"""
Sorting Algorithms Module - ADA Project
Contains implementations of Merge Sort and Quick Sort for student data.
Includes detailed metrics: comparisons, swaps/moves, execution time (ns/us/ms),
and algorithmic step-by-step tracing for educational visualization.
"""
from typing import List, Dict, Any, Tuple, Optional
import time
import copy


def compare_students(a: Dict[str, Any], b: Dict[str, Any], key: str = "roll_no") -> int:
    """
    Returns -1 if a < b, 1 if a > b, 0 if equal according to key.
    Keys: 'roll_no', 'subject_code', 'student_name', or composite 'subject_then_roll'.
    """
    if key == "roll_no":
        val_a = str(a.get("roll_no", "")).strip()
        val_b = str(b.get("roll_no", "")).strip()
        # Handle numeric roll numbers if possible
        if val_a.isdigit() and val_b.isdigit():
            va, vb = int(val_a), int(val_b)
            return (va > vb) - (va < vb)
        return (val_a > val_b) - (val_a < val_b)

    elif key == "subject_code":
        val_a = str(a.get("subject_code", "")).strip().lower()
        val_b = str(b.get("subject_code", "")).strip().lower()
        if val_a != val_b:
            return (val_a > val_b) - (val_a < val_b)
        return compare_students(a, b, "roll_no")

    elif key == "student_name":
        val_a = str(a.get("student_name", "")).strip().lower()
        val_b = str(b.get("student_name", "")).strip().lower()
        if val_a != val_b:
            return (val_a > val_b) - (val_a < val_b)
        return compare_students(a, b, "roll_no")

    elif key == "subject_then_roll":
        val_a = str(a.get("subject_code", "")).strip().lower()
        val_b = str(b.get("subject_code", "")).strip().lower()
        if val_a != val_b:
            return (val_a > val_b) - (val_a < val_b)
        return compare_students(a, b, "roll_no")

    val_a = str(a.get(key, ""))
    val_b = str(b.get(key, ""))
    return (val_a > val_b) - (val_a < val_b)


