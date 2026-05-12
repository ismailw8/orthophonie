import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '',  // ← vide, le proxy Vite gère la redirection
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur request — ajoute le token JWT automatiquement
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur response — gère l'expiration du token
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(
                    '/api/auth/refresh',
                    {},
                    { headers: { 'Refresh-Token': refreshToken } }
                );

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return axiosInstance(originalRequest);
            } catch {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;