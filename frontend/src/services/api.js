/**
 * API Service Client
 * Interfaces with FastAPI backend at /api
 */

const API_BASE = '/api';
const AUTH_TOKEN_KEY = 'admin_access_token';

function handleUnauthorized(url) {
  if (url !== '/auth/login') {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    window.dispatchEvent(new Event('auth:expired'));
  }
}

async function request(url, options = {}) {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  // Remove Content-Type if uploading FormData
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${url}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(url);
    }
    let errorDetail = 'An unexpected error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `HTTP error ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function downloadFile(url, filename) {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(url);
    }
    throw new Error(`Download failed (HTTP ${response.status})`);
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export const api = {
  // Authentication
  loginAdmin: async (credentials) => {
    const result = await request('/auth/login', { method: 'POST', body: credentials });
    sessionStorage.setItem(AUTH_TOKEN_KEY, result.access_token);
    return result;
  },
  getCurrentAdmin: () => request('/auth/me'),
  logout: () => sessionStorage.removeItem(AUTH_TOKEN_KEY),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Subjects
  getSubjects: (search) => request(`/subjects${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createSubject: (data) => request('/subjects', { method: 'POST', body: data }),
  updateSubject: (id, data) => request(`/subjects/${id}`, { method: 'PUT', body: data }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.subject_id) q.append('subject_id', params.subject_id);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return request(`/students${queryString}`);
  },
  createStudent: (data) => request('/students', { method: 'POST', body: data }),
  updateStudent: (rollNo, data) => request(`/students/${encodeURIComponent(rollNo)}`, { method: 'PUT', body: data }),
  deleteStudent: (rollNo) => request(`/students/${encodeURIComponent(rollNo)}`, { method: 'DELETE' }),
  importStudentsCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/students/import-csv', { method: 'POST', body: formData });
  },
  downloadStudentsCSV: () => downloadFile('/students/export-csv', 'students.csv'),

  // Classrooms
  getClassrooms: () => request('/classrooms'),
  getClassroom: (id) => request(`/classrooms/${id}`),
  createClassroom: (data) => request('/classrooms', { method: 'POST', body: data }),
  updateClassroom: (id, data) => request(`/classrooms/${id}`, { method: 'PUT', body: data }),
  deleteClassroom: (id) => request(`/classrooms/${id}`, { method: 'DELETE' }),

  // Arrangements
  getArrangements: () => request('/arrangements'),
  getArrangementDetails: (id) => request(`/arrangements/${id}`),
  generateArrangement: (data) => request('/arrangements/generate', { method: 'POST', body: data }),
  deleteArrangement: (id) => request(`/arrangements/${id}`, { method: 'DELETE' }),

  // Conflict Analysis
  getConflictAnalysis: (id) => request(`/conflict-analysis/${id}`),
  reoptimizeArrangement: (id, algorithm, mode) => 
    request(`/conflict-analysis/${id}/optimize?target_algorithm=${algorithm}&separation_mode=${mode}`, { method: 'POST' }),

  // Algorithms Standalone & Benchmarks
  runStandaloneSort: (data) => request('/algorithms/sort', { method: 'POST', body: data }),
  compareAlgorithms: (mode, limit) => 
    request(`/algorithms/compare?separation_mode=${mode || 'all'}${limit ? `&limit_students=${limit}` : ''}`, { method: 'POST' }),
  runBenchmark: (data) => request('/algorithms/benchmark', { method: 'POST', body: data }),

  // Reports
  getReportSummary: (id) => request(`/reports/${id}/summary`),
  downloadReportCSV: (id) => downloadFile(`/reports/${id}/csv`, `seating_plan_${id}.csv`),

  // Seed & Demo
  seedDemoData: () => request('/seed/demo', { method: 'POST' }),
  resetDatabase: () => request('/seed/reset', { method: 'POST' }),
};
