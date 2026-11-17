"""
Algorithm Comparator Module - ADA Project
Runs Sorting, Greedy, and Backtracking on the exact same dataset to produce
empirical performance comparisons, complexity analysis, and visualization data.
"""
from typing import List, Dict, Any, Optional, Tuple, Set
import time
import copy
import random

from .sorting import merge_sort_students, quick_sort_students, interleave_sort_students
from .greedy import greedy_seat_allocation
from .backtracking import backtracking_seat_allocation
from .conflict_engine import detect_seating_conflicts


def run_sequential_sorting_allocation(
    students: List[Dict[str, Any]],
    seats: List[Dict[str, Any]],
    separation_mode: str = "all",
    sort_strategy: str = "merge_sort"
) -> Dict[str, Any]:
    """
    Baseline Algorithm 1: Pure Sorting + Linear Allocation.
    Sorts students (by roll no or subject), then assigns them sequentially
    into seats row by row. Demonstrates why pure sorting without adjacency awareness
    creates high clusters of conflicts when sorted by subject!
    """
    start_ns = time.perf_counter_ns()

    if sort_strategy == "quick_sort":
        sort_res = quick_sort_students(students, key="subject_then_roll")
    else:
        sort_res = merge_sort_students(students, key="subject_then_roll")

    sorted_students = sort_res["sorted_students"]
    ordered_seats = sorted(
        seats,
        key=lambda s: (s.get("classroom_id", 0), s.get("row_num", 0), s.get("col_num", 0))
    )

    assignments: List[Dict[str, Any]] = []
    unassigned: List[Dict[str, Any]] = []

    for idx, student in enumerate(sorted_students):
        if idx < len(ordered_seats):
            seat = ordered_seats[idx]
            assignments.append({
                "seat_id": seat.get("seat_id"),
                "seat_number": seat.get("seat_number"),
                "classroom_id": seat.get("classroom_id"),
                "classroom_name": seat.get("classroom_name"),
                "row_num": seat.get("row_num"),
                "col_num": seat.get("col_num"),
                "student_roll_no": student.get("roll_no"),
                "student_name": student.get("student_name"),
                "subject_id": student.get("subject_id"),
                "subject_code": student.get("subject_code"),
                "subject_name": student.get("subject_name"),
                "local_penalty": 0
            })
        else:
            unassigned.append(student)

    conflict_res = detect_seating_conflicts(assignments, separation_mode=separation_mode)
    elapsed_ns = time.perf_counter_ns() - start_ns
    elapsed_ms = elapsed_ns / 1_000_000.0

    return {
        "algorithm": f"Sorting-Based Allocation ({sort_res['algorithm']})",
        "assigned_students": len(assignments),
        "unassigned_students": len(unassigned),
        "total_conflicts": conflict_res["total_conflicts"],
        "conflict_score": conflict_res["conflict_score"],
        "conflicting_seat_ids": conflict_res["conflicting_seat_ids"],
        "conflict_pairs": conflict_res["conflict_pairs"],
        "subject_distribution": conflict_res["subject_distribution"],
        "classroom_distribution": conflict_res["classroom_distribution"],
        "execution_time_ns": elapsed_ns,
        "execution_time_ms": round(elapsed_ms, 3),
        "time_complexity": sort_res["time_complexity"],
        "space_complexity": sort_res["space_complexity"],
        "recursive_calls": "N/A",
        "backtracking_operations": "N/A",
        "sorting_comparisons": sort_res["comparisons"],
        "sorting_moves": sort_res["moves_or_swaps"],
        "strategy_explanation": "Sorts students by subject and roll number, then naively assigns seats in sequential order. Fast O(n log n), but groups same-subject students together causing highest conflicts.",
        "assignments": assignments
    }


def run_algorithm_comparison(
    students: List[Dict[str, Any]],
    seats: List[Dict[str, Any]],
    separation_mode: str = "all"
) -> Dict[str, Any]:
    """
    Executes Sorting, Greedy, and Backtracking on identical input data.
    Measures and aggregates comparative metrics for side-by-side analysis.
    """
    # 1. Sorting-Based Sequential
    sorting_res = run_sequential_sorting_allocation(
        students=copy.deepcopy(students),
        seats=copy.deepcopy(seats),
        separation_mode=separation_mode,
        sort_strategy="merge_sort"
    )

    # 2. Greedy Optimization
    greedy_res = greedy_seat_allocation(
        students=copy.deepcopy(students),
        seats=copy.deepcopy(seats),
        separation_mode=separation_mode,
        pre_interleave=True
    )

    # 3. Backtracking Optimization
    backtrack_res = backtracking_seat_allocation(
        students=copy.deepcopy(students),
        seats=copy.deepcopy(seats),
        separation_mode=separation_mode,
        max_states=30000,
        max_backtracks=10000,
        time_limit_sec=3.0
    )

    # Comparison Table Rows
    comparison_table = [
        {
            "algorithm": sorting_res["algorithm"],
            "execution_time_ms": sorting_res["execution_time_ms"],
            "assigned_students": sorting_res["assigned_students"],
            "total_conflicts": sorting_res["total_conflicts"],
            "conflict_score": sorting_res["conflict_score"],
            "recursive_calls": "N/A",
            "backtracking_operations": "N/A",
            "time_complexity": sorting_res["time_complexity"],
            "space_complexity": sorting_res["space_complexity"],
            "conflict_reduction": "0% (Baseline)"
        },
        {
            "algorithm": greedy_res["algorithm"],
            "execution_time_ms": greedy_res["execution_time_ms"],
            "assigned_students": greedy_res["assigned_students"],
            "total_conflicts": greedy_res["total_conflicts"],
            "conflict_score": greedy_res["conflict_score"],
            "recursive_calls": "N/A",
            "backtracking_operations": "N/A",
            "time_complexity": greedy_res["time_complexity"],
            "space_complexity": greedy_res["space_complexity"],
            "conflict_reduction": f"{round((1 - (greedy_res['total_conflicts'] / max(1, sorting_res['total_conflicts']))) * 100, 1)}%"
        },
        {
            "algorithm": backtrack_res["algorithm"],
            "execution_time_ms": backtrack_res["execution_time_ms"],
            "assigned_students": backtrack_res["assigned_students"],
            "total_conflicts": backtrack_res["total_conflicts"],
            "conflict_score": backtrack_res["conflict_score"],
            "recursive_calls": backtrack_res["recursive_calls"],
            "backtracking_operations": backtrack_res["backtracking_operations"],
            "time_complexity": backtrack_res["time_complexity"],
            "space_complexity": backtrack_res["space_complexity"],
            "conflict_reduction": f"{round((1 - (backtrack_res['total_conflicts'] / max(1, sorting_res['total_conflicts']))) * 100, 1)}%"
        }
    ]

    return {
        "dataset_summary": {
            "total_students": len(students),
            "total_seats": len(seats),
            "separation_mode": separation_mode
        },
        "comparison_table": comparison_table,
        "results": {
            "sorting": sorting_res,
            "greedy": greedy_res,
            "backtracking": backtrack_res
        }
    }


