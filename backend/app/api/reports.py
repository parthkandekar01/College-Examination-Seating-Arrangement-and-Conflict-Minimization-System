"""
Reports and Export API
Generates classroom-wise examination seating reports and CSV data exports.
"""
from typing import List, Optional, Dict, Any
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ArrangementResult, SeatingAssignment, Seat, Student, Classroom, Subject

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{arrangement_id}/csv")
def export_seating_csv(arrangement_id: int, db: Session = Depends(get_db)):
    arrangement = db.query(ArrangementResult).filter(ArrangementResult.arrangement_id == arrangement_id).first()
    if not arrangement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arrangement not found")

    assignments = db.query(SeatingAssignment)\
        .join(Seat, SeatingAssignment.seat_id == Seat.seat_id)\
        .join(Student, SeatingAssignment.student_roll_no == Student.roll_no)\
        .join(Classroom, SeatingAssignment.classroom_id == Classroom.classroom_id)\
        .outerjoin(Subject, SeatingAssignment.subject_id == Subject.subject_id)\
        .filter(SeatingAssignment.arrangement_id == arrangement_id)\
        .order_by(Classroom.classroom_name.asc(), Seat.row_num.asc(), Seat.col_num.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Headers
    writer.writerow([
        "Examination Name",
        "Classroom",
        "Row",
        "Column",
        "Seat Number",
        "Student Roll No",
        "Student Name",
        "Subject Code",
        "Subject Name",
        "Has Conflict",
        "Conflict Details",
        "Algorithm Used"
    ])

    for a in assignments:
        subject = a.subject or a.student.subject
        writer.writerow([
            arrangement.exam_name,
            a.classroom.classroom_name,
            a.seat.row_num,
            a.seat.col_num,
            a.seat.seat_number,
            a.student.roll_no,
            a.student.student_name,
            subject.subject_code if subject else "",
            subject.subject_name if subject else "",
            "YES" if a.has_conflict else "NO",
            a.conflict_details or "",
            arrangement.algorithm_used
        ])

    csv_data = output.getvalue()
    safe_filename = f"seating_report_{arrangement_id}_{arrangement.exam_name.replace(' ', '_')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={safe_filename}"}
    )


@router.get("/{arrangement_id}/summary")
def get_report_summary(arrangement_id: int, db: Session = Depends(get_db)):
    arrangement = db.query(ArrangementResult).filter(ArrangementResult.arrangement_id == arrangement_id).first()
    if not arrangement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arrangement not found")

    assignments = db.query(SeatingAssignment)\
        .join(Seat, SeatingAssignment.seat_id == Seat.seat_id)\
        .join(Student, SeatingAssignment.student_roll_no == Student.roll_no)\
        .join(Classroom, SeatingAssignment.classroom_id == Classroom.classroom_id)\
        .outerjoin(Subject, SeatingAssignment.subject_id == Subject.subject_id)\
        .filter(SeatingAssignment.arrangement_id == arrangement_id)\
        .order_by(Classroom.classroom_name.asc(), Seat.row_num.asc(), Seat.col_num.asc()).all()

    by_classroom: Dict[str, Dict[str, Any]] = {}
    for a in assignments:
        subject = a.subject or a.student.subject
        cname = a.classroom.classroom_name
        if cname not in by_classroom:
            by_classroom[cname] = {
                "classroom_id": a.classroom_id,
                "classroom_name": cname,
                "capacity": a.classroom.capacity,
                "total_rows": a.classroom.rows,
                "total_cols": a.classroom.cols,
                "assigned_students": 0,
                "conflict_count": 0,
                "students": []
            }
        
        by_classroom[cname]["assigned_students"] += 1
        if a.has_conflict:
            by_classroom[cname]["conflict_count"] += 1

        by_classroom[cname]["students"].append({
            "seat_number": a.seat.seat_number,
            "row": a.seat.row_num,
            "col": a.seat.col_num,
            "roll_no": a.student.roll_no,
            "student_name": a.student.student_name,
            "subject_code": subject.subject_code if subject else "",
            "subject_name": subject.subject_name if subject else "",
            "has_conflict": a.has_conflict,
            "conflict_details": a.conflict_details
        })

    return {
        "arrangement_id": arrangement.arrangement_id,
        "exam_name": arrangement.exam_name,
        "exam_date": arrangement.exam_date,
        "algorithm_used": arrangement.algorithm_used,
        "separation_mode": arrangement.separation_mode,
        "total_students": arrangement.total_students,
        "students_assigned": arrangement.students_assigned,
        "unassigned_students": arrangement.unassigned_students,
        "total_conflict_count": arrangement.total_conflict_count,
        "conflict_score": arrangement.conflict_score,
        "execution_time_ms": arrangement.execution_time_ms,
        "created_at": arrangement.created_at,
        "classrooms": list(by_classroom.values())
    }
