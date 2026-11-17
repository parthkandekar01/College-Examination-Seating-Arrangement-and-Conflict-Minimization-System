"""
Subject Management API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Subject, Student, student_subjects
from ..schemas import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Subject)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter((Subject.subject_code.ilike(search_fmt)) | (Subject.subject_name.ilike(search_fmt)))
    
    subjects = query.order_by(Subject.subject_code.asc()).all()

    # Compute registered student counts
    results = []
    for s in subjects:
        count = db.query(func.count(student_subjects.c.student_roll_no))\
            .filter(student_subjects.c.subject_id == s.subject_id).scalar() or 0
        resp = SubjectResponse(
            subject_id=s.subject_id,
            subject_code=s.subject_code,
            subject_name=s.subject_name,
            created_at=s.created_at,
            registered_students_count=count
        )
        results.append(resp)
    return results


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(Subject).filter(Subject.subject_code.ilike(payload.subject_code.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject code '{payload.subject_code}' already exists."
        )

    new_subject = Subject(
        subject_code=payload.subject_code.strip().upper(),
        subject_name=payload.subject_name.strip()
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)

    return SubjectResponse(
        subject_id=new_subject.subject_id,
        subject_code=new_subject.subject_code,
        subject_name=new_subject.subject_name,
        created_at=new_subject.created_at,
        registered_students_count=0
    )


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.subject_id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    count = db.query(func.count(student_subjects.c.student_roll_no))\
        .filter(student_subjects.c.subject_id == subject.subject_id).scalar() or 0
    return SubjectResponse(
        subject_id=subject.subject_id,
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        created_at=subject.created_at,
        registered_students_count=count
    )


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: int, payload: SubjectUpdate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.subject_id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if payload.subject_code:
        code_clean = payload.subject_code.strip().upper()
        existing = db.query(Subject).filter(Subject.subject_code.ilike(code_clean), Subject.subject_id != subject_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Subject code '{code_clean}' already taken.")
        subject.subject_code = code_clean

    if payload.subject_name:
        subject.subject_name = payload.subject_name.strip()

    db.commit()
    db.refresh(subject)
    count = db.query(func.count(student_subjects.c.student_roll_no))\
        .filter(student_subjects.c.subject_id == subject.subject_id).scalar() or 0
    return SubjectResponse(
        subject_id=subject.subject_id,
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        created_at=subject.created_at,
        registered_students_count=count
    )


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.subject_id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    for student in list(subject.default_students):
        other_subjects = [enrolled for enrolled in student.subjects if enrolled.subject_id != subject_id]
        if other_subjects:
            student.subject_id = other_subjects[0].subject_id
        else:
            db.delete(student)

    db.delete(subject)
    db.commit()
    return None
