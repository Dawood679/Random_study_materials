// ============================================================
//  09 - Advanced Topics
//  Topics: CORS, Helmet, Rate Limiting, Compression,
//          Cookie Parser, Server-Sent Events, request timeout,
//          graceful shutdown, environment config
// ============================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const http = require('http');

const app = express();

// ── 1. Helmet — sets secure HTTP headers ──────────────────────
app.use(helmet());
// Helmet sets headers like: Content-Security-Policy, X-Frame-Options,
// X-XSS-Protection, Strict-Transport-Security, etc.

// ── 2. CORS — Cross-Origin Resource Sharing ───────────────────
const allowedOrigins = ['http://localhost:5173', 'https://myapp.com'];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: Origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // allow cookies to be sent cross-origin
    maxAge: 86400,      // preflight cache: 24h
  })
);

// Enable pre-flight for all routes
app.options('*', cors());

// ── 3. Rate Limiting ──────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                   // max 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                    // max 10 login attempts per hour per IP
  message: { error: 'Too many login attempts. Try again in an hour.' },
  skipSuccessfulRequests: true,
});

app.use(globalLimiter);
app.use('/auth', authLimiter);

// ── 4. Compression ────────────────────────────────────────────
// Compresses responses with gzip/deflate — reduces bandwidth
app.use(
  compression({
    level: 6,    // 0 = off, 9 = max compression (slower)
    threshold: 1024, // only compress responses > 1KB
  })
);

// ── 5. Cookie Parser ──────────────────────────────────────────
app.use(cookieParser('cookie_secret_key')); // secret for signed cookies

app.use(express.json());

// ── 6. Cookie Routes ──────────────────────────────────────────
app.post('/set-cookie', (req, res) => {
  // Regular cookie
  res.cookie('username', 'Alice', {
    maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
    httpOnly: true,  // not accessible via JS
    secure: false,   // true in production (HTTPS only)
    sameSite: 'lax', // CSRF protection
  });

  // Signed cookie (tamper-proof)
  res.cookie('session', 'abc123', { signed: true, httpOnly: true });

  res.json({ message: 'Cookies set' });
});

app.get('/read-cookie', (req, res) => {
  res.json({
    regular: req.cookies,          // all regular cookies
    signed: req.signedCookies,     // all signed cookies (verified)
  });
});

app.post('/clear-cookie', (req, res) => {
  res.clearCookie('username');
  res.clearCookie('session');
  res.json({ message: 'Cookies cleared' });
});

// ── 7. Server-Sent Events (SSE) ───────────────────────────────
// One-way real-time push from server to client (no WebSocket needed)
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let count = 0;
  const interval = setInterval(() => {
    count++;
    res.write(`data: ${JSON.stringify({ count, time: new Date().toISOString() })}\n\n`);

    if (count >= 5) {
      res.write('event: done\ndata: Stream ended\n\n');
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  req.on('close', () => clearInterval(interval));
});

// ── 8. Request Timeout ────────────────────────────────────────
const timeoutMiddleware = (ms) => (req, res, next) => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  }, ms);
  res.on('finish', () => clearTimeout(timer));
  next();
};

app.use(timeoutMiddleware(10_000)); // 10 second global timeout

// ── 9. Test Routes ────────────────────────────────────────────
app.get('/', (req, res) => {
  const large = 'x'.repeat(5000); // test compression
  res.json({ message: 'Advanced Express demo', data: large });
});

app.post('/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint (rate limited to 10/hr)' });
});

// ── 10. Graceful Shutdown ─────────────────────────────────────
const server = http.createServer(app);

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('All connections closed. Exiting.');
    process.exit(0);
  });

  // Force shutdown after 10s if connections are stuck
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

const PORT = 3009;
server.listen(PORT, () => {
  console.log(`\n[09-advanced] Server running at http://localhost:${PORT}`);
  console.log('Features active: Helmet, CORS, Rate Limiting, Compression, Cookies, SSE');
  console.log('Routes:');
  console.log('  GET  http://localhost:3009/         (compression test)');
  console.log('  GET  http://localhost:3009/events   (SSE — open in browser)');
  console.log('  POST http://localhost:3009/set-cookie');
  console.log('  GET  http://localhost:3009/read-cookie');
  console.log('  POST http://localhost:3009/auth/login  (rate limited)');
});
