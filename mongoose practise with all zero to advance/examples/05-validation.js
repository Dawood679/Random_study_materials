'use strict';
/**
 * 05 — VALIDATION
 * Topics: required, minlength, maxlength, min, max, enum, match,
 *         custom validators, ValidationError handling,
 *         runValidators on update, validate() method
 */
const { connect, disconnect } = require('../src/config/db');
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function run() {
  await connect();

  // Helper to test validation and catch errors
  async function tryCreate(data, label) {
    try {
      const doc = await User.create(data);
      console.log(`[${label}] OK — created: ${doc.email}`);
      await User.deleteOne({ _id: doc._id });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        console.log(`[${label}] ValidationError: ${messages.join(' | ')}`);
      } else {
        console.log(`[${label}] Error: ${err.message}`);
      }
    }
  }

  console.log('\n── BUILT-IN VALIDATORS ─────────────────────────');

  // required
  await tryCreate({ lastName: 'Test', email: 'r@test.com', password: 'abc123' }, 'missing firstName');

  // minlength
  await tryCreate({ firstName: 'A', lastName: 'T', email: 'ml@test.com', password: 'abc123' }, 'firstName too short');

  // email regex match
  await tryCreate({ firstName: 'Ali', lastName: 'T', email: 'not-an-email', password: 'abc123' }, 'bad email');

  // enum
  await tryCreate({ firstName: 'Ali', lastName: 'T', email: 'enum@test.com', password: 'abc123', role: 'superuser' }, 'bad role');

  // min/max (age)
  await tryCreate({ firstName: 'Ali', lastName: 'T', email: 'age@test.com', password: 'abc123', age: 5 }, 'age < 13');
  await tryCreate({ firstName: 'Ali', lastName: 'T', email: 'age2@test.com', password: 'abc123', age: 200 }, 'age > 120');

  // custom validator (phone)
  await tryCreate({ firstName: 'Ali', lastName: 'T', email: 'ph@test.com', password: 'abc123', phone: 'abc' }, 'bad phone');

  // valid
  await tryCreate({ firstName: 'Valid', lastName: 'User', email: `valid_${Date.now()}@test.com`, password: 'secure123', age: 25, role: 'user' }, 'valid user');

  console.log('\n── VALIDATE() METHOD ───────────────────────────');
  // Validate without saving
  const user = new User({ firstName: 'T', email: 'bad' }); // multiple errors
  try {
    await user.validate();
  } catch (err) {
    console.log('validate() errors:', Object.keys(err.errors));
  }

  console.log('\n── RUNUNVALIDATORS ON UPDATE ───────────────────');
  const real = await User.create({
    firstName: 'Update',
    lastName: 'Test',
    email: `upd_${Date.now()}@test.com`,
    password: 'abc123',
  });

  try {
    // By default, update operations don't run validators
    // Add { runValidators: true } to enforce them
    await User.updateOne(
      { _id: real._id },
      { $set: { role: 'superuser' } },
      { runValidators: true }
    );
  } catch (err) {
    console.log('runValidators caught:', err.errors?.role?.message);
  }

  await User.deleteOne({ _id: real._id });

  console.log('\n── MONGOOSE SCHEMA-LEVEL VALIDATION DEMO ───────');
  const strictSchema = new mongoose.Schema({
    username: {
      type: String,
      required: [true, 'Username required'],
      minlength: [3, 'Min 3 chars'],
      maxlength: [20, 'Max 20 chars'],
      match: [/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscore'],
    },
    score: {
      type: Number,
      min: [0, 'Score min 0'],
      max: [100, 'Score max 100'],
    },
    level: {
      type: String,
      enum: { values: ['beginner', 'intermediate', 'advanced'], message: '{VALUE} is not a valid level' },
    },
    tags: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'Maximum 5 tags allowed',
      },
    },
  }, { versionKey: false });

  const GameProfile = mongoose.model('GameProfile', strictSchema);

  try {
    await GameProfile.create({ username: 'hi', score: 150, level: 'pro', tags: ['a', 'b', 'c', 'd', 'e', 'f'] });
  } catch (err) {
    console.log('GameProfile validation errors:', Object.values(err.errors).map((e) => e.message));
  }

  await GameProfile.deleteMany({});
  await disconnect();
}

run().catch(console.error);
