// ============================================================
//  05 - Error Handling
//  Topics: sync errors, async errors, custom Error class,
//          global error middleware, 404 handler
// ============================================================

const express = require('express');
const app = express();
app.use(express.json());

// ── Custom Error Class ────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // vs programmer errors
  }
}

// ── 1. Synchronous Error ──────────────────────────────────────
// Express automatically catches sync throws and passes to error middleware
app.get('/sync-error', (req, res) => {
  throw new AppError('Something went wrong (sync)', 500);
});

// ── 2. Async Error — WRONG way (unhandled) ───────────────────
// app.get('/async-wrong', async (req, res) => {
//   const data = await someAsyncThing(); // if this throws, Express won't catch it in v4
// });

// ── 3. Async Error — with try/catch ──────────────────────────
const fakeDB = () =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('DB connection failed')), 100)
  );

app.get('/async-trycatch', async (req, res, next) => {
  try {
    await fakeDB();
    res.json({ ok: true });
  } catch (err) {
    next(err); // pass to error middleware
  }
});

// ── 4. asyncHandler wrapper — eliminates repetitive try/catch ─
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get(
  '/async-handler',
  asyncHandler(async (req, res) => {
    await fakeDB(); // throws → caught by asyncHandler → next(err)
    res.json({ ok: true });
  })
);

// ── 5. Throwing custom AppError ──────────────────────────────
app.get('/not-found-resource', (req, res, next) => {
  next(new AppError('Resource not found', 404));
});

app.get('/forbidden', (req, res, next) => {
  next(new AppError('Access denied', 403));
});

// ── 6. 404 Handler (must be before global error handler) ──────
app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404));
});

// ── 7. Global Error Handler (4 params — signature is important!) ─
// Express identifies error middleware by exactly 4 params
app.use((err, req, res, next) => {
  // Distinguish operational errors from programmer bugs
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // Always log
  console.error(`[ERROR] ${statusCode} — ${err.message}`);
  if (!isOperational) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    status: statusCode >= 500 ? 'error' : 'fail',
    message: isOperational ? err.message : 'Something went very wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`\n[05-error-handling] Server running at http://localhost:${PORT}`);
  console.log('Try these to see errors:');
  console.log('  GET http://localhost:3005/sync-error');
  console.log('  GET http://localhost:3005/async-trycatch');
  console.log('  GET http://localhost:3005/async-handler');
  console.log('  GET http://localhost:3005/not-found-resource');
  console.log('  GET http://localhost:3005/forbidden');
  console.log('  GET http://localhost:3005/unknown-route   (404)');
});
