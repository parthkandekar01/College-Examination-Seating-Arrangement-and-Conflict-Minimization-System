"""
Conflict Analysis & Re-Optimization API
"""
from typing import Dict, Any, List
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ArrangementResult, SeatingAssignment, Seat, Student, Classroom, Subject
from ..algorithms import (
    detect_seating_conflicts,
    greedy_seat_allocation,
    backtracking_seat_allocation
)
from ..schemas import ArrangementDetailResponse, AssignmentItem

router = APIRouter(prefix="/conflict-analysis", tags=["Conflict Analysis"])


@router.get("/{arrangement_id}")
def get_conflict_analysis(arrangement_id: int, db: Session = Depends(get_db)):
    arrangement = db.query(ArrangementResult).filter(ArrangementResult.arrangement_id == arrangement_id).first()
    if not arrangement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arrangement not found")

    assignments_db = db.query(SeatingAssignment)\
        .join(Seat, SeatingAssignment.seat_id == Seat.seat_id)\
        .join(Student, SeatingAssignment.student_roll_no == Student.roll_no)\
        .join(Classroom, SeatingAssignment.classroom_id == Classroom.classroom_id)\
        .outerjoin(Subject, SeatingAssignment.subject_id == Subject.subject_id)\
        .filter(SeatingAssignment.arrangement_id == arrangement_id).all()

    assignments_raw = []
    for assignment in assignments_db:
        subject = assignment.subject or assignment.student.subject
        assignments_raw.append({
            "seat_id": assignment.seat_id,
            "seat_number": assignment.seat.seat_number,
            "classroom_id": assignment.classroom_id,
            "classroom_name": assignment.classroom.classroom_name,
            "row_num": assignment.seat.row_num,
            "col_num": assignment.seat.col_num,
            "student_roll_no": assignment.student.roll_no,
            "student_name": assignment.student.student_name,
            "subject_code": subject.subject_code if subject else "",
        })

    conflict_report = detect_seating_conflicts(assignments_raw, separation_mode=arrangement.separation_mode)

    return {
        "arrangement_id": arrangement.arrangement_id,
        "exam_name": arrangement.exam_name,
        "algorithm_used": arrangement.algorithm_used,
        "separation_mode": arrangement.separation_mode,
        "total_assigned": len(assignments_db),
        "total_conflicts": conflict_report["total_conflicts"],
        "conflict_score": conflict_report["conflict_score"],
        "conflicting_seat_ids": conflict_report["conflicting_seat_ids"],
        "conflict_pairs": conflict_report["conflict_pairs"],
        "subject_distribution": conflict_report["subject_distribution"],
        "classroom_distribution": conflict_report["classroom_distribution"]
    }


