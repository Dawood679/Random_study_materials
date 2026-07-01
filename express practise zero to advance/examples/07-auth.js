// ============================================================
//  07 - Authentication with JWT
//  Topics: JWT sign/verify, auth middleware, protected routes,
//          refresh tokens (concept), role-based access
// ============================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
app.use(express.json());

const JWT_SECRET = 'mysecretkey_change_in_production';
const JWT_EXPIRES_IN = '1h';

// Fake user store (use DB in real app)
const users = [];

// ── Helper: sign a token ──────────────────────────────────────
const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// ── 1. Register ───────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email, password required' });

  if (users.find((u) => u.email === email))
    return res.status(409).json({ error: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = { id: users.length + 1, name, email, password: hashedPassword, role };
  users.push(user);

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  res.status(201).json({
    message: 'Registered successfully',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// ── 2. Login ──────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  res.json({
    message: 'Logged in',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// ── 3. Auth Middleware ────────────────────────────────────────
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ── 4. Role-Based Access Control Middleware ───────────────────
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Role '${req.user.role}' is not allowed to access this route`,
    });
  }
  next();
};

// ── 5. Protected Routes ───────────────────────────────────────
app.get('/profile', protect, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.patch('/profile', protect, async (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.body.name) user.name = req.body.name;
  res.json({ message: 'Profile updated', user: { name: user.name, email: user.email } });
});

// Admin-only route
app.get('/admin/users', protect, restrictTo('admin'), (req, res) => {
  const safeUsers = users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// ── 6. Logout (client-side — token is stateless) ─────────────
// Real logout: maintain a token blacklist in Redis or similar
app.post('/auth/logout', protect, (req, res) => {
  res.json({ message: 'Logged out (delete the token on client side)' });
});

const PORT = 3007;
app.listen(PORT, () => {
  console.log(`\n[07-auth] Server running at http://localhost:${PORT}`);
  console.log('Flow:');
  console.log('  1. POST /auth/register  { name, email, password, role:"admin" }');
  console.log('  2. POST /auth/login     { email, password }');
  console.log('  3. GET  /profile        Header: Authorization: Bearer <token>');
  console.log('  4. GET  /admin/users    Header: Authorization: Bearer <admin-token>');
});
