import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token so AuthContext can redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const signup = (email, password, fullName = '', role = 'employee') =>
  api.post('/auth/signup', { email, password, full_name: fullName, role });

export const getMe = () => api.get('/auth/me');

// ─── Applications ─────────────────────────────────
export const getApplications = (skip = 0, limit = 20, status = null) => {
  const params = { skip, limit };
  if (status) params.status = status;
  return api.get('/applications', { params });
};

export const getApplication = (applicationId) =>
  api.get(`/applications/${applicationId}`);

export const deleteApplication = (applicationId) =>
  api.delete(`/applications/${applicationId}`);

// ─── Upload ────────────────────────────────────────
export const uploadFiles = (files, subject = '', sender = '') => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (sender) params.append('sender', sender);

  return api.post(`/upload?${params.toString()}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 min timeout for processing
  });
};

// ─── Documents & Pages ────────────────────────────
export const getDocuments = (applicationId) =>
  api.get(`/applications/${applicationId}/documents`);

export const getPages = (documentId) =>
  api.get(`/documents/${documentId}/pages`);

export const getDocumentPdfUrl = (documentId) =>
  `${API_BASE}/documents/${documentId}/pdf`;

// ─── Validation ────────────────────────────────────
export const getValidation = (applicationId) =>
  api.get(`/applications/${applicationId}/validation`);

// ─── Extracted Fields ──────────────────────────────
export const getExtractedFields = (applicationId) =>
  api.get(`/applications/${applicationId}/fields`);

// ─── Stats ─────────────────────────────────────────
export const getStats = () => api.get('/stats');

// ─── Email Inbox ────────────────────────────────────
export const getEmailInbox = () => api.get('/email-inbox');

// ─── Email Processing ──────────────────────────────
export const processEmails = () => api.post('/process-emails');

// ─── Chat ───────────────────────────────────────────
export const chatWithDocument = (applicationId, question) =>
  api.post(`/applications/${applicationId}/chat?question=${encodeURIComponent(question)}`);

export const updateExtractedField = (applicationId, category, field, value) =>
  api.patch(`/applications/${applicationId}/extracted-data`, { category, field, value });

export default api;
