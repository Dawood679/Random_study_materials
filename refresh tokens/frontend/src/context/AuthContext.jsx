import { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken, clearAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading: true while we check if the user has a valid session on page load
  // PrivateRoute waits for this to be false before deciding to redirect
  const [loading, setLoading] = useState(true);

  // On every page load/refresh: try to restore the session silently.
  // The httpOnly refresh token cookie persists across page refreshes.
  // The in-memory access token does NOT — so we call /refresh to get a fresh one.
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data } = await api.post('/api/auth/refresh');
        setAccessToken(data.accessToken);
        const meRes = await api.get('/api/auth/me');
        setUser(meRes.data.user);
      } catch {
        // No valid refresh token cookie → user is not logged in
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }

  async function register(username, email, password) {
    const { data } = await api.post('/api/auth/register', { username, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout');
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
