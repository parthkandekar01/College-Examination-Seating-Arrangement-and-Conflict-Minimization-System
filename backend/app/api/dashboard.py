"""
Dashboard Aggregated Statistics API
Collects live metrics directly from application database and seating models.
"""
from typing import Dict, Any, List
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..database import get_db
from ..models import Student, Subject, Classroom, Seat, ArrangementResult, SeatingAssignment, student_subjects

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_students = db.query(func.count(Student.roll_no)).scalar() or 0
    total_subjects = db.query(func.count(Subject.subject_id)).scalar() or 0
    total_classrooms = db.query(func.count(Classroom.classroom_id)).scalar() or 0
    total_seats = db.query(func.count(Seat.seat_id)).scalar() or 0
    total_arrangements = db.query(func.count(ArrangementResult.arrangement_id)).scalar() or 0

    # Total conflicts across all arrangements
    total_conflicts_sum = db.query(func.sum(ArrangementResult.total_conflict_count)).scalar() or 0

    # Latest arrangement
    latest_arrangement = db.query(ArrangementResult).order_by(desc(ArrangementResult.arrangement_id)).first()

    # Students awaiting seat allocation (students who are registered but not assigned in latest arrangement, or total if no arrangements)
    if latest_arrangement:
        assigned_in_latest = db.query(func.count(SeatingAssignment.assignment_id))\
            .filter(SeatingAssignment.arrangement_id == latest_arrangement.arrangement_id).scalar() or 0
        students_awaiting = max(0, total_students - assigned_in_latest)
    else:
        students_awaiting = total_students

    # Student distribution by subject
    subjects_db = db.query(Subject).all()
    subject_distribution = []
    for s in subjects_db:
        st_count = db.query(func.count(student_subjects.c.student_roll_no))\
            .filter(student_subjects.c.subject_id == s.subject_id).scalar() or 0
        subject_distribution.append({
            "subject_id": s.subject_id,
            "subject_code": s.subject_code,
            "subject_name": s.subject_name,
            "student_count": st_count
        })

    # Classroom capacity and seat utilization
    classrooms_db = db.query(Classroom).all()
    classroom_utilization = []
    for c in classrooms_db:
        seat_count = db.query(func.count(Seat.seat_id)).filter(Seat.classroom_id == c.classroom_id).scalar() or 0
        # If there's a latest arrangement, check how many seats are occupied in this room
        occupied_count = 0
        if latest_arrangement:
            occupied_count = db.query(func.count(SeatingAssignment.assignment_id))\
                .filter(
                    SeatingAssignment.arrangement_id == latest_arrangement.arrangement_id,
                    SeatingAssignment.classroom_id == c.classroom_id
                ).scalar() or 0

        classroom_utilization.append({
            "classroom_id": c.classroom_id,
            "classroom_name": c.classroom_name,
            "capacity": c.capacity,
            "generated_seats": seat_count,
            "occupied_seats": occupied_count,
            "utilization_rate": round(occupied_count / max(1, seat_count) * 100, 1)
        })

    # Recent arrangements list (latest 5)
    recent_arrangements = db.query(ArrangementResult).order_by(desc(ArrangementResult.arrangement_id)).limit(5).all()
    recent_arrangements_data = [
        {
            "arrangement_id": a.arrangement_id,
            "exam_name": a.exam_name,
            "exam_date": a.exam_date,
            "algorithm_used": a.algorithm_used,
            "separation_mode": a.separation_mode,
            "students_assigned": a.students_assigned,
            "total_conflicts": a.total_conflict_count,
            "conflict_score": a.conflict_score,
            "execution_time_ms": a.execution_time_ms,
            "created_at": a.created_at
        }
        for a in recent_arrangements
    ]

    # Algorithm performance comparison across past arrangements
    algo_performance: Dict[str, Dict[str, Any]] = {}
    for a in recent_arrangements:
        algo_name = a.algorithm_used.split("(")[0].strip()
        if algo_name not in algo_performance:
            algo_performance[algo_name] = {
                "count": 0,
                "total_time_ms": 0.0,
                "total_conflicts": 0
            }
        algo_performance[algo_name]["count"] += 1
        algo_performance[algo_name]["total_time_ms"] += a.execution_time_ms
        algo_performance[algo_name]["total_conflicts"] += a.total_conflict_count

    algo_stats = [
        {
            "algorithm": k,
            "runs": v["count"],
            "avg_time_ms": round(v["total_time_ms"] / max(1, v["count"]), 2),
            "avg_conflicts": round(v["total_conflicts"] / max(1, v["count"]), 1)
        }
        for k, v in algo_performance.items()
    ]

    return {
        "total_students": total_students,
        "total_subjects": total_subjects,
        "total_classrooms": total_classrooms,
        "total_seats": total_seats,
        "students_awaiting": students_awaiting,
        "total_arrangements": total_arrangements,
        "total_conflicts_sum": total_conflicts_sum,
        "latest_activity": {
            "arrangement_id": latest_arrangement.arrangement_id,
            "exam_name": latest_arrangement.exam_name,
            "algorithm": latest_arrangement.algorithm_used,
            "conflicts": latest_arrangement.total_conflict_count,
            "created_at": latest_arrangement.created_at
        } if latest_arrangement else None,
        "subject_distribution": subject_distribution,
        "classroom_utilization": classroom_utilization,
        "recent_arrangements": recent_arrangements_data,
        "algorithm_performance": algo_stats
    }
