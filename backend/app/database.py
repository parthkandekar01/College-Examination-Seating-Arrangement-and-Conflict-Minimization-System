"""
Database Setup - SQLite & SQLAlchemy
"""
import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "exam_seating.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def initialize_database():
    Base.metadata.create_all(bind=engine)

    with engine.begin() as connection:
        assignment_columns = {
            column["name"] for column in inspect(connection).get_columns("seating_assignments")
        }
        if "subject_id" not in assignment_columns:
            connection.exec_driver_sql(
                "ALTER TABLE seating_assignments "
                "ADD COLUMN subject_id INTEGER REFERENCES subjects(subject_id) ON DELETE SET NULL"
            )

        connection.exec_driver_sql(
            "UPDATE seating_assignments "
            "SET subject_id = ("
            "SELECT subject_id FROM students "
            "WHERE students.roll_no = seating_assignments.student_roll_no"
            ") "
            "WHERE subject_id IS NULL"
        )
        connection.exec_driver_sql(
            "INSERT OR IGNORE INTO student_subjects (student_roll_no, subject_id) "
            "SELECT roll_no, subject_id FROM students WHERE subject_id IS NOT NULL"
        )

        unique_constraints = inspect(connection).get_unique_constraints("seating_assignments")
        constraint_names = {constraint["name"] for constraint in unique_constraints}
        if "uq_arrangement_student" in constraint_names:
            connection.exec_driver_sql(
                "CREATE TABLE seating_assignments_new ("
                "assignment_id INTEGER NOT NULL PRIMARY KEY, "
                "arrangement_id INTEGER NOT NULL REFERENCES arrangements(arrangement_id) ON DELETE CASCADE, "
                "student_roll_no VARCHAR(50) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE, "
                "subject_id INTEGER REFERENCES subjects(subject_id) ON DELETE SET NULL, "
                "seat_id INTEGER NOT NULL REFERENCES seats(seat_id) ON DELETE CASCADE, "
                "classroom_id INTEGER NOT NULL REFERENCES classrooms(classroom_id) ON DELETE CASCADE, "
                "has_conflict BOOLEAN, "
                "conflict_details TEXT, "
                "CONSTRAINT uq_arrangement_student_subject "
                "UNIQUE (arrangement_id, student_roll_no, subject_id), "
                "CONSTRAINT uq_arrangement_seat UNIQUE (arrangement_id, seat_id)"
                ")"
            )
            connection.exec_driver_sql(
                "INSERT INTO seating_assignments_new ("
                "assignment_id, arrangement_id, student_roll_no, subject_id, seat_id, "
                "classroom_id, has_conflict, conflict_details"
                ") SELECT assignment_id, arrangement_id, student_roll_no, subject_id, seat_id, "
                "classroom_id, has_conflict, conflict_details FROM seating_assignments"
            )
            connection.exec_driver_sql("DROP TABLE seating_assignments")
            connection.exec_driver_sql(
                "ALTER TABLE seating_assignments_new RENAME TO seating_assignments"
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