@router.post("/{arrangement_id}/optimize", response_model=ArrangementDetailResponse)
def reoptimize_arrangement(
    arrangement_id: int,
    target_algorithm: str = Query("greedy", pattern="^(greedy|backtracking)$"),
    separation_mode: str = Query("all", pattern="^(horizontal|vertical|all)$"),
    db: Session = Depends(get_db)
):
    arrangement = db.query(ArrangementResult).filter(ArrangementResult.arrangement_id == arrangement_id).first()
    if not arrangement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arrangement not found")

    # Get all students and seats involved in this arrangement
    assignments_db = db.query(SeatingAssignment)\
        .join(Seat, SeatingAssignment.seat_id == Seat.seat_id)\
        .join(Student, SeatingAssignment.student_roll_no == Student.roll_no)\
        .join(Classroom, SeatingAssignment.classroom_id == Classroom.classroom_id)\
        .outerjoin(Subject, SeatingAssignment.subject_id == Subject.subject_id)\
        .filter(SeatingAssignment.arrangement_id == arrangement_id).all()

    if not assignments_db:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No assignments to optimize in this arrangement.")

    students_input = []
    for assignment in assignments_db:
        subject = assignment.subject or assignment.student.subject
        students_input.append({
            "roll_no": assignment.student.roll_no,
            "student_name": assignment.student.student_name,
            "subject_id": subject.subject_id if subject else None,
            "subject_code": subject.subject_code if subject else "GEN",
            "subject_name": subject.subject_name if subject else "General",
        })

    # Distinct classroom IDs involved
    room_ids = list({a.classroom_id for a in assignments_db})
    seats_db = db.query(Seat).join(Classroom).filter(Seat.classroom_id.in_(room_ids))\
        .order_by(Seat.classroom_id.asc(), Seat.row_num.asc(), Seat.col_num.asc()).all()

    room_map = {c.classroom_id: c.classroom_name for c in db.query(Classroom).filter(Classroom.classroom_id.in_(room_ids)).all()}
    seats_input = [
        {
            "seat_id": st.seat_id,
            "seat_number": st.seat_number,
            "classroom_id": st.classroom_id,
            "classroom_name": room_map.get(st.classroom_id, f"Room {st.classroom_id}"),
            "row_num": st.row_num,
            "col_num": st.col_num
        }
        for st in seats_db
    ]

    # Re-run target algorithm
    if target_algorithm == "greedy":
        algo_label = "Greedy Optimization (Re-optimized)"
        algo_result = greedy_seat_allocation(students_input, seats_input, separation_mode=separation_mode, pre_interleave=True)
    else:
        algo_label = "Recursive Backtracking (Re-optimized)"
        algo_result = backtracking_seat_allocation(students_input, seats_input, separation_mode=separation_mode)

    # Delete previous assignments
    db.query(SeatingAssignment).filter(SeatingAssignment.arrangement_id == arrangement_id).delete()

    # Update arrangement record
    arrangement.algorithm_used = algo_label
    arrangement.separation_mode = separation_mode
    arrangement.total_conflict_count = algo_result.get("total_conflicts", 0)
    arrangement.conflict_score = algo_result.get("conflict_score", 0)
    arrangement.execution_time_ms = algo_result.get("execution_time_ms", 0.0)
    arrangement.metrics_json = json.dumps({
        "evaluations_count": algo_result.get("evaluations_count"),
        "recursive_calls": algo_result.get("recursive_calls"),
        "backtracking_operations": algo_result.get("backtracking_operations"),
        "time_complexity": algo_result.get("time_complexity"),
        "space_complexity": algo_result.get("space_complexity"),
        "subject_distribution": algo_result.get("subject_distribution", {}),
        "classroom_distribution": algo_result.get("classroom_distribution", {})
    })

    # Save new assignments
    conflicting_seat_ids = set(algo_result.get("conflicting_seat_ids", []))
    db_assignments = []
    response_assignments = []

    for item in algo_result.get("assignments", []):
        has_conf = item["seat_id"] in conflicting_seat_ids
        dba = SeatingAssignment(
            arrangement_id=arrangement_id,
            student_roll_no=item["student_roll_no"],
            subject_id=item.get("subject_id"),
            seat_id=item["seat_id"],
            classroom_id=item["classroom_id"],
            has_conflict=has_conf,
            conflict_details=f"Adjacent {separation_mode} conflict" if has_conf else None
        )
        db_assignments.append(dba)

        response_assignments.append(
            AssignmentItem(
                seat_id=item["seat_id"],
                seat_number=item["seat_number"],
                classroom_id=item["classroom_id"],
                classroom_name=item.get("classroom_name"),
                row_num=item["row_num"],
                col_num=item["col_num"],
                student_roll_no=item["student_roll_no"],
                student_name=item["student_name"],
                subject_id=item.get("subject_id"),
                subject_code=item.get("subject_code"),
                subject_name=item.get("subject_name"),
                has_conflict=has_conf,
                conflict_details=f"Adjacent conflict" if has_conf else None,
                local_penalty=item.get("local_penalty", 0)
            )
        )

    db.add_all(db_assignments)
    db.commit()
    db.refresh(arrangement)

    return ArrangementDetailResponse(
        arrangement_id=arrangement.arrangement_id,
        exam_name=arrangement.exam_name,
        exam_date=arrangement.exam_date,
        algorithm_used=arrangement.algorithm_used,
        separation_mode=arrangement.separation_mode,
        total_students=arrangement.total_students,
        students_assigned=arrangement.students_assigned,
        unassigned_students=arrangement.unassigned_students,
        total_conflict_count=arrangement.total_conflict_count,
        conflict_score=arrangement.conflict_score,
        execution_time_ms=arrangement.execution_time_ms,
        created_at=arrangement.created_at,
        assignments=response_assignments,
        conflict_report={
            "total_conflicts": algo_result.get("total_conflicts", 0),
            "conflict_score": algo_result.get("conflict_score", 0),
            "conflict_pairs": algo_result.get("conflict_pairs", []),
            "subject_distribution": algo_result.get("subject_distribution", {}),
            "classroom_distribution": algo_result.get("classroom_distribution", {})
        },
        metrics=json.loads(arrangement.metrics_json) if arrangement.metrics_json else {},
        unassigned_list=[],
        decisions_trace=algo_result.get("decisions_trace", [])
    )
