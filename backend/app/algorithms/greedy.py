"""
Greedy Algorithm Module - ADA Project
Implements local optimization for examination seating arrangement.
At each step, selects the available seat that minimizes the immediate conflict score
with already assigned adjacent students.
"""
from typing import List, Dict, Any, Optional, Tuple, Set
import time
from .conflict_engine import ADJACENCY_DIRECTIONS, detect_seating_conflicts
from .sorting import interleave_sort_students


def compute_seat_conflict_penalty(
    student: Dict[str, Any],
    candidate_seat: Dict[str, Any],
    grid_assignments: Dict[Tuple[int, int, int], Dict[str, Any]],
    directions: List[Tuple[int, int, str, int]]
) -> int:
    """
    Computes the conflict penalty for placing student into candidate_seat.
    Checks all adjacent neighbors defined by directions.
    """
    room_id = candidate_seat["classroom_id"]
    r = candidate_seat["row_num"]
    c = candidate_seat["col_num"]
    s_subj = str(student.get("subject_code") or student.get("subject_id") or "").strip().lower()

    penalty = 0
    for dr, dc, _, weight in directions:
        pos = (room_id, r + dr, c + dc)
        if pos in grid_assignments:
            neighbor = grid_assignments[pos]
            neighbor_subj = str(neighbor.get("subject_code") or neighbor.get("subject_id") or "").strip().lower()
            if neighbor_subj == s_subj:
                penalty += weight

    return penalty


def greedy_seat_allocation(
    students: List[Dict[str, Any]],
    seats: List[Dict[str, Any]],
    separation_mode: str = "all",
    pre_interleave: bool = True,
    max_steps_trace: int = 40
) -> Dict[str, Any]:
    """
    Allocates seats using Greedy Local Conflict Minimization.
    Time Complexity: O(N * M) where N = students, M = seats
    Space Complexity: O(N + M)
    """
    start_ns = time.perf_counter_ns()

    mode = separation_mode if separation_mode in ADJACENCY_DIRECTIONS else "all"
    directions = ADJACENCY_DIRECTIONS[mode]

    # Pre-interleave or organize students to avoid contiguous blocks of same subject
    if pre_interleave:
        prep_res = interleave_sort_students(students)
        ordered_students = prep_res["sorted_students"]
    else:
        ordered_students = list(students)

    # Sort seats systematically by classroom_id, row, col for deterministic layout
    available_seats = sorted(
        seats,
        key=lambda s: (s.get("classroom_id", 0), s.get("row_num", 0), s.get("col_num", 0))
    )

    # State tracking
    occupied_seat_ids: Set[Any] = set()
    grid_assignments: Dict[Tuple[int, int, int], Dict[str, Any]] = {}
    assignments: List[Dict[str, Any]] = []
    unassigned_students: List[Dict[str, Any]] = []
    decisions_trace: List[Dict[str, Any]] = []

    evaluations_count = 0

    for s_idx, student in enumerate(ordered_students):
        best_seat: Optional[Dict[str, Any]] = None
        best_penalty = float("inf")

        # Evaluate candidate seats that are not occupied
        for seat in available_seats:
            sid = seat.get("seat_id")
            if sid in occupied_seat_ids:
                continue

            evaluations_count += 1
            penalty = compute_seat_conflict_penalty(student, seat, grid_assignments, directions)

            if penalty < best_penalty:
                best_penalty = penalty
                best_seat = seat
                # Early exit greedy choice: 0 conflict penalty is optimal locally
                if penalty == 0:
                    break

        if best_seat is not None and best_penalty != float("inf"):
            sid = best_seat.get("seat_id")
            occupied_seat_ids.add(sid)
            room_id = best_seat["classroom_id"]
            r = best_seat["row_num"]
            c = best_seat["col_num"]

            assignment_entry = {
                "seat_id": sid,
                "seat_number": best_seat.get("seat_number"),
                "classroom_id": room_id,
                "classroom_name": best_seat.get("classroom_name"),
                "row_num": r,
                "col_num": c,
                "student_roll_no": student.get("roll_no"),
                "student_name": student.get("student_name"),
                "subject_id": student.get("subject_id"),
                "subject_code": student.get("subject_code"),
                "subject_name": student.get("subject_name"),
                "local_penalty": best_penalty
            }

            grid_assignments[(room_id, r, c)] = student
            assignments.append(assignment_entry)

            if len(decisions_trace) < max_steps_trace:
                decisions_trace.append({
                    "step": s_idx + 1,
                    "student_roll": student.get("roll_no"),
                    "student_name": student.get("student_name"),
                    "subject": student.get("subject_code"),
                    "chosen_seat": best_seat.get("seat_number"),
                    "classroom": best_seat.get("classroom_name"),
                    "penalty_score": best_penalty,
                    "evaluations": evaluations_count
                })
        else:
            # Capacity exhausted or no seats available
            unassigned_students.append(student)

    # Post-hoc exact conflict analysis
    conflict_report = detect_seating_conflicts(assignments, separation_mode=mode)
    elapsed_ns = time.perf_counter_ns() - start_ns
    elapsed_ms = elapsed_ns / 1_000_000.0

    return {
        "algorithm": "Greedy (Min-Conflict Heuristic)",
        "assigned_students": len(assignments),
        "unassigned_students": len(unassigned_students),
        "unassigned_list": unassigned_students,
        "total_seats": len(seats),
        "utilized_seats": len(assignments),
        "seat_utilization_rate": round(len(assignments) / len(seats) * 100, 2) if seats else 0.0,
        "total_conflicts": conflict_report["total_conflicts"],
        "conflict_score": conflict_report["conflict_score"],
        "conflicting_seat_ids": conflict_report["conflicting_seat_ids"],
        "conflict_pairs": conflict_report["conflict_pairs"],
        "subject_distribution": conflict_report["subject_distribution"],
        "classroom_distribution": conflict_report["classroom_distribution"],
        "evaluations_count": evaluations_count,
        "execution_time_ns": elapsed_ns,
        "execution_time_ms": round(elapsed_ms, 3),
        "time_complexity": "O(N * M)",
        "space_complexity": "O(N + M)",
        "strategy_explanation": "Iterates through students in order; greedily picks the seat with minimum adjacent conflict score (0 penalty preferred).",
        "assignments": assignments,
        "decisions_trace": decisions_trace
    }
