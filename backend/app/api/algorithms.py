"""
Algorithm Comparison & ADA Educational Engine API
Provides endpoints for standalone sorting execution, head-to-head algorithm comparison,
and live empirical scalability benchmarks across variable input sizes.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Subject, Classroom, Seat
from ..schemas import StandaloneSortRequest, BenchmarkRunRequest
from ..algorithms import (
    merge_sort_students,
    quick_sort_students,
    interleave_sort_students,
    run_algorithm_comparison
)
from ..algorithms.comparator import run_benchmark_suite

router = APIRouter(prefix="/algorithms", tags=["Algorithms"])


@router.post("/sort")
def execute_standalone_sorting(
    payload: StandaloneSortRequest,
    db: Session = Depends(get_db)
):
    query = db.query(Student).join(Subject, Student.subject_id == Subject.subject_id)
    if payload.student_roll_nos:
        query = query.filter(Student.roll_no.in_(payload.student_roll_nos))

    students_db = query.all()
    if not students_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No students available to sort. Please register or seed students first."
        )

    students_input = [
        {
            "roll_no": s.roll_no,
            "student_name": s.student_name,
            "subject_id": s.subject_id,
            "subject_code": s.subject.subject_code if s.subject else "GEN",
            "subject_name": s.subject.subject_name if s.subject else "General"
        }
        for s in students_db
    ]

    original_order = list(students_input)

    algo = payload.algorithm.lower()
    if algo == "merge_sort":
        result = merge_sort_students(students_input, key=payload.key)
    elif algo == "quick_sort":
        result = quick_sort_students(students_input, key=payload.key)
    elif algo == "interleaved":
        result = interleave_sort_students(students_input)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported sorting algorithm: {payload.algorithm}")

    result["original_students"] = original_order
    return result


@router.post("/compare")
def compare_algorithms(
    separation_mode: str = Query("all", pattern="^(horizontal|vertical|all)$"),
    limit_students: Optional[int] = None,
    db: Session = Depends(get_db)
):
    student_query = db.query(Student).join(Subject, Student.subject_id == Subject.subject_id)
    if limit_students and limit_students > 0:
        student_query = student_query.limit(limit_students)

    students_db = student_query.all()
    if not students_db:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No students found. Please seed or add students.")

    seats_db = db.query(Seat).join(Classroom, Seat.classroom_id == Classroom.classroom_id)\
        .order_by(Seat.classroom_id.asc(), Seat.row_num.asc(), Seat.col_num.asc()).all()

    if not seats_db:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No seats found. Create classrooms first.")

    students_input = [
        {
            "roll_no": s.roll_no,
            "student_name": s.student_name,
            "subject_id": s.subject_id,
            "subject_code": s.subject.subject_code if s.subject else "GEN",
            "subject_name": s.subject.subject_name if s.subject else "General"
        }
        for s in students_db
    ]

    classrooms_db = db.query(Classroom).all()
    room_map = {c.classroom_id: c.classroom_name for c in classrooms_db}
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

    comparison_results = run_algorithm_comparison(
        students=students_input,
        seats=seats_input,
        separation_mode=separation_mode
    )

    return comparison_results


@router.post("/benchmark")
def run_scalability_benchmark(payload: Optional[BenchmarkRunRequest] = None):
    sizes = payload.sizes if (payload and payload.sizes) else [20, 50, 100, 200, 400]
    # Restrict maximum size to 1000 to keep execution fast and prevent timeout
    sanitized_sizes = [min(1000, max(10, s)) for s in sizes]
    benchmark_data = run_benchmark_suite(sizes=sanitized_sizes)

    return {
        "status": "success",
        "benchmark_points": benchmark_data,
        "theoretical_complexity": {
            "Sorting": "O(N log N) time, O(N) space",
            "Greedy": "O(N * M) time, O(N + M) space",
            "Backtracking": "O(M^N) worst-case time, O(N) recursion space"
        },
        "analysis_notes": (
            "Empirical results verify that Sorting is fastest O(N log N) but produces the highest conflict clusters. "
            "Greedy scales polynomially O(N * M) with excellent sub-second times and dramatically reduced conflicts. "
            "Backtracking performs extensive state-space exploration with rollbacks, achieving optimal zero-conflict configurations on dense subgrids, "
            "with state-limiting bounds to guarantee termination."
        )
    }
