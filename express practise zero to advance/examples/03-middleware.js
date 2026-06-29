// ============================================================
//  03 - Middleware
//  Topics: built-in middleware, custom middleware, third-party,
//          next(), order matters, route-level middleware
// ============================================================

const express = require('express');
const app = express();

// ── 1. Built-in Middleware ─────────────────────────────────────
app.use(express.json());                            // parse JSON body
app.use(express.urlencoded({ extended: true }));    // parse form data
app.use(express.static('public'));                  // serve static files

// ── 2. Custom Application-Level Middleware ────────────────────
// Runs on every request
const requestLogger = (req, res, next) => {
  const start = Date.now();
  console.log(`→ ${req.method} ${req.url}`);

  // Hook into res.send to log response time
  const originalSend = res.send.bind(res);
  res.send = (...args) => {
    console.log(`← ${res.statusCode} [${Date.now() - start}ms]`);
    return originalSend(...args);
  };

  next(); // MUST call next() or the request will hang
};

app.use(requestLogger);

// ── 3. Middleware that modifies req ───────────────────────────
const addRequestId = (req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  next();
};

app.use(addRequestId);

// ── 4. Route-Level Middleware ─────────────────────────────────
// Only runs for specific routes — NOT app.use()
const checkAdmin = (req, res, next) => {
  const role = req.headers['x-role'];
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admins only' });
  }
  next();
};

// Multiple middlewares on a single route
app.get('/admin/dashboard', checkAdmin, (req, res) => {
  res.json({
    message: 'Welcome admin!',
    requestId: req.requestId,
  });
});

// ── 5. Middleware Array ───────────────────────────────────────
const validateBody = (req, res, next) => {
  if (!req.body.name) return res.status(400).json({ error: 'name is required' });
  next();
};

const sanitizeName = (req, res, next) => {
  req.body.name = req.body.name.trim().toLowerCase();
  next();
};

app.post('/register', [validateBody, sanitizeName], (req, res) => {
  res.json({ created: req.body.name });
});

// ── 6. Third-Party Middleware (morgan logger) ─────────────────
// In real projects: const morgan = require('morgan'); app.use(morgan('dev'));
// We simulate it here:
const fakemorgan = (req, res, next) => {
  console.log(`[morgan] ${req.method} ${req.url} ${new Date().toISOString()}`);
  next();
};
// app.use(fakemorgan); // uncomment to see morgan-style logs

// ── 7. Conditional Middleware ─────────────────────────────────
const maintenanceMode = false;

app.use((req, res, next) => {
  if (maintenanceMode) {
    return res.status(503).json({ error: 'Down for maintenance' });
  }
  next();
});

// ── Test Routes ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Hello!', requestId: req.requestId });
});

app.get('/info', (req, res) => {
  res.json({
    method: req.method,
    url: req.url,
    headers: req.headers,
    requestId: req.requestId,
  });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`\n[03-middleware] Server running at http://localhost:${PORT}`);
  console.log('Try:');
  console.log('  GET  http://localhost:3003/');
  console.log('  GET  http://localhost:3003/admin/dashboard   (set header x-role: admin)');
  console.log('  POST http://localhost:3003/register          (body: { "name": " Alice " })');
});
