"""
Backtracking Algorithm Module - ADA Project
Implements recursive backtracking with state rollback, constraint satisfaction pruning,
and branch-and-bound optimization for examination seating arrangement.
Includes recursive call counts, explored states, and backtracking rollback counters.
"""
from typing import List, Dict, Any, Optional, Tuple, Set
import time
from .conflict_engine import ADJACENCY_DIRECTIONS, detect_seating_conflicts
from .sorting import interleave_sort_students


class BacktrackingSeatingSolver:
    def __init__(
        self,
        students: List[Dict[str, Any]],
        seats: List[Dict[str, Any]],
        separation_mode: str = "all",
        max_states: int = 50000,
        max_backtracks: int = 15000,
        time_limit_sec: float = 4.0
    ):
        self.students = students
        self.seats = sorted(
            seats,
            key=lambda s: (s.get("classroom_id", 0), s.get("row_num", 0), s.get("col_num", 0))
        )
        self.mode = separation_mode if separation_mode in ADJACENCY_DIRECTIONS else "all"
        self.directions = ADJACENCY_DIRECTIONS[self.mode]

        self.max_states = max_states
        self.max_backtracks = max_backtracks
        self.time_limit_sec = time_limit_sec

        # Counters
        self.recursive_calls = 0
        self.explored_states = 0
        self.backtrack_count = 0
        self.search_pruned = False
        self.start_time = 0.0

        # State representations
        self.occupied_seats: Set[Any] = set()
        self.grid: Dict[Tuple[int, int, int], Dict[str, Any]] = {}
        self.current_assignment: List[Dict[str, Any]] = []

        # Best solution found (for branch-and-bound or when zero conflict is impossible)
        self.best_assignment: List[Dict[str, Any]] = []
        self.best_conflict_count = float("inf")
        self.best_assigned_count = 0
        self.trace_steps: List[Dict[str, Any]] = []

    def _is_safe(self, student: Dict[str, Any], seat: Dict[str, Any]) -> Tuple[bool, int]:
        """
        Constraint Checking:
        Checks whether placing student at seat causes an adjacent same-subject violation.
        Returns (is_zero_conflict, penalty_score).
        """
        room_id = seat["classroom_id"]
        r = seat["row_num"]
        c = seat["col_num"]
        subj = str(student.get("subject_code") or student.get("subject_id") or "").strip().lower()

        penalty = 0
        for dr, dc, _, weight in self.directions:
            pos = (room_id, r + dr, c + dc)
            if pos in self.grid:
                neighbor = self.grid[pos]
                n_subj = str(neighbor.get("subject_code") or neighbor.get("subject_id") or "").strip().lower()
                if n_subj == subj:
                    penalty += weight

        return (penalty == 0, penalty)

    def solve(self) -> bool:
        self.start_time = time.perf_counter()
        # Pre-order students with round-robin interleaving to maximize probability of 0-conflict path
        prep = interleave_sort_students(self.students)
        self.students = prep["sorted_students"]

        # Call recursive search
        found_perfect = self._backtrack(0)
        return found_perfect

    def _backtrack(self, student_idx: int) -> bool:
        if self.search_pruned:
            return False

        self.recursive_calls += 1
        self.explored_states += 1

        # Check safety bounds (timeout or max state limits)
        if (
            self.explored_states >= self.max_states
            or self.backtrack_count >= self.max_backtracks
            or (time.perf_counter() - self.start_time) >= self.time_limit_sec
        ):
            self.search_pruned = True
            return False

        # Base case: all students seated successfully
        if student_idx >= len(self.students):
            self.best_assignment = list(self.current_assignment)
            self.best_conflict_count = 0
            self.best_assigned_count = len(self.current_assignment)
            return True

        student = self.students[student_idx]

        # Prioritize candidate seats (heuristic: try seats that have 0 conflict penalty first)
        candidate_evaluations: List[Tuple[int, Dict[str, Any]]] = []
        for seat in self.seats:
            sid = seat.get("seat_id")
            if sid in self.occupied_seats:
                continue
            is_zero, penalty = self._is_safe(student, seat)
            candidate_evaluations.append((penalty, seat))

        # Sort candidate seats by penalty (try 0 penalty first - Minimum Remaining Conflict heuristic)
        candidate_evaluations.sort(key=lambda x: x[0])

        # Domain pruning: evaluate top candidate choices to keep branching factor tractable
        top_candidates = candidate_evaluations[:6]

        for penalty, seat in top_candidates:
            if self.search_pruned:
                return False

            sid = seat.get("seat_id")
            room_id = seat["classroom_id"]
            r = seat["row_num"]
            c = seat["col_num"]

            # Pruning rule: in hard-constraint phase, avoid branches that immediately introduce conflicts
            if penalty > 0 and self.recursive_calls < 5000 and len(self.seats) >= len(self.students):
                # Don't pick conflicting seat if we have plenty of seats and early search
                continue

            # 1. MAKE ASSIGNMENT (FORWARD STEP)
            self.occupied_seats.add(sid)
            self.grid[(room_id, r, c)] = student
            entry = {
                "seat_id": sid,
                "seat_number": seat.get("seat_number"),
                "classroom_id": room_id,
                "classroom_name": seat.get("classroom_name"),
                "row_num": r,
                "col_num": c,
                "student_roll_no": student.get("roll_no"),
                "student_name": student.get("student_name"),
                "subject_id": student.get("subject_id"),
                "subject_code": student.get("subject_code"),
                "subject_name": student.get("subject_name"),
                "local_penalty": penalty
            }
            self.current_assignment.append(entry)

            if len(self.trace_steps) < 30:
                self.trace_steps.append({
                    "action": "ASSIGN",
                    "student": student.get("roll_no"),
                    "seat": seat.get("seat_number"),
                    "penalty": penalty,
                    "depth": student_idx + 1
                })

            # Track as partial best
            if len(self.current_assignment) > self.best_assigned_count:
                self.best_assigned_count = len(self.current_assignment)
                self.best_assignment = list(self.current_assignment)

            # 2. RECURSE
            if self._backtrack(student_idx + 1):
                return True

            if self.search_pruned:
                return False

            # 3. UNDO ASSIGNMENT (BACKTRACK STEP)
            self.backtrack_count += 1
            self.occupied_seats.remove(sid)
            del self.grid[(room_id, r, c)]
            self.current_assignment.pop()

            if len(self.trace_steps) < 30:
                self.trace_steps.append({
                    "action": "ROLLBACK",
                    "student": student.get("roll_no"),
                    "seat": seat.get("seat_number"),
                    "depth": student_idx + 1
                })

        return False


