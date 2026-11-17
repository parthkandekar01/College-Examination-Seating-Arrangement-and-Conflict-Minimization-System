"""
Arrangement Generation & Retrieval API
Orchestrates examination seating optimization using ADA algorithms,
persists arrangements and assignments, and serves interactive visualization data.
"""
from typing import List, Optional, Dict, Any
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Student, Subject, Classroom, Seat, ArrangementResult, SeatingAssignment
from ..schemas import ArrangementCreate, ArrangementResponse, ArrangementDetailResponse, AssignmentItem
from ..algorithms import (
    greedy_seat_allocation,
    backtracking_seat_allocation,
    detect_seating_conflicts
)
from ..algorithms.comparator import run_sequential_sorting_allocation

router = APIRouter(prefix="/arrangements", tags=["Arrangements"])


@router.get("", response_model=List[ArrangementResponse])
def get_arrangements(db: Session = Depends(get_db)):
    arrangements = db.query(ArrangementResult).order_by(desc(ArrangementResult.arrangement_id)).all()
    return arrangements


@router.post("/generate", response_model=ArrangementDetailResponse, status_code=status.HTTP_201_CREATED)
def generate_seating_arrangement(payload: ArrangementCreate, db: Session = Depends(get_db)):
    # 1. Fetch Students
    if payload.subject_ids:
        student_query = db.query(Student, Subject).join(Student.subjects).filter(
            Subject.subject_id.in_(payload.subject_ids)
        )
        if payload.student_roll_nos:
            student_query = student_query.filter(Student.roll_no.in_(payload.student_roll_nos))
        enrolled_students = student_query.order_by(Student.roll_no.asc(), Subject.subject_code.asc()).all()

        if len(payload.subject_ids) > 1:
            enrolled_rolls = [student.roll_no for student, _ in enrolled_students]
            if len(enrolled_rolls) != len(set(enrolled_rolls)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Students enrolled in multiple selected subjects would be seated more than once. Generate one subject exam at a time.",
                )
        students_input = [
            {
                "roll_no": student.roll_no,
                "student_name": student.student_name,
                "subject_id": subject.subject_id,
                "subject_code": subject.subject_code,
                "subject_name": subject.subject_name,
            }
            for student, subject in enrolled_students
        ]
    else:
        student_query = db.query(Student).join(Subject, Student.subject_id == Subject.subject_id)
        if payload.student_roll_nos:
            student_query = student_query.filter(Student.roll_no.in_(payload.student_roll_nos))
        students_db = student_query.order_by(Student.roll_no.asc()).all()
        students_input = [
            {
                "roll_no": student.roll_no,
                "student_name": student.student_name,
                "subject_id": student.subject_id,
                "subject_code": student.subject.subject_code if student.subject else "GEN",
                "subject_name": student.subject.subject_name if student.subject else "General",
            }
            for student in students_db
        ]

    if not students_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No eligible students found matching the selected criteria. Please register students first."
        )

    # 2. Fetch Classrooms and Seats
    classroom_query = db.query(Classroom)
    if payload.classroom_ids:
        classroom_query = classroom_query.filter(Classroom.classroom_id.in_(payload.classroom_ids))

    classrooms_db = classroom_query.all()
    if not classrooms_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No classrooms selected or found. Please create and select at least one classroom."
        )

    selected_room_ids = [c.classroom_id for c in classrooms_db]
    seats_db = db.query(Seat).join(Classroom, Seat.classroom_id == Classroom.classroom_id)\
        .filter(Seat.classroom_id.in_(selected_room_ids))\
        .order_by(Seat.classroom_id.asc(), Seat.row_num.asc(), Seat.col_num.asc()).all()

    if not seats_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No seats found in the selected classrooms. Generate seats first."
        )

    # Capacity Check
    if len(students_input) > len(seats_db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient seating capacity: {len(students_input)} students selected, but only {len(seats_db)} seats available in selected classrooms. Add more classrooms or reduce students."
        )

    # 3. Format seats for algorithm engine
    room_name_map = {c.classroom_id: c.classroom_name for c in classrooms_db}
    seats_input = [
        {
            "seat_id": st.seat_id,
            "seat_number": st.seat_number,
            "classroom_id": st.classroom_id,
            "classroom_name": room_name_map.get(st.classroom_id, f"Room {st.classroom_id}"),
            "row_num": st.row_num,
            "col_num": st.col_num
        }
        for st in seats_db
    ]

    # 4. Execute Algorithm
    algo_choice = payload.algorithm.lower()
    algo_label = ""
    algo_result = {}

    if algo_choice == "greedy":
        algo_label = "Greedy Optimization"
        algo_result = greedy_seat_allocation(
            students=students_input,
            seats=seats_input,
            separation_mode=payload.separation_mode,
            pre_interleave=True
        )
    elif algo_choice == "backtracking":
        algo_label = "Recursive Backtracking"
        algo_result = backtracking_seat_allocation(
            students=students_input,
            seats=seats_input,
            separation_mode=payload.separation_mode,
            max_states=payload.max_states or 30000,
            max_backtracks=payload.max_backtracks or 10000,
            time_limit_sec=payload.time_limit_sec or 3.5
        )
    elif algo_choice == "sorting":
        algo_label = f"Sorting-Based ({payload.sort_strategy or 'Merge Sort'})"
        algo_result = run_sequential_sorting_allocation(
            students=students_input,
            seats=seats_input,
            separation_mode=payload.separation_mode,
            sort_strategy=payload.sort_strategy or "merge_sort"
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported algorithm '{payload.algorithm}'")

    assignments_data = algo_result.get("assignments", [])
    conflicting_seat_ids = set(algo_result.get("conflicting_seat_ids", []))

    # 5. Persist Arrangement Result
    new_arrangement = ArrangementResult(
        exam_name=payload.exam_name.strip(),
        exam_date=payload.exam_date,
        algorithm_used=algo_label,
        separation_mode=payload.separation_mode,
        total_students=len(students_input),
        students_assigned=algo_result.get("assigned_students", len(assignments_data)),
        unassigned_students=algo_result.get("unassigned_students", 0),
        total_conflict_count=algo_result.get("total_conflicts", 0),
        conflict_score=algo_result.get("conflict_score", 0),
        execution_time_ms=algo_result.get("execution_time_ms", 0.0),
        metrics_json=json.dumps({
            "evaluations_count": algo_result.get("evaluations_count"),
            "recursive_calls": algo_result.get("recursive_calls"),
            "backtracking_operations": algo_result.get("backtracking_operations"),
            "sorting_comparisons": algo_result.get("sorting_comparisons"),
            "sorting_moves": algo_result.get("sorting_moves"),
            "time_complexity": algo_result.get("time_complexity"),
            "space_complexity": algo_result.get("space_complexity"),
            "seat_utilization_rate": algo_result.get("seat_utilization_rate"),
            "subject_distribution": algo_result.get("subject_distribution", {}),
            "classroom_distribution": algo_result.get("classroom_distribution", {})
        })
    )
    db.add(new_arrangement)
    db.commit()
    db.refresh(new_arrangement)

    # 6. Persist Individual Seating Assignments
    db_assignments = []
    response_assignments = []
    
    # Map seat conflict details
    pair_by_seat: Dict[int, List[str]] = {}
    for p in algo_result.get("conflict_pairs", []):
        s1 = p["seat_1_id"]
        s2 = p["seat_2_id"]
        msg1 = f"Adjacent {p['direction']} conflict with {p['student_2_name']} ({p['student_2_roll']}) in seat {p['seat_2_number']}"
        msg2 = f"Adjacent {p['direction']} conflict with {p['student_1_name']} ({p['student_1_roll']}) in seat {p['seat_1_number']}"
        pair_by_seat.setdefault(s1, []).append(msg1)
        pair_by_seat.setdefault(s2, []).append(msg2)

    for item in assignments_data:
        has_conf = item["seat_id"] in conflicting_seat_ids
        conf_detail_str = "; ".join(pair_by_seat.get(item["seat_id"], [])) if has_conf else None

        db_assignment = SeatingAssignment(
            arrangement_id=new_arrangement.arrangement_id,
            student_roll_no=item["student_roll_no"],
            subject_id=item.get("subject_id"),
            seat_id=item["seat_id"],
            classroom_id=item["classroom_id"],
            has_conflict=has_conf,
            conflict_details=conf_detail_str
        )
        db_assignments.append(db_assignment)

        response_assignments.append(
            AssignmentItem(
                assignment_id=None,  # will be populated after commit
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
                conflict_details=conf_detail_str,
                local_penalty=item.get("local_penalty", 0)
            )
        )

    db.add_all(db_assignments)
    db.commit()

    # Update assignment_ids in response
    for idx, dba in enumerate(db_assignments):
        response_assignments[idx].assignment_id = dba.assignment_id

    metrics_obj = json.loads(new_arrangement.metrics_json) if new_arrangement.metrics_json else {}

    return ArrangementDetailResponse(
        arrangement_id=new_arrangement.arrangement_id,
        exam_name=new_arrangement.exam_name,
        exam_date=new_arrangement.exam_date,
        algorithm_used=new_arrangement.algorithm_used,
        separation_mode=new_arrangement.separation_mode,
        total_students=new_arrangement.total_students,
        students_assigned=new_arrangement.students_assigned,
        unassigned_students=new_arrangement.unassigned_students,
        total_conflict_count=new_arrangement.total_conflict_count,
        conflict_score=new_arrangement.conflict_score,
        execution_time_ms=new_arrangement.execution_time_ms,
        created_at=new_arrangement.created_at,
        assignments=response_assignments,
        conflict_report={
            "total_conflicts": algo_result.get("total_conflicts", 0),
            "conflict_score": algo_result.get("conflict_score", 0),
            "conflict_pairs": algo_result.get("conflict_pairs", []),
            "subject_distribution": algo_result.get("subject_distribution", {}),
            "classroom_distribution": algo_result.get("classroom_distribution", {})
        },
        metrics=metrics_obj,
        unassigned_list=algo_result.get("unassigned_list", []),
        decisions_trace=algo_result.get("decisions_trace", [])
    )


@router.get("/{arrangement_id}", response_model=ArrangementDetailResponse)
def get_arrangement_details(arrangement_id: int, db: Session = Depends(get_db)):
    arrangement = db.query(ArrangementResult).filter(ArrangementResult.arrangement_id == arrangement_id).first()
    if not arrangement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arrangement not found")

    assignments_db = db.query(SeatingAssignment)\
        .join(Seat, SeatingAssignment.seat_id == Seat.seat_id)\
        .join(Student, SeatingAssignment.student_roll_no == Student.roll_no)\
        .join(Classroom, SeatingAssignment.classroom_id == Classroom.classroom_id)\
        .outerjoin(Subject, SeatingAssignment.subject_id == Subject.subject_id)\
        .filter(SeatingAssignment.arrangement_id == arrangement_id)\
        .order_by(Seat.classroom_id.asc(), Seat.row_num.asc(), Seat.col_num.asc()).all()

    response_assignments = []
    assignments_raw = []
    for a in assignments_db:
        subject = a.subject or a.student.subject
        item = AssignmentItem(
            assignment_id=a.assignment_id,
            seat_id=a.seat_id,
            seat_number=a.seat.seat_number,
            classroom_id=a.classroom_id,
            classroom_name=a.classroom.classroom_name,
            row_num=a.seat.row_num,
            col_num=a.seat.col_num,
            student_roll_no=a.student.roll_no,
            student_name=a.student.student_name,
            subject_id=subject.subject_id if subject else None,
            subject_code=subject.subject_code if subject else "",
            subject_name=subject.subject_name if subject else "",
            has_conflict=a.has_conflict,
            conflict_details=a.conflict_details
        )
        response_assignments.append(item)
        assignments_raw.append({
            "seat_id": a.seat_id,
            "seat_number": a.seat.seat_number,
            "classroom_id": a.classroom_id,
            "classroom_name": a.classroom.classroom_name,
            "row_num": a.seat.row_num,
            "col_num": a.seat.col_num,
            "student_roll_no": a.student.roll_no,
            "student_name": a.student.student_name,
            "subject_code": subject.subject_code if subject else ""
        })

    # Fresh conflict report scan
    conflict_report = detect_seating_conflicts(assignments_raw, separation_mode=arrangement.separation_mode)
    metrics_obj = json.loads(arrangement.metrics_json) if arrangement.metrics_json else {}

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
        conflict_report=conflict_report,
        metrics=metrics_obj,
        unassigned_list=[],
        decisions_trace=[]
    )


@router.delete("/{arrangement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_arrangement(arrangement_id: int, db: Session = Depends(get_db)):
    arrangement = db.query(ArrangementResult).filter(ArrangementResult.arrangement_id == arrangement_id).first()
    if not arrangement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arrangement not found")

    db.delete(arrangement)
    db.commit()
    return None