def generate_synthetic_benchmark_dataset(size: int) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generates synthetic benchmark dataset of given student size
    with matching classroom seats.
    """
    subjects = [
        {"id": 1, "code": "ADA", "name": "ADA"},
        {"id": 2, "code": "DBMS", "name": "DBMS"},
        {"id": 3, "code": "AIML", "name": "AI ML"},
        {"id": 4, "code": "MATHS", "name": "Maths"},
        {"id": 5, "code": "EVS", "name": "EVS"},
    ]

    students: List[Dict[str, Any]] = []
    for i in range(1, size + 1):
        subj = subjects[(i - 1) % len(subjects)]
        students.append({
            "roll_no": f"STU-{1000 + i}",
            "student_name": f"Student {i}",
            "subject_id": subj["id"],
            "subject_code": subj["code"],
            "subject_name": subj["name"]
        })

    # Generate sufficient classrooms
    seats_needed = int(size * 1.2)  # 20% seat buffer
    seats: List[Dict[str, Any]] = []
    seat_id = 1
    room_idx = 1
    remaining_seats = seats_needed

    while remaining_seats > 0:
        rows = 6
        cols = 6
        room_cap = rows * cols
        room_name = f"Hall-{chr(64 + room_idx)}"
        
        for r in range(1, rows + 1):
            for c in range(1, cols + 1):
                seats.append({
                    "seat_id": seat_id,
                    "seat_number": f"{room_name}-R{r}C{c}",
                    "classroom_id": room_idx,
                    "classroom_name": room_name,
                    "row_num": r,
                    "col_num": c
                })
                seat_id += 1
                remaining_seats -= 1
                if remaining_seats <= 0:
                    break
            if remaining_seats <= 0:
                break
        room_idx += 1

    return students, seats


def run_benchmark_suite(sizes: Optional[List[int]] = None) -> List[Dict[str, Any]]:
    """
    Executes empirical scalability benchmarks on actual synthetic datasets
    of varying sizes (e.g., 20, 50, 100, 200, 500, 1000).
    Returns real measured execution times.
    """
    if sizes is None:
        sizes = [20, 50, 100, 200, 500]

    benchmark_points: List[Dict[str, Any]] = []

    for sz in sizes:
        students, seats = generate_synthetic_benchmark_dataset(sz)

        # 1. Sorting
        t0 = time.perf_counter_ns()
        s_res = run_sequential_sorting_allocation(students, seats, separation_mode="all")
        s_time_ms = round((time.perf_counter_ns() - t0) / 1_000_000.0, 3)

        # 2. Greedy
        t1 = time.perf_counter_ns()
        g_res = greedy_seat_allocation(students, seats, separation_mode="all")
        g_time_ms = round((time.perf_counter_ns() - t1) / 1_000_000.0, 3)

        # 3. Backtracking (adjust limit based on size to avoid timeout on huge sizes)
        # On larger sizes (> 200), pure backtracking explores massive trees, so limits prune search
        t2 = time.perf_counter_ns()
        b_res = backtracking_seat_allocation(
            students,
            seats,
            separation_mode="all",
            max_states=min(25000, max(5000, sz * 50)),
            max_backtracks=min(8000, max(2000, sz * 20)),
            time_limit_sec=2.0
        )
        b_time_ms = round((time.perf_counter_ns() - t2) / 1_000_000.0, 3)

        benchmark_points.append({
            "student_count": sz,
            "seat_count": len(seats),
            "sorting_time_ms": s_time_ms,
            "greedy_time_ms": g_time_ms,
            "backtracking_time_ms": b_time_ms,
            "sorting_conflicts": s_res["total_conflicts"],
            "greedy_conflicts": g_res["total_conflicts"],
            "backtracking_conflicts": b_res["total_conflicts"]
        })

    return benchmark_points