def backtracking_seat_allocation(
    students: List[Dict[str, Any]],
    seats: List[Dict[str, Any]],
    separation_mode: str = "all",
    max_states: int = 40000,
    max_backtracks: int = 15000,
    time_limit_sec: float = 3.5
) -> Dict[str, Any]:
    """
    Executes recursive Backtracking with ADA metrics.
    Time Complexity: Worst Case O(M^N) exponential without pruning, optimized with MRV.
    Space Complexity: O(N) recursion stack and state.
    """
    start_ns = time.perf_counter_ns()

    solver = BacktrackingSeatingSolver(
        students=students,
        seats=seats,
        separation_mode=separation_mode,
        max_states=max_states,
        max_backtracks=max_backtracks,
        time_limit_sec=time_limit_sec
    )

    found_zero_conflict = solver.solve()
    assignments = solver.best_assignment

    # If backtracking search could not seat all students due to hard constraints (e.g. pigeonhole principle),
    # complete the seating using the best min-conflict placement so all students receive a seat
    if len(assignments) < len(students):
        assigned_rolls = {a["student_roll_no"] for a in assignments}
        occupied_seats = {a["seat_id"] for a in assignments}
        grid = {(a["classroom_id"], a["row_num"], a["col_num"]): a for a in assignments}
        
        remaining_students = [s for s in students if s.get("roll_no") not in assigned_rolls]
        remaining_seats = [seat for seat in solver.seats if seat.get("seat_id") not in occupied_seats]

        for s in remaining_students:
            best_s = None
            best_pen = float("inf")
            for seat in remaining_seats:
                if seat.get("seat_id") in occupied_seats:
                    continue
                room_id = seat["classroom_id"]
                r = seat["row_num"]
                c = seat["col_num"]
                subj = str(s.get("subject_code") or s.get("subject_id") or "").strip().lower()
                pen = 0
                for dr, dc, _, weight in solver.directions:
                    pos = (room_id, r + dr, c + dc)
                    if pos in grid:
                        if str(grid[pos].get("subject_code") or grid[pos].get("subject_id") or "").strip().lower() == subj:
                            pen += weight
                if pen < best_pen:
                    best_pen = pen
                    best_s = seat
                    if pen == 0:
                        break
            
            if best_s:
                occupied_seats.add(best_s.get("seat_id"))
                grid[(best_s["classroom_id"], best_s["row_num"], best_s["col_num"])] = s
                assignments.append({
                    "seat_id": best_s.get("seat_id"),
                    "seat_number": best_s.get("seat_number"),
                    "classroom_id": best_s["classroom_id"],
                    "classroom_name": best_s.get("classroom_name"),
                    "row_num": best_s["row_num"],
                    "col_num": best_s["col_num"],
                    "student_roll_no": s.get("roll_no"),
                    "student_name": s.get("student_name"),
                    "subject_id": s.get("subject_id"),
                    "subject_code": s.get("subject_code"),
                    "subject_name": s.get("subject_name"),
                    "local_penalty": best_pen
                })

    # Evaluate final conflicts
    conflict_report = detect_seating_conflicts(assignments, separation_mode=solver.mode)

    assigned_rolls = {a["student_roll_no"] for a in assignments}
    unassigned = [s for s in students if s.get("roll_no") not in assigned_rolls]

    elapsed_ns = time.perf_counter_ns() - start_ns
    elapsed_ms = elapsed_ns / 1_000_000.0

    return {
        "algorithm": "Backtracking (Constraint Satisfaction Search)",
        "found_optimal_zero_conflict": found_zero_conflict,
        "search_pruned_by_limit": solver.search_pruned,
        "assigned_students": len(assignments),
        "unassigned_students": len(unassigned),
        "unassigned_list": unassigned,
        "total_seats": len(seats),
        "utilized_seats": len(assignments),
        "seat_utilization_rate": round(len(assignments) / len(seats) * 100, 2) if seats else 0.0,
        "total_conflicts": conflict_report["total_conflicts"],
        "conflict_score": conflict_report["conflict_score"],
        "conflicting_seat_ids": conflict_report["conflicting_seat_ids"],
        "conflict_pairs": conflict_report["conflict_pairs"],
        "subject_distribution": conflict_report["subject_distribution"],
        "classroom_distribution": conflict_report["classroom_distribution"],
        "recursive_calls": solver.recursive_calls,
        "explored_states": solver.explored_states,
        "backtracking_operations": solver.backtrack_count,
        "execution_time_ns": elapsed_ns,
        "execution_time_ms": round(elapsed_ms, 3),
        "time_complexity": "O(M^N) worst-case exponential",
        "space_complexity": "O(N) stack depth",
        "strategy_explanation": "Recursive exploration of seat assignments with constraint pruning. Undoes assignments (backtracks) when adjacent conflict is violated.",
        "assignments": assignments,
        "decisions_trace": solver.trace_steps
    }
