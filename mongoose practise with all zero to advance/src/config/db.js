'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mongoose_practice';

async function connect() {
  await mongoose.connect(MONGO_URI);
  console.log(`[db] Connected to MongoDB: ${MONGO_URI}`);
}

async function disconnect() {
  await mongoose.disconnect();
  console.log('[db] Disconnected from MongoDB');
}

module.exports = { connect, disconnect, MONGO_URI };
