'use strict';
/**
 * 02 — CRUD OPERATIONS
 * Topics: create, insertMany, find, findById, findOne,
 *         updateOne, findByIdAndUpdate, replaceOne,
 *         deleteOne, deleteMany, findByIdAndDelete
 */
const { connect, disconnect } = require('../src/config/db');
const User = require('../src/models/User');

async function run() {
  await connect();

  // ── CREATE ─────────────────────────────────────────────────────────────────
  console.log('\n── CREATE ──────────────────────────────────────');

  // Model.create() — shorthand for new + save
  const u1 = await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: `test_${Date.now()}@crud.com`,
    password: 'secret123',
    role: 'user',
    age: 25,
  });
  console.log('create():', u1.fullName, u1._id);

  // insertMany() — bulk insert, no pre-save hooks per document
  const bulk = await User.insertMany([
    { firstName: 'Bulk', lastName: 'One', email: `bulk1_${Date.now()}@crud.com`, password: 'secret123' },
    { firstName: 'Bulk', lastName: 'Two', email: `bulk2_${Date.now()}@crud.com`, password: 'secret123' },
  ]);
  console.log('insertMany():', bulk.length, 'docs inserted');

  // ── READ ───────────────────────────────────────────────────────────────────
  console.log('\n── READ ────────────────────────────────────────');

  // find() — returns array
  const allUsers = await User.find({ role: 'user' }).limit(5);
  console.log('find():', allUsers.length, 'users found');

  // findById() — returns one doc by _id
  const found = await User.findById(u1._id);
  console.log('findById():', found?.email);

  // findOne() — returns first match
  const one = await User.findOne({ email: u1.email });
  console.log('findOne():', one?.fullName);

  // find with projection (select only certain fields)
  const projected = await User.find({}, 'firstName email role').limit(3);
  console.log('projection:', projected.map((u) => ({ name: u.firstName, email: u.email })));

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  console.log('\n── UPDATE ──────────────────────────────────────');

  // updateOne() — updates first match, returns result (not document)
  const updateResult = await User.updateOne({ _id: u1._id }, { $set: { age: 26 } });
  console.log('updateOne() modifiedCount:', updateResult.modifiedCount);

  // findByIdAndUpdate() — returns the document (old by default)
  const updated = await User.findByIdAndUpdate(
    u1._id,
    { $set: { isActive: false } },
    { new: true }  // return updated document
  );
  console.log('findByIdAndUpdate() isActive:', updated?.isActive);

  // findOneAndUpdate()
  const upserted = await User.findOneAndUpdate(
    { email: 'nonexistent@crud.com' },
    { $set: { firstName: 'Ghost' }, $setOnInsert: { password: 'ghost123', lastName: 'User' } },
    { upsert: true, new: true }
  );
  console.log('findOneAndUpdate() upsert:', upserted?.firstName);

  // $inc, $push, $addToSet operators
  await User.updateOne({ _id: u1._id }, {
    $inc: { age: 1 },                    // increment age by 1
    $push: { interests: 'coding' },       // add to array
  });
  const afterUpdate = await User.findById(u1._id);
  console.log('$inc + $push — age:', afterUpdate?.age, 'interests:', afterUpdate?.interests);

  // ── DELETE ─────────────────────────────────────────────────────────────────
  console.log('\n── DELETE ──────────────────────────────────────');

  // deleteOne()
  const del1 = await User.deleteOne({ _id: u1._id });
  console.log('deleteOne() deletedCount:', del1.deletedCount);

  // findByIdAndDelete()
  const deleted = await User.findByIdAndDelete(bulk[0]._id);
  console.log('findByIdAndDelete():', deleted?.fullName);

  // deleteMany()
  const delMany = await User.deleteMany({ firstName: 'Bulk' });
  console.log('deleteMany() deletedCount:', delMany.deletedCount);

  // Cleanup ghost upsert
  await User.deleteMany({ firstName: 'Ghost' });

  await disconnect();
}

run().catch(console.error);
