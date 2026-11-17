import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
  Layers,
  School,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#3b82f6'];

export default function ConflictAnalysisPage({
  selectedArrangementId,
  setSelectedArrangementId,
  setLatestArrangementResult,
  setActivePage
}) {
  const [arrangements, setArrangements] = useState([]);
  const [conflictData, setConflictData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [optAlgorithm, setOptAlgorithm] = useState('greedy');
  const [optMode, setOptMode] = useState('all');

  useEffect(() => {
    const fetchArrangements = async () => {
      try {
        setLoading(true);
        const list = await api.getArrangements();
        setArrangements(list);
        if (list.length > 0) {
          const targetId = selectedArrangementId || list[0].arrangement_id;
          fetchConflictDetails(targetId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch arrangements');
        setLoading(false);
      }
    };
    fetchArrangements();
  }, [selectedArrangementId]);

  const fetchConflictDetails = async (id) => {
    try {
      setLoading(true);
      const data = await api.getConflictAnalysis(id);
      setConflictData(data);
      setSelectedArrangementId(id);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch conflict analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleReoptimize = async () => {
    if (!conflictData) return;
    try {
      setOptimizing(true);
      setSuccessMsg(null);
      setError(null);

      const beforeCount = conflictData.total_conflicts;
      const res = await api.reoptimizeArrangement(conflictData.arrangement_id, optAlgorithm, optMode);

      setLatestArrangementResult(res);
      setSuccessMsg(
        `Optimization completed with ${res.algorithm_used}! Conflicts changed from ${beforeCount} to ${res.total_conflict_count}.`
      );
      fetchConflictDetails(conflictData.arrangement_id);
    } catch (err) {
      setError(err.message || 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading && !conflictData) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Analyzing spatial adjacency graph...
      </div>
    );
  }

  if (arrangements.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto" />
        <div>
          <h3 className="font-bold text-slate-900 text-base">No Arrangements to Analyze</h3>
          <p className="text-xs text-slate-500 mt-1">
            Generate an arrangement first to evaluate same-subject seating conflicts.
          </p>
        </div>
        <button
          onClick={() => setActivePage('setup')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Generate Seating
        </button>
      </div>
    );
  }

  // Format data for Recharts
  const subjectChartData = Object.entries(conflictData?.subject_distribution || {}).map(
    ([code, count]) => ({
      name: code,
      conflicts: count,
    })
  );

  const classroomChartData = Object.entries(conflictData?.classroom_distribution || {}).map(
    ([roomId, count]) => ({
      name: `Hall ${roomId}`,
      conflicts: count,
    })
  );

  return (
    <div className="space-y-6">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Spatial Conflict Analysis</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Undirected graph edge detection for adjacent candidates belonging to the same subject
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold uppercase text-slate-400 whitespace-nowrap">Arrangement:</label>
          <select
            value={conflictData?.arrangement_id || ''}
            onChange={(e) => fetchConflictDetails(Number(e.target.value))}
            className="w-full sm:w-72 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {arrangements.map((a) => (
              <option key={a.arrangement_id} value={a.arrangement_id}>
                #{a.arrangement_id} - {a.exam_name} ({a.total_conflict_count} Conflicts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Unique Conflict Pairs
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {conflictData?.total_conflicts || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Deduplicated undirected pairs (u &lt; v)
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Weighted Conflict Penalty
          </span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {conflictData?.conflict_score || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            H:10, V:6, Diag:3 penalty weights
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Separation Constraint
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1 capitalize font-mono">
            {conflictData?.separation_mode || 'all'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Active spatial adjacency radius
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Total Students Seated
          </span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {conflictData?.total_assigned || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            100% allocation coverage
          </span>
        </div>
      </div>

      {/* Re-Optimization Action Box */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-base text-white">Re-Optimize Seating Arrangement</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Rerun optimization with alternate algorithm heuristics or strict spatial constraints to minimize remaining conflicts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={optAlgorithm}
            onChange={(e) => setOptAlgorithm(e.target.value)}
            className="px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="greedy">Greedy Optimization</option>
            <option value="backtracking">Recursive Backtracking (CSP)</option>
          </select>

          <select
            value={optMode}
            onChange={(e) => setOptMode(e.target.value)}
            className="px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Directions (Compass)</option>
            <option value="vertical">Horizontal + Vertical</option>
            <option value="horizontal">Horizontal Only</option>
          </select>

          <button
            onClick={handleReoptimize}
            disabled={optimizing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {optimizing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Run Optimizer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conflict Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject-Wise Conflicts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Conflicts by Subject</h3>
          <p className="text-xs text-slate-500 mb-4">Frequency of adjacent pairs per subject code</p>

          <div className="h-56">
            {subjectChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Zero conflicts recorded across all subjects!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="conflicts" name="Conflicts" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Classroom-Wise Conflicts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Conflicts by Examination Venue</h3>
          <p className="text-xs text-slate-500 mb-4">Spatial distribution of conflicts across halls</p>

          <div className="h-56">
            {classroomChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Zero conflicts recorded across all venues!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classroomChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="conflicts" name="Conflicts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Conflicting Pairs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Identified Conflicting Candidate Pairs</h3>
            <p className="text-xs text-slate-500">
              Each undirected pair (u, v) is recorded once with directional vector and penalty weight
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
            {conflictData?.conflict_pairs?.length || 0} Pairs Detected
          </span>
        </div>

        <div className="overflow-x-auto">
          {(!conflictData?.conflict_pairs || conflictData.conflict_pairs.length === 0) ? (
            <div className="p-12 text-center text-emerald-600 text-sm flex flex-col items-center justify-center space-y-2">
              <CheckCircle2 className="w-10 h-10" />
              <span className="font-bold text-base">Zero Seating Conflicts!</span>
              <p className="text-xs text-slate-500 max-w-md">
                All candidates from the same subject are completely separated across all adjacent dimensions.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Candidate 1</th>
                  <th className="px-5 py-3">Seat 1</th>
                  <th className="px-5 py-3">Candidate 2</th>
                  <th className="px-5 py-3">Seat 2</th>
                  <th className="px-5 py-3">Venue</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Adjacency</th>
                  <th className="px-5 py-3 text-right">Penalty Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {conflictData.conflict_pairs.map((p, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/40 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900 font-sans">
                      {p.student_1_name}
                      <span className="block text-[11px] font-mono text-slate-500">{p.student_1_roll}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {p.seat_1_number}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900 font-sans">
                      {p.student_2_name}
                      <span className="block text-[11px] font-mono text-slate-500">{p.student_2_roll}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {p.seat_2_number}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-sans">
                      {p.classroom_name || `Room ${p.classroom_id}`}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        {p.subject_code}
                      </span>
                    </td>
                    <td className="px-5 py-3 capitalize font-sans text-slate-600">
                      {p.direction}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-rose-600">
                      +{p.weight}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
