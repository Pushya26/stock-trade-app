import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/', // Adjust baseURL as needed
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Read from storage
    if (token) {
      config.headers.Authorization = `Token ${token}`; // Django REST expects `Token <token>`
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;