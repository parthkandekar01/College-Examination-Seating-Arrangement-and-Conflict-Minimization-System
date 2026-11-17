import React, { useState, useEffect } from 'react';
import {
  Grid,
  School,
  AlertTriangle,
  Armchair,
  User,
  BookOpen,
  Info,
  Maximize2,
  Printer,
  Compass,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

const SUBJECT_COLOR_PALETTES = [
  { bg: 'bg-blue-100 text-blue-900 border-blue-300', dot: 'bg-blue-600', name: 'Blue' },
  { bg: 'bg-teal-100 text-teal-900 border-teal-300', dot: 'bg-teal-600', name: 'Teal' },
  { bg: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-600', name: 'Amber' },
  { bg: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-600', name: 'Purple' },
  { bg: 'bg-rose-100 text-rose-900 border-rose-300', dot: 'bg-rose-600', name: 'Rose' },
  { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-600', name: 'Emerald' },
];

export default function SeatingVisualizationPage({
  selectedArrangementId,
  setSelectedArrangementId,
  setActivePage
}) {
  const [arrangements, setArrangements] = useState([]);
  const [currentArrangement, setCurrentArrangement] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [highlightSubject, setHighlightSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Arrangements List
  useEffect(() => {
    const fetchArrangements = async () => {
      try {
        setLoading(true);
        const list = await api.getArrangements();
        setArrangements(list);
        if (list.length > 0) {
          const targetId = selectedArrangementId || list[0].arrangement_id;
          loadArrangement(targetId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.message || 'Failed to load arrangements');
        setLoading(false);
      }
    };
    fetchArrangements();
  }, [selectedArrangementId]);

  const loadArrangement = async (id) => {
    try {
      setLoading(true);
      const data = await api.getArrangementDetails(id);
      setCurrentArrangement(data);
      setSelectedArrangementId(id);

      // Extract distinct classrooms involved
      const roomIds = Array.from(new Set(data.assignments.map((a) => a.classroom_id)));
      const roomObjects = roomIds.map((rid) => {
        const found = data.assignments.find((a) => a.classroom_id === rid);
        return {
          classroom_id: rid,
          classroom_name: found?.classroom_name || `Hall ${rid}`,
        };
      });

      setClassrooms(roomObjects);
      if (roomObjects.length > 0) {
        setSelectedClassroomId(roomObjects[0].classroom_id);
      }
      setSelectedSeat(null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load arrangement details');
    } finally {
      setLoading(false);
    }
  };

  // Color mapping per subject
  const distinctSubjects = Array.from(
    new Set(currentArrangement?.assignments?.map((a) => a.subject_code).filter(Boolean))
  );

  const subjectColorMap = {};
  distinctSubjects.forEach((sub, idx) => {
    subjectColorMap[sub] = SUBJECT_COLOR_PALETTES[idx % SUBJECT_COLOR_PALETTES.length];
  });

  // Filter assignments for selected classroom
  const activeRoomAssignments = currentArrangement?.assignments?.filter(
    (a) => a.classroom_id === selectedClassroomId
  ) || [];

  // Determine max row and col in this classroom to render grid
  const maxRow = activeRoomAssignments.reduce((max, a) => Math.max(max, a.row_num), 0) || 5;
  const maxCol = activeRoomAssignments.reduce((max, a) => Math.max(max, a.col_num), 0) || 5;

  // Build coordinate map: (r, c) -> assignment
  const seatGridMap = {};
  activeRoomAssignments.forEach((a) => {
    seatGridMap[`${a.row_num}-${a.col_num}`] = a;
  });

  const activeRoomName = classrooms.find((c) => c.classroom_id === selectedClassroomId)?.classroom_name || 'Classroom';
  const conflictsInRoom = activeRoomAssignments.filter((a) => a.has_conflict).length;

  if (loading && !currentArrangement) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Generating interactive seating grid...
      </div>
    );
  }

  if (arrangements.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
        <Armchair className="w-12 h-12 text-slate-300 mx-auto" />
        <div>
          <h3 className="font-bold text-slate-900 text-base">No Seating Arrangements Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Create your first examination arrangement or seed realistic college demonstration data.
          </p>
        </div>
        <button
          onClick={() => setActivePage('setup')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          Configure Seating Arrangement
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Arrangement Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Interactive Seating Visualization</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual examination hall grid with seat coordinates, student roll numbers, and conflict detection heatmaps
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold uppercase text-slate-400 whitespace-nowrap">Arrangement:</label>
          <select
            value={currentArrangement?.arrangement_id || ''}
            onChange={(e) => loadArrangement(Number(e.target.value))}
            className="w-full sm:w-72 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {arrangements.map((a) => (
              <option key={a.arrangement_id} value={a.arrangement_id}>
                #{a.arrangement_id} - {a.exam_name} ({a.algorithm_used})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Arrangement Performance Header Ribbon */}
      {currentArrangement && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block uppercase text-[10px] font-semibold">Algorithm</span>
              <span className="font-bold text-blue-700">{currentArrangement.algorithm_used}</span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block uppercase text-[10px] font-semibold">Separation</span>
              <span className="font-semibold text-slate-800 capitalize font-mono">
                {currentArrangement.separation_mode}
              </span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block uppercase text-[10px] font-semibold">Students Seated</span>
              <span className="font-bold text-slate-900">{currentArrangement.students_assigned} / {currentArrangement.total_students}</span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block uppercase text-[10px] font-semibold">Total Conflicts</span>
              <span
                className={`font-bold ${
                  currentArrangement.total_conflict_count === 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {currentArrangement.total_conflict_count} ({currentArrangement.conflict_score} penalty)
              </span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block uppercase text-[10px] font-semibold">Execution Time</span>
              <span className="font-mono text-slate-700 font-semibold">{currentArrangement.execution_time_ms} ms</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Hall</span>
            </button>
            <button
              onClick={() => setActivePage('conflicts')}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
            >
              Conflict Details
            </button>
          </div>
        </div>
      )}

      {/* Classroom Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <School className="w-4 h-4 text-slate-400 mr-1" />
        {classrooms.map((c) => {
          const isSelected = selectedClassroomId === c.classroom_id;
          const roomAssigned = currentArrangement?.assignments?.filter((a) => a.classroom_id === c.classroom_id) || [];
          const roomConflicts = roomAssigned.filter((a) => a.has_conflict).length;

          return (
            <button
              key={c.classroom_id}
              onClick={() => {
                setSelectedClassroomId(c.classroom_id);
                setSelectedSeat(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{c.classroom_name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {roomAssigned.length} seats
              </span>
              {roomConflicts > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" title="Conflicts in this hall" />
              )}
            </button>
          );
        })}
      </div>

      {/* Visual Legend */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-400" />
            <span className="text-slate-600">Occupied Seat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-dashed border-slate-300" />
            <span className="text-slate-400">Available / Empty Seat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-50 border-2 border-rose-600 conflict-pulse" />
            <span className="text-rose-700 font-semibold">Same-Subject Conflict (Violates Adjacency)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white border-2 border-blue-600 ring-2 ring-blue-300" />
            <span className="text-slate-800 font-semibold">Selected Seat</span>
          </div>
        </div>

        {/* Subject Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium text-[11px] mr-1">Filter Subject:</span>
          {distinctSubjects.map((sub) => {
            const pal = subjectColorMap[sub] || SUBJECT_COLOR_PALETTES[0];
            const isHighlighted = highlightSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => setHighlightSubject(isHighlighted ? null : sub)}
                className={`px-2 py-1 rounded text-[11px] font-bold border transition flex items-center gap-1.5 ${
                  isHighlighted ? `${pal.bg} ring-2 ring-blue-500` : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${pal.dot}`} />
                <span>{sub}</span>
              </button>
            );
          })}
          {highlightSubject && (
            <button
              onClick={() => setHighlightSubject(null)}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Grid on Left/Center, Seat Inspector Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* The Visual Grid */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">{activeRoomName} - Seating Layout</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any seat to inspect student roll number, subject, and adjacent neighbor status
              </p>
            </div>
            {conflictsInRoom > 0 ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{conflictsInRoom} Conflicts in Hall</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Conflicts</span>
              </span>
            )}
          </div>

          {/* Front Blackboard Header */}
          <div className="w-full py-2 bg-slate-800 text-slate-200 rounded-lg text-center text-[11px] font-mono tracking-widest uppercase shadow-inner">
            ━━ INVIGILATOR STAGE / BLACKBOARD (FRONT) ━━
          </div>

          {/* Matrix Grid of Seats */}
          <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl overflow-x-auto min-h-[380px] flex items-center justify-center">
            <div
              className="grid gap-3 mx-auto w-fit"
              style={{
                gridTemplateColumns: `repeat(${maxCol}, minmax(72px, 1fr))`,
              }}
            >
              {Array.from({ length: maxRow }, (_, rIdx) => {
                const r = rIdx + 1;
                return Array.from({ length: maxCol }, (_, cIdx) => {
                  const c = cIdx + 1;
                  const key = `${r}-${c}`;
                  const assignment = seatGridMap[key];

                  if (!assignment) {
                    // Empty seat
                    return (
                      <div
                        key={key}
                        className="h-20 rounded-xl border border-dashed border-slate-300 bg-slate-100/50 flex flex-col items-center justify-center text-slate-400 select-none"
                        title={`Empty Seat R${r}C${c}`}
                      >
                        <Armchair className="w-4 h-4 opacity-40 mb-1" />
                        <span className="text-[10px] font-mono">R{r}C{c}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">Empty</span>
                      </div>
                    );
                  }

                  const isSelected = selectedSeat?.assignment_id === assignment.assignment_id;
                  const hasConflict = assignment.has_conflict;
                  const pal = subjectColorMap[assignment.subject_code] || SUBJECT_COLOR_PALETTES[0];
                  const isDimmed = highlightSubject && highlightSubject !== assignment.subject_code;

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSeat(assignment)}
                      className={`h-20 p-1.5 rounded-xl border text-center flex flex-col justify-between transition relative text-left group ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500 shadow-md bg-white z-10'
                          : hasConflict
                          ? 'bg-rose-50 border-rose-500 conflict-pulse'
                          : `${pal.bg} hover:shadow-sm`
                      } ${isDimmed ? 'opacity-25 grayscale' : ''}`}
                    >
                      {/* Top Bar: Coordinate and conflict badge */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-mono font-bold text-slate-600 leading-none">
                          R{r}C{c}
                        </span>
                        {hasConflict && (
                          <span className="w-2 h-2 rounded-full bg-rose-600" title="Same-subject adjacent conflict!" />
                        )}
                      </div>

                      {/* Middle: Student Roll No */}
                      <div className="my-auto text-center">
                        <span className="font-mono font-extrabold text-xs block text-slate-900 leading-tight">
                          {assignment.student_roll_no}
                        </span>
                        <span className="text-[10px] text-slate-600 truncate block max-w-[80px] mx-auto">
                          {assignment.student_name}
                        </span>
                      </div>

                      {/* Bottom Badge: Subject Code */}
                      <div className="w-full text-center">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold font-mono tracking-wider ${
                            hasConflict ? 'bg-rose-200 text-rose-900' : 'bg-white/80 text-slate-800'
                          }`}
                        >
                          {assignment.subject_code}
                        </span>
                      </div>
                    </button>
                  );
                });
              })}
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 font-mono">
            Back of Examination Hall (Door Exit)
          </div>
        </div>

        {/* Right Pane: Seat Inspector */}
        <div className="lg:col-span-1 space-y-4">
          {selectedSeat ? (
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Seat Details Inspector</h4>
                    <span className="text-[11px] font-mono text-slate-500">Seat {selectedSeat.seat_number}</span>
                  </div>
                </div>
                {selectedSeat.has_conflict ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                    Conflict
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                    Clean
                  </span>
                )}
              </div>

              {/* Student Details */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Candidate Info</span>
                  <div className="text-slate-900 font-bold text-sm">{selectedSeat.student_name}</div>
                  <div className="font-mono text-slate-600">Roll: {selectedSeat.student_roll_no}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Subject</span>
                  <div className="font-bold text-slate-900">
                    {selectedSeat.subject_code} - {selectedSeat.subject_name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Coordinates</span>
                    <span className="font-mono font-bold text-slate-800">
                      Row {selectedSeat.row_num}, Col {selectedSeat.col_num}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Classroom</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {selectedSeat.classroom_name}
                    </span>
                  </div>
                </div>

                {/* Conflict Explanation if applicable */}
                {selectedSeat.has_conflict && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-rose-900">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Adjacency Violation Detected</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {selectedSeat.conflict_details ||
                        `Adjacent seat shares the same subject (${selectedSeat.subject_code}) within ${currentArrangement.separation_mode} distance.`}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick action: Re-optimize */}
              <button
                onClick={() => setActivePage('conflicts')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <span>Run Conflict Optimizer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-400 text-xs space-y-2">
              <Armchair className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No Seat Selected</p>
              <p>Click on any seat in the classroom grid to inspect the candidate and check neighbor adjacencies.</p>
            </div>
          )}

          {/* Quick Classroom Statistics Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Classroom Summary</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Classroom:</span>
                <span className="font-semibold text-slate-900">{activeRoomName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Grid Dimension:</span>
                <span className="font-mono text-slate-900">{maxRow} × {maxCol}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Occupied Seats:</span>
                <span className="font-bold text-blue-600">{activeRoomAssignments.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Conflict Count:</span>
                <span className={`font-bold ${conflictsInRoom > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {conflictsInRoom}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
