# Express.js — Zero to Advanced

A complete, runnable practice project covering every Express.js concept from scratch to production-ready patterns.

---

## Quick Start

```bash
npm install
cp .env.example .env
npm start          # starts the full MVC server on port 3000
```

Or run individual concept examples:

```bash
npm run example:basics
npm run example:routing
npm run example:middleware
npm run example:rest-api
npm run example:error-handling
npm run example:validation
npm run example:auth
npm run example:file-upload
npm run example:advanced
```

Or with Docker:

```bash
docker compose up
```

---

## Table of Contents

1. [What is Express?](#1-what-is-express)
2. [Installation & Hello World](#2-installation--hello-world)
3. [HTTP Methods & Responses](#3-http-methods--responses)
4. [Routing](#4-routing)
5. [Middleware](#5-middleware)
6. [Request Object (req)](#6-request-object-req)
7. [Response Object (res)](#7-response-object-res)
8. [Express Router](#8-express-router)
9. [REST API — Full CRUD](#9-rest-api--full-crud)
10. [Error Handling](#10-error-handling)
11. [Validation](#11-validation)
12. [Authentication with JWT](#12-authentication-with-jwt)
13. [File Uploads with Multer](#13-file-uploads-with-multer)
14. [CORS](#14-cors)
15. [Security with Helmet](#15-security-with-helmet)
16. [Rate Limiting](#16-rate-limiting)
17. [Cookies](#17-cookies)
18. [Compression](#18-compression)
19. [Server-Sent Events (SSE)](#19-server-sent-events-sse)
20. [MVC Structure](#20-mvc-structure)
21. [Environment Variables](#21-environment-variables)
22. [Graceful Shutdown](#22-graceful-shutdown)
23. [Common Status Codes](#23-common-status-codes)
24. [Best Practices Checklist](#24-best-practices-checklist)

---

## 1. What is Express?

Express is a **minimal, unopinionated web framework for Node.js**. It wraps Node's built-in `http` module and adds:

- Simple, chainable routing
- Middleware pipeline
- Request/response helpers
- Router for modular code organization

```
Client → HTTP request → Express App → Middleware chain → Route handler → Response
```

---

## 2. Installation & Hello World

```bash
npm init -y
npm install express
```

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(3000, () => console.log('Server on http://localhost:3000'));
```

**The 3 things every Express app needs:**
1. `express()` — create the app
2. Routes or middleware — define behavior
3. `app.listen()` — start the server

---

## 3. HTTP Methods & Responses

```js
app.get('/resource',    handler);   // Read
app.post('/resource',   handler);   // Create
app.put('/resource',    handler);   // Full Replace
app.patch('/resource',  handler);   // Partial Update
app.delete('/resource', handler);   // Delete
app.all('/resource',    handler);   // All methods
```

### Sending Responses

```js
res.send('text');                         // text/html
res.json({ key: 'value' });               // application/json
res.status(201).json({ created: true });  // with status code
res.sendFile('/absolute/path/file.html'); // file
res.download('/path/to/file.pdf');        // force download
res.redirect(301, '/new-path');           // redirect
res.status(204).send();                   // no content
```

---

## 4. Routing

### Basic Routes

```js
app.get('/users', (req, res) => { ... });
app.post('/users', (req, res) => { ... });
```

### Route Parameters

```js
// Named params → req.params
app.get('/users/:id', (req, res) => {
  console.log(req.params.id); // '42'
});

// Multiple params
app.get('/users/:userId/posts/:postId', (req, res) => {
  console.log(req.params); // { userId: '1', postId: '5' }
});

// Optional param
app.get('/products/:category/:subcategory?', (req, res) => {
  // subcategory may be undefined
});
```

### Query Strings

```js
// GET /search?q=express&page=2&limit=10
app.get('/search', (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  // q = 'express', page = '2' (always string!)
});
```

### Route Chaining

```js
app.route('/articles')
  .get((req, res) => res.json({ action: 'list' }))
  .post((req, res) => res.json({ action: 'create' }));

app.route('/articles/:id')
  .get(handler)
  .put(handler)
  .delete(handler);
```

---

## 5. Middleware

Middleware = a function that runs **between** request and response.

```
Request → middleware1 → middleware2 → Route Handler → Response
```

```js
// Signature: (req, res, next) => void
const myMiddleware = (req, res, next) => {
  console.log('Running middleware...');
  // MUST call next() or the request hangs forever
  next();
};
```

### Types of Middleware

```js
// 1. Application-level — runs on every request
app.use(myMiddleware);

// 2. Route-level — runs only for specific route
app.get('/admin', checkAdmin, handler);

// 3. Router-level — on an Express Router
router.use(myMiddleware);

// 4. Error-handling — 4 params, must be last
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// 5. Built-in
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
```

### Middleware Order Matters

```js
app.use(logger);       // 1st — logs every request
app.use(authCheck);    // 2nd — checks auth
app.get('/', handler); // 3rd — only reached if auth passes
app.use(errorHandler); // LAST — catches errors from above
```

### Multiple Middleware on One Route

```js
app.post('/register',
  validateBody,     // middleware 1
  sanitizeInput,    // middleware 2
  createUser        // route handler
);

// Or as array
app.post('/register', [validateBody, sanitizeInput], createUser);
```

---

## 6. Request Object (req)

```js
req.params        // route params:   { id: '42' }
req.query         // query string:   { page: '2', limit: '10' }
req.body          // request body:   { name: 'Alice' }  (needs express.json())
req.headers       // HTTP headers:   { authorization: 'Bearer ...' }
req.cookies       // cookies:        { session: 'abc' }  (needs cookie-parser)
req.method        // 'GET', 'POST', etc.
req.path          // '/api/users'
req.url           // '/api/users?page=1'
req.ip            // client IP
req.hostname      // 'localhost'
req.protocol      // 'http' or 'https'
req.secure        // true if HTTPS
req.get('header') // get a specific header
```

---

## 7. Response Object (res)

```js
res.status(404)                   // set status code
res.set('X-Custom', 'value')      // set header
res.json({ ok: true })            // send JSON
res.send('hello')                 // send text/html
res.end()                         // end without body
res.redirect('/new-url')          // redirect
res.sendFile('/path/file.html')   // send file
res.download('/path/file.pdf')    // force download
res.cookie('name', 'value', {})   // set cookie
res.clearCookie('name')           // clear cookie
res.headersSent                   // boolean — already responded?
```

---

## 8. Express Router

Use `Router` to split routes into separate files — keeps `app.js` clean.

```js
// routes/user.routes.js
const router = require('express').Router();

router.get('/', getAllUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
```

```js
// app.js
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);
// Now: GET /api/users, POST /api/users, GET /api/users/:id ...
```

---

## 9. REST API — Full CRUD

```
GET    /api/users          → list all
GET    /api/users/:id      → get one
POST   /api/users          → create
PUT    /api/users/:id      → full replace
PATCH  /api/users/:id      → partial update
DELETE /api/users/:id      → delete
```

```js
// CREATE
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: 'name and email required' });

  const newUser = { id: ++nextId, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
});

// READ ALL (with pagination)
app.get('/api/users', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const start = (page - 1) * limit;
  res.json({ data: users.slice(start, start + +limit), total: users.length });
});

// READ ONE
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === +req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// FULL UPDATE
app.put('/api/users/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  users[idx] = { id: users[idx].id, ...req.body };
  res.json(users[idx]);
});

// PARTIAL UPDATE
app.patch('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === +req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  Object.assign(user, req.body);
  res.json(user);
});

// DELETE
app.delete('/api/users/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  users.splice(idx, 1);
  res.status(204).send();
});
```

---

## 10. Error Handling

### Custom Error Class

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

### Throwing Errors

```js
// In a route — sync
app.get('/item/:id', (req, res, next) => {
  const item = find(req.params.id);
  if (!item) return next(new AppError('Not found', 404));
  res.json(item);
});

// In a route — async (always use try/catch and call next)
app.get('/item/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
});
```

### asyncHandler Wrapper (removes try/catch boilerplate)

```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/items/:id', asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id); // throws → caught by wrapper
  res.json(item);
}));
```

### Global Error Middleware (must have 4 params)

```js
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Internal server error',
  });
});
```

### 404 Handler (before error middleware)

```js
app.all('*', (req, res, next) => {
  next(new AppError(`${req.method} ${req.path} not found`, 404));
});
```

---

## 11. Validation

### express-validator

```bash
npm install express-validator
```

```js
const { body, param, query, validationResult } = require('express-validator');

// Middleware to extract errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });
  next();
};

app.post('/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Min 2 chars').escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Min 8 chars'),
    body('age').optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  (req, res) => {
    res.status(201).json({ user: req.body });
  }
);

// Validate route params
app.get('/users/:id',
  param('id').isInt({ min: 1 }).toInt(),
  validate,
  handler
);

// Custom validator
body('confirmPassword').custom((val, { req }) => {
  if (val !== req.body.password) throw new Error('Passwords do not match');
  return true;
});
```

---

## 12. Authentication with JWT

```bash
npm install jsonwebtoken bcryptjs
```

```js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SECRET = process.env.JWT_SECRET;

// Sign token
const signToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: '7d' });

// Register
app.post('/auth/register', async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({ ...req.body, password: hashed });
  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({ token, user });
});

// Login
app.post('/auth/login', async (req, res) => {
  const user = await User.findByEmail(req.body.email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ token: signToken({ id: user.id, role: user.role }) });
});

// Auth middleware
const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token' });

  try {
    req.user = jwt.verify(auth.split(' ')[1], SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Access denied' });
  next();
};

// Protected route
app.get('/profile', protect, (req, res) => res.json(req.user));

// Admin only
app.get('/admin', protect, restrictTo('admin'), handler);
```

---

## 13. File Uploads with Multer

```bash
npm install multer
```

```js
const multer = require('multer');
const path = require('path');

// Disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter
const imageOnly = (req, file, cb) => {
  ['image/jpeg', 'image/png'].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Images only'), false);
};

const upload = multer({
  storage,
  fileFilter: imageOnly,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Single file
app.post('/upload/avatar', upload.single('avatar'), (req, res) => {
  res.json({ file: req.file });
});

// Multiple files (max 5)
app.post('/upload/photos', upload.array('photos', 5), (req, res) => {
  res.json({ files: req.files });
});

// Mixed fields
app.post('/upload/mixed',
  upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'docs', maxCount: 3 }]),
  (req, res) => res.json(req.files)
);

// Memory storage (for processing, not saving)
const uploadMem = multer({ storage: multer.memoryStorage() });
app.post('/upload/buffer', uploadMem.single('file'), (req, res) => {
  // req.file.buffer is a Buffer
  res.json({ size: req.file.buffer.length });
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError)
    return res.status(400).json({ error: err.message });
  next(err);
});
```

---

## 14. CORS

```bash
npm install cors
```

```js
const cors = require('cors');

// Allow all origins (development only)
app.use(cors());

// Specific origins
app.use(cors({
  origin: ['http://localhost:5173', 'https://myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,   // allow cookies
  maxAge: 86400,        // cache preflight 24h
}));

// Dynamic origin check
app.use(cors({
  origin: (origin, cb) => {
    const allowed = ['https://myapp.com'];
    if (!origin || allowed.includes(origin)) cb(null, true);
    else cb(new Error('CORS not allowed'));
  },
}));

// Enable preflight for all routes
app.options('*', cors());
```

---

## 15. Security with Helmet

```bash
npm install helmet
```

```js
const helmet = require('helmet');
app.use(helmet()); // sets ~15 security headers automatically
```

**What Helmet sets:**
| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Prevents XSS |
| `X-Frame-Options` | Prevents clickjacking |
| `X-XSS-Protection` | Legacy XSS filter |
| `Strict-Transport-Security` | Enforces HTTPS |
| `X-Content-Type-Options` | Prevents MIME sniffing |
| `Referrer-Policy` | Controls referrer info |

---

## 16. Rate Limiting

```bash
npm install express-rate-limit
```

```js
const rateLimit = require('express-rate-limit');

// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window per IP
  standardHeaders: true,
  message: { error: 'Too many requests' },
});
app.use(globalLimiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10,
  skipSuccessfulRequests: true,
});
app.use('/api/auth', authLimiter);
```

---

## 17. Cookies

```bash
npm install cookie-parser
```

```js
const cookieParser = require('cookie-parser');
app.use(cookieParser('secret_for_signed_cookies'));

