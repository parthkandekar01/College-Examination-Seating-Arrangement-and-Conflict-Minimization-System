import React, { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  School,
  Armchair,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Clock,
  Cpu,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';

const SUBJECT_COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DashboardPage({ setActivePage, setSelectedArrangementId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Aggregating live examination metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">Error Loading Dashboard</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.total_students,
      subtitle: `${stats.students_awaiting} awaiting allocation`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Total Classrooms',
      value: stats.total_classrooms,
      subtitle: `${stats.total_seats} total available seats`,
      icon: School,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
    },
    {
      title: 'Seating Arrangements',
      value: stats.total_arrangements,
      subtitle: stats.latest_activity ? `Latest: ${stats.latest_activity.exam_name}` : 'No arrangements yet',
      icon: Armchair,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      title: 'Adjacent Conflicts',
      value: stats.total_conflicts_sum,
      subtitle: stats.latest_activity ? `${stats.latest_activity.conflicts} in latest exam` : 'Zero conflicts recorded',
      icon: AlertTriangle,
      color: stats.total_conflicts_sum > 0 ? 'text-amber-600' : 'text-emerald-600',
      bg: stats.total_conflicts_sum > 0 ? 'bg-amber-50' : 'bg-emerald-50',
      border: stats.total_conflicts_sum > 0 ? 'border-amber-100' : 'border-emerald-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-teal-300 border border-teal-500/30 mb-2">
            Faculty of Technology • Analysis and Design of Algorithms
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Automated Examination Seating & Conflict Minimization
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Optimizing examination seating using Merge/Quick Sorting, Greedy conflict heuristics, and Recursive Backtracking constraint satisfaction.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActivePage('setup')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            <span>Configure Exam</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActivePage('comparison')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>Compare Algorithms</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-xl bg-white border ${card.border} shadow-sm hover:shadow transition flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <div className="text-xs text-slate-500 mt-1 truncate">{card.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Distribution by Subject */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Student Distribution by Subject</h3>
              <p className="text-xs text-slate-500">Students registered across academic disciplines</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
              {stats.subject_distribution.length} Subjects
            </span>
          </div>

          <div className="h-64">
            {stats.subject_distribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No subjects registered yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.subject_distribution}
                    dataKey="student_count"
                    nameKey="subject_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                    label={(entry) => `${entry.subject_name} (${entry.student_count})`}
                  >
                    {stats.subject_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, props) => [`${val} Students`, props.payload.subject_name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Classroom Capacity & Utilization */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Classroom Capacity & Occupancy</h3>
              <p className="text-xs text-slate-500">Seat availability vs utilized seats in latest exam</p>
            </div>
            <span className="text-xs font-mono bg-teal-50 text-teal-700 px-2 py-1 rounded border border-teal-200">
              Live Utilization
            </span>
          </div>

          <div className="h-64">
            {stats.classroom_utilization.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No classrooms registered yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.classroom_utilization}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="classroom_name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="capacity" name="Total Capacity" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="occupied_seats" name="Occupied Seats" fill="#026bc9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Seating Arrangements Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Seating Arrangements</h3>
            <p className="text-xs text-slate-500">Generated optimization runs with measured execution times and conflicts</p>
          </div>
          <button
            onClick={() => setActivePage('setup')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>New Arrangement</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {stats.recent_arrangements.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No seating arrangements generated yet. Click "Configure Exam" or "Seed Demo Data" above.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Examination Name</th>
                  <th className="px-5 py-3">Algorithm Used</th>
                  <th className="px-5 py-3">Separation Mode</th>
                  <th className="px-5 py-3">Students Seated</th>
                  <th className="px-5 py-3">Adjacent Conflicts</th>
                  <th className="px-5 py-3">Execution Time</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_arrangements.map((arr) => (
                  <tr key={arr.arrangement_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {arr.exam_name}
                      <span className="block text-xs font-normal text-slate-400">{arr.exam_date || 'No date set'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {arr.algorithm_used}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-mono capitalize">
                      {arr.separation_mode}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {arr.students_assigned}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          arr.total_conflicts === 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {arr.total_conflicts === 0 ? '0 Conflicts (Optimal)' : `${arr.total_conflicts} Conflicts`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                      {arr.execution_time_ms} ms
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedArrangementId(arr.arrangement_id);
                          setActivePage('visualization');
                        }}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                      >
                        View Grid
                      </button>
                      <button
                        onClick={() => {
                          setSelectedArrangementId(arr.arrangement_id);
                          setActivePage('conflicts');
                        }}
                        className="px-2.5 py-1 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition"
                      >
                        Analyze
                      </button>
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
