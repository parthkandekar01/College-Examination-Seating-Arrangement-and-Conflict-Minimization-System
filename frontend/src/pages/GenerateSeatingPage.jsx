import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { api } from '../services/api';

export default function GenerateSeatingPage({ setActivePage, setLatestArrangementResult, setSelectedArrangementId }) {
  const [examName, setExamName] = useState('Final Semester Examination 2026');
  const [algorithm, setAlgorithm] = useState('greedy');
  const [separationMode, setSeparationMode] = useState('all');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleQuickRun = async () => {
    try {
      setExecuting(true);
      setError(null);
      setExecutionResult(null);

      const res = await api.generateArrangement({
        exam_name: examName,
        algorithm: algorithm,
        separation_mode: separationMode,
      });

      setExecutionResult(res);
      setLatestArrangementResult(res);
      setSelectedArrangementId(res.arrangement_id);
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Generate Seating Arrangement</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Execute ADA optimization algorithms live and view conflict scores, execution metrics, and generated seating layouts
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setActivePage('setup')}
            className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold"
          >
            Review Setup
          </button>
        </div>
      )}

      {/* Execution Control Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Examination Label
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Optimization Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="greedy">Greedy Optimization (Min-Conflict)</option>
              <option value="backtracking">Recursive Backtracking (CSP)</option>
              <option value="sorting">Pure Sorting (Baseline)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Separation Rule
            </label>
            <select
              value={separationMode}
              onChange={(e) => setSeparationMode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="all">All Directions (8-Way Compass)</option>
              <option value="vertical">Horizontal + Vertical</option>
              <option value="horizontal">Horizontal Only</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Executes actual Python algorithm logic with measured microsecond timing</span>
          </div>

          <button
            onClick={handleQuickRun}
            disabled={executing}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {executing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Algorithm...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Seating Optimizer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Result View if generated */}
      {executionResult && (
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Seating Arrangement Generated!</h3>
                <p className="text-xs text-slate-500">
                  {executionResult.exam_name} • Algorithm: {executionResult.algorithm_used}
                </p>
              </div>
            </div>

            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              ID #{executionResult.arrangement_id}
            </span>
          </div>

          {/* Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Assigned Students</span>
              <span className="text-xl font-bold text-slate-900">{executionResult.students_assigned}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Adjacent Conflicts</span>
              <span
                className={`text-xl font-bold ${
                  executionResult.total_conflict_count === 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {executionResult.total_conflict_count}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Execution Time</span>
              <span className="text-xl font-bold text-blue-600 font-mono">{executionResult.execution_time_ms} ms</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Conflict Score</span>
              <span className="text-xl font-bold text-slate-700">{executionResult.conflict_score}</span>
            </div>
          </div>

          {/* Decisions Trace Sample if available */}
          {executionResult.decisions_trace && executionResult.decisions_trace.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-600 tracking-wider">
                Algorithm Execution Trace (First {executionResult.decisions_trace.length} Decisions)
              </span>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] max-h-40 overflow-y-auto space-y-1">
                {executionResult.decisions_trace.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-800/80 pb-0.5">
                    <span className="text-teal-400">Step {step.step || idx + 1}:</span>
                    <span>Student {step.student_roll || step.student}</span>
                    <span className="text-blue-400">→ Seat {step.chosen_seat || step.seat}</span>
                    <span className="text-slate-400">Penalty: {step.penalty_score ?? step.penalty ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setSelectedArrangementId(executionResult.arrangement_id);
                setActivePage('conflicts');
              }}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Analyze Conflicts
            </button>
            <button
              onClick={() => {
                setSelectedArrangementId(executionResult.arrangement_id);
                setActivePage('visualization');
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <span>Inspect Seating Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
