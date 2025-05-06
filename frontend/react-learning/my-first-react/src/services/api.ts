import axios from 'axios';

// 创建axios实例
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器：添加token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // 清除token并重定向到登录页
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 认证相关API
export const auth = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    register: async (email: string, password: string, username: string) => {
        const response = await api.post('/auth/register', { email, password, username });
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

// 视频相关API
export const videos = {
    // 获取视频列表
    getVideos: async (skip = 0, limit = 100) => {
        const response = await api.get(`/videos?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    // 上传视频
    uploadVideo: async (file: File, title: string, description?: string) => {
        const formData = new FormData();
        formData.append('video_file', file);
        formData.append('title', title);
        if (description) {
            formData.append('description', description);
        }

        const response = await api.post('/videos', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // 获取视频详情
    getVideo: async (videoId: string) => {
        const response = await api.get(`/videos/${videoId}`);
        return response.data;
    },

    // 删除视频
    deleteVideo: async (videoId: string) => {
        await api.delete(`/videos/${videoId}`);
    },

    // 获取视频台词
    getTranscripts: async (videoId: string, skip = 0, limit = 100) => {
        const response = await api.get(`/search/video/${videoId}/transcripts?skip=${skip}&limit=${limit}`);
        return response.data;
    },
};

// 搜索相关API
export const search = {
    // 搜索台词
    searchTranscripts: async (query: string, limit = 10, minConfidence = 0.5) => {
        const response = await api.post('/search', {
            query,
            limit,
            min_confidence: minConfidence,
        });
        return response.data;
    },
};

export default api; 