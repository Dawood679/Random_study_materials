'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');

const ROOT = path.resolve(__dirname, '..');
const CONTAINER_NAME = process.env.CONTAINER_NAME || 'mongoose_practice_mongo';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mongoose_practice';
const MAX_WAIT_SECONDS = 60;

// ── Step 1: Start MongoDB container ──────────────────────────────────────────
function startMongo() {
  console.log('\n[startup] Checking MongoDB container...');

  // Check if already running
  const running = spawnSync('docker', ['ps', '-q', '-f', `name=^${CONTAINER_NAME}$`], { encoding: 'utf8' });
  if (running.stdout.trim()) {
    console.log(`[startup] Container "${CONTAINER_NAME}" is already running.`);
    return;
  }

  // Check if exists but stopped
  const exists = spawnSync('docker', ['ps', '-aq', '-f', `name=^${CONTAINER_NAME}$`], { encoding: 'utf8' });
  if (exists.stdout.trim()) {
    console.log(`[startup] Container "${CONTAINER_NAME}" exists but is stopped. Starting...`);
    execSync(`docker start ${CONTAINER_NAME}`, { stdio: 'inherit' });
    return;
  }

  // Create and start new container
  console.log(`[startup] Creating new MongoDB container "${CONTAINER_NAME}"...`);
  execSync(
    `docker run -d \
      --name ${CONTAINER_NAME} \
      -p 27017:27017 \
      -e MONGO_INITDB_DATABASE=mongoose_practice \
      -v mongoose_practice_data:/data/db \
      mongo:7.0`,
    { stdio: 'inherit' }
  );
  console.log('[startup] Container started.');
}

// ── Step 2: Wait for MongoDB to be ready ─────────────────────────────────────
async function waitForMongo() {
  console.log('[startup] Waiting for MongoDB to accept connections...');
  const start = Date.now();

  while (true) {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    if (elapsed > MAX_WAIT_SECONDS) {
      console.error(`\n[startup] MongoDB did not become ready within ${MAX_WAIT_SECONDS}s.`);
      console.error('[startup] Make sure Docker is running and try again.');
      process.exit(1);
    }
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      await mongoose.connection.db.admin().command({ ping: 1 });
      await mongoose.disconnect();
      console.log(`[startup] MongoDB ready! (waited ${elapsed}s)`);
      return;
    } catch (_) {
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

// ── Step 3: Seed data ─────────────────────────────────────────────────────────
async function runSeed() {
  console.log('\n[startup] Seeding practice data...');
  const { seed } = require('./seed/index');
  const conn = await mongoose.connect(MONGO_URI);
  await seed();
  await mongoose.disconnect();
}

// ── Step 4: Print ready banner ────────────────────────────────────────────────
function printReadyBanner() {
  const line = '═'.repeat(58);
  console.log(`\n╔${line}╗`);
  console.log(`║${'  MongoDB is RUNNING and SEEDED for Practice!'.padEnd(58)}║`);
  console.log(`╠${line}╣`);
  console.log(`║  URI : ${MONGO_URI.padEnd(50)}║`);
  console.log(`║  DB  : mongoose_practice${''.padEnd(33)}║`);
  console.log(`╠${line}╣`);
  console.log(`║  Run example files in a new terminal:${''.padEnd(21)}║`);
  console.log(`║    npm run example:basics${''.padEnd(33)}║`);
  console.log(`║    npm run example:crud${''.padEnd(35)}║`);
  console.log(`║    npm run example:queries${''.padEnd(32)}║`);
  console.log(`║    npm run example:middleware${''.padEnd(29)}║`);
  console.log(`║    npm run example:validation${''.padEnd(29)}║`);
  console.log(`║    npm run example:populate${''.padEnd(31)}║`);
  console.log(`║    npm run example:aggregation${''.padEnd(28)}║`);
  console.log(`║    npm run example:advanced${''.padEnd(31)}║`);
  console.log(`╠${line}╣`);
  console.log(`║  Press Ctrl+C to stop.${''.padEnd(35)}║`);
  console.log(`╚${line}╝\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    startMongo();
    await waitForMongo();
    await runSeed();
    printReadyBanner();
    // Keep process alive
    setInterval(() => {}, 1 << 30);
  } catch (err) {
    console.error('[startup] Fatal error:', err.message);
    process.exit(1);
  }
})();
