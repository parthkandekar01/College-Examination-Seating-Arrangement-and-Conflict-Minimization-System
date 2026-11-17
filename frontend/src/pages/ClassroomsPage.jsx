import React, { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Trash2,
  Edit2,
  Grid,
  Armchair,
  X,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);

  const [formData, setFormData] = useState({
    classroom_name: '',
    capacity: 25,
    rows: 5,
    cols: 5,
  });

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const data = await api.getClassrooms();
      setClassrooms(data);
      if (data.length > 0 && !selectedRoomDetails) {
        viewRoom(data[0].classroom_id);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const viewRoom = async (id) => {
    try {
      const room = await api.getClassroom(id);
      setSelectedRoomDetails(room);
    } catch (err) {
      console.error('Error fetching room details:', err);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const cap = parseInt(formData.capacity);
      const r = parseInt(formData.rows);
      const c = parseInt(formData.cols);

      if (r * c < cap) {
        alert(`Rows (${r}) x Cols (${c}) = ${r * c} seats, which cannot accommodate capacity (${cap}). Adjust dimensions.`);
        return;
      }

      await api.createClassroom({
        classroom_name: formData.classroom_name.trim(),
        capacity: cap,
        rows: r,
        cols: c,
      });

      setSuccessMsg(`Classroom ${formData.classroom_name} and ${cap} seats generated successfully!`);
      setShowModal(false);
      setFormData({ classroom_name: '', capacity: 25, rows: 5, cols: 5 });
      fetchClassrooms();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      alert(`Error creating classroom: ${err.message}`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete classroom "${name}" and all its auto-generated seats?`)) return;
    try {
      await api.deleteClassroom(id);
      setSuccessMsg(`Classroom ${name} deleted.`);
      if (selectedRoomDetails?.classroom_id === id) {
        setSelectedRoomDetails(null);
      }
      fetchClassrooms();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Classroom Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure examination venues, row-column dimensions, and automated seat numbering
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ classroom_name: '', capacity: 25, rows: 5, cols: 5 });
            setShowModal(true);
          }}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Classroom</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Left List, Right Layout Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classrooms List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider px-1">
            Registered Classrooms ({classrooms.length})
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              Loading classrooms...
            </div>
          ) : classrooms.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              No classrooms available. Click "Add Classroom" or "Seed Demo Data".
            </div>
          ) : (
            classrooms.map((c) => {
              const isSelected = selectedRoomDetails?.classroom_id === c.classroom_id;
              return (
                <div
                  key={c.classroom_id}
                  onClick={() => viewRoom(c.classroom_id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm truncate">{c.classroom_name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.classroom_id, c.classroom_name);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Delete Classroom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase">Capacity</span>
                      <span className="font-bold text-slate-800">{c.capacity}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase">Grid</span>
                      <span className="font-bold text-slate-800">{c.rows}x{c.cols}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase">Seats</span>
                      <span className="font-bold text-blue-700">{c.seats_count}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Live Grid Layout Preview */}
        <div className="lg:col-span-2">
          {selectedRoomDetails ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <School className="w-4 h-4 text-blue-600" />
                    <span>{selectedRoomDetails.classroom_name} Seating Grid</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dimensions: {selectedRoomDetails.rows} Rows × {selectedRoomDetails.cols} Columns ({selectedRoomDetails.capacity} Max Capacity)
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-teal-50 text-teal-700 border border-teal-200 self-start sm:self-auto">
                  {selectedRoomDetails.seats?.length || 0} Auto-Generated Seats
                </span>
              </div>

              {/* Front of Exam Hall Indicator */}
              <div className="w-full py-1.5 bg-slate-100 border border-slate-200 rounded text-center text-[11px] font-semibold tracking-wider uppercase text-slate-500 shadow-inner">
                ▲ BLACKBOARD / INVIGILATOR DESK (FRONT) ▲
              </div>

              {/* Seats Matrix Render */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl overflow-x-auto">
                <div
                  className="grid gap-2.5 mx-auto w-fit"
                  style={{
                    gridTemplateColumns: `repeat(${selectedRoomDetails.cols}, minmax(56px, 1fr))`,
                  }}
                >
                  {selectedRoomDetails.seats?.map((seat) => (
                    <div
                      key={seat.seat_id}
                      className="h-14 px-1 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center hover:border-blue-400 transition"
                      title={`Row ${seat.row_num}, Column ${seat.col_num} (${seat.seat_number})`}
                    >
                      <Armchair className="w-4 h-4 text-slate-400 mb-0.5" />
                      <span className="text-[10px] font-mono font-bold text-slate-700 leading-none">
                        R{seat.row_num}C{seat.col_num}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-3.5 h-3.5" />
                <span>Seats are numbered row-wise and mapped to coordinate space for adjacency conflict calculations.</span>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center text-slate-400 text-sm">
              Select a classroom on the left to preview its seating layout.
            </div>
          )}
        </div>
      </div>

      {/* Add Classroom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Create New Classroom</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Classroom / Hall Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hall 103 - Ramanujan Hall"
                  value={formData.classroom_name}
                  onChange={(e) => setFormData({ ...formData, classroom_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Rows <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formData.rows}
                    onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Columns <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formData.cols}
                    onChange={(e) => setFormData({ ...formData, cols: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Capacity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.rows * formData.cols}
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-800 space-y-1">
                <span className="font-semibold">Automated Seat Generation:</span>
                <p>
                  A grid of {formData.rows} × {formData.cols} will generate up to {formData.capacity} individual seat records numbered like <span className="font-mono">{formData.classroom_name || 'Room'}-R1C1</span>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
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
                  Generate Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
