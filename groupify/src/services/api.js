/**
 * Groupify — API Service Layer.
 */
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('groupify_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
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
  return request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) });
}
export async function verifyOtp(email, otp) {
  const data = await request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
  localStorage.setItem('groupify_token', data.access_token);
  return data;
}
export async function login(email, password) {
  const data = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  localStorage.setItem('groupify_token', data.access_token);
  return data;
}
export async function googleAuth(credential) {
  const data = await request('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
  localStorage.setItem('groupify_token', data.access_token);
  return data;
}
export async function getMe() { return request('/api/auth/me'); }
export function logout() { localStorage.removeItem('groupify_token'); }
export function isAuthenticated() { return !!localStorage.getItem('groupify_token'); }

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function getProfile() { return request('/api/profile'); }
export async function updateProfile(data) { return request('/api/profile', { method: 'PUT', body: JSON.stringify(data) }); }
export async function getPublicProfile(userId) { return request(`/api/profile/${userId}`); }
export async function getCompatibility(userId) { return request(`/api/profile/${userId}/compatibility`); }

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------
export async function findTeammates(query, mode = 'standard') { return request('/api/match/find', { method: 'POST', body: JSON.stringify({ query, mode }) }); }
export async function getMatchHistory() { return request('/api/match/history'); }
export async function getMatchResult(matchId) { return request(`/api/match/${matchId}`); }

// ---------------------------------------------------------------------------
// Projects & Team
// ---------------------------------------------------------------------------
export async function getMyProject() { return request('/api/projects/my'); }
export async function createProject(data) { return request('/api/projects', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateProject(id, data) { return request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function removeTeamMember(projectId, userId) { return request(`/api/projects/${projectId}/remove-member`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }); }
export async function leaveTeam(projectId) { return request(`/api/projects/${projectId}/leave`, { method: 'POST' }); }

// --- NAYA AI HEALTH CHECK ROUTE ---
export async function analyzeTeamHealth(projectId) { return request(`/api/projects/${projectId}/health/analyze`, { method: 'POST' }); }

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------
export async function getConversations() { return request('/api/chats'); }
export async function getMessages(userId) { return request(`/api/chats/${userId}`); }
export async function sendMessage(userId, content) { return request(`/api/chats/${userId}`, { method: 'POST', body: JSON.stringify({ content }) }); }
export async function getUnreadChatsStatus() { return request('/api/chats/unread'); }
export async function getTeamMessages(projectId) { return request(`/api/chats/team/${projectId}`); }
export async function sendTeamMessage(projectId, content) { return request(`/api/chats/team/${projectId}`, { method: 'POST', body: JSON.stringify({ content }) }); }

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------
export async function getInvites() { return request('/api/invites'); }
export async function getPendingInvites() { return request('/api/invites/pending'); }
export async function sendInvite(userId, projectId, invitationMessage = '') { return request(`/api/invites/${userId}`, { method: 'POST', body: JSON.stringify({ project_id: projectId, invitation_message: invitationMessage }) }); }
export async function respondInvite(inviteId, action) { return request(`/api/invites/${inviteId}/respond`, { method: 'POST', body: JSON.stringify({ action }) }); }

// AI Recommendations fetch karne ki asli API
export async function getAiRecommendations(projectId) {
  return request(`/api/recommendations/${projectId}`);
}

// Asli invitation bhejne ki API (Tumhare existing invite system se mapped)
export async function sendTeamInvitation(projectId, userId) {
  return request(`/api/invites/${userId}`, { 
    method: 'POST', 
    body: JSON.stringify({ 
      project_id: projectId, 
      invitation_message: 'Hi! We have a skill gap in our team and your profile perfectly matches our requirements. Would you like to join us?' 
    }) 
  });
}