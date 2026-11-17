import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  SlidersHorizontal,
  PlayCircle,
  Grid,
  AlertTriangle,
  GitCompare,
  GraduationCap,
  FileSpreadsheet,
  Settings,
  Menu,
  X,
  Sparkles,
  LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Overview' },
  { id: 'students', label: 'Students', icon: Users, category: 'Academic Data' },
  { id: 'subjects', label: 'Subjects', icon: BookOpen, category: 'Academic Data' },
  { id: 'classrooms', label: 'Classrooms', icon: School, category: 'Academic Data' },
  { id: 'setup', label: 'Exam Setup', icon: SlidersHorizontal, category: 'Seating Engine' },
  { id: 'generate', label: 'Generate Seating', icon: PlayCircle, category: 'Seating Engine' },
  { id: 'visualization', label: 'Seating Grid', icon: Grid, category: 'Arrangement View' },
  { id: 'conflicts', label: 'Conflict Analysis', icon: AlertTriangle, category: 'Arrangement View' },
  { id: 'comparison', label: 'Algorithm Comparison', icon: GitCompare, category: 'ADA Analysis' },
  { id: 'performance', label: 'ADA Educational Hub', icon: GraduationCap, category: 'ADA Analysis' },
  { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet, category: 'Reports' },
  { id: 'settings', label: 'Settings & Data', icon: Settings, category: 'System' },
];

export default function DashboardLayout({ activePage, setActivePage, children, onQuickSeed, seeding, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeItem = NAV_ITEMS.find((item) => item.id === activePage) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 select-none flex-shrink-0">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800 bg-slate-950/60">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-lg">
            Ω
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-base tracking-tight leading-tight">Faculty of Technology</span>
            <span className="text-[10px] text-teal-400 font-medium tracking-wide uppercase">Examination Seating System</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {['Overview', 'Academic Data', 'Seating Engine', 'Arrangement View', 'ADA Analysis', 'Reports', 'System'].map((cat) => {
            const items = NAV_ITEMS.filter((i) => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-1">
                <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {cat}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info badge */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="bg-slate-800/60 rounded-lg p-2.5 flex items-center justify-between border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">ADA Engine v1.0</span>
            </div>
            <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded font-mono">
              FastAPI
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/70 backdrop-blur-sm">
          <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">Ω</div>
                <span className="font-bold text-white text-base">Faculty of Technology</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Faculty of Technology</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-blue-600">{activeItem.category}</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{activeItem.label}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Demo Seed Button */}
            <button
              onClick={onQuickSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-sm hover:from-teal-600 hover:to-blue-700 transition disabled:opacity-50"
              title="Populate 5 subjects, 60 shared students, 3 classrooms, and initial seating"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{seeding ? 'Seeding...' : 'Seed Demo Data'}</span>
            </button>

            {/* ADA Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Sorting • Greedy • Backtracking</span>
            </div>

            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center text-xs shadow-sm">
              AD
            </div>
            <button
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
