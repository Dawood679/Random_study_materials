// ============================================================
//  06 - Validation
//  Topics: manual validation, express-validator, sanitization
// ============================================================

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const app = express();
app.use(express.json());

// ── Helper: extract validation errors ────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── 1. Manual Validation (no library) ────────────────────────
app.post('/manual-register', (req, res) => {
  const { name, email, age } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push({ field: 'email', message: 'Valid email required' });

  if (age !== undefined && (isNaN(age) || age < 0 || age > 120))
    errors.push({ field: 'age', message: 'Age must be between 0 and 120' });

  if (errors.length > 0) return res.status(422).json({ errors });

  res.status(201).json({ message: 'User created', data: { name: name.trim(), email, age } });
});

// ── 2. express-validator: Register ───────────────────────────
app.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be 2–50 characters')
      .escape(), // prevent XSS

    body('email')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(), // lowercases and strips dots for gmail etc.

    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number'),

    body('age')
      .optional()
      .isInt({ min: 0, max: 120 })
      .withMessage('Age must be an integer between 0–120')
      .toInt(), // convert string "25" → number 25

    body('role')
      .optional()
      .isIn(['user', 'admin', 'moderator'])
      .withMessage('Role must be user, admin, or moderator'),
  ],
  validate,
  (req, res) => {
    // If we reach here, all validations passed
    const { password, ...safeData } = req.body; // never return the password
    res.status(201).json({ message: 'Registered!', data: safeData });
  }
);

// ── 3. Validate Route Params ──────────────────────────────────
app.get(
  '/users/:id',
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt(),
  validate,
  (req, res) => {
    res.json({ userId: req.params.id, type: typeof req.params.id }); // number after toInt()
  }
);

// ── 4. Validate Query Strings ─────────────────────────────────
app.get(
  '/search',
  [
    query('q').trim().notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be 1–100'),
  ],
  validate,
  (req, res) => {
    res.json({ query: req.query.q, page: req.query.page || 1, limit: req.query.limit || 10 });
  }
);

// ── 5. Custom Validator ───────────────────────────────────────
app.post(
  '/transfer',
  [
    body('from').notEmpty().withMessage('from is required'),
    body('to').notEmpty().withMessage('to is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('amount must be > 0').toFloat(),
    body('to').custom((to, { req }) => {
      if (to === req.body.from) throw new Error('Cannot transfer to same account');
      return true;
    }),
  ],
  validate,
  (req, res) => {
    res.json({ message: 'Transfer queued', data: req.body });
  }
);

const PORT = 3006;
app.listen(PORT, () => {
  console.log(`\n[06-validation] Server running at http://localhost:${PORT}`);
  console.log('Try:');
  console.log('  POST http://localhost:3006/register');
  console.log('  Body: { "name": "Alice", "email": "alice@test.com", "password": "Secret1" }');
  console.log('  GET  http://localhost:3006/users/abc   (invalid id)');
  console.log('  GET  http://localhost:3006/search?q=express&page=2');
  console.log('  POST http://localhost:3006/transfer  { "from":"A","to":"A","amount":50 }');
});