class MergeSortTracer:
    def __init__(self, key: str = "roll_no", max_steps: int = 50):
        self.key = key
        self.comparisons = 0
        self.moves = 0
        self.steps: List[Dict[str, Any]] = []
        self.max_steps = max_steps

    def sort(self, arr: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if len(arr) <= 1:
            return arr

        mid = len(arr) // 2
        left = self.sort(arr[:mid])
        right = self.sort(arr[mid:])
        return self._merge(left, right)

    def _merge(self, left: List[Dict[str, Any]], right: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        merged: List[Dict[str, Any]] = []
        i = j = 0

        while i < len(left) and j < len(right):
            self.comparisons += 1
            cmp = compare_students(left[i], right[j], self.key)
            if cmp <= 0:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1
            self.moves += 1

            if len(self.steps) < self.max_steps:
                self.steps.append({
                    "action": "merge_element",
                    "compared": f"{left[i-1 if cmp <= 0 else i].get('roll_no')} vs {right[j if cmp <= 0 else j-1].get('roll_no') if j < len(right) or cmp > 0 else 'END'}",
                    "chosen": merged[-1].get("roll_no"),
                    "merged_size": len(merged)
                })

        while i < len(left):
            merged.append(left[i])
            i += 1
            self.moves += 1

        while j < len(right):
            merged.append(right[j])
            j += 1
            self.moves += 1

        return merged


class QuickSortTracer:
    def __init__(self, key: str = "roll_no", max_steps: int = 50):
        self.key = key
        self.comparisons = 0
        self.swaps = 0
        self.steps: List[Dict[str, Any]] = []
        self.max_steps = max_steps

    def sort(self, arr: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        arr_copy = list(arr)
        self._quicksort(arr_copy, 0, len(arr_copy) - 1)
        return arr_copy

    def _quicksort(self, arr: List[Dict[str, Any]], low: int, high: int):
        if low < high:
            pi = self._partition(arr, low, high)
            self._quicksort(arr, low, pi - 1)
            self._quicksort(arr, pi + 1, high)

    def _partition(self, arr: List[Dict[str, Any]], low: int, high: int) -> int:
        pivot = arr[high]
        i = low - 1

        for j in range(low, high):
            self.comparisons += 1
            if compare_students(arr[j], pivot, self.key) < 0:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
                self.swaps += 1
                if len(self.steps) < self.max_steps:
                    self.steps.append({
                        "action": "swap",
                        "indices": (i, j),
                        "swapped": (arr[i].get("roll_no"), arr[j].get("roll_no")),
                        "pivot": pivot.get("roll_no")
                    })

        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        self.swaps += 1
        if len(self.steps) < self.max_steps:
            self.steps.append({
                "action": "place_pivot",
                "pivot": pivot.get("roll_no"),
                "pivot_index": i + 1
            })
        return i + 1


def merge_sort_students(students: List[Dict[str, Any]], key: str = "roll_no") -> Dict[str, Any]:
    """
    Executes Merge Sort on students and returns sorted result with complete ADA metrics.
    Time Complexity: Best O(n log n), Average O(n log n), Worst O(n log n)
    Space Complexity: O(n) auxiliary space
    """
    start_ns = time.perf_counter_ns()
    tracer = MergeSortTracer(key=key)
    sorted_list = tracer.sort(students)
    elapsed_ns = time.perf_counter_ns() - start_ns

    elapsed_ms = elapsed_ns / 1_000_000.0
    elapsed_us = elapsed_ns / 1_000.0

    return {
        "algorithm": "Merge Sort",
        "key": key,
        "input_count": len(students),
        "sorted_students": sorted_list,
        "comparisons": tracer.comparisons,
        "moves_or_swaps": tracer.moves,
        "execution_time_ns": elapsed_ns,
        "execution_time_us": round(elapsed_us, 3),
        "execution_time_ms": round(elapsed_ms, 4),
        "time_complexity": "O(n log n)",
        "space_complexity": "O(n)",
        "stability": "Stable",
        "description": "Divide-and-Conquer algorithm that divides input list into halves, recursively sorts, and merges sorted sub-lists.",
        "steps": tracer.steps[:30]
    }


def quick_sort_students(students: List[Dict[str, Any]], key: str = "roll_no") -> Dict[str, Any]:
    """
    Executes Quick Sort on students and returns sorted result with complete ADA metrics.
    Time Complexity: Best O(n log n), Average O(n log n), Worst O(n^2)
    Space Complexity: O(log n) auxiliary stack space
    """
    start_ns = time.perf_counter_ns()
    tracer = QuickSortTracer(key=key)
    sorted_list = tracer.sort(students)
    elapsed_ns = time.perf_counter_ns() - start_ns

    elapsed_ms = elapsed_ns / 1_000_000.0
    elapsed_us = elapsed_ns / 1_000.0

    return {
        "algorithm": "Quick Sort",
        "key": key,
        "input_count": len(students),
        "sorted_students": sorted_list,
        "comparisons": tracer.comparisons,
        "moves_or_swaps": tracer.swaps,
        "execution_time_ns": elapsed_ns,
        "execution_time_us": round(elapsed_us, 3),
        "execution_time_ms": round(elapsed_ms, 4),
        "time_complexity": "O(n log n) avg, O(n²) worst",
        "space_complexity": "O(log n)",
        "stability": "Unstable",
        "description": "Partition-based Divide-and-Conquer algorithm that selects a pivot and places elements smaller to the left, larger to the right.",
        "steps": tracer.steps[:30]
    }


def interleave_sort_students(students: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    ADA Optimization Pre-processing:
    Groups students by subject, then distributes them in round-robin / interleaved order.
    Ensures adjacent students in the stream come from different subjects before seating assignment.
    """
    start_ns = time.perf_counter_ns()
    
    # 1. Group by subject
    by_subject: Dict[str, List[Dict[str, Any]]] = {}
    for s in students:
        subj = s.get("subject_code", "UNKNOWN")
        by_subject.setdefault(subj, []).append(s)

    # Sort each subject bucket by roll_no
    for subj in by_subject:
        tracer = MergeSortTracer(key="roll_no")
        by_subject[subj] = tracer.sort(by_subject[subj])

    # 2. Interleave
    sorted_keys = sorted(by_subject.keys(), key=lambda k: len(by_subject[k]), reverse=True)
    interleaved: List[Dict[str, Any]] = []
    has_more = True
    idx = 0
    while has_more:
        has_more = False
        for k in sorted_keys:
            if idx < len(by_subject[k]):
                interleaved.append(by_subject[k][idx])
                has_more = True
        idx += 1

    elapsed_ns = time.perf_counter_ns() - start_ns
    elapsed_ms = elapsed_ns / 1_000_000.0

    return {
        "algorithm": "Round-Robin Interleaved Sorting",
        "input_count": len(students),
        "sorted_students": interleaved,
        "subject_groups": {k: len(v) for k, v in by_subject.items()},
        "execution_time_ms": round(elapsed_ms, 4),
        "time_complexity": "O(n log(n/k))",
        "space_complexity": "O(n)",
        "description": "Bucketizes students by subject code, sorts each bucket, and reconstructs a maximum-dispersion round-robin sequence."
    }
