import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    roll_no: '',
    student_name: '',
    subject_id: '',
    email: '',
    semester: 'Semester 5',
  });

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, subjectsData] = await Promise.all([
        api.getStudents({ search, subject_id: selectedSubjectId || undefined }),
        api.getSubjects(),
      ]);
      setStudents(studentsData);
      setSubjects(subjectsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedSubjectId]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!formData.roll_no || !formData.student_name || !formData.subject_id) {
        alert('Please fill in Roll Number, Name, and Subject.');
        return;
      }

      if (editingStudent) {
        await api.updateStudent(editingStudent.roll_no, {
          student_name: formData.student_name,
          subject_id: parseInt(formData.subject_id),
          email: formData.email,
          semester: formData.semester,
        });
        setSuccessMsg(`Student ${formData.roll_no} updated successfully!`);
      } else {
        await api.createStudent({
          roll_no: formData.roll_no.trim(),
          student_name: formData.student_name.trim(),
          subject_id: parseInt(formData.subject_id),
          email: formData.email.trim(),
          semester: formData.semester.trim(),
        });
        setSuccessMsg(`Student ${formData.roll_no} registered successfully!`);
      }

      setShowAddModal(false);
      setEditingStudent(null);
      setFormData({ roll_no: '', student_name: '', subject_id: '', email: '', semester: 'Semester 5' });
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (rollNo) => {
    if (!window.confirm(`Are you sure you want to delete student ${rollNo}?`)) return;
    try {
      await api.deleteStudent(rollNo);
      setSuccessMsg(`Student ${rollNo} deleted.`);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert('Please select a CSV file.');
      return;
    }
    try {
      setImporting(true);
      const res = await api.importStudentsCSV(importFile);
      setSuccessMsg(`CSV imported: ${res.added} students added, ${res.skipped} skipped.`);
      setShowImportModal(false);
      setImportFile(null);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert(`Import error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const openEdit = (st) => {
    setEditingStudent(st);
    setFormData({
      roll_no: st.roll_no,
      student_name: st.student_name,
      subject_id: st.subject_id,
      email: st.email || '',
      semester: st.semester || 'Semester 5',
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidates, subjects, and bulk registration for examination allocation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              try {
                await api.downloadStudentsCSV();
              } catch (err) {
                alert(`Export failed: ${err.message}`);
              }
            }}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-300" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingStudent(null);
              setFormData({
                roll_no: '',
                student_name: '',
                subject_id: subjects[0]?.subject_id || '',
                email: '',
                semester: 'Semester 5',
              });
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or subject code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-slate-700"
          >
            <option value="">All Subjects ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_code} - {s.subject_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No students found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Roll Number</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Enrolled Subjects</th>
                  <th className="px-5 py-3">Semester</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.roll_no} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-900 text-xs">
                      {st.roll_no}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {st.student_name}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(st.subjects?.length ? st.subjects : [{
                          subject_code: st.subject_code,
                          subject_name: st.subject_name,
                        }]).map((subject) => (
                          <span
                            key={subject.subject_code}
                            title={subject.subject_name}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {subject.subject_name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {st.semester || '-'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                      {st.email || '-'}
                    </td>
                    <td className="px-5 py-3 text-right space-x-1">
                      <button
                        onClick={() => openEdit(st)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition"
                        title="Edit Student"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(st.roll_no)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {students.length} students</span>
          <span className="font-mono">Total Database Records: {students.length}</span>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingStudent}
                  placeholder="e.g. 24CS001"
                  value={formData.roll_no}
                  onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Sharma"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Assigned Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">Select Examination Subject</option>
                  {subjects.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.subject_code} - {s.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    placeholder="Semester 5"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Bulk Import Students</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportCSV} className="p-6 space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition cursor-pointer">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">
                  {importFile ? importFile.name : 'Click to select CSV file or drag and drop'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: roll_no, student_name, subject_code, email, semester
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="mt-3 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">CSV Template Guidance:</p>
                <code className="block bg-white p-2 rounded border border-slate-200 font-mono text-[11px] text-blue-900">
                  roll_no,student_name,subject_code<br/>
                  24CS001,Aarav Sharma,CS301<br/>
                  24IT001,Priya Patel,CS302
                </code>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {importing ? 'Processing CSV...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
