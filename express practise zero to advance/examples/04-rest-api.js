// ============================================================
//  04 - Building a REST API
//  Topics: full CRUD, in-memory store, status codes, best practices
// ============================================================

const express = require('express');
const app = express();
app.use(express.json());

// In-memory data store (replace with DB in real apps)
let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 },
  { id: 2, name: 'Bob',   email: 'bob@example.com',   age: 34 },
  { id: 3, name: 'Carol', email: 'carol@example.com', age: 22 },
];
let nextId = 4;

// ── Helper ────────────────────────────────────────────────────
const findUser = (id) => users.find((u) => u.id === Number(id));

// ── GET /api/users — list all (with optional filter & pagination) ──
app.get('/api/users', (req, res) => {
  const { name, page = 1, limit = 10 } = req.query;

  let result = [...users];

  if (name) {
    result = result.filter((u) =>
      u.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  const start = (Number(page) - 1) * Number(limit);
  const paginated = result.slice(start, start + Number(limit));

  res.json({
    total: result.length,
    page: Number(page),
    limit: Number(limit),
    data: paginated,
  });
});

// ── GET /api/users/:id — get one ─────────────────────────────
app.get('/api/users/:id', (req, res) => {
  const user = findUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ── POST /api/users — create ──────────────────────────────────
app.post('/api/users', (req, res) => {
  const { name, email, age } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const duplicate = users.find((u) => u.email === email);
  if (duplicate) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const newUser = { id: nextId++, name, email, age: age || null };
  users.push(newUser);

  res.status(201).json(newUser);
});

// ── PUT /api/users/:id — full replace ────────────────────────
app.put('/api/users/:id', (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  const { name, email, age } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required for full update' });
  }

  users[index] = { id: users[index].id, name, email, age: age || null };
  res.json(users[index]);
});

// ── PATCH /api/users/:id — partial update ────────────────────
app.patch('/api/users/:id', (req, res) => {
  const user = findUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Only update fields that are provided
  const allowed = ['name', 'email', 'age'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  res.json(user);
});

// ── DELETE /api/users/:id ─────────────────────────────────────
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  const deleted = users.splice(index, 1)[0];
  res.json({ message: 'User deleted', user: deleted });
  // Or: res.status(204).send(); // 204 = No Content
});

// ── DELETE /api/users — delete all ───────────────────────────
app.delete('/api/users', (req, res) => {
  const count = users.length;
  users = [];
  nextId = 1;
  res.json({ message: `Deleted ${count} users` });
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`\n[04-rest-api] Server running at http://localhost:${PORT}`);
  console.log('REST API endpoints:');
  console.log('  GET    /api/users               — list (supports ?name=&page=&limit=)');
  console.log('  GET    /api/users/:id            — get one');
  console.log('  POST   /api/users                — create { name, email, age }');
  console.log('  PUT    /api/users/:id            — full replace');
  console.log('  PATCH  /api/users/:id            — partial update');
  console.log('  DELETE /api/users/:id            — delete one');
  console.log('  DELETE /api/users                — delete all');
});
