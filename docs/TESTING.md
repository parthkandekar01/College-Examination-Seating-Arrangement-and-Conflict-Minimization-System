# Automated Testing Report & Test Suite Documentation

## 1. Overview
The system contains an automated test suite implemented using **pytest**, verifying both algorithm correctness and API integration.

To run the automated tests:
```powershell
# From project root in PowerShell:
$env:PYTHONPATH="backend"; & ".\backend\venv\Scripts\python.exe" -m pytest backend/tests -v
```

---

## 2. Test Cases Covered

### A. Core ADA Algorithms (`backend/tests/test_algorithms.py`)
1. `test_merge_sort_correctness`: Verifies Merge Sort divide-and-conquer logic, alphabetical/numerical ordering, comparison tracking, and $O(n \log n)$ metadata.
2. `test_quick_sort_correctness`: Verifies Quick Sort partitioning correctness and swap tracking.
3. `test_interleaved_sorting`: Confirms that round-robin interleaving alternates adjacent subjects.
4. `test_conflict_detection_deduplication`: Validates that adjacent same-subject seats are counted **strictly once** (undirected pair deduplication $u < v$), preventing double-counting.
5. `test_greedy_seat_allocation`: Validates local conflict minimization and capacity enforcement.
6. `test_backtracking_seat_allocation`: Validates recursive backtracking, constraint checking, and state rollback operations.
7. `test_edge_case_zero_students`: Validates graceful execution with 0 students.
8. `test_edge_case_single_student`: Validates execution with a single student.

### B. API & Database Integration (`backend/tests/test_api.py`)
9. `test_admin_login_protects_api_routes`: Validates login, signed tokens, and rejection of unauthenticated or invalid-token API requests.
10. `test_seed_demonstration_data`: Tests seeding 5 subjects, 60 shared students, 3 classrooms, and initial seating arrangement.
11. `test_seeded_students_are_enrolled_in_every_subject`: Confirms all 60 student identities are enrolled in each of the five subjects.
12. `test_dashboard_stats_endpoint`: Verifies live aggregation of students, subjects, classrooms, and seat utilization.
13. `test_get_subjects_and_students`: Verifies student and subject retrieval with enrollment counts.
14. `test_generate_arrangement_greedy`: Tests subject-specific seating generation with Greedy Optimization.
15. `test_shared_students_cannot_be_seated_twice_in_multi_subject_exam`: Ensures overlapping subjects are rejected to prevent duplicate seating.
16. `test_generate_arrangement_backtracking`: Tests full arrangement generation with Recursive Backtracking.
17. `test_conflict_analysis_report`: Tests conflict breakdown inspection.

---

## 3. Test Execution Verification Output
```text
platform win32 -- Python 3.14.2, pytest-9.2.0
17 passed, 1 Starlette/httpx deprecation warning
```
