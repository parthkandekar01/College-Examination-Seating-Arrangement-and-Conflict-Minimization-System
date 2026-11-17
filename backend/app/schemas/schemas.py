"""
Pydantic Schemas for Request & Response Validation
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ------------------ SUBJECT SCHEMAS ------------------
class SubjectBase(BaseModel):
    subject_code: str = Field(..., min_length=2, max_length=30)
    subject_name: str = Field(..., min_length=2, max_length=120)


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    subject_code: Optional[str] = Field(None, min_length=2, max_length=30)
    subject_name: Optional[str] = Field(None, min_length=2, max_length=120)


class SubjectResponse(SubjectBase):
    subject_id: int
    created_at: Optional[datetime] = None
    registered_students_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ------------------ STUDENT SCHEMAS ------------------
class StudentBase(BaseModel):
    roll_no: str = Field(..., min_length=1, max_length=50)
    student_name: str = Field(..., min_length=1, max_length=120)
    subject_id: int
    email: Optional[str] = None
    semester: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentSubjectResponse(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str


class StudentUpdate(BaseModel):
    student_name: Optional[str] = Field(None, min_length=1, max_length=120)
    subject_id: Optional[int] = None
    email: Optional[str] = None
    semester: Optional[str] = None


class StudentResponse(BaseModel):
    roll_no: str
    student_name: str
    subject_id: int
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    subjects: List[StudentSubjectResponse] = Field(default_factory=list)
    email: Optional[str] = None
    semester: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class BulkStudentCreate(BaseModel):
    students: List[StudentCreate]


# ------------------ CLASSROOM & SEAT SCHEMAS ------------------
class SeatResponse(BaseModel):
    seat_id: int
    classroom_id: int
    seat_number: str
    row_num: int
    col_num: int

    model_config = ConfigDict(from_attributes=True)


class ClassroomBase(BaseModel):
    classroom_name: str = Field(..., min_length=1, max_length=100)
    capacity: int = Field(..., gt=0)
    rows: int = Field(..., gt=0)
    cols: int = Field(..., gt=0)


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    classroom_name: Optional[str] = None
    capacity: Optional[int] = None
    rows: Optional[int] = None
    cols: Optional[int] = None


class ClassroomResponse(ClassroomBase):
    classroom_id: int
    created_at: Optional[datetime] = None
    seats_count: int = 0
    seats: Optional[List[SeatResponse]] = None

    model_config = ConfigDict(from_attributes=True)


# ------------------ ARRANGEMENT SCHEMAS ------------------
class ArrangementCreate(BaseModel):
    exam_name: str = Field(..., min_length=2, max_length=150)
    exam_date: Optional[str] = None
    subject_ids: Optional[List[int]] = None
    classroom_ids: Optional[List[int]] = None
    student_roll_nos: Optional[List[str]] = None
    algorithm: str = Field("greedy", pattern="^(greedy|backtracking|sorting)$")
    separation_mode: str = Field("all", pattern="^(horizontal|vertical|all)$")
    sort_strategy: Optional[str] = "merge_sort"  # for sorting algorithm: merge_sort or quick_sort
    max_states: Optional[int] = 30000
    max_backtracks: Optional[int] = 10000
    time_limit_sec: Optional[float] = 3.5


class AssignmentItem(BaseModel):
    assignment_id: Optional[int] = None
    seat_id: int
    seat_number: str
    classroom_id: int
    classroom_name: Optional[str] = None
    row_num: int
    col_num: int
    student_roll_no: str
    student_name: str
    subject_id: Optional[int] = None
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    has_conflict: bool = False
    conflict_details: Optional[str] = None
    local_penalty: Optional[int] = 0


class ArrangementResponse(BaseModel):
    arrangement_id: int
    exam_name: str
    exam_date: Optional[str] = None
    algorithm_used: str
    separation_mode: str
    total_students: int
    students_assigned: int
    unassigned_students: int
    total_conflict_count: int
    conflict_score: int
    execution_time_ms: float
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ArrangementDetailResponse(ArrangementResponse):
    assignments: List[AssignmentItem] = []
    conflict_report: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    unassigned_list: Optional[List[Dict[str, Any]]] = []
    decisions_trace: Optional[List[Dict[str, Any]]] = []


# ------------------ ALGORITHM RUNNER & BENCHMARK SCHEMAS ------------------
class StandaloneSortRequest(BaseModel):
    algorithm: str = Field("merge_sort", pattern="^(merge_sort|quick_sort|interleaved)$")
    key: str = Field("roll_no", pattern="^(roll_no|subject_code|student_name|subject_then_roll)$")
    student_roll_nos: Optional[List[str]] = None


class BenchmarkRunRequest(BaseModel):
    sizes: Optional[List[int]] = None
    separation_mode: str = "all"