// Set cookie
app.post('/login', (req, res) => {
  res.cookie('session', 'token123', {
    httpOnly: true,       // not readable by browser JS
    secure: true,         // HTTPS only
    sameSite: 'strict',   // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  res.json({ ok: true });
});

// Read cookies
app.get('/profile', (req, res) => {
  console.log(req.cookies);       // regular cookies
  console.log(req.signedCookies); // signed cookies (verified)
});

// Clear cookie
app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ ok: true });
});
```

---

## 18. Compression

```bash
npm install compression
```

```js
const compression = require('compression');

app.use(compression({
  level: 6,          // 0 = off, 9 = max (default: 6)
  threshold: 1024,   // only compress responses > 1 KB
}));
```

Reduces response size by up to 70% for JSON and HTML payloads.

---

## 19. Server-Sent Events (SSE)

Real-time one-way push from server to client — no WebSocket needed.

```js
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data, event = 'message') => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send an event every second
  const interval = setInterval(() => {
    send({ time: new Date().toISOString(), count: ++n });
  }, 1000);

  // Clean up when client disconnects
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});
```

```js
// Client (browser)
const es = new EventSource('/events');
es.onmessage = (e) => console.log(JSON.parse(e.data));
es.close(); // stop listening
```

---

## 20. MVC Structure

```
src/
├── app.js                  # Express app setup (middleware, routes, error handlers)
├── server.js               # Start HTTP server
├── routes/
│   ├── auth.routes.js
│   └── user.routes.js
├── controllers/
│   ├── auth.controller.js
│   └── user.controller.js
├── models/
│   └── user.model.js
├── middleware/
│   ├── auth.js             # JWT protect + restrictTo
│   └── errorHandler.js     # Global error middleware
└── utils/
    ├── AppError.js         # Custom error class
    └── asyncHandler.js     # Wraps async route handlers
