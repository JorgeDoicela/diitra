import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5175/api', 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
