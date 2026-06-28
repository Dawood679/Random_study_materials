'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/refresh_tokens_db';

async function connect() {
  await mongoose.connect(MONGO_URI);
  console.log(`[db] Connected: ${MONGO_URI}`);
}

async function disconnect() {
  await mongoose.disconnect();
  console.log('[db] Disconnected');
}

module.exports = { connect, disconnect, MONGO_URI };
