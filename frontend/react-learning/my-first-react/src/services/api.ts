import axios from 'axios';

// 创建axios实例
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API服务
const apiService = {
  // 认证相关
  auth: {
    login: async (username: string, password: string) => {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      const response = await apiClient.post('/api/v1/auth/login', formData);
      return response.data;
    },
    register: async (userData: any) => {
      const response = await apiClient.post('/api/v1/auth/register', userData);
      return response.data;
    },
  },
  
  // 视频相关
  videos: {
    getAll: async () => {
      const response = await apiClient.get('/api/v1/videos');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await apiClient.get(`/api/v1/videos/${id}`);
      return response.data;
    },
    upload: async (formData: FormData) => {
      const response = await apiClient.post('/api/v1/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/api/v1/videos/${id}`);
      return response.data;
    },
    search: async (query: string, limit = 10, page = 1) => {
      const response = await apiClient.get('/api/v1/videos/search', {
        params: {
          q: query,
          limit,
          page
        }
      });
      return response.data;
    },
    toggleBookmark: async (videoId: string) => {
      const response = await apiClient.post(`/api/v1/videos/${videoId}/bookmark`);
      return response.data;
    },
    getBookmarks: async () => {
      const response = await apiClient.get('/api/v1/videos/bookmarks');
      return response.data;
    },
    getTranscripts: async (videoId: string) => {
      const response = await apiClient.get(`/api/v1/videos/${videoId}/transcripts`);
      return response.data;
    },
    getRelated: async (videoId: string, limit = 5) => {
      const response = await apiClient.get(`/api/v1/videos/${videoId}/related`, {
        params: { limit }
      });
      return response.data;
    }
  },
  
  // 搜索相关
  search: {
    transcripts: async (query: string, limit = 10, minConfidence = 0.5, page = 1) => {
      const response = await apiClient.post('/api/v1/search/transcripts', {
        query,
        limit,
        min_confidence: minConfidence,
        page
      });
      return response.data;
    },
  },
};

export default apiService; 