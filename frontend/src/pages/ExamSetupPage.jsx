import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Calendar,
  Layers,
  School,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  ListOrdered
} from 'lucide-react';
import { api } from '../services/api';

export default function ExamSetupPage({ setActivePage, setLatestArrangementResult, setSelectedArrangementId }) {
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [examName, setExamName] = useState('End Semester Examination 2026');
  const [examDate, setExamDate] = useState('2026-12-10 (Morning 09:30 AM)');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState([]);
  const [separationMode, setSeparationMode] = useState('all'); // horizontal, vertical, all
  const [algorithm, setAlgorithm] = useState('greedy'); // greedy, backtracking, sorting
  const [sortStrategy, setSortStrategy] = useState('merge_sort');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [subjs, rms, stus] = await Promise.all([
          api.getSubjects(),
          api.getClassrooms(),
          api.getStudents(),
        ]);
        setSubjects(subjs);
        setClassrooms(rms);
        setStudents(stus);

        // Preserve the existing preference of selecting the first subject initially.
        setSelectedSubjectIds(subjs.length > 0 ? [subjs[0].subject_id] : []);
        setSelectedClassroomIds(rms.map((r) => r.classroom_id));
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to initialize exam configuration');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute the selected-subject enrollment count subject-wise.
  // A student can be listed under multiple subjects, while different subject rosters add to the total.
  const selectedEnrollments = selectedSubjectIds.flatMap((subjectId) =>
    students.filter((student) =>
      student.subjects?.some((subject) => subject.subject_id === subjectId)
    )
  );

  // Compute total available seats in selected classrooms
  const totalSelectedSeats = classrooms
    .filter((c) => selectedClassroomIds.includes(c.classroom_id))
    .reduce((acc, c) => acc + (c.seats_count ?? c.capacity), 0);

  const hasCapacityDeficit = selectedEnrollments.length > totalSelectedSeats;

  const handleToggleSubject = (id) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((subjectId) => subjectId !== id) : [...prev, id]
    );
  };

  const handleToggleClassroom = (id) => {
    setSelectedClassroomIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSubjectIds.length === 0) {
      alert('Please select at least one examination subject.');
      return;
    }
    if (selectedClassroomIds.length === 0) {
      alert('Please select at least one classroom.');
      return;
    }
    if (hasCapacityDeficit) {
      alert(`Cannot proceed: ${selectedEnrollments.length} subject enrollments selected, but only ${totalSelectedSeats} seats available.`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.generateArrangement({
        exam_name: examName.trim(),
        exam_date: examDate.trim(),
        subject_ids: selectedSubjectIds,
        classroom_ids: selectedClassroomIds,
        algorithm: algorithm,
        separation_mode: separationMode,
        sort_strategy: sortStrategy,
      });

      setLatestArrangementResult(res);
      setSelectedArrangementId(res.arrangement_id);
      setActivePage('visualization');
    } catch (err) {
      setError(err.message || 'Failed to generate seating arrangement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading examination configuration wizard...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Examination Configuration Setup</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select one or more examination subjects, allocate examination halls, define adjacency separation constraints, and select the ADA algorithm
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Configuration Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Pre-flight Capacity Validation Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          hasCapacityDeficit
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {hasCapacityDeficit ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          )}
          <div>
            <span className="font-bold text-xs uppercase tracking-wider block">
              {hasCapacityDeficit ? 'Seating Capacity Insufficient' : 'Seating Capacity Validated'}
            </span>
            <span className="text-xs">
              Selected Subject Enrollments: <strong>{selectedEnrollments.length}</strong> | Total Available Seats:{' '}
              <strong>{totalSelectedSeats}</strong>{' '}
              {hasCapacityDeficit
                ? `(Deficit of ${selectedEnrollments.length - totalSelectedSeats} seats)`
                : `(${totalSelectedSeats - selectedEnrollments.length} buffer seats)`}
            </span>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-white/70 border border-current">
          Capacity Ratio: {totalSelectedSeats > 0 ? Math.round((selectedEnrollments.length / totalSelectedSeats) * 100) : 0}%
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Examination Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>1. Examination Basic Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Examination Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Scheduled Date & Session
              </label>
              <input
                type="text"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Subject & Classroom Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject Picker */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>2. Examination Subject</span>
                </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSubjectIds(
                        selectedSubjectIds.length === subjects.length
                          ? []
                          : subjects.map((subject) => subject.subject_id)
                      )
                    }
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    {selectedSubjectIds.length === subjects.length ? 'Clear all' : 'Select all'}
                  </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {subjects.map((sub) => {
                  const isChecked = selectedSubjectIds.includes(sub.subject_id);
                  return (
                    <label
                      key={sub.subject_id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked ? 'bg-blue-50/60 border-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSubject(sub.subject_id)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="font-semibold text-slate-800">{sub.subject_name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {sub.registered_students_count} stus
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
              {selectedEnrollments.length} selected subject enrollments (counted separately by subject)
            </div>
          </div>

          {/* Classroom Picker */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <School className="w-4 h-4 text-indigo-600" />
                  <span>3. Examination Classrooms</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedClassroomIds(
                      selectedClassroomIds.length === classrooms.length ? [] : classrooms.map((c) => c.classroom_id)
                    )
                  }
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  {selectedClassroomIds.length === classrooms.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {classrooms.map((crm) => {
                  const isChecked = selectedClassroomIds.includes(crm.classroom_id);
                  return (
                    <label
                      key={crm.classroom_id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/60 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleClassroom(crm.classroom_id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="font-semibold text-slate-800">{crm.classroom_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">({crm.rows}x{crm.cols})</span>
                        <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                          {crm.seats_count || crm.capacity} seats
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
              {totalSelectedSeats} total physical seats allocated
            </div>
          </div>
        </div>

        {/* Section 3: Separation Constraints */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>4. Same-Subject Adjacency Separation Constraints</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify in which spatial directions students from the same subject must be separated to prevent cheating
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'horizontal',
                title: 'Horizontal Only',
                desc: 'Prevents same subject sitting side-by-side in the same row.',
                badge: 'Relaxed',
              },
              {
                id: 'vertical',
                title: 'Horizontal + Vertical',
                desc: 'Separates students horizontally (left/right) and vertically (front/behind).',
                badge: 'Standard',
              },
              {
                id: 'all',
                title: 'All Adjacent Directions',
                desc: 'Separates students horizontally, vertically, and diagonally (8-way compass check).',
                badge: 'Recommended',
              },
            ].map((mode) => {
              const isSelected = separationMode === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => setSeparationMode(mode.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 text-xs">{mode.title}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{mode.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Algorithm Selection */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>5. Core Optimization Algorithm</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select which Analysis and Design of Algorithms (ADA) engine will generate the seating arrangement
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Greedy */}
            <div
              onClick={() => setAlgorithm('greedy')}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                algorithm === 'greedy'
                  ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-sm">Greedy Heuristic</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Evaluates available seats locally for each student and picks the seat with minimum adjacent conflict penalty.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-200/60 font-mono text-[11px] text-blue-900">
                Time: O(N · M) | Space: O(N + M)
              </div>
            </div>

            {/* Backtracking */}
            <div
              onClick={() => setAlgorithm('backtracking')}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                algorithm === 'backtracking'
                  ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-slate-900 text-sm">Recursive Backtracking</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    CSP Search
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Recursively explores valid assignments with forward constraint checking. Rolls back (undoes) when adjacency conflicts occur.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-200/60 font-mono text-[11px] text-teal-900">
                Worst: O(Mᴺ) exponential
              </div>
            </div>

            {/* Sorting */}
            <div
              onClick={() => setAlgorithm('sorting')}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                algorithm === 'sorting'
                  ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm">Pure Sorting</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    Baseline
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sorts students by subject and roll number, then naively allocates row-by-row. Demonstrates highest conflict baseline.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-200/60 font-mono text-[11px] text-indigo-900">
                Time: O(N log N) | Space: O(N)
              </div>
            </div>
          </div>
        </div>

        {/* Submit Execution Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setActivePage('dashboard')}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || hasCapacityDeficit}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing Algorithm Engine...</span>
              </>
            ) : (
              <>
                <span>Generate Seating Arrangement</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
