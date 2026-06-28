'use strict';

const jwt = require('jsonwebtoken');

// Middleware: verify access token from "Authorization: Bearer <token>" header
// Attaches req.user = { id, username, email } on success
// Returns 401 for missing token, 401 for invalid/expired token
function verifyAccessToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { id: decoded.sub, username: decoded.username, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

module.exports = { verifyAccessToken };
