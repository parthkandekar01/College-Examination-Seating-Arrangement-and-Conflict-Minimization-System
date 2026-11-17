"""
Student Management API
Includes full CRUD, CSV import, CSV export, subject filtering, and search.
"""
from typing import List, Optional, Dict, Any
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Student, Subject
from ..schemas import StudentCreate, StudentUpdate, StudentResponse, BulkStudentCreate

router = APIRouter(prefix="/students", tags=["Students"])


def student_response(student: Student, primary_subject: Optional[Subject] = None) -> StudentResponse:
    subject = primary_subject or student.subject
    return StudentResponse(
        roll_no=student.roll_no,
        student_name=student.student_name,
        subject_id=student.subject_id,
        subject_code=subject.subject_code if subject else None,
        subject_name=subject.subject_name if subject else None,
        subjects=[
            {
                "subject_id": enrolled.subject_id,
                "subject_code": enrolled.subject_code,
                "subject_name": enrolled.subject_name,
            }
            for enrolled in sorted(student.subjects, key=lambda item: item.subject_code)
        ],
        email=student.email,
        semester=student.semester,
        created_at=student.created_at,
    )


@router.get("", response_model=List[StudentResponse])
def get_students(
    search: Optional[str] = None,
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Student)

    if subject_id:
        query = query.filter(Student.subjects.any(Subject.subject_id == subject_id))

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.roll_no.ilike(search_fmt),
                Student.student_name.ilike(search_fmt),
                Student.subjects.any(
                    or_(
                        Subject.subject_code.ilike(search_fmt),
                        Subject.subject_name.ilike(search_fmt),
                    )
                )
            )
        )

    students = query.order_by(Student.roll_no.asc()).all()
    return [student_response(student) for student in students]


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    roll = payload.roll_no.strip()
    if not roll:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Roll number cannot be empty")

    existing = db.query(Student).filter(Student.roll_no == roll).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Student with roll number '{roll}' already exists.")

    subject = db.query(Subject).filter(Subject.subject_id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    new_student = Student(
        roll_no=roll,
        student_name=payload.student_name.strip(),
        subject_id=payload.subject_id,
        email=payload.email.strip() if payload.email else None,
        semester=payload.semester.strip() if payload.semester else None
    )
    new_student.subjects = [subject]
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return student_response(new_student, subject)


@router.post("/bulk", response_model=Dict[str, Any])
def create_bulk_students(payload: BulkStudentCreate, db: Session = Depends(get_db)):
    added_count = 0
    skipped_count = 0
    errors = []

    # Cache subjects
    subjects_map = {s.subject_id: s for s in db.query(Subject).all()}

    for s_in in payload.students:
        roll = s_in.roll_no.strip()
        if not roll:
            skipped_count += 1
            errors.append("Empty roll number skipped.")
            continue

        if db.query(Student).filter(Student.roll_no == roll).first():
            skipped_count += 1
            errors.append(f"Roll number {roll} already exists.")
            continue

        if s_in.subject_id not in subjects_map:
            skipped_count += 1
            errors.append(f"Subject ID {s_in.subject_id} for roll {roll} does not exist.")
            continue

        student = Student(
            roll_no=roll,
            student_name=s_in.student_name.strip(),
            subject_id=s_in.subject_id,
            email=s_in.email.strip() if s_in.email else None,
            semester=s_in.semester.strip() if s_in.semester else None
        )
        student.subjects = [subjects_map[s_in.subject_id]]
        db.add(student)
        added_count += 1

    db.commit()
    return {
        "status": "success",
        "added": added_count,
        "skipped": skipped_count,
        "errors": errors[:10]
    }


@router.post("/import-csv", response_model=Dict[str, Any])
async def import_students_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a CSV format (.csv)")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    
    # Normalize headers
    headers = [h.strip().lower() for h in (reader.fieldnames or [])]
    if "roll_no" not in headers and "roll" not in headers and "roll no" not in headers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV must contain 'roll_no' (or 'roll'), 'student_name' (or 'name'), and 'subject_code' (or 'subject_id') columns."
        )

    # Cache subjects by code
    subjects_by_code = {s.subject_code.upper(): s for s in db.query(Subject).all()}
    subjects_by_id = {s.subject_id: s for s in db.query(Subject).all()}

    added = 0
    skipped = 0
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        row_norm = {k.strip().lower(): v.strip() for k, v in row.items() if k and v}
        roll = row_norm.get("roll_no") or row_norm.get("roll") or row_norm.get("roll number")
        name = row_norm.get("student_name") or row_norm.get("name") or "Student"
        subj_val = row_norm.get("subject_code") or row_norm.get("subject") or row_norm.get("subject_id")
        email = row_norm.get("email")
        semester = row_norm.get("semester") or row_norm.get("sem")

        if not roll:
            skipped += 1
            continue

        if db.query(Student).filter(Student.roll_no == roll).first():
            skipped += 1
            errors.append(f"Row {row_idx}: Duplicate roll number '{roll}'")
            continue

        # Resolve subject
        target_subj = None
        if subj_val:
            if subj_val.isdigit() and int(subj_val) in subjects_by_id:
                target_subj = subjects_by_id[int(subj_val)]
            elif subj_val.upper() in subjects_by_code:
                target_subj = subjects_by_code[subj_val.upper()]

        if not target_subj:
            # Auto-create subject if doesn't exist to make import smooth!
            code = (subj_val or "GEN").upper()[:20]
            target_subj = Subject(subject_code=code, subject_name=f"Subject {code}")
            db.add(target_subj)
            db.commit()
            db.refresh(target_subj)
            subjects_by_code[code] = target_subj
            subjects_by_id[target_subj.subject_id] = target_subj

        new_student = Student(
            roll_no=roll,
            student_name=name,
            subject_id=target_subj.subject_id,
            email=email,
            semester=semester
        )
        new_student.subjects = [target_subj]
        db.add(new_student)
        added += 1

    db.commit()
    return {
        "status": "success",
        "added": added,
        "skipped": skipped,
        "errors": errors[:10]
    }


@router.get("/export-csv")
def export_students_csv(db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.roll_no.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["roll_no", "student_name", "subject_codes", "subject_names", "email", "semester"])

    for s in students:
        writer.writerow([
            s.roll_no,
            s.student_name,
            "; ".join(subject.subject_code for subject in sorted(s.subjects, key=lambda item: item.subject_code)),
            "; ".join(subject.subject_name for subject in sorted(s.subjects, key=lambda item: item.subject_code)),
            s.email or "",
            s.semester or ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students_export.csv"}
    )


@router.get("/{roll_no}", response_model=StudentResponse)
def get_student(roll_no: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_no == roll_no).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    return student_response(student)


@router.put("/{roll_no}", response_model=StudentResponse)
def update_student(roll_no: str, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_no == roll_no).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if payload.subject_id is not None:
        subject = db.query(Subject).filter(Subject.subject_id == payload.subject_id).first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        student.subject_id = payload.subject_id
        if subject not in student.subjects:
            student.subjects.append(subject)

    if payload.student_name is not None:
        student.student_name = payload.student_name.strip()
    if payload.email is not None:
        student.email = payload.email.strip()
    if payload.semester is not None:
        student.semester = payload.semester.strip()

    db.commit()
    db.refresh(student)

    return student_response(student)


@router.delete("/{roll_no}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(roll_no: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_no == roll_no).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    db.delete(student)
    db.commit()
    return None
