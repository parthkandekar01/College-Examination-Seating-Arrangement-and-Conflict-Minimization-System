import React, { useEffect, useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import SubjectsPage from './pages/SubjectsPage';
import ClassroomsPage from './pages/ClassroomsPage';
import ExamSetupPage from './pages/ExamSetupPage';
import GenerateSeatingPage from './pages/GenerateSeatingPage';
import SeatingVisualizationPage from './pages/SeatingVisualizationPage';
import ConflictAnalysisPage from './pages/ConflictAnalysisPage';
import AlgorithmComparisonPage from './pages/AlgorithmComparisonPage';
import PerformanceAnalysisPage from './pages/PerformanceAnalysisPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { api } from './services/api';

export default function App() {
  const [authStatus, setAuthStatus] = useState('checking');
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedArrangementId, setSelectedArrangementId] = useState(null);
  const [latestArrangementResult, setLatestArrangementResult] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccessNotice, setSeedSuccessNotice] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('admin_access_token')) {
      setAuthStatus('logged-out');
      return undefined;
    }

    let active = true;
    api.getCurrentAdmin()
      .then(() => {
        if (active) setAuthStatus('authenticated');
      })
      .catch(() => {
        if (active) setAuthStatus('logged-out');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => setAuthStatus('logged-out');
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const handleLogout = () => {
    api.logout();
    setAuthStatus('logged-out');
  };

  const handleQuickSeed = async () => {
    try {
      setSeeding(true);
      const res = await api.seedDemoData();
      setSelectedArrangementId(res.initial_arrangement_id);
      setSeedSuccessNotice(true);
      setTimeout(() => setSeedSuccessNotice(false), 5000);
      // Reload dashboard or active page
      if (activePage === 'dashboard' || activePage === 'visualization') {
        // Trigger re-render by staying on page
        const currentPage = activePage;
        setActivePage('dashboard');
        if (currentPage !== 'dashboard') {
          setTimeout(() => setActivePage(currentPage), 50);
        }
      }
    } catch (err) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            setActivePage={setActivePage}
            setSelectedArrangementId={setSelectedArrangementId}
          />
        );
      case 'students':
        return <StudentsPage />;
      case 'subjects':
        return <SubjectsPage />;
      case 'classrooms':
        return <ClassroomsPage />;
      case 'setup':
        return (
          <ExamSetupPage
            setActivePage={setActivePage}
            setLatestArrangementResult={setLatestArrangementResult}
            setSelectedArrangementId={setSelectedArrangementId}
          />
        );
      case 'generate':
        return (
          <GenerateSeatingPage
            setActivePage={setActivePage}
            setLatestArrangementResult={setLatestArrangementResult}
            setSelectedArrangementId={setSelectedArrangementId}
          />
        );
      case 'visualization':
        return (
          <SeatingVisualizationPage
            selectedArrangementId={selectedArrangementId}
            setSelectedArrangementId={setSelectedArrangementId}
            setActivePage={setActivePage}
          />
        );
      case 'conflicts':
        return (
          <ConflictAnalysisPage
            selectedArrangementId={selectedArrangementId}
            setSelectedArrangementId={setSelectedArrangementId}
            setLatestArrangementResult={setLatestArrangementResult}
            setActivePage={setActivePage}
          />
        );
      case 'comparison':
        return <AlgorithmComparisonPage />;
      case 'performance':
        return <PerformanceAnalysisPage />;
      case 'reports':
        return (
          <ReportsPage
            selectedArrangementId={selectedArrangementId}
            setSelectedArrangementId={setSelectedArrangementId}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            onQuickSeed={handleQuickSeed}
            seeding={seeding}
            setActivePage={setActivePage}
          />
        );
      default:
        return (
          <DashboardPage
            setActivePage={setActivePage}
            setSelectedArrangementId={setSelectedArrangementId}
          />
        );
    }
  };

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-sm font-medium text-slate-300">
        Checking admin session...
      </div>
    );
  }

  if (authStatus !== 'authenticated') {
    return <LoginPage onLogin={() => setAuthStatus('authenticated')} />;
  }

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={setActivePage}
      onQuickSeed={handleQuickSeed}
      seeding={seeding}
      onLogout={handleLogout}
    >
      {seedSuccessNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>✓ Demonstration dataset loaded (5 subjects, 60 shared students, 3 classrooms, and initial seating plan)!</span>
          <button
            onClick={() => setSeedSuccessNotice(false)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
      {renderActivePage()}
    </DashboardLayout>
  );
}
