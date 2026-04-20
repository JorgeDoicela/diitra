import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // La URL de tu .NET API
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
