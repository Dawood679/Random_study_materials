'use strict';
/**
 * 07 — AGGREGATION PIPELINE
 * Topics: $match, $group, $project, $sort, $limit, $skip,
 *         $lookup (join), $unwind, $addFields, $count,
 *         $bucket, $facet, $replaceRoot, Model.aggregate()
 */
const { connect, disconnect } = require('../src/config/db');
const Post = require('../src/models/Post');
const User = require('../src/models/User');
const Comment = require('../src/models/Comment');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');

async function run() {
  await connect();

  // ── $match + $group ────────────────────────────────────────────────────────
  console.log('\n── $match + $group ─────────────────────────────');
  const postsByStatus = await Post.aggregate([
    { $match: { status: { $in: ['published', 'draft', 'archived'] } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgLikes: { $avg: '$likes' },
        maxViews: { $max: '$views' },
      },
    },
    { $sort: { count: -1 } },
  ]);
  console.log('Posts by status:');
  postsByStatus.forEach((r) => console.log(`  ${r._id}: ${r.count} posts, ${r.totalViews} total views, avg likes: ${r.avgLikes?.toFixed(1)}`));

  // ── $project ───────────────────────────────────────────────────────────────
  console.log('\n── $project ────────────────────────────────────');
  const projected = await Post.aggregate([
    { $match: { status: 'published' } },
    {
      $project: {
        title: 1,
        status: 1,
        views: 1,
        tagCount: { $size: '$tags' },                       // computed field
        titleLength: { $strLenCP: '$title' },               // string length
        isPopular: { $gt: ['$views', 500] },                // boolean expression
        firstTag: { $arrayElemAt: ['$tags', 0] },           // first array element
      },
    },
    { $sort: { views: -1 } },
    { $limit: 3 },
  ]);
  console.log('Projected posts:');
  projected.forEach((p) => console.log(`  "${p.title.substring(0, 35)}..." — views:${p.views} popular:${p.isPopular} tags:${p.tagCount}`));

  // ── $lookup (JOIN) ────────────────────────────────────────────────────────
  console.log('\n── $lookup (JOIN) ──────────────────────────────');
  const postsWithAuthors = await Post.aggregate([
    { $match: { status: 'published' } },
    {
      $lookup: {
        from: 'users',          // collection name (lowercase plural)
        localField: 'author',   // field in Post
        foreignField: '_id',    // field in User
        as: 'authorData',       // output array field
      },
    },
    { $unwind: '$authorData' }, // flatten the array to a single object
    {
      $project: {
        title: 1,
        views: 1,
        authorName: { $concat: ['$authorData.firstName', ' ', '$authorData.lastName'] },
        authorRole: '$authorData.role',
      },
    },
    { $sort: { views: -1 } },
    { $limit: 4 },
  ]);
  console.log('Posts with author (via $lookup):');
  postsWithAuthors.forEach((p) => console.log(`  "${p.title.substring(0, 30)}..." by ${p.authorName} (${p.authorRole})`));

  // ── $unwind ───────────────────────────────────────────────────────────────
  console.log('\n── $unwind (tags) ──────────────────────────────');
  const tagFrequency = await Post.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },       // one doc per tag
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  console.log('Top tags:', tagFrequency.map((t) => `${t._id}(${t.count})`).join(', '));

  // ── $addFields ────────────────────────────────────────────────────────────
  console.log('\n── $addFields ──────────────────────────────────');
  const withEngagement = await Post.aggregate([
    { $match: { status: 'published' } },
    {
      $addFields: {
        engagement: { $add: ['$views', { $multiply: ['$likes', 10] }] },
        viewsK: { $divide: ['$views', 1000] },
      },
    },
    { $sort: { engagement: -1 } },
    { $limit: 3 },
    { $project: { title: 1, views: 1, likes: 1, engagement: 1 } },
  ]);
  console.log('Engagement scores:');
  withEngagement.forEach((p) => console.log(`  ${p.title.substring(0, 35)} — engagement: ${p.engagement}`));

  // ── $count ────────────────────────────────────────────────────────────────
  console.log('\n── $count ──────────────────────────────────────');
  const [publishedCount] = await Post.aggregate([
    { $match: { status: 'published' } },
    { $count: 'total' },
  ]);
  console.log('Published posts count:', publishedCount?.total);

  // ── $bucket ───────────────────────────────────────────────────────────────
  console.log('\n── $bucket (views ranges) ──────────────────────');
  const viewsBuckets = await Post.aggregate([
    {
      $bucket: {
        groupBy: '$views',
        boundaries: [0, 100, 500, 1000, 2000],
        default: 'Other',
        output: { count: { $sum: 1 }, titles: { $push: '$title' } },
      },
    },
  ]);
  viewsBuckets.forEach((b) => console.log(`  views [${b._id}-...]: ${b.count} posts`));

  // ── Order aggregation: revenue by status ──────────────────────────────────
  console.log('\n── Orders: revenue by status ───────────────────');
  const revenue = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        avgOrder: { $avg: '$totalAmount' },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
  revenue.forEach((r) => console.log(`  ${r._id}: PKR ${r.totalRevenue.toLocaleString()} (${r.orderCount} orders, avg: PKR ${Math.round(r.avgOrder)})`));

  // ── $lookup with pipeline (advanced) ─────────────────────────────────────
  console.log('\n── $lookup with pipeline ───────────────────────');
  const usersWithPostCount = await User.aggregate([
    {
      $lookup: {
        from: 'posts',
        let: { userId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$author', '$$userId'] } } },
          { $count: 'count' },
        ],
        as: 'postStats',
      },
    },
    {
      $addFields: {
        postCount: { $ifNull: [{ $arrayElemAt: ['$postStats.count', 0] }, 0] },
      },
    },
    { $project: { firstName: 1, lastName: 1, role: 1, postCount: 1 } },
    { $sort: { postCount: -1 } },
  ]);
  console.log('Users with post count:');
  usersWithPostCount.forEach((u) => console.log(`  ${u.firstName} ${u.lastName} (${u.role}): ${u.postCount} posts`));

  await disconnect();
}

run().catch(console.error);
