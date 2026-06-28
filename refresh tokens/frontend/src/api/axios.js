import axios from 'axios';

// ── In-memory access token storage ───────────────────────────────────────────
// WHY memory? localStorage is readable by any JS on the page (XSS attack vector).
// Downside: lost on page refresh → we restore it by calling /api/auth/refresh
// on page load (the httpOnly cookie survives page refresh; in-memory token doesn't).
let accessToken = null;

export function setAccessToken(token) { accessToken = token; }
export function getAccessToken() { return accessToken; }
export function clearAccessToken() { accessToken = null; }

// ── Axios instance ────────────────────────────────────────────────────────────
// withCredentials: true → browser sends the httpOnly refreshToken cookie automatically
// Vite proxy routes /api/* to http://localhost:4000, so baseURL is just '/'
const api = axios.create({
  baseURL: '/',
  withCredentials: true,
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach "Authorization: Bearer <token>" to every outgoing request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401: silently call /api/auth/refresh, update in-memory token, retry original request
// failedQueue: if two requests get 401 simultaneously, only ONE refresh call is made.
// All queued requests are retried with the new token once refresh completes.
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Refresh already in-flight — queue this request and wait
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // httpOnly cookie is sent automatically (withCredentials: true)
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        setAccessToken(data.accessToken);
        processQueue(null, data.accessToken);

        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        // Refresh token is also invalid → force user to log in again
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
