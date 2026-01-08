import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Só limpar sessão se for erro de token inválido/expirado explícito
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || '';

            // Só redirecionar se for explicitamente um problema de token/autenticação
            const isTokenError = (status === 401 || status === 403) &&
                (message.includes('Token') || message.includes('token') ||
                    message.includes('ausente') || message.includes('inválido') ||
                    message.includes('expirado'));

            if (isTokenError) {
                console.warn('🔒 Sessão expirada ou token inválido, redirecionando...');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
