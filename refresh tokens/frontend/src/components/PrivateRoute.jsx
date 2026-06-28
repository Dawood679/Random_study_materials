import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wait for auth check to finish before deciding to redirect.
// Without this, the page flickers to /login on every refresh before the
// session is restored from the refresh token cookie.
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.center}>
        <p style={styles.text}>Checking authentication...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

const styles = {
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  text: { color: '#94a3b8', fontSize: '1rem' },
};
