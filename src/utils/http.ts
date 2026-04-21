import axios, { AxiosResponse } from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

const http = axios.create({
  baseURL: `${API_BASE_URL}/api/educine`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token if available
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('counselorToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('counselorToken')
      localStorage.removeItem('counselorInfo')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default http
