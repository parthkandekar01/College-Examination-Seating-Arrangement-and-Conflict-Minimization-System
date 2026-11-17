"""
SQLAlchemy ORM Models - College Examination Seating System
Directly aligns with the project ER Diagram:
SUBJECT, STUDENT, CLASSROOM, SEAT, ARRANGEMENT_RESULT, SEATING_ASSIGNMENT
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, UniqueConstraint, Table
from sqlalchemy.orm import relationship
from ..database import Base


student_subjects = Table(
    "student_subjects",
    Base.metadata,
    Column("student_roll_no", String(50), ForeignKey("students.roll_no", ondelete="CASCADE"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.subject_id", ondelete="CASCADE"), primary_key=True),
)


class Subject(Base):
    __tablename__ = "subjects"

    subject_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    subject_code = Column(String(30), unique=True, index=True, nullable=False)
    subject_name = Column(String(120), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    default_students = relationship("Student", back_populates="subject")
    students = relationship("Student", secondary=student_subjects, back_populates="subjects")


class Student(Base):
    __tablename__ = "students"

    roll_no = Column(String(50), primary_key=True, index=True)
    student_name = Column(String(120), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id", ondelete="CASCADE"), nullable=False)
    email = Column(String(120), nullable=True)
    semester = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    subject = relationship("Subject", back_populates="default_students")
    subjects = relationship("Subject", secondary=student_subjects, back_populates="students")
    assignments = relationship("SeatingAssignment", back_populates="student", cascade="all, delete-orphan")


class Classroom(Base):
    __tablename__ = "classrooms"

    classroom_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    classroom_name = Column(String(100), unique=True, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    seats = relationship("Seat", back_populates="classroom", cascade="all, delete-orphan")
    assignments = relationship("SeatingAssignment", back_populates="classroom", cascade="all, delete-orphan")


class Seat(Base):
    __tablename__ = "seats"

    seat_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.classroom_id", ondelete="CASCADE"), nullable=False)
    seat_number = Column(String(50), nullable=False)
    row_num = Column(Integer, nullable=False)
    col_num = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("classroom_id", "seat_number", name="uq_room_seat_number"),
        UniqueConstraint("classroom_id", "row_num", "col_num", name="uq_room_row_col"),
    )

    # Relationships
    classroom = relationship("Classroom", back_populates="seats")
    assignments = relationship("SeatingAssignment", back_populates="seat", cascade="all, delete-orphan")


class ArrangementResult(Base):
    """
    Corresponds to ARRANGEMENT_RESULT in the ER Diagram.
    """
    __tablename__ = "arrangements"

    arrangement_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exam_name = Column(String(150), nullable=False)
    exam_date = Column(String(50), nullable=True)
    algorithm_used = Column(String(80), nullable=False)
    separation_mode = Column(String(30), default="all")  # horizontal, vertical, all
    total_students = Column(Integer, default=0)
    students_assigned = Column(Integer, default=0)
    unassigned_students = Column(Integer, default=0)
    total_conflict_count = Column(Integer, default=0)
    conflict_score = Column(Integer, default=0)
    execution_time_ms = Column(Float, default=0.0)
    metrics_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    assignments = relationship("SeatingAssignment", back_populates="arrangement", cascade="all, delete-orphan")


class SeatingAssignment(Base):
    """
    Corresponds to SEATING_ASSIGNMENT in the ER Diagram.
    Connects Student and Seat per Arrangement.
    Constraints: each student gets exactly one seat; each seat used at most once.
    """
    __tablename__ = "seating_assignments"

    assignment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    arrangement_id = Column(Integer, ForeignKey("arrangements.arrangement_id", ondelete="CASCADE"), nullable=False)
    student_roll_no = Column(String(50), ForeignKey("students.roll_no", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id", ondelete="SET NULL"), nullable=True)
    seat_id = Column(Integer, ForeignKey("seats.seat_id", ondelete="CASCADE"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.classroom_id", ondelete="CASCADE"), nullable=False)
    has_conflict = Column(Boolean, default=False)
    conflict_details = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("arrangement_id", "student_roll_no", name="uq_arrangement_student"),
        UniqueConstraint("arrangement_id", "seat_id", name="uq_arrangement_seat"),
    )

    # Relationships
    arrangement = relationship("ArrangementResult", back_populates="assignments")
    student = relationship("Student", back_populates="assignments")
    subject = relationship("Subject")
    seat = relationship("Seat", back_populates="assignments")
    classroom = relationship("Classroom", back_populates="assignments")
