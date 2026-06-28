'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const CONTAINER_NAME = process.env.CONTAINER_NAME || 'refresh_tokens_mongo';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/refresh_tokens_db';
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MAX_WAIT_SECONDS = 60;

// ── Step 1: Start MongoDB via Docker ─────────────────────────────────────────

function startMongo() {
  console.log('\n[startup] Checking MongoDB Docker container...');

  const running = spawnSync('docker', ['ps', '-q', '-f', `name=^${CONTAINER_NAME}$`], {
    encoding: 'utf8',
  });

  if (running.stdout.trim()) {
    console.log(`[startup] Container "${CONTAINER_NAME}" is already running.`);
    return;
  }

  const exists = spawnSync('docker', ['ps', '-aq', '-f', `name=^${CONTAINER_NAME}$`], {
    encoding: 'utf8',
  });

  if (exists.stdout.trim()) {
    console.log(`[startup] Starting existing container "${CONTAINER_NAME}"...`);
    execSync(`docker start ${CONTAINER_NAME}`, { stdio: 'inherit' });
    return;
  }

  console.log(`[startup] Creating and starting container "${CONTAINER_NAME}"...`);
  execSync(
    [
      'docker run -d',
      `--name ${CONTAINER_NAME}`,
      '-p 27017:27017',
      '-e MONGO_INITDB_DATABASE=refresh_tokens_db',
      '-v refresh_tokens_data:/data/db',
      'mongo:7.0',
    ].join(' '),
    { stdio: 'inherit' }
  );
}

// ── Step 2: Wait until MongoDB is ready ──────────────────────────────────────

async function waitForMongo() {
  console.log('[startup] Waiting for MongoDB to be ready...');
  const start = Date.now();

  while (true) {
    const elapsed = (Date.now() - start) / 1000;
    if (elapsed > MAX_WAIT_SECONDS) {
      console.error(`[startup] MongoDB not ready after ${MAX_WAIT_SECONDS}s — giving up.`);
      process.exit(1);
    }

    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      await mongoose.connection.db.admin().command({ ping: 1 });
      await mongoose.disconnect();
      console.log('[startup] MongoDB is ready!');
      return;
    } catch {
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

// ── Step 3: Start Express app ─────────────────────────────────────────────────

async function startExpress() {
  await mongoose.connect(MONGO_URI);
  console.log('[startup] Connected to MongoDB for API server.');

  const app = express();

  // credentials: true is required for cookies to be sent/received cross-origin
  // origin must be a specific URL (not '*') when credentials: true
  app.use(cors({ origin: FRONTEND_URL, credentials: true }));

  app.use(express.json());
  app.use(cookieParser()); // populates req.cookies from the Cookie header

  app.use('/api/auth', authRoutes);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.listen(PORT, () => printReadyBanner());
}

function printReadyBanner() {
  const w = 58;
  const line = '═'.repeat(w);
  const pad = (s) => s.padEnd(w);

  console.log(`\n╔${line}╗`);
  console.log(`║${pad('  Refresh Tokens Backend is RUNNING!')}║`);
  console.log(`╠${line}╣`);
  console.log(`║${pad(`  http://localhost:${PORT}/api/auth`)}║`);
  console.log(`╠${line}╣`);
  console.log(`║${pad('  POST  /api/auth/register')}║`);
  console.log(`║${pad('  POST  /api/auth/login')}║`);
  console.log(`║${pad('  POST  /api/auth/refresh')}║`);
  console.log(`║${pad('  POST  /api/auth/logout')}║`);
  console.log(`║${pad('  GET   /api/auth/me       ← requires access token')}║`);
  console.log(`╠${line}╣`);
  console.log(`║${pad(`  Frontend: ${FRONTEND_URL}`)}║`);
  console.log(`║${pad('  Press Ctrl+C to stop.')}║`);
  console.log(`╚${line}╝\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  try {
    startMongo();
    await waitForMongo();
    await startExpress();
  } catch (err) {
    console.error('[startup] Fatal error:', err.message);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  console.log('\n[shutdown] Disconnecting from MongoDB...');
  await mongoose.disconnect();
  process.exit(0);
});
