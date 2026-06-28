'use strict';
/**
 * 01 — BASICS
 * Topics: Schema definition, SchemaTypes, Model creation, document instantiation, save()
 */
const { connect, disconnect } = require('../src/config/db');
const mongoose = require('mongoose');

async function run() {
  await connect();

  // ── 1. Defining a Schema ───────────────────────────────────────────────────
  const animalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['cat', 'dog', 'bird', 'fish'], default: 'dog' },
    age:  { type: Number, min: 0 },
    isVaccinated: { type: Boolean, default: false },
    registeredAt: { type: Date, default: Date.now },
    tags: [String],                                     // Array of strings
    metadata: { type: mongoose.Schema.Types.Mixed },    // Any shape
    ownerId: { type: mongoose.Schema.Types.ObjectId },  // Reference (no ref here)
  });

  // ── 2. Creating a Model ────────────────────────────────────────────────────
  // Model is a class constructed from the schema
  const Animal = mongoose.model('Animal', animalSchema);

  // ── 3. Creating a document using `new` + `save()` ─────────────────────────
  const cat = new Animal({ name: 'Whiskers', type: 'cat', age: 3, isVaccinated: true });
  await cat.save();
  console.log('[basics] Saved with save():', cat.toObject());

  // ── 4. Creating a document using Model.create() ───────────────────────────
  const dog = await Animal.create({ name: 'Bruno', type: 'dog', age: 5, tags: ['friendly', 'trained'] });
  console.log('[basics] Created with create():', dog.name, dog.tags);

  // ── 5. Checking document state ────────────────────────────────────────────
  console.log('[basics] Is new?', cat.isNew);          // false after save
  console.log('[basics] Modified paths:', dog.modifiedPaths());

  dog.age = 6;
  console.log('[basics] isModified("age")?', dog.isModified('age')); // true
  await dog.save();

  // ── 6. Schema path info ───────────────────────────────────────────────────
  console.log('[basics] Schema paths:', Object.keys(animalSchema.paths));

  // ── 7. All schema types summary ───────────────────────────────────────────
  console.log('\n[basics] Mongoose Schema Types:');
  console.log('  String, Number, Date, Boolean, Buffer, Mixed, ObjectId, Array, Decimal128, Map');

  // Cleanup
  await Animal.deleteMany({});
  await disconnect();
}

run().catch(console.error);
