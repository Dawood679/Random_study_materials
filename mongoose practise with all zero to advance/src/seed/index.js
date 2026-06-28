'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Product = require('../models/Product');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mongoose_practice';

async function seed() {
  console.log('[seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('[seed] Creating users...');
  const users = await User.create([
    {
      firstName: 'Ali',
      lastName: 'Hassan',
      email: 'ali@example.com',
      password: 'password123',
      role: 'admin',
      age: 28,
      isActive: true,
      phone: '+92-300-1234567',
      interests: ['coding', 'gaming', 'reading'],
      address: { street: '12 Main Street', city: 'Lahore', country: 'Pakistan' },
    },
    {
      firstName: 'Sara',
      lastName: 'Khan',
      email: 'sara@example.com',
      password: 'password123',
      role: 'moderator',
      age: 25,
      isActive: true,
      interests: ['design', 'travel', 'photography'],
      address: { street: '5 Garden Town', city: 'Karachi', country: 'Pakistan' },
    },
    {
      firstName: 'Ahmed',
      lastName: 'Raza',
      email: 'ahmed@example.com',
      password: 'password123',
      role: 'user',
      age: 22,
      isActive: true,
      interests: ['movies', 'music'],
    },
    {
      firstName: 'Fatima',
      lastName: 'Malik',
      email: 'fatima@example.com',
      password: 'password123',
      role: 'user',
      age: 30,
      isActive: true,
      interests: ['cooking', 'yoga'],
      address: { city: 'Islamabad', country: 'Pakistan' },
    },
    {
      firstName: 'Bilal',
      lastName: 'Siddiqui',
      email: 'bilal@example.com',
      password: 'password123',
      role: 'user',
      age: 19,
      isActive: false,
      interests: ['football', 'cricket'],
    },
  ]);

  // ── Posts ──────────────────────────────────────────────────────────────────
  console.log('[seed] Creating posts...');
  const posts = await Post.create([
    {
      title: 'Getting Started with Mongoose',
      content: 'Mongoose is an ODM (Object Data Modeling) library for MongoDB and Node.js. It manages relationships between data, provides schema validation, and translates between objects in code and the representation of those objects in MongoDB.',
      author: users[0]._id,
      tags: ['mongoose', 'mongodb', 'nodejs'],
      status: 'published',
      views: 1200,
      likes: 45,
    },
    {
      title: 'Understanding Mongoose Schema Types',
      content: 'Mongoose supports many schema types: String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array, Decimal128, Map, UUID. Each type has its own validation and casting rules.',
      author: users[0]._id,
      tags: ['mongoose', 'schema', 'types'],
      status: 'published',
      views: 980,
      likes: 32,
    },
    {
      title: 'Mongoose Middleware and Hooks Explained',
      content: 'Mongoose middleware (also called pre and post hooks) are functions which are passed control during execution of asynchronous functions. Pre hooks run before the operation and post hooks run after.',
      author: users[1]._id,
      tags: ['mongoose', 'middleware', 'hooks'],
      status: 'published',
      views: 750,
      likes: 28,
    },
    {
      title: 'Population in Mongoose: A Deep Dive',
      content: 'Population is the process of automatically replacing the specified paths in the document with document(s) from other collection(s). We may populate a single document, multiple documents, a plain object, multiple plain objects, or all objects returned from a query.',
      author: users[1]._id,
      tags: ['mongoose', 'populate', 'references'],
      status: 'published',
      views: 620,
      likes: 19,
    },
    {
      title: 'MongoDB Aggregation Pipeline with Mongoose',
      content: 'The aggregation pipeline is a framework for data aggregation modeled on the concept of data processing pipelines. Documents enter a multi-stage pipeline that transforms the documents into aggregated results.',
      author: users[0]._id,
      tags: ['mongodb', 'aggregation', 'pipeline'],
      status: 'published',
      views: 890,
      likes: 37,
    },
    {
      title: 'Draft: Advanced Indexing Strategies',
      content: 'Indexes support the efficient execution of queries in MongoDB. Without indexes, MongoDB must perform a collection scan, i.e. scan every document in a collection, to select those documents that match the query statement.',
      author: users[0]._id,
      tags: ['mongodb', 'indexes', 'performance'],
      status: 'draft',
      views: 0,
      likes: 0,
    },
    {
      title: 'Working with Mongoose Virtuals',
      content: 'Virtuals are document properties that you can get and set but that do not get persisted to MongoDB. The getters are useful for formatting or combining fields, while setters are useful for de-composing a single value into multiple values for storage.',
      author: users[2]._id,
      tags: ['mongoose', 'virtuals'],
      status: 'published',
      views: 410,
      likes: 15,
    },
    {
      title: 'Transactions in MongoDB with Mongoose',
      content: 'In version 4.0, MongoDB added support for multi-document ACID transactions. Mongoose has a session API for working with transactions. You can start a session, start a transaction, execute operations, and then commit or abort the transaction.',
      author: users[1]._id,
      tags: ['mongodb', 'transactions', 'acid'],
      status: 'published',
      views: 530,
      likes: 22,
    },
    {
      title: 'Schema Validation Best Practices',
      content: 'Mongoose lets you add validation to your schemas. Validation is defined in the SchemaType and is middleware. Mongoose registers validation as a pre("save") hook on every schema by default.',
      author: users[3]._id,
      tags: ['mongoose', 'validation', 'schema'],
      status: 'published',
      views: 340,
      likes: 11,
    },
    {
      title: 'Using Discriminators for Schema Inheritance',
      content: 'Discriminators are a schema inheritance mechanism. They enable you to have multiple models with overlapping schemas on top of the same underlying MongoDB collection.',
      author: users[0]._id,
      tags: ['mongoose', 'discriminators', 'advanced'],
      status: 'archived',
      views: 210,
      likes: 8,
    },
  ]);

  // ── Comments ───────────────────────────────────────────────────────────────
  console.log('[seed] Creating comments...');
  await Comment.create([
    { body: 'Great introduction! This helped me understand Mongoose concepts.', author: users[1]._id, post: posts[0]._id },
    { body: 'Very well explained. The examples are clear and concise.', author: users[2]._id, post: posts[0]._id },
    { body: 'I had no idea about all these schema types. Thank you!', author: users[3]._id, post: posts[1]._id },
    { body: 'The Decimal128 type is especially useful for financial apps.', author: users[0]._id, post: posts[1]._id },
    { body: 'Pre hooks saved my life when I needed to hash passwords.', author: users[2]._id, post: posts[2]._id },
    { body: 'Could you write more about error handling middleware?', author: users[3]._id, post: posts[2]._id },
    { body: 'Population is so powerful. I use it constantly.', author: users[0]._id, post: posts[3]._id },
    { body: 'Virtual populate is a game changer!', author: users[4]._id, post: posts[3]._id },
    { body: 'The $lookup stage is equivalent to SQL JOINs. Mind blown.', author: users[1]._id, post: posts[4]._id },
    { body: 'Please add more aggregation examples.', author: users[2]._id, post: posts[4]._id },
    { body: 'Virtuals are great for computed properties.', author: users[3]._id, post: posts[6]._id },
    { body: 'fullName virtual is a classic example.', author: users[1]._id, post: posts[6]._id },
    { body: 'Transactions are essential for banking apps.', author: users[0]._id, post: posts[7]._id },
    { body: 'What about nested transactions? Are they supported?', author: users[2]._id, post: posts[7]._id },
    { body: 'Required and enum validators are the most common ones I use.', author: users[1]._id, post: posts[8]._id },
    { body: 'Custom validators are super flexible!', author: users[4]._id, post: posts[8]._id },
    { body: 'I love the fact that indexes can be defined right in the schema.', author: users[2]._id, post: posts[5]._id },
    { body: 'Discriminators remind me of class inheritance in OOP.', author: users[3]._id, post: posts[9]._id },
    { body: 'This is advanced but very useful for polymorphic data.', author: users[1]._id, post: posts[9]._id },
    { body: 'Would love a video tutorial on this topic.', author: users[0]._id, post: posts[9]._id },
  ]);

  // ── Products ───────────────────────────────────────────────────────────────
  console.log('[seed] Creating products...');
  const products = await Product.create([
    {
      name: 'MacBook Pro 14',
      description: 'Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD',
      price: mongoose.Types.Decimal128.fromString('349999.00'),
      stock: 10,
      category: 'electronics',
      sku: 'MBP-14-M3',
      specs: new Map([['cpu', 'Apple M3'], ['ram', '16GB'], ['storage', '512GB SSD'], ['display', '14.2 inch Liquid Retina']]),
      isAvailable: true,
      rating: { average: 4.8, count: 250 },
    },
    {
      name: 'Samsung Galaxy S24',
      description: 'Latest Samsung flagship with Snapdragon 8 Gen 3',
      price: mongoose.Types.Decimal128.fromString('189999.00'),
      stock: 25,
      category: 'electronics',
      sku: 'SAM-S24-256',
      specs: new Map([['cpu', 'Snapdragon 8 Gen 3'], ['ram', '12GB'], ['storage', '256GB'], ['camera', '200MP']]),
      isAvailable: true,
      rating: { average: 4.6, count: 180 },
    },
    {
      name: 'Clean Code by Robert C. Martin',
      description: 'A Handbook of Agile Software Craftsmanship — essential read for every developer',
      price: mongoose.Types.Decimal128.fromString('2500.00'),
      stock: 100,
      category: 'books',
      sku: 'BOOK-CLEANCODE',
      isAvailable: true,
      rating: { average: 4.9, count: 3200 },
    },
    {
      name: 'Nike Air Max 270',
      description: 'Comfortable running shoes with Air Max cushioning',
      price: mongoose.Types.Decimal128.fromString('18000.00'),
      stock: 50,
      category: 'sports',
      sku: 'NIKE-AM270-44',
      specs: new Map([['size', '44'], ['color', 'Black/White'], ['material', 'Mesh']]),
      isAvailable: true,
      rating: { average: 4.4, count: 890 },
    },
    {
      name: 'Polo Ralph Lauren T-Shirt',
      description: 'Classic fit cotton polo shirt',
      price: mongoose.Types.Decimal128.fromString('4500.00'),
      stock: 200,
      category: 'clothing',
      sku: 'PRL-POLO-M',
      isAvailable: true,
      rating: { average: 4.2, count: 620 },
    },
    {
      name: 'Wireless Mechanical Keyboard',
      description: 'Bluetooth mechanical keyboard with RGB backlight',
      price: mongoose.Types.Decimal128.fromString('8500.00'),
      stock: 30,
      category: 'electronics',
      sku: 'KB-MECH-RGB',
      specs: new Map([['switches', 'Brown'], ['layout', 'TKL'], ['battery', '4000mAh']]),
      isAvailable: true,
      rating: { average: 4.5, count: 340 },
    },
    {
      name: 'Yoga Mat Premium',
      description: 'Non-slip 6mm thick yoga mat with carrying strap',
      price: mongoose.Types.Decimal128.fromString('3200.00'),
      stock: 75,
      category: 'sports',
      isAvailable: true,
      rating: { average: 4.3, count: 210 },
    },
    {
      name: 'JavaScript: The Good Parts',
      description: 'Must-read book about the best JavaScript features',
      price: mongoose.Types.Decimal128.fromString('1800.00'),
      stock: 60,
      category: 'books',
      sku: 'BOOK-JSGOODPARTS',
      isAvailable: true,
      rating: { average: 4.7, count: 1500 },
    },
  ]);

  // ── Orders ─────────────────────────────────────────────────────────────────
  console.log('[seed] Creating orders...');
  await Order.create([
    {
      customer: users[0]._id,
      items: [
        { product: products[0]._id, productName: products[0].name, quantity: 1, unitPrice: 349999 },
        { product: products[2]._id, productName: products[2].name, quantity: 2, unitPrice: 2500 },
      ],
      status: 'delivered',
      shippingAddress: { street: '12 Main St', city: 'Lahore', country: 'Pakistan', zip: '54000' },
      paymentMethod: 'card',
    },
    {
      customer: users[1]._id,
      items: [
        { product: products[1]._id, productName: products[1].name, quantity: 1, unitPrice: 189999 },
        { product: products[5]._id, productName: products[5].name, quantity: 1, unitPrice: 8500 },
      ],
      status: 'shipped',
      shippingAddress: { street: '5 Garden Town', city: 'Karachi', country: 'Pakistan', zip: '74200' },
      paymentMethod: 'jazzcash',
    },
    {
      customer: users[2]._id,
      items: [
        { product: products[3]._id, productName: products[3].name, quantity: 2, unitPrice: 18000 },
        { product: products[6]._id, productName: products[6].name, quantity: 1, unitPrice: 3200 },
      ],
      status: 'confirmed',
      shippingAddress: { city: 'Islamabad', country: 'Pakistan' },
      paymentMethod: 'easypaisa',
    },
    {
      customer: users[3]._id,
      items: [
        { product: products[7]._id, productName: products[7].name, quantity: 1, unitPrice: 1800 },
        { product: products[4]._id, productName: products[4].name, quantity: 3, unitPrice: 4500 },
      ],
      status: 'pending',
      shippingAddress: { city: 'Multan', country: 'Pakistan' },
      paymentMethod: 'cash',
      notes: 'Please deliver in the morning.',
    },
  ]);

  console.log('[seed] Done! Seeded: 5 users, 10 posts, 20 comments, 8 products, 4 orders');
}

// Run directly: node src/seed/index.js
if (require.main === module) {
  mongoose
    .connect(MONGO_URI)
    .then(() => seed())
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] Error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
