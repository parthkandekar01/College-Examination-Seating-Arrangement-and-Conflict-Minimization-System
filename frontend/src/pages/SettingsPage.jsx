import React, { useState } from 'react';
import {
  Settings,
  Database,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  Info,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({ onQuickSeed, seeding, setActivePage }) {
  const [clearing, setClearing] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleReset = async () => {
    if (!window.confirm('WARNING: This will completely delete all subjects, students, classrooms, and seating arrangements! Are you sure?')) {
      return;
    }
    try {
      setClearing(true);
      await api.resetDatabase();
      setStatusMsg('Database cleared successfully. All tables have been reset.');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Data Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Demonstration data population, database reset, and ADA algorithm engine diagnostics
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Demonstration Data Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">Demonstration Data Seeder</h3>
            <p className="text-xs text-slate-500">
              Populates realistic college examination datasets for live project defense & viva demonstration
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The seeder creates:
        </p>
        <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
          <li><strong>5 Subjects:</strong> ADA, DBMS, AI ML, Maths, and EVS.</li>
          <li><strong>60 Realistic Students:</strong> the same 60 students are enrolled in all five subjects.</li>
          <li><strong>3 Examination Classrooms:</strong> Newton Hall (5x5 = 25 seats), Turing Block (5x5 = 25 seats), Lovelace Wing (4x5 = 20 seats). Total: 70 seats.</li>
          <li><strong>Initial Seating Plan:</strong> Pre-calculates an optimized seating arrangement using Greedy Local Conflict Minimization.</li>
        </ul>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={onQuickSeed}
            disabled={seeding}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{seeding ? 'Seeding Demonstration Data...' : 'Populate Demonstration Dataset'}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Clear Database */}
      <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">Database Reset</h3>
            <p className="text-xs text-slate-500">
              Wipe all database records to start afresh with custom college inputs
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          This operation permanently purges all student records, classroom configurations, seat matrices, and saved arrangement results.
        </p>

        <button
          onClick={handleReset}
          disabled={clearing}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{clearing ? 'Clearing Tables...' : 'Purge All Database Records'}</span>
        </button>
      </div>

      {/* System Architecture Specifications */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Server className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Architecture & Implementation Environment</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Frontend Stack</span>
            <span className="font-bold text-slate-800">React 18 + Vite + Tailwind CSS</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Backend Framework</span>
            <span className="font-bold text-slate-800">FastAPI + Python 3.12 + SQLAlchemy</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Data Storage</span>
            <span className="font-bold text-slate-800">SQLite (exam_seating.db)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Algorithms</span>
            <span className="font-bold text-slate-800">MergeSort, QuickSort, Greedy, Backtracking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
