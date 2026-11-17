"""
Conflict Analysis Engine - ADA Project
Detects adjacent same-subject student seat allocations in classroom grids.
Calculates unique pair conflicts (preventing double counting) and weighted conflict scores.
"""
from typing import List, Dict, Any, Set, Tuple


ADJACENCY_DIRECTIONS = {
    "horizontal": [
        (0, -1, "horizontal", 10),
        (0, 1, "horizontal", 10),
    ],
    "vertical": [
        (0, -1, "horizontal", 10),
        (0, 1, "horizontal", 10),
        (-1, 0, "vertical", 6),
        (1, 0, "vertical", 6),
    ],
    "all": [
        (0, -1, "horizontal", 10),
        (0, 1, "horizontal", 10),
        (-1, 0, "vertical", 6),
        (1, 0, "vertical", 6),
        (-1, -1, "diagonal", 3),
        (-1, 1, "diagonal", 3),
        (1, -1, "diagonal", 3),
        (1, 1, "diagonal", 3),
    ]
}


def detect_seating_conflicts(
    assignments: List[Dict[str, Any]],
    separation_mode: str = "all"
) -> Dict[str, Any]:
    """
    Scans assignments across classrooms and seats.
    Each assignment should contain:
      - seat_id
      - classroom_id
      - row_num
      - col_num
      - student_roll_no
      - student_name
      - subject_id or subject_code
    
    Returns:
      - total_conflicts: int (unique pairs)
      - conflict_score: int (weighted sum)
      - conflict_pairs: list of pair details
      - conflicting_seat_ids: list of seat IDs involved
      - subject_distribution: dict of subject_code -> conflict count
      - classroom_distribution: dict of classroom_id -> conflict count
    """
    mode = separation_mode if separation_mode in ADJACENCY_DIRECTIONS else "all"
    directions = ADJACENCY_DIRECTIONS[mode]

    # Map by classroom -> (row, col) -> assignment
    grid_by_room: Dict[int, Dict[Tuple[int, int], Dict[str, Any]]] = {}
    for a in assignments:
        room_id = a.get("classroom_id")
        r = a.get("row_num")
        c = a.get("col_num")
        if room_id is not None and r is not None and c is not None:
            grid_by_room.setdefault(room_id, {})[(r, c)] = a

    seen_pairs: Set[Tuple[Any, Any]] = set()
    conflict_pairs: List[Dict[str, Any]] = []
    conflicting_seat_ids: Set[Any] = set()
    total_score = 0
    subject_conflict_counts: Dict[str, int] = {}
    classroom_conflict_counts: Dict[int, int] = {}

    for room_id, grid in grid_by_room.items():
        for (r, c), a1 in grid.items():
            s1_roll = a1.get("student_roll_no")
            s1_subj = str(a1.get("subject_code") or a1.get("subject_id") or "")
            seat1_id = a1.get("seat_id")

            if not s1_roll or not s1_subj:
                continue

            for dr, dc, direction_name, weight in directions:
                nr, nc = r + dr, c + dc
                if (nr, nc) in grid:
                    a2 = grid[(nr, nc)]
                    s2_roll = a2.get("student_roll_no")
                    s2_subj = str(a2.get("subject_code") or a2.get("subject_id") or "")
                    seat2_id = a2.get("seat_id")

                    if not s2_roll or not s2_subj:
                        continue

                    # Same subject check
                    if s1_subj.lower() == s2_subj.lower() and s1_roll != s2_roll:
                        # Normalize pair to avoid double counting (u < v)
                        pair_key = (min(str(seat1_id), str(seat2_id)), max(str(seat1_id), str(seat2_id)))
                        if pair_key not in seen_pairs:
                            seen_pairs.add(pair_key)
                            total_score += weight
                            conflicting_seat_ids.add(seat1_id)
                            conflicting_seat_ids.add(seat2_id)

                            subject_conflict_counts[s1_subj] = subject_conflict_counts.get(s1_subj, 0) + 1
                            classroom_conflict_counts[room_id] = classroom_conflict_counts.get(room_id, 0) + 1

                            conflict_pairs.append({
                                "seat_1_id": seat1_id,
                                "seat_1_number": a1.get("seat_number"),
                                "student_1_roll": s1_roll,
                                "student_1_name": a1.get("student_name"),
                                "seat_2_id": seat2_id,
                                "seat_2_number": a2.get("seat_number"),
                                "student_2_roll": s2_roll,
                                "student_2_name": a2.get("student_name"),
                                "classroom_id": room_id,
                                "classroom_name": a1.get("classroom_name"),
                                "subject_code": s1_subj,
                                "direction": direction_name,
                                "weight": weight
                            })

    return {
        "total_conflicts": len(conflict_pairs),
        "conflict_score": total_score,
        "conflicting_seat_ids": list(conflicting_seat_ids),
        "conflict_pairs": conflict_pairs,
        "subject_distribution": subject_conflict_counts,
        "classroom_distribution": classroom_conflict_counts,
        "separation_mode": mode
    }


def compute_adjacency_matrix(seats: List[Dict[str, Any]], separation_mode: str = "all") -> Dict[Any, List[Any]]:
    """
    Builds adjacency graph for seats in a classroom.
    Maps seat_id -> list of adjacent seat_ids.
    """
    mode = separation_mode if separation_mode in ADJACENCY_DIRECTIONS else "all"
    directions = ADJACENCY_DIRECTIONS[mode]

    by_room_pos: Dict[int, Dict[Tuple[int, int], Any]] = {}
    for s in seats:
        room_id = s.get("classroom_id")
        r = s.get("row_num")
        c = s.get("col_num")
        sid = s.get("seat_id")
        if room_id is not None and r is not None and c is not None and sid is not None:
            by_room_pos.setdefault(room_id, {})[(r, c)] = sid

    adj: Dict[Any, List[Any]] = {}
    for s in seats:
        sid = s.get("seat_id")
        adj[sid] = []
        room_id = s.get("classroom_id")
        r = s.get("row_num")
        c = s.get("col_num")
        if room_id in by_room_pos:
            room_grid = by_room_pos[room_id]
            for dr, dc, _, _ in directions:
                neighbor_pos = (r + dr, c + dc)
                if neighbor_pos in room_grid:
                    adj[sid].append(room_grid[neighbor_pos])

    return adj
