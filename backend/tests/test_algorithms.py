"""
Automated Unit Tests for Core ADA Algorithms:
- Sorting (Merge Sort, Quick Sort, Interleaved)
- Conflict Detection (Pair Deduplication & Adjacency)
- Greedy Seat Allocation
- Recursive Backtracking & Rollbacks
"""
import pytest
from app.algorithms import (
    merge_sort_students,
    quick_sort_students,
    interleave_sort_students,
    greedy_seat_allocation,
    backtracking_seat_allocation,
    detect_seating_conflicts
)


@pytest.fixture
def sample_students():
    return [
        {"roll_no": "24CS003", "student_name": "Charlie", "subject_id": 1, "subject_code": "CS301", "subject_name": "ADA"},
        {"roll_no": "24CS001", "student_name": "Alice", "subject_id": 1, "subject_code": "CS301", "subject_name": "ADA"},
        {"roll_no": "24CS002", "student_name": "Bob", "subject_id": 1, "subject_code": "CS301", "subject_name": "ADA"},
        {"roll_no": "24IT002", "student_name": "David", "subject_id": 2, "subject_code": "IT302", "subject_name": "OS"},
        {"roll_no": "24IT001", "student_name": "Emma", "subject_id": 2, "subject_code": "IT302", "subject_name": "OS"},
    ]


@pytest.fixture
def sample_seats():
    seats = []
    # 3x3 classroom (9 seats)
    seat_id = 1
    for r in range(1, 4):
        for c in range(1, 4):
            seats.append({
                "seat_id": seat_id,
                "seat_number": f"H1-R{r}C{c}",
                "classroom_id": 1,
                "classroom_name": "Hall 1",
                "row_num": r,
                "col_num": c
            })
            seat_id += 1
    return seats


def test_merge_sort_correctness(sample_students):
    res = merge_sort_students(sample_students, key="roll_no")
    sorted_rolls = [s["roll_no"] for s in res["sorted_students"]]
    assert sorted_rolls == ["24CS001", "24CS002", "24CS003", "24IT001", "24IT002"]
    assert res["comparisons"] > 0
    assert res["time_complexity"] == "O(n log n)"


def test_quick_sort_correctness(sample_students):
    res = quick_sort_students(sample_students, key="roll_no")
    sorted_rolls = [s["roll_no"] for s in res["sorted_students"]]
    assert sorted_rolls == ["24CS001", "24CS002", "24CS003", "24IT001", "24IT002"]
    assert res["comparisons"] > 0


def test_interleaved_sorting(sample_students):
    res = interleave_sort_students(sample_students)
    sorted_subjects = [s["subject_code"] for s in res["sorted_students"]]
    # Should alternate subjects
    assert sorted_subjects[0] != sorted_subjects[1]


def test_conflict_detection_deduplication():
    # Two students of CS301 side-by-side in R1C1 and R1C2
    assignments = [
        {"seat_id": 101, "seat_number": "R1C1", "classroom_id": 1, "row_num": 1, "col_num": 1, "student_roll_no": "S1", "student_name": "A", "subject_code": "CS301"},
        {"seat_id": 102, "seat_number": "R1C2", "classroom_id": 1, "row_num": 1, "col_num": 2, "student_roll_no": "S2", "student_name": "B", "subject_code": "CS301"},
    ]
    report = detect_seating_conflicts(assignments, separation_mode="horizontal")
    # Must be exactly 1 conflict pair (not double-counted as 2!)
    assert report["total_conflicts"] == 1
    assert report["conflict_score"] == 10
    assert 101 in report["conflicting_seat_ids"]
    assert 102 in report["conflicting_seat_ids"]


def test_greedy_seat_allocation(sample_students, sample_seats):
    res = greedy_seat_allocation(sample_students, sample_seats, separation_mode="all")
    assert res["assigned_students"] == 5
    assert res["unassigned_students"] == 0
    assert len(res["assignments"]) == 5
    # In a 3x3 grid with 5 students (3 CS, 2 IT), greedy can place them with 0 conflicts
    assert res["total_conflicts"] == 0


def test_backtracking_seat_allocation(sample_students, sample_seats):
    res = backtracking_seat_allocation(sample_students, sample_seats, separation_mode="all")
    assert res["assigned_students"] == 5
    assert res["recursive_calls"] > 0
    assert res["total_conflicts"] == 0


def test_edge_case_zero_students(sample_seats):
    res = greedy_seat_allocation([], sample_seats)
    assert res["assigned_students"] == 0
    assert res["total_conflicts"] == 0


def test_edge_case_single_student(sample_seats):
    student = [{"roll_no": "S1", "student_name": "Sole", "subject_id": 1, "subject_code": "CS301"}]
    res = greedy_seat_allocation(student, sample_seats)
    assert res["assigned_students"] == 1
    assert res["total_conflicts"] == 0