```

**Flow:**
```
Request → app.js middleware → router → controller → model → controller → response
```

---

## 21. Environment Variables

```bash
npm install dotenv
```

```
# .env
PORT=3000
NODE_ENV=development
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

```js
// Load at the very top of server.js (before anything else)
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;
```

**Never commit `.env` — commit `.env.example` instead.**

---

## 22. Graceful Shutdown

```js
const server = require('http').createServer(app);
server.listen(3000);

const shutdown = (signal) => {
  console.log(`${signal} received — shutting down`);
  server.close(() => {
    // Close DB connections here
    process.exit(0);
  });
  // Force kill after 10 seconds
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker / cloud
process.on('SIGINT',  () => shutdown('SIGINT'));  // Ctrl+C

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});
```

---

## 23. Common Status Codes

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Successful GET / PATCH / PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 301 | Moved Permanently | URL changed forever |
| 302 | Found | Temporary redirect |
| 400 | Bad Request | Missing/invalid input |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Logged in but no permission |
| 404 | Not Found | Resource doesn't exist |
| 408 | Request Timeout | Client too slow |
| 409 | Conflict | Duplicate resource (e.g. email exists) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server crash |
| 503 | Service Unavailable | Maintenance / overloaded |

---

## 24. Best Practices Checklist

