'use strict';
/**
 * 04 — MIDDLEWARE / HOOKS
 * Topics: pre save, post save, pre find, post find,
 *         pre deleteOne, error handling middleware,
 *         middleware execution order
 */
const { connect, disconnect } = require('../src/config/db');
const mongoose = require('mongoose');

async function run() {
  await connect();

  // ── Define a schema with all middleware types ─────────────────────────────
  const logSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: String,
    category: { type: String, default: 'general' },
    viewCount: { type: Number, default: 0 },
  }, { timestamps: true, versionKey: false });

  // PRE-SAVE: runs before .save() / .create()
  logSchema.pre('save', function (next) {
    console.log('[hook] pre("save") — doc is new?', this.isNew, '— title:', this.title);
    // this = the document being saved
    if (this.isNew) {
      this.title = this.title.toUpperCase(); // transform on create
    }
    next(); // must call next() or the operation hangs
  });

  // PRE-SAVE (async version with async/await)
  logSchema.pre('save', async function () {
    // Example: simulate async check (e.g., duplicate title lookup)
    await new Promise((r) => setTimeout(r, 10));
    console.log('[hook] pre("save") async — category:', this.category);
  });

  // POST-SAVE: runs after .save() succeeds
  logSchema.post('save', function (doc, next) {
    console.log('[hook] post("save") — saved _id:', doc._id, 'title:', doc.title);
    next();
  });

  // PRE-FIND: runs before any find query
  logSchema.pre(/^find/, function (next) {
    console.log('[hook] pre("find") — query filter:', JSON.stringify(this.getFilter()));
    next();
  });

  // POST-FIND: runs after find query completes
  logSchema.post('find', function (docs) {
    console.log('[hook] post("find") — returned', docs.length, 'docs');
  });

  // PRE-DELETE
  logSchema.pre('deleteOne', { document: false, query: true }, function (next) {
    console.log('[hook] pre("deleteOne") — deleting docs matching:', JSON.stringify(this.getFilter()));
    next();
  });

  // ERROR HANDLING MIDDLEWARE — catches errors thrown in earlier hooks
  logSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
      next(new Error('Duplicate key error caught by error-handling middleware'));
    } else {
      next(error);
    }
  });

  const Log = mongoose.model('Log', logSchema);

  // ── Test pre/post save ─────────────────────────────────────────────────────
  console.log('\n── SAVE HOOKS ──────────────────────────────────');
  const log1 = await Log.create({ title: 'hello world', content: 'Test content' });
  // Notice title is uppercased by pre-save hook
  console.log('saved title (uppercased by hook):', log1.title);

  // Modify and save again — pre("save") fires but isNew is false
  log1.content = 'Updated content';
  await log1.save();

  // ── Test find hooks ────────────────────────────────────────────────────────
  console.log('\n── FIND HOOKS ──────────────────────────────────');
  const logs = await Log.find({ category: 'general' });

  // ── Test deleteOne hook ────────────────────────────────────────────────────
  console.log('\n── DELETE HOOK ─────────────────────────────────');
  await Log.deleteOne({ _id: log1._id });

  // ── Middleware execution order ─────────────────────────────────────────────
  console.log('\n── ORDER: pre1 → pre2 → operation → post1 → post2');

  // ── User model hooks (from our real model) ────────────────────────────────
  console.log('\n── User model pre-save hook (password hashing) ─');
  const User = require('../src/models/User');
  const testUser = await User.create({
    firstName: 'Hook',
    lastName: 'Test',
    email: `hook_test_${Date.now()}@example.com`,
    password: 'plaintext123',
  });
  // password is now bcrypt hash, not plaintext
  const withPassword = await User.findById(testUser._id).select('+password');
  console.log('password hashed by pre-save?', withPassword.password.startsWith('$2'));

  await User.deleteOne({ _id: testUser._id });
  await Log.deleteMany({});
  await disconnect();
}

run().catch(console.error);
