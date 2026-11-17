import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Code2,
  Cpu,
  Layers,
  RotateCcw,
  Zap,
  Play,
  HelpCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function PerformanceAnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, sorting, greedy, backtracking, viva
  const [sortAlgo, setSortAlgo] = useState('merge_sort');
  const [sortKey, setSortKey] = useState('roll_no');
  const [sortResult, setSortResult] = useState(null);
  const [runningSort, setRunningSort] = useState(false);

  const handleRunSort = async () => {
    try {
      setRunningSort(true);
      const res = await api.runStandaloneSort({ algorithm: sortAlgo, key: sortKey });
      setSortResult(res);
    } catch (err) {
      alert(`Sort execution failed: ${err.message}`);
    } finally {
      setRunningSort(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Analysis & Design of Algorithms (ADA) Educational Hub
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Academic reference, pseudocode, asymptotic analysis, and practical examination viva voce preparation
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Complexity Matrix', icon: Layers },
          { id: 'sorting', label: '1. Sorting Engine', icon: Code2 },
          { id: 'greedy', label: '2. Greedy Heuristic', icon: Zap },
          { id: 'backtracking', label: '3. Recursive Backtracking', icon: RotateCcw },
          { id: 'viva', label: 'Viva Voce Q&A Guide', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & COMPLEXITY MATRIX */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Theoretical vs Empirical Asymptotic Complexity</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In this Examination Seating Arrangement system, each algorithm addresses a distinct phase of the optimization workflow:
              Sorting organizes candidate queues, Greedy performs rapid sub-optimal conflict minimization, and Backtracking explores
              exact constraint satisfaction solutions.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200 font-semibold font-mono">
                  <tr>
                    <th className="px-4 py-3">Algorithm</th>
                    <th className="px-4 py-3">Paradigm</th>
                    <th className="px-4 py-3">Best Time</th>
                    <th className="px-4 py-3">Average Time</th>
                    <th className="px-4 py-3">Worst Time</th>
                    <th className="px-4 py-3">Space Complexity</th>
                    <th className="px-4 py-3">Conflict Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="px-4 py-3 font-bold font-sans text-slate-900">Merge Sort</td>
                    <td className="px-4 py-3 font-sans text-blue-700">Divide & Conquer</td>
                    <td className="px-4 py-3">O(n log n)</td>
                    <td className="px-4 py-3">O(n log n)</td>
                    <td className="px-4 py-3">O(n log n)</td>
                    <td className="px-4 py-3">O(n) auxiliary</td>
                    <td className="px-4 py-3 font-sans text-slate-500">Queue prep only</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold font-sans text-slate-900">Quick Sort</td>
                    <td className="px-4 py-3 font-sans text-blue-700">Partitioning</td>
                    <td className="px-4 py-3">O(n log n)</td>
                    <td className="px-4 py-3">O(n log n)</td>
                    <td className="px-4 py-3 text-rose-600">O(n²)</td>
                    <td className="px-4 py-3">O(log n) stack</td>
                    <td className="px-4 py-3 font-sans text-slate-500">Queue prep only</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold font-sans text-slate-900">Greedy Heuristic</td>
                    <td className="px-4 py-3 font-sans text-emerald-700">Local Optimization</td>
                    <td className="px-4 py-3">O(N)</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">O(N · M)</td>
                    <td className="px-4 py-3">O(N · M)</td>
                    <td className="px-4 py-3">O(N + M)</td>
                    <td className="px-4 py-3 font-sans text-emerald-700 font-bold">Low (sub-optimal)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold font-sans text-slate-900">Recursive Backtracking</td>
                    <td className="px-4 py-3 font-sans text-teal-700">Constraint Satisfaction (CSP)</td>
                    <td className="px-4 py-3">O(N)</td>
                    <td className="px-4 py-3">Pruned O(kᴺ)</td>
                    <td className="px-4 py-3 text-rose-600 font-bold">O(Mᴺ) exponential</td>
                    <td className="px-4 py-3">O(N) recursion stack</td>
                    <td className="px-4 py-3 font-sans text-teal-700 font-bold">Zero / Minimal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SORTING DEEP-DIVE */}
      {activeTab === 'sorting' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">1. Sorting Algorithm Implementation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Purpose:</strong> Prepares candidate streams prior to seat allocation. In examination logistics,
              candidates may be ordered by Roll Number, Subject, or distributed using <em>Round-Robin Interleaving</em>
              to maximize initial subject diversity across incoming seat coordinates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-xs uppercase text-slate-700 mb-2">Merge Sort Pseudocode</h4>
                <pre className="text-[11px] font-mono text-slate-800 bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto leading-relaxed">
{`Algorithm MergeSort(A, left, right):
  if left < right:
    mid = (left + right) // 2
    MergeSort(A, left, mid)
    MergeSort(A, mid + 1, right)
    Merge(A, left, mid, right)

Time Complexity: O(n log n) in all cases
Space Complexity: O(n) auxiliary storage`}
                </pre>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-xs uppercase text-slate-700 mb-2">Quick Sort Pseudocode</h4>
                <pre className="text-[11px] font-mono text-slate-800 bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto leading-relaxed">
{`Algorithm QuickSort(A, low, high):
  if low < high:
    pivot_idx = Partition(A, low, high)
    QuickSort(A, low, pivot_idx - 1)
    QuickSort(A, pivot_idx + 1, high)

Time Complexity: Best/Avg O(n log n), Worst O(n²)
Space Complexity: O(log n) call stack`}
                </pre>
              </div>
            </div>

            {/* Live Interactive Sorting Sandbox */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Interactive Live Sorting Sandbox</h4>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={sortAlgo}
                  onChange={(e) => setSortAlgo(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="merge_sort">Merge Sort O(n log n)</option>
                  <option value="quick_sort">Quick Sort O(n log n)</option>
                  <option value="interleaved">Round-Robin Interleaved Sort</option>
                </select>

                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="roll_no">Sort by Roll Number</option>
                  <option value="subject_code">Sort by Subject Code</option>
                  <option value="student_name">Sort by Student Name</option>
                </select>

                <button
                  onClick={handleRunSort}
                  disabled={runningSort}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Sorting</span>
                </button>
              </div>

              {sortResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 font-sans">
                      {sortResult.algorithm} ({sortResult.input_count} Students Sorted)
                    </span>
                    <span className="text-blue-700 font-semibold">
                      CPU Time: {sortResult.execution_time_us} µs ({sortResult.execution_time_ms} ms)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>Comparisons: <strong>{sortResult.comparisons ?? 'N/A'}</strong></div>
                    <div>Swaps/Moves: <strong>{sortResult.moves_or_swaps ?? 'N/A'}</strong></div>
                    <div>Time Complexity: <strong>{sortResult.time_complexity}</strong></div>
                    <div>Space: <strong>{sortResult.space_complexity}</strong></div>
                  </div>

                  {/* Traces */}
                  {sortResult.steps && sortResult.steps.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                        First {sortResult.steps.length} Traced Execution Steps:
                      </span>
                      <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg max-h-36 overflow-y-auto text-[10px] space-y-0.5">
                        {sortResult.steps.map((st, i) => (
                          <div key={i}>
                            Step {i+1}: Action={st.action} | {JSON.stringify(st)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GREEDY HEURISTIC */}
      {activeTab === 'greedy' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">2. Greedy Algorithm for Seat Allocation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Greedy Choice Property:</strong> For each student in the stream, evaluate all currently unoccupied seats
              in the classroom. Compute the immediate adjacent conflict penalty with already seated neighbors.
              Assign the candidate to the seat yielding minimum immediate conflict penalty (0 penalty preferred).
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs">
              <h4 className="font-bold text-slate-800 mb-2 font-sans text-xs uppercase tracking-wider">
                Greedy Seating Pseudocode
              </h4>
              <pre className="bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto text-[11px] text-slate-800 leading-relaxed">
{`Algorithm GreedySeatingAllocation(Students S, Seats M, AdjacencyDirections D):
  Occupied = EmptySet()
  Assignments = []

  for each student s in S:
    best_seat = None
    min_penalty = Infinity

    for each seat m in M:
      if m in Occupied:
        continue
      penalty = CalculateConflictPenalty(s, m, AdjacencyNeighbors(m, D))
      if penalty < min_penalty:
        min_penalty = penalty
        best_seat = m
        if penalty == 0:  // Greedy early exit
          break

    Assign(s, best_seat)
    Occupied.add(best_seat)

Complexity: O(N * M) where N = students, M = seats`}
              </pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-bold text-emerald-900 block mb-1">Advantages:</span>
                <ul className="list-disc list-inside space-y-1 text-emerald-800">
                  <li>Polynomial time complexity \(O(N \cdot M)\) guarantees sub-second execution on large examinations.</li>
                  <li>Early greedy break (at 0 conflict) dramatically accelerates seat evaluation.</li>
                  <li>Dramatically reduces conflicts compared to sequential sorting baseline.</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900 block mb-1">Theoretical Limitation:</span>
                <ul className="list-disc list-inside space-y-1 text-amber-800">
                  <li>Local optimization without backtracking may trap future candidates into unavoidable conflicts.</li>
                  <li>Does not guarantee a global zero-conflict arrangement if candidate distribution is tightly constrained.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKTRACKING */}
      {activeTab === 'backtracking' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">3. Recursive Backtracking (Constraint Satisfaction Search)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Working Procedure:</strong> Models examination seating as a Constraint Satisfaction Problem (CSP).
              Recursively assigns students to seats such that no same-subject adjacency constraints are violated.
              If a path leads to a dead end (no available valid seat), the algorithm <em>backtracks</em> (undoes previous assignments)
              and explores alternative branches in the state-space tree.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs">
              <h4 className="font-bold text-slate-800 mb-2 font-sans text-xs uppercase tracking-wider">
                Recursive Backtracking Pseudocode
              </h4>
              <pre className="bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto text-[11px] text-slate-800 leading-relaxed">
{`Algorithm BacktrackSeating(student_index):
  if student_index == TotalStudents:
    return True  // All students successfully seated with 0 conflicts

  student = Students[student_index]
  candidate_seats = GetAvailableSeatsSortedByConflict(student)

  for each seat in candidate_seats:
    if IsSafe(student, seat):       // Constraint checking
      Assign(student, seat)         // Forward state step
      
      if BacktrackSeating(student_index + 1):
        return True
        
      Rollback(student, seat)       // Backtracking step (Undo)
      backtrack_operations_count++

  return False`}
              </pre>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-2">
              <span className="font-bold block text-sm">Worst-Case Exponential Complexity Note:</span>
              <p>
                In the unconstrained worst case, Backtracking explores \(O(M^N)\) states, where \(M\) is seats and \(N\) is students.
                To ensure real-time application responsiveness during practical examination presentations, our implementation incorporates:
              </p>
              <ul className="list-disc list-inside space-y-1 font-medium">
                <li><strong>MRV (Minimum Remaining Values) Domain Pruning:</strong> Filters candidate seats to top low-penalty domains.</li>
                <li><strong>State-Exploration Bounding:</strong> Search limits prevent uncontrolled recursion lockup on dense matrices.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VIVA VOCE Q&A GUIDE */}
      {activeTab === 'viva' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">ADA Viva Voce Examination Preparation Guide</h3>
                <p className="text-xs text-slate-500">Key questions and answers frequently asked during project defense</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {[
                {
                  q: '1. Why is this project classified under Analysis & Design of Algorithms (ADA) rather than DBMS?',
                  a: 'The central challenge is not data persistence, but combinatorial optimization. Allocating N students to M seats under 2D spatial adjacency constraints is an NP-hard problem equivalent to Map/Graph Coloring. We implement and compare three fundamental algorithmic paradigms: Divide & Conquer (Sorting), Local Optimization (Greedy), and State-Space Search (Recursive Backtracking).'
                },
                {
                  q: '2. What is the Greedy Choice Property in your seating arrangement engine?',
                  a: 'At each sequential step, the algorithm chooses the candidate seat that minimizes the immediate adjacent conflict penalty (preferring 0-conflict coordinates). It does not revisit past assignments.'
                },
                {
                  q: '3. When does Backtracking backtrack, and what data structures are updated during rollback?',
                  a: 'Backtracking undoes an assignment when all remaining candidate seats for the current student violate the same-subject adjacency rule. The rollback pops the student from the current assignment stack, removes the seat from occupied_seats set, and deletes the coordinate from the grid spatial hashmap.'
                },
                {
                  q: '4. Why is theoretical time complexity different from measured execution time?',
                  a: 'Theoretical complexity (e.g. Big-O) measures growth rate of basic operations relative to input size N in the worst case. Measured execution time in milliseconds accounts for CPU cache locality, Python bytecode overhead, branch prediction, and pruning heuristics that eliminate massive subtrees in practice.'
                },
                {
                  q: '5. How do you prevent double counting of conflicts?',
                  a: 'Each conflict between seat u and seat v is represented as an undirected edge. We normalize pair tuples as (min(u, v), max(u, v)) and store them in a hash set, ensuring that edge (A, B) is counted exactly once, not twice as (A, B) and (B, A).'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-xs">{item.q}</h4>
                  <p className="text-slate-700 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
