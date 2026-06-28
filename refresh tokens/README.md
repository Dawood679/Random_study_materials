# Refresh Tokens — Full-Stack Demo

Express + MongoDB + JWT backend · React + Vite frontend

---

## Concept

Most auth systems issue two tokens at login:

| Token | Lifetime | Stored where | Purpose |
|---|---|---|---|
| **Access token** | 15 minutes | JS memory (never localStorage) | Authenticate API requests |
| **Refresh token** | 7 days | httpOnly cookie + MongoDB | Get a new access token when the old one expires |

**Why two tokens?**
- A short-lived access token limits the damage if it's stolen — it expires in 15 min.
- The refresh token lives in an `httpOnly` cookie so JavaScript cannot read it (XSS protection).
- Storing the refresh token in MongoDB lets you revoke it on logout.

---

## Flow Diagram

```
Browser                         Backend                      MongoDB
  │                               │                              │
  │── POST /login ───────────────▶│                              │
  │                               │── save refresh token ───────▶│
  │◀── accessToken + httpOnly ────│                              │
  │    cookie (refreshToken)      │                              │
  │                               │                              │
  │  [15 min later — token expired]                              │
  │                               │                              │
  │── GET /api/auth/me ──────────▶│                              │
  │◀── 401 Unauthorized ──────────│                              │
  │                               │                              │
  │  [axios interceptor kicks in] │                              │
  │── POST /refresh (cookie) ────▶│                              │
  │                               │── lookup + revoke old ──────▶│
  │                               │── save new refresh token ───▶│
  │◀── new accessToken ───────────│                              │
  │    + new httpOnly cookie      │                              │
  │                               │                              │
  │── GET /api/auth/me (retry) ──▶│                              │
  │◀── 200 user data ─────────────│                              │
```

---

## Security Properties

| Attack | Protection |
|---|---|
| XSS reads access token | Token is in JS memory — lost on tab close, but not in DOM/storage |
| XSS reads refresh token | `httpOnly` cookie — JS cannot access it at all |
| CSRF sends refresh cookie | `sameSite: strict` — cookie not sent on cross-site requests |
| Stolen refresh token reuse | Token rotation: old token revoked on use; reuse attempt detected |
| DB breach exposes tokens | TTL index auto-deletes expired tokens (production: store hashed tokens) |

---

## Project Structure

```
refresh tokens/
├── backend/
│   ├── src/
│   │   ├── config/db.js              MongoDB connect/disconnect
│   │   ├── models/User.js            username, email, hashed password
│   │   ├── models/RefreshToken.js    token, userId, expiresAt, isRevoked
│   │   ├── middleware/auth.js        verifyAccessToken middleware
│   │   ├── routes/auth.js            register, login, refresh, logout, me
│   │   └── server.js                 auto-start Docker + Express
│   ├── .env.example
│   ├── docker-compose.yml
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/axios.js              in-memory token + request/response interceptors
    │   ├── context/AuthContext.jsx   login, register, logout, silent restore
    │   ├── components/PrivateRoute.jsx
    │   ├── pages/Login.jsx
    │   ├── pages/Register.jsx
    │   └── pages/Dashboard.jsx       demo: call protected endpoint
    ├── vite.config.js                proxy /api → localhost:4000
    └── package.json
```

---

## How to Run

### Backend

```bash
cd "refresh tokens/backend"
npm install
cp .env.example .env
# Edit .env: set strong secrets with: openssl rand -hex 64
npm start
# → starts Docker MongoDB automatically, then Express on http://localhost:4000
```

### Frontend

```bash
cd "refresh tokens/frontend"
npm install
npm run dev
# → Vite dev server on http://localhost:5173
```

Open http://localhost:5173 — register, login, test the dashboard.

---

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account, get access token + cookie |
| POST | `/api/auth/login` | — | Login, get access token + cookie |
| POST | `/api/auth/refresh` | cookie | Rotate refresh token, get new access token |
| POST | `/api/auth/logout` | cookie | Revoke refresh token, clear cookie |
| GET | `/api/auth/me` | Bearer token | Get current user (protected) |

---

## Manual Test with curl

```bash
# 1. Register
curl -c cookies.txt -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ali","email":"ali@test.com","password":"secret123"}'
# Returns: { accessToken, user }
# Sets:    httpOnly cookie "refreshToken"

# 2. Use access token on protected route
ACCESS_TOKEN="<paste accessToken here>"
curl -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:4000/api/auth/me

# 3. Refresh (cookie sent automatically with -b)
curl -b cookies.txt -c cookies.txt -X POST http://localhost:4000/api/auth/refresh
# Returns: { accessToken }   ← new token
# Old refresh token is now REVOKED in MongoDB

# 4. Logout
curl -b cookies.txt -X POST http://localhost:4000/api/auth/logout
# MongoDB: isRevoked = true  Cookie: cleared

# 5. Try refresh again after logout — should fail
curl -b cookies.txt -X POST http://localhost:4000/api/auth/refresh
# Returns: 403 Forbidden
```

---

## Key Files to Study

1. **`backend/src/routes/auth.js`** — The full refresh token logic with token rotation
2. **`backend/src/models/RefreshToken.js`** — TTL index, revocation fields
3. **`frontend/src/api/axios.js`** — In-memory token, interceptors, `failedQueue` pattern
4. **`frontend/src/context/AuthContext.jsx`** — Silent session restore on page load
