'use strict';
/**
 * 03 — QUERY METHODS & CHAINING
 * Topics: comparison ($gt, $gte, $lt, $lte, $eq, $ne),
 *         array ($in, $nin), logical ($or, $and, $nor, $not),
 *         element ($exists, $type), select, sort, limit, skip,
 *         lean(), exec(), countDocuments(), distinct()
 */
const { connect, disconnect } = require('../src/config/db');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Product = require('../src/models/Product');

async function run() {
  await connect();

  console.log('\n── COMPARISON OPERATORS ────────────────────────');

  // $gt / $gte / $lt / $lte
  const adults = await User.find({ age: { $gte: 18, $lte: 30 } }).select('firstName age');
  console.log('age between 18-30:', adults.map((u) => `${u.firstName}(${u.age})`));

  // $ne (not equal)
  const nonAdmins = await User.find({ role: { $ne: 'admin' } }).select('firstName role');
  console.log('non-admins:', nonAdmins.map((u) => `${u.firstName}(${u.role})`));

  console.log('\n── ARRAY OPERATORS ─────────────────────────────');

  // $in — matches any value in array
  const roleFilter = await User.find({ role: { $in: ['admin', 'moderator'] } }).select('firstName role');
  console.log('$in [admin, moderator]:', roleFilter.map((u) => u.firstName));

  // $nin — matches none of the values
  const notUsers = await User.find({ role: { $nin: ['user'] } }).select('firstName role');
  console.log('$nin [user]:', notUsers.map((u) => `${u.firstName}(${u.role})`));

  // Array field contains value
  const withCoding = await User.find({ interests: 'coding' }).select('firstName interests');
  console.log('interests includes "coding":', withCoding.map((u) => u.firstName));

  console.log('\n── LOGICAL OPERATORS ───────────────────────────');

  // $or
  const orResult = await User.find({ $or: [{ role: 'admin' }, { age: { $lt: 20 } }] }).select('firstName role age');
  console.log('$or (admin OR age<20):', orResult.map((u) => `${u.firstName}(${u.role},${u.age})`));

  // $and (explicit — usually implicit)
  const andResult = await User.find({ $and: [{ isActive: true }, { age: { $gte: 25 } }] }).select('firstName age isActive');
  console.log('$and (active AND age>=25):', andResult.map((u) => u.firstName));

  console.log('\n── ELEMENT OPERATORS ───────────────────────────');

  // $exists
  const hasPhone = await User.find({ phone: { $exists: true } }).select('firstName phone');
  console.log('has phone field:', hasPhone.map((u) => u.firstName));

  console.log('\n── QUERY CHAINING ──────────────────────────────');

  // Chain: select + sort + limit + skip
  const page2 = await User.find({ isActive: true })
    .select('firstName lastName role age')
    .sort({ age: -1 })    // sort by age descending
    .skip(1)              // skip first result (page 2 simulation)
    .limit(3);            // max 3 results
  console.log('chained query (page 2, sorted by age desc):', page2.map((u) => `${u.firstName}(${u.age})`));

  // .where() chain style
  const whereResult = await User.find()
    .where('isActive').equals(true)
    .where('age').gt(20).lt(35)
    .select('firstName age')
    .sort('firstName');
  console.log('.where() chain:', whereResult.map((u) => `${u.firstName}(${u.age})`));

  console.log('\n── LEAN() — returns plain JS objects (faster) ──');
  const leanUsers = await User.find({ isActive: true }).lean().limit(2);
  console.log('lean type:', typeof leanUsers[0], '— has virtuals?', !!leanUsers[0].fullName);
  // lean docs are plain objects, no mongoose methods/virtuals

  console.log('\n── COUNT & DISTINCT ────────────────────────────');
  const totalUsers = await User.countDocuments({ isActive: true });
  console.log('countDocuments(active):', totalUsers);

  const distinctRoles = await User.distinct('role');
  console.log('distinct roles:', distinctRoles);

  console.log('\n── POST QUERIES ────────────────────────────────');
  // $text search (requires text index — defined in Post model)
  try {
    const searchResults = await Post.find({ $text: { $search: 'mongoose aggregation' } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .select('title');
    console.log('text search results:', searchResults.map((p) => p.title));
  } catch (e) {
    console.log('text search skipped:', e.message);
  }

  // Regex
  const regexPosts = await Post.find({ title: /mongoose/i }).select('title').limit(3);
  console.log('regex /mongoose/i:', regexPosts.map((p) => p.title));

  await disconnect();
}

run().catch(console.error);
