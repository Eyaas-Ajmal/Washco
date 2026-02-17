import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // For cookies
});

// Token storage
let accessToken = localStorage.getItem('accessToken');

// Request interceptor - attach token
client.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Check if token expired
            if (error.response?.data?.code === 'TOKEN_EXPIRED') {
                originalRequest._retry = true;

                try {
                    // Try to refresh
                    const { data } = await axios.post(
                        `${API_BASE}/auth/refresh`,
                        {},
                        { withCredentials: true }
                    );

                    // Store new token
                    accessToken = data.data.accessToken;
                    localStorage.setItem('accessToken', accessToken);

                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return client(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear token and redirect to login
                    accessToken = null;
                    localStorage.removeItem('accessToken');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

// Token management
export const setToken = (token) => {
    accessToken = token;
    localStorage.setItem('accessToken', token);
};

export const clearToken = () => {
    accessToken = null;
    localStorage.removeItem('accessToken');
};

export const getToken = () => accessToken;

export default client;
