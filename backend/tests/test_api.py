"""
Automated Integration Tests for Backend APIs
Tests Subjects, Students, Classrooms, Seating Generation, Conflict Analysis, and Dashboard
Directly exercises route handlers, database transactions, and ADA algorithms.
"""
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.database import Base, engine, SessionLocal, initialize_database
from app.models import Subject, Student, Classroom, Seat, ArrangementResult, SeatingAssignment
from app.schemas import SubjectCreate, StudentCreate, ClassroomCreate, ArrangementCreate
from app.api.subjects import get_subjects, create_subject
from app.api.students import get_students, create_student
from app.api.classrooms import get_classrooms, create_classroom
from app.api.arrangements import generate_seating_arrangement, get_arrangements
from app.api.conflict_analysis import get_conflict_analysis
from app.api.dashboard import get_dashboard_stats
from app.api.seed import seed_demonstration_data
from app.main import app


@pytest.fixture(scope="module")
def db_session():
    initialize_database()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_admin_login_protects_api_routes():
    client = TestClient(app)
    allowed_origin = client.options(
        "/api/subjects",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    assert allowed_origin.headers["access-control-allow-origin"] == "http://localhost:5173"

    rejected_origin = client.options(
        "/api/subjects",
        headers={
            "Origin": "http://untrusted.example",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    assert "access-control-allow-origin" not in rejected_origin.headers

    assert client.get("/api/subjects").status_code == 401
    assert client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrong-password"},
    ).status_code == 401

    login_response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "12345678"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    assert client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    ).json() == {"username": "admin"}
    assert client.get(
        "/api/subjects",
        headers={"Authorization": f"Bearer {token}"},
    ).status_code == 200
    assert client.get(
        "/api/subjects",
        headers={"Authorization": "Bearer invalid-token"},
    ).status_code == 401


def test_seed_demonstration_data(db_session):
    res = seed_demonstration_data(db=db_session)
    assert res["status"] == "success"
    assert res["subjects_created"] == 5
    assert res["students_created"] == 60
    assert res["classrooms_created"] == 3
    assert res["total_seats_generated"] == 70


def test_seeded_students_are_enrolled_in_every_subject(db_session):
    subjects = get_subjects(search=None, db=db_session)
    assert {subject.subject_name for subject in subjects} == {"ADA", "DBMS", "AI ML", "Maths", "EVS"}
    assert all(subject.registered_students_count == 60 for subject in subjects)

    students = get_students(search=None, subject_id=None, db=db_session)
    assert len(students) == 60
    assert all({subject.subject_name for subject in student.subjects} == {"ADA", "DBMS", "AI ML", "Maths", "EVS"} for student in students)
    assert {
        student.roll_no
        for student in get_students(search=None, subject_id=subjects[0].subject_id, db=db_session)
    } == {student.roll_no for student in students}


def test_dashboard_stats_endpoint(db_session):
    stats = get_dashboard_stats(db=db_session)
    assert stats["total_students"] >= 60
    assert stats["total_subjects"] >= 4
    assert stats["total_classrooms"] >= 3
    assert len(stats["subject_distribution"]) == 5
    assert {subject["student_count"] for subject in stats["subject_distribution"]} == {60}
    assert len(stats["classroom_utilization"]) == 3


def test_get_subjects_and_students(db_session):
    subjects = get_subjects(search=None, db=db_session)
    assert len(subjects) == 5
    assert all(subject.registered_students_count == 60 for subject in subjects)

    students = get_students(search=None, subject_id=None, db=db_session)
    assert len(students) == 60


def test_generate_arrangement_greedy(db_session):
    payload = ArrangementCreate(
        exam_name="Mid-Term ADA Exam 2026",
        algorithm="greedy",
        separation_mode="all",
        subject_ids=[next(subject.subject_id for subject in get_subjects(search="ADA", db=db_session))]
    )
    res = generate_seating_arrangement(payload=payload, db=db_session)
    assert res.students_assigned == 60
    assert "Greedy" in res.algorithm_used
    assert len(res.assignments) == 60
    assert res.total_conflict_count >= 0
    assert {assignment.subject_name for assignment in res.assignments} == {"ADA"}


def test_shared_students_cannot_be_seated_twice_in_multi_subject_exam(db_session):
    subjects = get_subjects(search=None, db=db_session)
    payload = ArrangementCreate(
        exam_name="Multi-subject Shared Roster Test",
        algorithm="greedy",
        separation_mode="all",
        subject_ids=[subjects[0].subject_id, subjects[1].subject_id],
    )

    with pytest.raises(HTTPException) as error:
        generate_seating_arrangement(payload=payload, db=db_session)
    assert error.value.status_code == 400
    assert "Generate one subject exam at a time" in error.value.detail


def test_generate_arrangement_backtracking(db_session):
    payload = ArrangementCreate(
        exam_name="Backtracking Test Exam",
        algorithm="backtracking",
        separation_mode="horizontal",
        max_states=5000,
        max_backtracks=2000
    )
    res = generate_seating_arrangement(payload=payload, db=db_session)
    assert res.students_assigned == 60
    assert "Backtracking" in res.algorithm_used
    assert len(res.assignments) == 60


def test_conflict_analysis_report(db_session):
    arrs = get_arrangements(db=db_session)
    assert len(arrs) > 0
    latest_id = arrs[0].arrangement_id

    report = get_conflict_analysis(arrangement_id=latest_id, db=db_session)
    assert report["arrangement_id"] == latest_id
    assert "total_conflicts" in report
    assert "conflict_pairs" in report
