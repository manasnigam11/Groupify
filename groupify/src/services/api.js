/**
 * Groupify — API Service Layer.
 *
 * Centralized HTTP client for all backend communication.
 * Attaches JWT from localStorage to every authenticated request.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('groupify_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    const err = new Error(error.detail || 'Request failed');
    err.status = response.status;
    throw err;
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signup(email, password, name) {
  const data = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  localStorage.setItem('groupify_token', data.access_token);
  return data;
}

export async function login(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('groupify_token', data.access_token);
  return data;
}

export async function getMe() {
  return request('/api/auth/me');
}

export function logout() {
  localStorage.removeItem('groupify_token');
}

export function isAuthenticated() {
  return !!localStorage.getItem('groupify_token');
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function getProfile() {
  return request('/api/profile');
}

export async function updateProfile(data) {
  return request('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export async function findTeammates(query, mode = 'standard') {
  return request('/api/match/find', {
    method: 'POST',
    body: JSON.stringify({ query, mode }),
  });
}

export async function getMatchHistory() {
  return request('/api/match/history');
}

export async function getMatchResult(matchId) {
  return request(`/api/match/${matchId}`);
}
