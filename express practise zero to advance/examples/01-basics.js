// ============================================================
//  01 - Express Basics
//  Topics: Hello World, HTTP methods, sending responses
// ============================================================

const express = require('express');
const app = express();

// Parse JSON bodies automatically
app.use(express.json());

// ── GET ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// ── Sending different response types ─────────────────────────
app.get('/json', (req, res) => {
  res.json({ message: 'This is JSON', success: true });
});

app.get('/status', (req, res) => {
  res.status(201).json({ message: 'Created!' });
});

app.get('/html', (req, res) => {
  res.send('<h1>Hello from HTML</h1>');
});

// ── POST ─────────────────────────────────────────────────────
app.post('/echo', (req, res) => {
  // req.body contains the parsed JSON body
  res.json({ youSent: req.body });
});

// ── PUT ──────────────────────────────────────────────────────
app.put('/update', (req, res) => {
  res.json({ updated: true, data: req.body });
});

// ── DELETE ───────────────────────────────────────────────────
app.delete('/remove', (req, res) => {
  res.json({ deleted: true });
});

// ── PATCH ────────────────────────────────────────────────────
app.patch('/patch', (req, res) => {
  res.json({ patched: true, data: req.body });
});

// ── Redirect ─────────────────────────────────────────────────
app.get('/old-route', (req, res) => {
  res.redirect(301, '/json');
});

// ── Download a file ──────────────────────────────────────────
app.get('/download', (req, res) => {
  // res.download('/absolute/path/to/file.pdf');
  res.send('(File download demo — provide an actual path)');
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n[01-basics] Server running at http://localhost:${PORT}`);
  console.log('Try these routes:');
  console.log('  GET  http://localhost:3001/');
  console.log('  GET  http://localhost:3001/json');
  console.log('  GET  http://localhost:3001/status');
  console.log('  POST http://localhost:3001/echo   (send JSON body)');
});
