import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  School,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Building,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportsPage({ selectedArrangementId, setSelectedArrangementId }) {
  const [arrangements, setArrangements] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassroomTab, setSelectedClassroomTab] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArrangements = async () => {
      try {
        setLoading(true);
        const list = await api.getArrangements();
        setArrangements(list);
        if (list.length > 0) {
          const targetId = selectedArrangementId || list[0].arrangement_id;
          loadReport(targetId);
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

  const loadReport = async (id) => {
    try {
      setLoading(true);
      const data = await api.getReportSummary(id);
      setReport(data);
      setSelectedArrangementId(id);
      if (data.classrooms && data.classrooms.length > 0) {
        setSelectedClassroomTab(data.classrooms[0].classroom_name);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const activeClassroomData = report?.classrooms?.find(
    (c) => c.classroom_name === selectedClassroomTab
  ) || report?.classrooms?.[0];

  return (
    <div className="space-y-6">
      {/* Top Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Examination Seating Reports & Rosters</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Classroom-wise official seating plans, invigilator attendance sheets, and CSV exports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {report && (
            <>
              <button
                onClick={async () => {
                  try {
                    await api.downloadReportCSV(report.arrangement_id);
                  } catch (err) {
                    alert(`Export failed: ${err.message}`);
                  }
                }}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV Plan</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Roster (PDF)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Arrangement Selector Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase text-slate-400">Target Exam:</label>
          <select
            value={report?.arrangement_id || ''}
            onChange={(e) => loadReport(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
          >
            {arrangements.map((a) => (
              <option key={a.arrangement_id} value={a.arrangement_id}>
                #{a.arrangement_id} - {a.exam_name} ({a.algorithm_used})
              </option>
            ))}
          </select>
        </div>

        {report && (
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span>Algorithm: <strong className="text-blue-700 font-sans">{report.algorithm_used}</strong></span>
            <span>•</span>
            <span>Time: <strong>{report.execution_time_ms} ms</strong></span>
            <span>•</span>
            <span>Conflicts: <strong>{report.total_conflict_count}</strong></span>
          </div>
        )}
      </div>

      {/* Classroom Selection Tabs */}
      {report?.classrooms && report.classrooms.length > 0 && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-print">
          <School className="w-4 h-4 text-slate-400 mr-1" />
          {report.classrooms.map((c) => {
            const isSelected = selectedClassroomTab === c.classroom_name;
            return (
              <button
                key={c.classroom_name}
                onClick={() => setSelectedClassroomTab(c.classroom_name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{c.classroom_name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                  {c.assigned_students} students
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Printable Report Canvas */}
      {activeClassroomData && (
        <div className="printable-card bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Official College Examination Letterhead */}
          <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Faculty of Technology • Department of Computer Science & Engineering
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              Faculty of Technology Examination Seating Chart & Attendance Roster
            </h1>
            <div className="text-xs font-medium text-slate-600">
              Academic Term 2026 • Examination Cell Confidential Record
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Examination</span>
              <strong className="text-slate-900">{report.exam_name}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Date / Session</span>
              <strong className="text-slate-900">{report.exam_date || 'Standard Session'}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Classroom Venue</span>
              <strong className="text-blue-700">{activeClassroomData.classroom_name}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Allocated Candidates</span>
              <strong className="text-slate-900">{activeClassroomData.assigned_students} / {activeClassroomData.capacity} Seats</strong>
            </div>
          </div>

          {/* Student Seating Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 border-r border-slate-200 text-center w-12">S.No</th>
                  <th className="px-3 py-2 border-r border-slate-200 w-24">Seat No</th>
                  <th className="px-3 py-2 border-r border-slate-200 w-28">Roll Number</th>
                  <th className="px-3 py-2 border-r border-slate-200">Candidate Name</th>
                  <th className="px-3 py-2 border-r border-slate-200 w-28">Subject Code</th>
                  <th className="px-3 py-2 border-r border-slate-200">Subject Description</th>
                  <th className="px-3 py-2 border-r border-slate-200 text-center w-24">Booklet No</th>
                  <th className="px-3 py-2 text-center w-32">Candidate Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {activeClassroomData.students.map((st, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 text-center border-r border-slate-200 font-sans text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900 border-r border-slate-200">
                      {st.seat_number}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-blue-900 border-r border-slate-200">
                      {st.roll_no}
                    </td>
                    <td className="px-3 py-2.5 font-sans font-medium text-slate-900 border-r border-slate-200">
                      {st.student_name}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-700 border-r border-slate-200">
                      {st.subject_code}
                    </td>
                    <td className="px-3 py-2.5 font-sans text-slate-600 border-r border-slate-200 truncate max-w-[160px]">
                      {st.subject_name}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-200 text-center">
                      <div className="w-16 h-4 border-b border-dashed border-slate-300 mx-auto" />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="w-24 h-4 border-b border-dashed border-slate-300 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invigilator Sign-off Footer */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-xs text-slate-600 text-center">
            <div className="space-y-6">
              <div className="w-36 border-b border-slate-400 mx-auto" />
              <span>Room Invigilator Signature</span>
            </div>
            <div className="space-y-6">
              <div className="w-36 border-b border-slate-400 mx-auto" />
              <span>Chief Superintendent Sign</span>
            </div>
            <div className="space-y-6">
              <div className="w-36 border-b border-slate-400 mx-auto" />
              <span>Faculty Seal / Exam Cell</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
