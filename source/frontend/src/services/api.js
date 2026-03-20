import axios from 'axios';

const IDENTITY_URL = process.env.REACT_APP_IDENTITY_URL || 'http://localhost:8081';
const ORG_URL = process.env.REACT_APP_ORG_URL || 'http://localhost:8082';
const LEAVE_URL = process.env.REACT_APP_LEAVE_URL || 'http://localhost:8083';
const RECRUIT_URL = process.env.REACT_APP_RECRUIT_URL || 'http://localhost:8084';

const createAxios = (baseURL) => {
  const instance = axios.create({ baseURL });
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};

export const identityApi = createAxios(IDENTITY_URL);
export const orgApi = createAxios(ORG_URL);
export const leaveApi = createAxios(LEAVE_URL);
export const recruitApi = createAxios(RECRUIT_URL);

// ─── Auth ─────────────────────────────────────────────────────────
export const authService = {
  login: (username, password) =>
    identityApi.post('/api/auth/login', { username, password }),
  register: (data) =>
    identityApi.post('/api/auth/register', data),
  getMe: () =>
    identityApi.get('/api/auth/me'),
};

// ─── Organization ─────────────────────────────────────────────────
export const orgService = {
  getStaff: () => orgApi.get('/api/staff'),
  getStaffById: (id) => orgApi.get(`/api/staff/${id}`),
  createStaff: (data) => orgApi.post('/api/staff', data),
  updateStaff: (id, data) => orgApi.put(`/api/staff/${id}`, data),
  deleteStaff: (id) => orgApi.delete(`/api/staff/${id}`),
  getOrgChart: () => orgApi.get('/api/org-chart'),
  getOrgChartFlat: () => orgApi.get('/api/org-chart/flat'),
  getDashboardStats: () => orgApi.get('/api/dashboard/stats'),
};

// ─── Leave ────────────────────────────────────────────────────────
export const leaveService = {
  requestLeave: (staffId, days) =>
    leaveApi.post('/api/leave/request', { staffId, days }),
  getLeavesByStaff: (staffId) =>
    leaveApi.get(`/api/leave/${staffId}`),
  getAllLeaves: () =>
    leaveApi.get('/api/leave'),
  getLeaveBalance: (staffId) =>
    leaveApi.get(`/api/leave/balance/${staffId}`),
};

// ─── Recruitment ──────────────────────────────────────────────────
export const recruitService = {
  getCandidates: () => recruitApi.get('/api/candidates'),
  getCandidateById: (id) => recruitApi.get(`/api/candidates/${id}`),
  createCandidate: (data) => recruitApi.post('/api/candidates', data),
  updateCandidate: (id, data) => recruitApi.put(`/api/candidates/${id}`, data),
  updateStatus: (id, status) =>
    recruitApi.patch(`/api/candidates/${id}/status?status=${status}`),
  deleteCandidate: (id) => recruitApi.delete(`/api/candidates/${id}`),
  searchCandidates: (params) =>
    recruitApi.get('/api/candidates/search', { params }),
};
