// ============================================================
//  02 - Routing
//  Topics: route params, query strings, Express Router,
//          route chaining, wildcard routes
// ============================================================

const express = require('express');
const app = express();
app.use(express.json());

// ── Route Parameters  ─────────────────────────────────────────
// :id  is a named param — available on req.params.id
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ userId: id });
});

// Multiple params
app.get('/users/:userId/posts/:postId', (req, res) => {
  res.json(req.params); // { userId: '1', postId: '5' }
});

// Optional param  (? makes it optional)
app.get('/products/:category/:subcategory?', (req, res) => {
  res.json(req.params);
});

// ── Query Strings ─────────────────────────────────────────────
// /search?q=express&page=2
app.get('/search', (req, res) => {
  const { q = '', page = 1, limit = 10 } = req.query;
  res.json({ query: q, page: Number(page), limit: Number(limit) });
});

// ── Route Chaining ────────────────────────────────────────────
// Define multiple HTTP methods on the same path cleanly
app
  .route('/articles')
  .get((req, res) => res.json({ action: 'list all articles' }))
  .post((req, res) => res.json({ action: 'create article', body: req.body }));

app
  .route('/articles/:id')
  .get((req, res) => res.json({ action: 'get article', id: req.params.id }))
  .put((req, res) => res.json({ action: 'update article', id: req.params.id }))
  .delete((req, res) => res.json({ action: 'delete article', id: req.params.id }));

// ── Express Router (modular routing) ──────────────────────────
const userRouter = express.Router();

userRouter.get('/', (req, res) => res.json({ action: 'list users' }));
userRouter.post('/', (req, res) => res.json({ action: 'create user' }));
userRouter.get('/:id', (req, res) => res.json({ action: 'get user', id: req.params.id }));
userRouter.put('/:id', (req, res) => res.json({ action: 'update user', id: req.params.id }));
userRouter.delete('/:id', (req, res) => res.json({ action: 'delete user', id: req.params.id }));

// Mount the router at /api/users
app.use('/api/users', userRouter);

// ── Wildcard / 404 route ──────────────────────────────────────
// Must be LAST — catches everything not matched above
app.all('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`\n[02-routing] Server running at http://localhost:${PORT}`);
  console.log('Try these routes:');
  console.log('  GET http://localhost:3002/users/42');
  console.log('  GET http://localhost:3002/users/1/posts/5');
  console.log('  GET http://localhost:3002/search?q=express&page=2');
  console.log('  GET http://localhost:3002/api/users');
  console.log('  GET http://localhost:3002/api/users/7');
});
