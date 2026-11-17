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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
