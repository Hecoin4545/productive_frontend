import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arcstep_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('arcstep_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard
export const getDashboardData = () => api.get('/dashboard/overview');

// Learning Paths
export const getLearningPaths = () => api.get('/learning-paths');
export const getLearningPath = (id) => api.get(`/learning-paths/${id}`);
export const createLearningPath = (data) => api.post('/learning-paths', data);
export const updateLearningPath = (id, data) => api.put(`/learning-paths/${id}`, data);
export const deleteLearningPath = (id) => api.delete(`/learning-paths/${id}`);

// Todos
export const getTodos = (params) => api.get('/todos', { params });
export const createTodo = (data) => api.post('/todos', data);
export const updateTodo = (id, data) => api.put(`/todos/${id}`, data);
export const deleteTodo = (id) => api.delete(`/todos/${id}`);

// Goals
export const getGoals = (params) => api.get('/goals', { params });
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

// Study Sessions
export const getStudySessions = (params) => api.get('/study-sessions', { params });
export const createStudySession = (data) => api.post('/study-sessions', data);
export const updateStudySession = (id, data) => api.put(`/study-sessions/${id}`, data);
export const deleteStudySession = (id) => api.delete(`/study-sessions/${id}`);
export const getStudySessionStats = (params) => api.get('/study-sessions/stats/summary', { params });
export const getWeeklyStats = () => api.get('/study-sessions/stats/weekly');

// Journals
export const getJournals = (params) => api.get('/journals', { params });
export const getJournalByDate = (date) => api.get(`/journals/date/${date}`);
export const createJournal = (data) => api.post('/journals', data);
export const updateJournal = (id, data) => api.put(`/journals/${id}`, data);
export const patchJournal = (id, data) => api.patch(`/journals/${id}`, data);
export const deleteJournal = (id) => api.delete(`/journals/${id}`);

// User
export const getProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.put('/users/profile', data);

// Analytics
export const getAnalyticsOverview = (params) => api.get('/analytics/overview', { params });
export const getAnalyticsStudyTime = (params) => api.get('/analytics/study-time', { params });
export const getAnalyticsStudyTrend = (params) => api.get('/analytics/study-trend', { params });
export const getAnalyticsSubjects = (params) => api.get('/analytics/subjects', { params });
export const getAnalyticsLearningPaths = (params) => api.get('/analytics/learning-paths', { params });
export const getAnalyticsTopics = (params) => api.get('/analytics/topics', { params });
export const getAnalyticsTodos = (params) => api.get('/analytics/todos', { params });
export const getAnalyticsGoals = (params) => api.get('/analytics/goals', { params });
export const getAnalyticsHeatmap = (params) => api.get('/analytics/heatmap', { params });
export const getAnalyticsHabits = (params) => api.get('/analytics/habits', { params });
export const getAnalyticsJournal = (params) => api.get('/analytics/journal', { params });
export const getAnalyticsRecentActivity = (params) => api.get('/analytics/recent-activity', { params });
export const exportAnalytics = (params) => api.get('/analytics/export', { params, responseType: params?.format === 'csv' ? 'blob' : 'json' });

export default api;
