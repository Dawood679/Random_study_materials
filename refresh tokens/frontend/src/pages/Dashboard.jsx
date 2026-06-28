import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [meData, setMeData] = useState(null);
  const [meError, setMeError] = useState('');
  const [meLoading, setMeLoading] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Demo: call GET /api/auth/me with the in-memory access token
  // The axios interceptor automatically attaches "Authorization: Bearer <token>"
  // If the token is expired, the interceptor silently refreshes it and retries
  async function callMeEndpoint() {
    setMeError('');
    setMeData(null);
    setMeLoading(true);
    try {
      const { data } = await api.get('/api/auth/me');
      setMeData(data.user);
    } catch (err) {
      setMeError(err.response?.data?.error || 'Request failed');
    } finally {
      setMeLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Protected page — requires valid access token</p>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>

        {/* User info from context */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Current User (from React state)</h2>
          <div style={styles.infoGrid}>
            <span style={styles.label}>ID</span>
            <span style={styles.value}>{user?.id}</span>
            <span style={styles.label}>Username</span>
            <span style={styles.value}>{user?.username}</span>
            <span style={styles.label}>Email</span>
            <span style={styles.value}>{user?.email}</span>
          </div>
        </div>

        {/* Demo: hit the protected /me endpoint */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Test Protected API Route</h2>
          <p style={styles.cardDesc}>
            Calls <code style={styles.code}>GET /api/auth/me</code> with your access token.
            If it's expired, the axios interceptor auto-refreshes it and retries — you won't notice.
          </p>
          <button style={styles.demoBtn} onClick={callMeEndpoint} disabled={meLoading}>
            {meLoading ? 'Calling...' : 'Call GET /api/auth/me'}
          </button>

          {meData && (
            <div style={styles.result}>
              <p style={styles.resultLabel}>Response from server:</p>
              <pre style={styles.pre}>{JSON.stringify(meData, null, 2)}</pre>
            </div>
          )}
          {meError && <p style={styles.error}>{meError}</p>}
        </div>

        {/* Concept notes */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>How it works</h2>
          <ul style={styles.list}>
            <li>Access token lives <strong>in memory</strong> (JS variable) — expires in 15 min</li>
            <li>Refresh token stored in <strong>httpOnly cookie</strong> — JS cannot read it</li>
            <li>Refresh token also saved in <strong>MongoDB</strong> so logout can revoke it</li>
            <li>On access token expiry → interceptor calls <code style={styles.code}>/api/auth/refresh</code> silently</li>
            <li>Refresh issues a <strong>new refresh token</strong> (rotation) and revokes the old one</li>
            <li>Page refresh → session restored from cookie via <code style={styles.code}>/api/auth/refresh</code> on mount</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', padding: '32px 16px' },
  container: { maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: '1.75rem', fontWeight: 700 },
  subtitle: { color: '#64748b', fontSize: '0.85rem', marginTop: 4 },
  logoutBtn: {
    padding: '8px 20px', borderRadius: 8, border: '1px solid #475569',
    background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.9rem',
  },
  card: { background: '#1e293b', borderRadius: 12, padding: 24 },
  cardTitle: { fontSize: '1rem', fontWeight: 600, marginBottom: 14, color: '#e2e8f0' },
  cardDesc: { color: '#94a3b8', fontSize: '0.9rem', marginBottom: 16, lineHeight: 1.5 },
  infoGrid: { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px' },
  label: { color: '#64748b', fontSize: '0.85rem' },
  value: { color: '#e2e8f0', fontSize: '0.85rem', wordBreak: 'break-all' },
  demoBtn: {
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
  },
  result: { marginTop: 16 },
  resultLabel: { color: '#94a3b8', fontSize: '0.8rem', marginBottom: 8 },
  pre: {
    background: '#0f172a', borderRadius: 8, padding: 16,
    color: '#a5f3fc', fontSize: '0.85rem', overflowX: 'auto',
  },
  error: { marginTop: 12, color: '#f87171', fontSize: '0.85rem' },
  code: {
    background: '#0f172a', padding: '2px 6px', borderRadius: 4,
    fontSize: '0.85rem', color: '#a5f3fc',
  },
  list: { paddingLeft: 20, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 2 },
};