- [ ] Use `helmet()` for security headers
- [ ] Use `cors()` with a specific `origin` whitelist
- [ ] Apply rate limiting on all routes — stricter on `/auth`
- [ ] Always parse bodies with `express.json({ limit: '10kb' })`
- [ ] Validate all input at the boundary (express-validator or Zod)
- [ ] Hash passwords with `bcrypt` (salt rounds >= 12)
- [ ] Store secrets in `.env`, never in code
- [ ] Use a custom `AppError` class and global error middleware
- [ ] Wrap async handlers with `asyncHandler()` to avoid uncaught rejections
- [ ] Return meaningful HTTP status codes
- [ ] Never leak stack traces in production responses
- [ ] Set up graceful shutdown for `SIGTERM` / `SIGINT`
- [ ] Use `compression()` to reduce bandwidth
- [ ] Serve static files with `express.static()` (or a CDN in production)
- [ ] Use `morgan` for request logging (only in dev, or structured in prod)

---

## Project Structure (this repo)

```
.
├── examples/
│   ├── 01-basics.js          # Hello World, HTTP methods, responses
│   ├── 02-routing.js         # Params, query strings, Router, chaining
│   ├── 03-middleware.js      # Custom, built-in, route-level middleware
│   ├── 04-rest-api.js        # Full CRUD with pagination
│   ├── 05-error-handling.js  # AppError, asyncHandler, global handler
│   ├── 06-validation.js      # express-validator, custom validators
│   ├── 07-auth.js            # JWT register/login/protect/restrictTo
│   ├── 08-file-upload.js     # Multer disk, memory, filters
│   └── 09-advanced.js        # CORS, Helmet, Rate Limit, SSE, Cookies
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── utils/
├── docker-compose.yml
├── package.json
└── .env.example
```
