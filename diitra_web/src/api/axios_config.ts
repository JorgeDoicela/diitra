import axios from 'axios';

const api = axios.create({
    // En desarrollo, el proxy de Vite reenvía /api → http://localhost:5175/api
    // En producción, VITE_API_BASE_URL apunta al dominio real del backend.
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api', 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor profesional para manejo de errores globales
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el servidor responde con 401 (No autorizado) simplemente rechazamos.
        // El AuthContext y las rutas protegidas se encargarán de mandar al login.
        if (error.response?.status === 401) {
            console.warn('Sesión expirada o inválida');
        }
        return Promise.reject(error);
    }
);

export default api;
