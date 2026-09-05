const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.detail || detail;
    } catch (e) {
      /* non-JSON error body, fall back to statusText */
    }
    throw new Error(detail);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  register: (email, password, studentName) =>
    request('/auth/register', { method: 'POST', body: { email, password, student_name: studentName } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  demoLogin: () => request('/auth/demo', { method: 'POST' }),
  me: (token) => request('/auth/me', { token }),

  dashboard: (token) => request('/api/dashboard', { token }),
  graph: (token) => request('/api/graph', { token }),

  quizGenerate: (token, topic, difficulty, count) =>
    request('/api/quiz/generate', { method: 'POST', token, body: { topic, difficulty, count } }),
  quizSubmit: (token, answers) => request('/api/quiz/submit', { method: 'POST', token, body: { answers } }),

  careerMatches: (token) => request('/api/career/matches', { token }),
  setCareerGoal: (token, careerId) => request('/api/career/goal', { method: 'POST', token, body: { career_id: careerId } }),

  roadmap: (token) => request('/api/roadmap', { token }),

  tutorAsk: (token, message) => request('/api/tutor/ask', { method: 'POST', token, body: { message } }),
  tutorHistory: (token) => request('/api/tutor/history', { token }),
};
