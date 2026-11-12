import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach language header
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const lang = localStorage.getItem('nyayasaathi_lang') || 'en'
  config.headers['Accept-Language'] = lang

  const sessionId = sessionStorage.getItem('nyayasaathi_session_id')
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId
  }

  return config
})

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const data = error.response.data as { message?: string }
      const message = data?.message || 'An error occurred. Please try again.'
      return Promise.reject(new Error(message))
    } else if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'))
    }
    return Promise.reject(error)
  }
)

export default apiClient
