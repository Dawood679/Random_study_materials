'use strict';
/**
 * 06 — POPULATION
 * Topics: basic populate, populate with select, deep populate,
 *         virtual populate, populate on save, multiple path populate
 */
const { connect, disconnect } = require('../src/config/db');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');

async function run() {
  await connect();

  // ── 1. Basic Populate ──────────────────────────────────────────────────────
  console.log('\n── BASIC POPULATE ──────────────────────────────');
  const posts = await Post.find({ status: 'published' })
    .populate('author')   // replace author ObjectId with full User document
    .limit(2);

  posts.forEach((p) => {
    console.log(`Post: "${p.title}" — Author: ${p.author?.fullName} (${p.author?.role})`);
  });

  // ── 2. Populate with select (only get specific fields) ────────────────────
  console.log('\n── POPULATE WITH SELECT ────────────────────────');
  const postsSlim = await Post.find({ status: 'published' })
    .populate('author', 'firstName lastName email -_id') // only these fields
    .limit(2);

  postsSlim.forEach((p) => {
    console.log(`Post: "${p.title}" — Author fields:`, p.author);
  });

  // ── 3. Populate with match (filter populated docs) ────────────────────────
  console.log('\n── POPULATE WITH MATCH ─────────────────────────');
  const postsFiltered = await Post.find()
    .populate({
      path: 'author',
      match: { role: 'admin' },  // only populate if author is admin
      select: 'firstName role',
    })
    .limit(5);

  postsFiltered.forEach((p) => {
    // author will be null if match failed
    console.log(`Post: "${p.title.substring(0, 30)}..." — Admin Author: ${p.author?.firstName || 'null (not admin)'}`);
  });

  // ── 4. Deep / Nested Populate ─────────────────────────────────────────────
  console.log('\n── DEEP POPULATE ───────────────────────────────');
  const comments = await Comment.find()
    .populate('author', 'firstName')
    .populate({
      path: 'post',
      select: 'title author',
      populate: {               // nested populate: post's author
        path: 'author',
        select: 'firstName role',
      },
    })
    .limit(2);

  comments.forEach((c) => {
    console.log(
      `Comment by ${c.author?.firstName} on "${c.post?.title}" ` +
      `(post author: ${c.post?.author?.firstName})`
    );
  });

  // ── 5. Multiple Path Populate ─────────────────────────────────────────────
  console.log('\n── MULTIPLE PATH POPULATE ──────────────────────');
  const multiPop = await Comment.find()
    .populate('author', 'firstName')
    .populate('post', 'title')
    .limit(3);

  multiPop.forEach((c) => {
    console.log(`"${c.body.substring(0, 40)}..." — by ${c.author?.firstName} — on "${c.post?.title?.substring(0, 30)}"`);
  });

  // ── 6. Virtual Populate ───────────────────────────────────────────────────
  console.log('\n── VIRTUAL POPULATE ────────────────────────────');
  // User.posts is a virtual defined on the User schema
  const userWithPosts = await User.findOne({ role: 'admin' })
    .populate('posts', 'title status views'); // populate virtual

  if (userWithPosts) {
    console.log(`User: ${userWithPosts.fullName}`);
    console.log(`Posts (via virtual populate):`);
    userWithPosts.posts?.forEach((p) => {
      console.log(`  - "${p.title}" [${p.status}] — ${p.views} views`);
    });
  }

  // ── 7. populate() on a document ──────────────────────────────────────────
  console.log('\n── .populate() ON EXISTING DOC ─────────────────');
  const comment = await Comment.findOne();
  await comment.populate('author', 'firstName email');
  console.log('Populated author on doc:', comment.author?.firstName, comment.author?.email);

  // ── 8. Populate and lean ──────────────────────────────────────────────────
  console.log('\n── POPULATE + LEAN ─────────────────────────────');
  const leanPost = await Post.findOne({ status: 'published' })
    .populate('author', 'firstName')
    .lean();
  console.log('lean + populate — author is plain object?', !leanPost.author?.save);
  console.log('lean author:', leanPost.author);

  await disconnect();
}

run().catch(console.error);
