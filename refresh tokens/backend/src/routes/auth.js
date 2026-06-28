'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { verifyAccessToken } = require('../middleware/auth');

const router = express.Router();

// ── Token helpers ─────────────────────────────────────────────────────────────

// Access token: short-lived (15m), lives in JS memory on the client
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user._id, username: user.username, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
  );
}

// Refresh token: long-lived (7d), saved to DB so it can be revoked
async function generateRefreshToken(user) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = jwt.sign(
    { sub: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
  await RefreshToken.create({ token, userId: user._id, expiresAt });
  return { token, expiresAt };
}

// httpOnly cookie: JS on the client CANNOT read this (XSS protection)
function setRefreshCookie(res, token, expiresAt) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',                            // CSRF protection
    expires: expiresAt,
  });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }

    // User.pre('save') hook hashes the password automatically
    const user = await User.create({ username, email, password });

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user);
    setRefreshCookie(res, refreshToken, expiresAt);

    res.status(201).json({
      accessToken,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // findByEmail explicitly includes password field (it has select: false)
    const user = await User.findByEmail(email);
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user);
    setRefreshCookie(res, refreshToken, expiresAt);

    res.json({
      accessToken,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
// The core of the refresh token pattern.
// The httpOnly cookie is sent automatically by the browser — no JS reads it.

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });

  try {
    // Step 1: Verify JWT signature and expiry
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Step 2: Check DB — must exist and not be revoked
    const storedToken = await RefreshToken.findOne({ token, isRevoked: false });
    if (!storedToken) {
      return res.status(403).json({ error: 'Refresh token revoked or not found' });
    }

    // Step 3: Belt-and-suspenders expiry check (jwt.verify already does this)
    if (storedToken.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Refresh token expired' });
    }

    // Step 4: Load the user
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(403).json({ error: 'User not found' });

    // Step 5: TOKEN ROTATION — revoke old token, issue a new one
    // Why rotate? If an attacker steals the refresh token and tries to use it
    // AFTER the real user has already rotated it, the server sees a revoked token
    // and can alert / revoke ALL tokens for that user.
    storedToken.isRevoked = true;
    await storedToken.save();

    const accessToken = generateAccessToken(user);
    const { token: newRefreshToken, expiresAt } = await generateRefreshToken(user);
    setRefreshCookie(res, newRefreshToken, expiresAt);

    // Only the new access token is returned — new refresh token goes into the cookie
    res.json({ accessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    // Revoke in DB so this token can never be used again
    await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true }).catch(() => {});
  }

  // Clear the httpOnly cookie on the client
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Logged out successfully' });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Protected route — requires a valid access token in the Authorization header

router.get('/me', verifyAccessToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: { id: user._id, username: user.username, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
