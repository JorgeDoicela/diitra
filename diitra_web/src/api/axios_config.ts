import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175/api', 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor profesional para manejo de errores globales
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el servidor responde con 401 (No autorizado)
        if (error.response?.status === 401) {
            const currentPath = window.location.pathname;
            
            // No redirigir si ya estamos en login o si es el chequeo inicial de /me
            if (currentPath !== '/' && !error.config.url?.includes('/auth/me')) {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
