"""
Seed Data & Demonstration Management API
Generates realistic college examination sample data for ADA viva demonstration.
Allows complete data reset or re-seeding with one click.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db, Base, engine
from ..models import Subject, Student, Classroom, Seat, ArrangementResult, SeatingAssignment, student_subjects
from .classrooms import generate_classroom_seats
from ..algorithms import greedy_seat_allocation
import json

router = APIRouter(prefix="/seed", tags=["Seed & Demo Data"])

SAMPLE_SUBJECTS = [
    {"code": "ADA", "name": "ADA"},
    {"code": "DBMS", "name": "DBMS"},
    {"code": "AIML", "name": "AI ML"},
    {"code": "MATHS", "name": "Maths"},
    {"code": "EVS", "name": "EVS"},
]

FIRST_NAMES = [
    "Aarav", "Ananya", "Rohan", "Sneha", "Aditya", "Ishita", "Vikram", "Pooja",
    "Karan", "Riya", "Varun", "Priyanka", "Nikhil", "Divya", "Siddharth", "Meera",
    "Tanmay", "Kavya", "Rahul", "Tanvi", "Arjun", "Neha", "Akash", "Shreya",
    "Harsh", "Simran", "Yash", "Anushka", "Gaurav", "Nisha"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Mehta", "Iyer", "Kulkarni", "Deshmukh", "Reddy",
    "Joshi", "Nair", "Bose", "Chopra", "Malhotra", "Gupta", "Bhat", "Rao"
]


@router.post("/demo")
def seed_demonstration_data(db: Session = Depends(get_db)):
    """
    Populates 5 subjects, 60 students (12 per subject), 3 classrooms (70 total seats),
    and 1 initial optimized arrangement for immediate demonstration.
    """
    # 1. Clear existing data
    db.query(SeatingAssignment).delete()
    db.query(ArrangementResult).delete()
    db.query(Seat).delete()
    db.execute(student_subjects.delete())
    db.query(Student).delete()
    db.query(Classroom).delete()
    db.query(Subject).delete()
    db.commit()

    # 2. Add Subjects
    created_subjects = []
    for s_info in SAMPLE_SUBJECTS:
        subj = Subject(subject_code=s_info["code"], subject_name=s_info["name"])
        db.add(subj)
        created_subjects.append(subj)
    db.commit()
    for s in created_subjects:
        db.refresh(s)

    # 3. Add one shared roster of 60 students, enrolled in every subject.
    created_students = []
    roll_prefixes = ["24ADA", "24DB", "24AI", "24MA", "24EV"]

    for student_idx in range(60):
        fname = FIRST_NAMES[student_idx % len(FIRST_NAMES)]
        lname = LAST_NAMES[student_idx % len(LAST_NAMES)]
        primary_subject_idx = student_idx % len(created_subjects)
        student_number = student_idx // len(created_subjects) + 1
        roll = f"{roll_prefixes[primary_subject_idx]}{student_number:03d}"
        name = f"{fname} {lname}"
        email = f"{fname.lower()}.{lname.lower()}{student_idx + 1}@college.edu"

        student = Student(
            roll_no=roll,
            student_name=name,
            subject_id=created_subjects[primary_subject_idx].subject_id,
            email=email,
            semester="Semester 5",
            subjects=created_subjects,
        )
        db.add(student)
        created_students.append(student)
    db.commit()

    # 4. Add 3 Classrooms (total 70 seats)
    rooms_data = [
        {"name": "Hall 101 - Newton Block", "capacity": 25, "rows": 5, "cols": 5},
        {"name": "Hall 102 - Turing Block", "capacity": 25, "rows": 5, "cols": 5},
        {"name": "Lab 201 - Lovelace Wing", "capacity": 20, "rows": 4, "cols": 5},
    ]

    created_rooms = []
    for r_data in rooms_data:
        crm = Classroom(
            classroom_name=r_data["name"],
            capacity=r_data["capacity"],
            rows=r_data["rows"],
            cols=r_data["cols"]
        )
        db.add(crm)
        created_rooms.append(crm)
    db.commit()

    for crm in created_rooms:
        db.refresh(crm)
        generate_classroom_seats(crm, db)

    # 5. Run Initial Demo Seating Arrangement using Greedy Algorithm
    all_seats = db.query(Seat).join(Classroom).order_by(Seat.classroom_id.asc(), Seat.row_num.asc(), Seat.col_num.asc()).all()
    room_map = {c.classroom_id: c.classroom_name for c in created_rooms}
    
    seats_input = [
        {
            "seat_id": st.seat_id,
            "seat_number": st.seat_number,
            "classroom_id": st.classroom_id,
            "classroom_name": room_map.get(st.classroom_id),
            "row_num": st.row_num,
            "col_num": st.col_num
        }
        for st in all_seats
    ]

    students_input = [
        {
            "roll_no": s.roll_no,
            "student_name": s.student_name,
            "subject_id": s.subject_id,
            "subject_code": s.subject.subject_code,
            "subject_name": s.subject.subject_name
        }
        for s in db.query(Student).join(Subject).all()
    ]

    greedy_res = greedy_seat_allocation(students_input, seats_input, separation_mode="all", pre_interleave=True)

    demo_arrangement = ArrangementResult(
        exam_name="End Semester Examination 2026 - Shift 1",
        exam_date="2026-12-05 (Morning 09:30 AM)",
        algorithm_used="Greedy Optimization",
        separation_mode="all",
        total_students=len(students_input),
        students_assigned=greedy_res["assigned_students"],
        unassigned_students=greedy_res["unassigned_students"],
        total_conflict_count=greedy_res["total_conflicts"],
        conflict_score=greedy_res["conflict_score"],
        execution_time_ms=greedy_res["execution_time_ms"],
        metrics_json=json.dumps({
            "evaluations_count": greedy_res.get("evaluations_count"),
            "time_complexity": "O(N * M)",
            "space_complexity": "O(N + M)",
            "seat_utilization_rate": greedy_res.get("seat_utilization_rate"),
            "subject_distribution": greedy_res.get("subject_distribution", {}),
            "classroom_distribution": greedy_res.get("classroom_distribution", {})
        })
    )
    db.add(demo_arrangement)
    db.commit()
    db.refresh(demo_arrangement)

    conflicting_ids = set(greedy_res.get("conflicting_seat_ids", []))
    demo_assignments = []
    for item in greedy_res.get("assignments", []):
        has_conf = item["seat_id"] in conflicting_ids
        d_asg = SeatingAssignment(
            arrangement_id=demo_arrangement.arrangement_id,
            student_roll_no=item["student_roll_no"],
            subject_id=item.get("subject_id"),
            seat_id=item["seat_id"],
            classroom_id=item["classroom_id"],
            has_conflict=has_conf,
            conflict_details="Adjacent same-subject conflict" if has_conf else None
        )
        demo_assignments.append(d_asg)

    db.add_all(demo_assignments)
    db.commit()

    return {
        "status": "success",
        "message": "Demonstration data successfully seeded!",
        "subjects_created": len(created_subjects),
        "students_created": len(created_students),
        "classrooms_created": len(created_rooms),
        "total_seats_generated": len(all_seats),
        "initial_arrangement_id": demo_arrangement.arrangement_id,
        "is_demonstration_data": True
    }


@router.post("/reset")
def reset_database(db: Session = Depends(get_db)):
    """
    Clears all tables completely.
    """
    db.query(SeatingAssignment).delete()
    db.query(ArrangementResult).delete()
    db.query(Seat).delete()
    db.execute(student_subjects.delete())
    db.query(Student).delete()
    db.query(Classroom).delete()
    db.query(Subject).delete()
    db.commit()

    return {
        "status": "success",
        "message": "All data cleared successfully. Database is now clean."
    }
