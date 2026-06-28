import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign In</h1>
        <p style={styles.subtitle}>Access token (15m) + Refresh token (7d)</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="ali@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.link}>
          No account?{' '}
          <Link to="/register" style={styles.linkA}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  card: { background: '#1e293b', borderRadius: 12, padding: 32, width: '100%', maxWidth: 400 },
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 },
  subtitle: { color: '#64748b', fontSize: '0.8rem', marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: '0.85rem', color: '#94a3b8' },
  input: {
    padding: '10px 14px', borderRadius: 8, border: '1px solid #334155',
    background: '#0f172a', color: '#e2e8f0', fontSize: '0.95rem',
    outline: 'none',
  },
  error: { color: '#f87171', fontSize: '0.85rem' },
  button: {
    marginTop: 8, padding: '11px 0', borderRadius: 8, border: 'none',
    background: '#6366f1', color: '#fff', fontSize: '1rem', fontWeight: 600,
    cursor: 'pointer',
  },
  link: { marginTop: 20, textAlign: 'center', color: '#64748b', fontSize: '0.9rem' },
  linkA: { color: '#818cf8' },
};
