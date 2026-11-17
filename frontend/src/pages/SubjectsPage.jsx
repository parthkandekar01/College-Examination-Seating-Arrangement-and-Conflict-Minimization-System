import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ subject_code: '', subject_name: '' });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await api.getSubjects(search);
      setSubjects(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchSubjects(), 250);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!formData.subject_code || !formData.subject_name) {
        alert('Please fill in both Subject Code and Name.');
        return;
      }

      if (editingSubject) {
        await api.updateSubject(editingSubject.subject_id, {
          subject_code: formData.subject_code.trim(),
          subject_name: formData.subject_name.trim(),
        });
        setSuccessMsg(`Subject ${formData.subject_code} updated!`);
      } else {
        await api.createSubject({
          subject_code: formData.subject_code.trim(),
          subject_name: formData.subject_name.trim(),
        });
        setSuccessMsg(`Subject ${formData.subject_code} created!`);
      }

      setShowModal(false);
      setEditingSubject(null);
      setFormData({ subject_code: '', subject_name: '' });
      fetchSubjects();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete subject ${code}? Students enrolled in other subjects will be kept.`)) return;
    try {
      await api.deleteSubject(id);
      setSuccessMsg(`Subject ${code} deleted.`);
      fetchSubjects();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const openEdit = (sub) => {
    setEditingSubject(sub);
    setFormData({ subject_code: sub.subject_code, subject_name: sub.subject_name });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Subject Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure examination academic disciplines and track student enrollments
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSubject(null);
            setFormData({ subject_code: '', subject_name: '' });
            setShowModal(true);
          }}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Subject</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subjects by code or subject name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading subjects...
          </div>
        ) : subjects.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
            No subjects created yet. Click "Add Subject" or "Seed Demo Data".
          </div>
        ) : (
          subjects.map((sub) => (
            <div
              key={sub.subject_id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {sub.subject_code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(sub)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.subject_id, sub.subject_code)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-3 leading-snug">
                  {sub.subject_name}
                </h3>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sub.registered_students_count} Registered Students</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">ID: #{sub.subject_id}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingSubject ? 'Edit Subject' : 'Add New Examination Subject'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Subject Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS301"
                  value={formData.subject_code}
                  onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Subject Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Analysis & Design of Algorithms"
                  value={formData.subject_name}
                  onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
