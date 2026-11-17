import React, { useState } from 'react';
import { AlertCircle, ArrowRight, KeyRound, LockKeyhole } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.loginAdmin({ username, password });
      onLogin();
    } catch (loginError) {
      setError(loginError.message || 'Sign in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <LockKeyhole className="w-7 h-7" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-teal-300">
            Faculty of Technology
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage examinations and seating arrangements.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-white p-6 sm:p-8 shadow-2xl space-y-5"
        >
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="admin-username" className="mb-1.5 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="admin-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              autoFocus
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter admin username"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{submitting ? 'Signing in...' : 'Sign in as Admin'}</span>
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>

          <div className="flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
            <KeyRound className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
            <p>
              Local demo login: <strong className="text-slate-700">admin</strong> /{' '}
              <strong className="text-slate-700">12345678</strong>
            </p>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Admin access for the examination seating system
        </p>
      </div>
    </main>
  );
}
