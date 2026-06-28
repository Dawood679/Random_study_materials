# Mongoose — Zero to Advanced

A complete, runnable practice project covering every Mongoose concept from scratch to advanced.

---

## Quick Start

```bash
npm install
npm start          # starts MongoDB container + seeds data + prints ready banner
```

Then in a second terminal:

```bash
npm run example:basics
npm run example:crud
npm run example:queries
npm run example:middleware
npm run example:validation
npm run example:populate
npm run example:aggregation
npm run example:advanced
```

---

## Table of Contents

1. [What is Mongoose?](#1-what-is-mongoose)
2. [Installation & Connection](#2-installation--connection)
3. [Schema & Schema Types](#3-schema--schema-types)
4. [Schema Options](#4-schema-options)
5. [CRUD Operations](#5-crud-operations)
6. [Query Methods & Chaining](#6-query-methods--chaining)
7. [Validators](#7-validators)
8. [Middleware / Hooks](#8-middleware--hooks)
9. [Virtuals](#9-virtuals)
10. [Instance Methods, Static Methods, Query Helpers](#10-instance-methods-static-methods-query-helpers)
11. [Population (Refs)](#11-population-refs)
12. [Aggregation Pipeline](#12-aggregation-pipeline)
13. [Indexing](#13-indexing)
14. [Transactions & Sessions](#14-transactions--sessions)
15. [Discriminators (Schema Inheritance)](#15-discriminators-schema-inheritance)
16. [Schema Plugins](#16-schema-plugins)
17. [Change Streams](#17-change-streams)
18. [Connection Options & Pooling](#18-connection-options--pooling)

---

## 1. What is Mongoose?

Mongoose is an **ODM (Object Data Modeling)** library for MongoDB and Node.js.

It provides:
- Schema-based data modeling
- Built-in type casting
- Validation
- Query building
- Business logic hooks (middleware)
- Population (joins between collections)

```
MongoDB (stores documents) ← Mongoose (adds structure, validation, logic) ← Node.js App
```

---

## 2. Installation & Connection

```bash
npm install mongoose
```

```js
const mongoose = require('mongoose');

// Basic connect
await mongoose.connect('mongodb://localhost:27017/mydb');

// With options
await mongoose.connect('mongodb://localhost:27017/mydb', {
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
});

// Disconnect
await mongoose.disconnect();

// Connection events
mongoose.connection.on('connected', () => console.log('Connected'));
mongoose.connection.on('error', (err) => console.log('Error:', err));
mongoose.connection.on('disconnected', () => console.log('Disconnected'));
```

---

## 3. Schema & Schema Types

A **Schema** defines the shape of documents in a MongoDB collection.

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // String
  name: String,
  email: { type: String, required: true },

  // Number
  age: Number,
  score: { type: Number, default: 0 },

  // Boolean
  isActive: { type: Boolean, default: true },

  // Date
  createdAt: { type: Date, default: Date.now },
  birthday: Date,

  // Buffer (binary data)
  profilePicture: Buffer,

  // Mixed (any type — no schema enforcement)
  metadata: mongoose.Schema.Types.Mixed,
  metadata2: {},  // shorthand for Mixed

  // ObjectId (reference to another document)
  authorId: mongoose.Schema.Types.ObjectId,
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },

  // Array of strings
  tags: [String],

  // Array of numbers
  scores: [Number],

  // Array of ObjectIds
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Decimal128 (precise floating point — use for money)
  price: mongoose.Schema.Types.Decimal128,

  // Map (flexible key-value pairs)
  preferences: { type: Map, of: String },
  settings: { type: Map, of: Boolean },

  // Nested object (embedded subdocument)
  address: {
    street: String,
    city: String,
    country: { type: String, default: 'Pakistan' },
  },

  // Array of subdocuments (each gets its own _id)
  experiences: [
    {
      company: String,
      years: Number,
      isCurrent: Boolean,
    },
  ],
});

const User = mongoose.model('User', userSchema);
```

### All Schema Types Summary

| Type | Usage |
|------|-------|
| `String` | Text data |
| `Number` | Integer or float |
| `Boolean` | true / false |
| `Date` | JavaScript Date objects |
| `Buffer` | Binary data (files, images) |
| `Mixed` / `{}` | Any shape — no validation |
| `ObjectId` | MongoDB ObjectId — used for refs |
| `Array` / `[]` | List of values or subdocs |
| `Decimal128` | Precise decimal numbers (money) |
| `Map` | Dynamic key-value pairs |

---

## 4. Schema Options

```js
const schema = new mongoose.Schema(
  { name: String },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,

    // Remove the __v version field
    versionKey: false,

    // Strict: ignore fields not in schema (default: true)
    // Set to false to allow any fields
    strict: true,

    // Collection name override
    collection: 'my_custom_collection',

    // Include virtuals when converting to JSON/Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },

    // Custom _id type (e.g., use UUID instead of ObjectId)
    // _id: false  ← disable auto _id
  }
);
```

---

## 5. CRUD Operations

### Create

```js
// Method 1: new + save()
const user = new User({ name: 'Ali', email: 'ali@example.com' });
await user.save();

// Method 2: Model.create() — shorthand for new + save()
const user2 = await User.create({ name: 'Sara', email: 'sara@example.com' });

// Method 3: insertMany() — bulk insert (no pre-save hooks per doc)
const users = await User.insertMany([
  { name: 'Ahmed', email: 'ahmed@example.com' },
  { name: 'Fatima', email: 'fatima@example.com' },
]);
```

### Read

```js
// Find all
const all = await User.find();

// Find with filter
const active = await User.find({ isActive: true });

// Find one
const one = await User.findOne({ email: 'ali@example.com' });

// Find by _id
const byId = await User.findById('64abc123...');

// With projection (select fields)
const projected = await User.find({}, 'name email -_id');

// Count
const count = await User.countDocuments({ isActive: true });

// Check if exists
const exists = await User.exists({ email: 'ali@example.com' });
```

### Update

```js
// updateOne — updates first match, returns result object (not doc)
const result = await User.updateOne(
  { email: 'ali@example.com' },
  { $set: { age: 25 } }
);
console.log(result.modifiedCount); // 1

// updateMany — updates all matches
await User.updateMany({ isActive: false }, { $set: { isActive: true } });

// findByIdAndUpdate — returns the document
const updated = await User.findByIdAndUpdate(
  '64abc123...',
  { $set: { age: 26 } },
  { new: true }        // return updated doc, not original
);

// findOneAndUpdate
const updated2 = await User.findOneAndUpdate(
  { email: 'ali@example.com' },
  { $inc: { score: 10 } },  // increment by 10
  { new: true, upsert: true }  // create if not found
);

// Common update operators:
// $set     — set a field value
// $unset   — remove a field
// $inc     — increment a number
// $push    — add to array
// $pull    — remove from array
// $addToSet — add to array if not exists
// $pop     — remove first/last array element
// $rename  — rename a field
```

### Delete

```js
// deleteOne
await User.deleteOne({ email: 'ali@example.com' });

// deleteMany
await User.deleteMany({ isActive: false });

// findByIdAndDelete — returns the deleted doc
const deleted = await User.findByIdAndDelete('64abc123...');

// findOneAndDelete
const deleted2 = await User.findOneAndDelete({ email: 'ali@example.com' });
```

---

## 6. Query Methods & Chaining

Mongoose queries are chainable — methods return the query object.

### Comparison Operators

```js
// $gt, $gte, $lt, $lte
await User.find({ age: { $gt: 18 } });           // age > 18
await User.find({ age: { $gte: 18, $lte: 30 } }); // 18 <= age <= 30
await User.find({ score: { $lt: 50 } });          // score < 50

// $eq, $ne
await User.find({ role: { $eq: 'admin' } });
await User.find({ role: { $ne: 'banned' } });
```

### Array Operators

```js
// $in — matches any of the values
await User.find({ role: { $in: ['admin', 'moderator'] } });

// $nin — matches none of the values
await User.find({ role: { $nin: ['banned', 'guest'] } });

// Array field contains a value
await User.find({ tags: 'javascript' });

// $all — array contains all values
await User.find({ tags: { $all: ['js', 'node'] } });

// $size — array has exact length
await User.find({ tags: { $size: 3 } });
```

### Logical Operators

```js
// $or
await User.find({ $or: [{ role: 'admin' }, { age: { $lt: 18 } }] });

// $and (usually implicit, but can be explicit)
await User.find({ $and: [{ isActive: true }, { role: 'user' }] });

// $nor — none of the conditions match
await User.find({ $nor: [{ role: 'admin' }, { role: 'banned' }] });

// $not
await User.find({ age: { $not: { $lt: 18 } } });
```

### Query Chain Methods

```js
await User.find({ isActive: true })
  .select('name email age')      // fields to include (or exclude with -)
  .sort({ age: -1 })             // -1 = descending, 1 = ascending
  .limit(10)                     // max results
  .skip(20)                      // skip first 20 (for pagination)
  .lean()                        // return plain JS objects (faster, no mongoose methods)
  .exec();                       // execute (optional — await also works)

// .where() style
await User.find()
  .where('age').gt(18).lt(60)
  .where('isActive').equals(true)
  .select('name age');

// Regex
await User.find({ name: /ali/i });
await User.find({ email: { $regex: '^ali', $options: 'i' } });

// $exists
await User.find({ phone: { $exists: true } });

// Distinct values
const roles = await User.distinct('role');  // ['admin', 'user', 'moderator']

// Pagination pattern
const page = 2;
const perPage = 10;
await User.find().skip((page - 1) * perPage).limit(perPage);
```

---

## 7. Validators

### Built-in Validators

```js
const schema = new mongoose.Schema({
  // required
  name: { type: String, required: true },
  name2: { type: String, required: [true, 'Name is required'] },  // custom message

  // String validators
  username: {
    type: String,
    minlength: 3,
    maxlength: 20,
    trim: true,         // strip whitespace
    lowercase: true,    // auto lowercase
    uppercase: false,
    match: /^[a-z]+$/,  // must match regex
    enum: ['admin', 'user', 'guest'],  // must be one of these
  },

  // Number validators
  age: {
    type: Number,
    min: 0,
    max: 150,
    min: [0, 'Age cannot be negative'],  // with custom message
  },

  // Date validators
  expiresAt: {
    type: Date,
    min: new Date(),
    max: new Date('2030-01-01'),
  },
});
```

### Custom Validators

```js
const schema = new mongoose.Schema({
  phone: {
    type: String,
    validate: {
      validator: function(value) {
        return /^\+?[\d\s\-()]{7,15}$/.test(value);
      },
      message: props => `${props.value} is not a valid phone number`,
    },
  },

  // Async validator
  username: {
    type: String,
    validate: {
      isAsync: true,
      validator: async function(value) {
        const count = await User.countDocuments({ username: value });
        return count === 0; // must be unique
      },
      message: 'Username already taken',
    },
  },
});
```

### Handling ValidationError

```js
try {
  await User.create({ name: '' });
} catch (err) {
  if (err.name === 'ValidationError') {
    // err.errors is an object keyed by field name
    Object.values(err.errors).forEach(error => {
      console.log(error.path, error.message);
    });
  }
}

// Validate without saving
const user = new User({ name: '' });
try {
  await user.validate();
} catch (err) {
  console.log(err.errors);
}

// Run validators on update (disabled by default)
await User.updateOne(
  { _id: id },
  { $set: { age: -1 } },
  { runValidators: true }  // now validates age min:0
);
```

---

## 8. Middleware / Hooks

Middleware runs at specific stages of a document's lifecycle.

### Types

```
Document middleware: save, validate, remove, deleteOne (document-level)
Query middleware:    find, findOne, count, updateOne, deleteOne (query-level)
Aggregate middleware: aggregate
Model middleware:    insertMany
```

### Pre Hooks

```js
// Pre-save (runs before .save() and .create())
schema.pre('save', function(next) {
  // this = the document
  console.log('About to save:', this.name);
  if (this.isNew) {
    this.createdAt = new Date();
  }
  next();
});

// Pre-save (async)
schema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Pre-find (runs before any find query)
schema.pre(/^find/, function(next) {
  // this = the query object
  this.find({ isDeleted: { $ne: true } }); // exclude soft-deleted
  next();
});

// Pre-updateOne (query middleware)
schema.pre('updateOne', { document: false, query: true }, function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Pre-validate (runs before validation)
schema.pre('validate', function(next) {
  this.name = this.name?.trim();
  next();
});
```

### Post Hooks

```js
// Post-save
schema.post('save', function(doc, next) {
  console.log('Saved:', doc._id);
  // doc = the saved document
  next();
});

// Post-find
schema.post('find', function(docs) {
  console.log('Found', docs.length, 'documents');
});

// Post error handling (4 params = error handler)
schema.post('save', function(error, doc, next) {
  if (error.code === 11000) {
    next(new Error('Duplicate entry'));
  } else {
    next(error);
  }
});
```

### Useful Document Methods in Hooks

```js
schema.pre('save', function(next) {
  this.isNew              // true if document is new (not yet in DB)
  this.isModified()       // true if any field changed
  this.isModified('name') // true if 'name' specifically changed
  this.modifiedPaths()    // array of changed field names
  this.get('name')        // get field value
  this.set('name', 'Ali') // set field value
  next();
});
```

---

## 9. Virtuals

Virtuals are properties computed from other fields — **not stored in MongoDB**.

```js
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  birthYear: Number,
});

// Virtual getter
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual with setter
userSchema.virtual('fullName')
  .get(function() {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function(value) {
    const [first, ...rest] = value.split(' ');
    this.firstName = first;
    this.lastName = rest.join(' ');
  });

// Enable virtuals in JSON/Object output
const schema = new mongoose.Schema({...}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Usage
const user = await User.findById(id);
console.log(user.fullName);  // "Ali Hassan"

// Setting via virtual
user.fullName = 'Sara Khan';
console.log(user.firstName); // "Sara"
console.log(user.lastName);  // "Khan"
```

### Virtual Populate

Cross-collection virtual (like a reverse populate):

```js
// User schema: "show me all posts by this user"
userSchema.virtual('posts', {
  ref: 'Post',          // which model to use
  localField: '_id',    // field on User
  foreignField: 'author', // field on Post that references User
});

// Usage
const user = await User.findById(id).populate('posts');
console.log(user.posts); // array of Post documents
```

---

## 10. Instance Methods, Static Methods, Query Helpers

### Instance Methods

Called on a **document** (an instance of the model).

```js
userSchema.methods.greet = function() {
  return `Hello, I am ${this.firstName}!`;
};

userSchema.methods.comparePassword = async function(plaintext) {
  return bcrypt.compare(plaintext, this.password);
};

// Usage
const user = await User.findById(id).select('+password');
const isMatch = await user.comparePassword('secret123');
user.greet(); // "Hello, I am Ali!"
```

### Static Methods

Called on the **Model** itself.

```js
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveAdmins = function() {
  return this.find({ role: 'admin', isActive: true });
};

// Usage
const user = await User.findByEmail('ali@example.com');
const admins = await User.findActiveAdmins();
```

### Query Helpers

Chainable methods on queries.

```js
userSchema.query.active = function() {
  return this.where({ isActive: true });
};

userSchema.query.byRole = function(role) {
  return this.where({ role });
};

// Usage — chainable
const users = await User.find()
  .active()
  .byRole('admin')
  .sort('firstName');
```

---

## 11. Population (Refs)

Population replaces ObjectId references with actual document data.

```js
// Post schema with ref
const postSchema = new mongoose.Schema({
  title: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
```

### Basic Populate

```js
// author ObjectId → replaced with full User document
const post = await Post.findById(id).populate('author');
console.log(post.author.firstName); // "Ali"
```

### Populate with Select

```js
// Only get specific fields from populated doc
const post = await Post.findById(id)
  .populate('author', 'firstName email -_id');
```

### Populate with Match (filter)

```js
const post = await Post.findById(id).populate({
  path: 'author',
  match: { isActive: true },  // only populate if user is active
  select: 'firstName role',
});
// post.author will be null if match fails
```

### Deep / Nested Populate

```js
const comment = await Comment.findById(id)
  .populate('author', 'firstName')
  .populate({
    path: 'post',
    select: 'title author',
    populate: {              // populate inside populate
      path: 'author',
      select: 'firstName',
    },
  });
```

### Multiple Paths at Once

```js
const doc = await Comment.findById(id)
  .populate('author', 'firstName')
  .populate('post', 'title');
```

### Populate on an Existing Document

```js
const post = await Post.findById(id); // author is still ObjectId
await post.populate('author');        // now it's a full User document
```

### Virtual Populate

```js
// Defined in User schema:
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
});

// Usage:
const user = await User.findById(id).populate('posts', 'title status');
console.log(user.posts); // array of Post documents
```

---

## 12. Aggregation Pipeline

The aggregation pipeline processes documents through stages.

```js
const results = await Model.aggregate([
  { $stage1: { ... } },
  { $stage2: { ... } },
  // ...
]);
```

### Common Stages

```js
// $match — filter documents (like .find())
{ $match: { status: 'published', views: { $gt: 100 } } }

// $group — group by field and compute values
{
  $group: {
    _id: '$status',            // group by this field
    count: { $sum: 1 },        // count docs in group
    total: { $sum: '$views' }, // sum of views
    average: { $avg: '$views' },
    max: { $max: '$views' },
    min: { $min: '$views' },
    first: { $first: '$title' },
    all: { $push: '$title' },  // collect into array
  }
}

// $project — reshape documents (include/exclude/compute fields)
{
  $project: {
    title: 1,                              // include
    password: 0,                           // exclude
    fullName: { $concat: ['$first', ' ', '$last'] },
    age: { $subtract: [2025, '$birthYear'] },
    isAdult: { $gte: ['$age', 18] },
    tagCount: { $size: '$tags' },
    firstTag: { $arrayElemAt: ['$tags', 0] },
  }
}

// $sort — sort documents
{ $sort: { views: -1, createdAt: 1 } }

// $limit / $skip
{ $limit: 10 }
{ $skip: 20 }

// $unwind — deconstruct array (one doc per array element)
{ $unwind: '$tags' }
{ $unwind: { path: '$tags', preserveNullAndEmpty: true } }

// $addFields — add new computed fields
{
  $addFields: {
    engagement: { $add: ['$views', { $multiply: ['$likes', 10] }] },
    titleUpper: { $toUpper: '$title' },
  }
}

// $count — count documents
{ $count: 'total' }

// $lookup — LEFT JOIN from another collection
{
  $lookup: {
    from: 'users',          // other collection (lowercase plural)
    localField: 'author',   // field in current collection
    foreignField: '_id',    // field in other collection
    as: 'authorData',       // output array field name
  }
}

// $lookup with pipeline (advanced)
{
  $lookup: {
    from: 'posts',
    let: { userId: '$_id' },
    pipeline: [
      { $match: { $expr: { $eq: ['$author', '$$userId'] } } },
      { $count: 'count' }
    ],
    as: 'postStats',
  }
}

// $bucket — categorize into ranges
{
  $bucket: {
    groupBy: '$age',
    boundaries: [0, 18, 30, 50, 100],
    default: 'Other',
    output: { count: { $sum: 1 } }
  }
}

// $facet — run multiple pipelines simultaneously
{
  $facet: {
    byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
    total: [{ $count: 'count' }],
    topViewed: [{ $sort: { views: -1 } }, { $limit: 3 }, { $project: { title: 1 } }],
  }
}
```

### Full Example

```js
const result = await Post.aggregate([
  { $match: { status: 'published' } },
  {
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'authorData',
    },
  },
  { $unwind: '$authorData' },
  {
    $group: {
      _id: '$authorData.role',
      postCount: { $sum: 1 },
      totalViews: { $sum: '$views' },
      authors: { $addToSet: '$authorData.firstName' },
    },
  },
  { $sort: { totalViews: -1 } },
]);
```

---

## 13. Indexing

Indexes speed up queries. Without them, MongoDB does a full collection scan.

```js
// Single field index
schema.index({ email: 1 });     // 1 = ascending, -1 = descending

// Unique index
schema.index({ email: 1 }, { unique: true });

// Compound index (covers queries on both fields)
schema.index({ role: 1, isActive: 1 });

// Text index (full-text search)
schema.index({ title: 'text', content: 'text' });
// Usage: Model.find({ $text: { $search: 'mongoose hooks' } })

// Sparse index (only indexes docs that have this field)
schema.index({ phone: 1 }, { sparse: true });

// TTL index (auto-delete docs after N seconds)
schema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // delete after 1 hour

// Partial index (only index docs matching a filter)
schema.index(
  { email: 1 },
  { partialFilterExpression: { isActive: true } }
);

// Inline index definition on field
const schema = new mongoose.Schema({
  email: { type: String, unique: true, index: true },
});

// View all indexes on a collection
const indexes = await User.collection.indexes();

// Drop an index
await User.collection.dropIndex('email_1');
```

---

## 14. Transactions & Sessions

Transactions ensure multiple operations are atomic (all succeed or all fail). Requires MongoDB replica set.

```js
const session = await mongoose.startSession();
session.startTransaction();

try {
  // All operations use the session
  const order = await Order.create([{ ... }], { session });
  await Product.updateOne(
    { _id: productId },
    { $inc: { stock: -1 } },
    { session }
  );
  await User.updateOne(
    { _id: userId },
    { $push: { orders: order[0]._id } },
    { session }
  );

  await session.commitTransaction();
  console.log('All operations committed!');
} catch (error) {
  await session.abortTransaction();
  console.log('Transaction aborted — all changes rolled back');
} finally {
  session.endSession();
}
```

### withTransaction Helper

```js
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await Order.create([{ ... }], { session });
  await Product.updateOne({ ... }, { ... }, { session });
  // automatically commits or aborts
});
session.endSession();
```

---

## 15. Discriminators (Schema Inheritance)

Discriminators let multiple models share the same MongoDB collection, with different schemas.

```js
// Base schema
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  isRead: { type: Boolean, default: false },
}, { discriminatorKey: 'type' }); // 'type' field distinguishes subtypes

const Notification = mongoose.model('Notification', notificationSchema);

// Subtype 1 — stored in same 'notifications' collection
const EmailNotification = Notification.discriminator(
  'EmailNotification',
  new mongoose.Schema({
    subject: String,
    emailTo: String,
  })
);

// Subtype 2
const SmsNotification = Notification.discriminator(
  'SmsNotification',
  new mongoose.Schema({
    phoneNumber: String,
  })
);

// Create
const email = await EmailNotification.create({
  recipient: userId,
  message: 'Your order shipped!',
  subject: 'Order Update',
  emailTo: 'ali@example.com',
});
// Stored with type: 'EmailNotification'

// Query all (base model sees all subtypes)
const all = await Notification.find({ recipient: userId });

// Query only one subtype
const emailsOnly = await EmailNotification.find({ recipient: userId });
```

---

## 16. Schema Plugins

Plugins add reusable functionality across schemas.

```js
// Define a plugin
function timestampPlugin(schema, options) {
  schema.add({
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  schema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
  });
}

// Apply to a specific schema
mySchema.plugin(timestampPlugin);

// Apply globally to ALL schemas
mongoose.plugin(timestampPlugin);

// Plugin with options
function softDeletePlugin(schema, options) {
  const field = options?.field || 'deletedAt';
  schema.add({ [field]: { type: Date, default: null } });
  schema.methods.softDelete = function() {
    this[field] = new Date();
    return this.save();
  };
  schema.statics.findActive = function() {
    return this.find({ [field]: null });
  };
}

mySchema.plugin(softDeletePlugin, { field: 'removedAt' });
```

---

## 17. Change Streams

Change streams let you watch for real-time changes in a collection. Requires MongoDB replica set.

```js
// Watch all changes on a collection
const changeStream = User.watch();

changeStream.on('change', (change) => {
  console.log('Operation:', change.operationType); // insert, update, delete
  console.log('Document:', change.fullDocument);
  console.log('Updated fields:', change.updateDescription?.updatedFields);
});

// Watch with filter (aggregation pipeline)
const stream = User.watch([
  { $match: { operationType: { $in: ['insert', 'update'] } } }
]);

// Watch a single document
const stream2 = User.watch([
  { $match: { 'fullDocument._id': mongoose.Types.ObjectId(userId) } }
]);

// Close the stream
changeStream.close();

// Watch with async iterator
async function watchChanges() {
  for await (const change of User.watch()) {
    console.log(change);
    if (shouldStop) break;
  }
}
```

---

## 18. Connection Options & Pooling

```js
await mongoose.connect('mongodb://localhost:27017/mydb', {
  // Connection pool
  maxPoolSize: 10,        // max simultaneous connections (default: 5)
  minPoolSize: 2,         // keep at least 2 connections open
  maxIdleTimeMS: 30000,   // close idle connections after 30s

  // Timeouts
  serverSelectionTimeoutMS: 5000,  // how long to try selecting a server
  socketTimeoutMS: 45000,          // how long to wait for socket response
  connectTimeoutMS: 10000,         // how long to wait for initial connection

  // Auth
  user: 'dbuser',
  pass: 'dbpassword',
  authSource: 'admin',

  // Replica set
  replicaSet: 'rs0',

  // Read preference (for replica sets)
  readPreference: 'secondaryPreferred', // read from secondary if possible

  // Write concern
  w: 'majority',          // wait for majority of replica set to acknowledge
  wtimeoutMS: 5000,
  j: true,                // wait for journal write
});

// Multiple connections
const conn1 = await mongoose.createConnection('mongodb://localhost:27017/db1');
const conn2 = await mongoose.createConnection('mongodb://localhost:27017/db2');

const UserOnConn1 = conn1.model('User', userSchema);
const UserOnConn2 = conn2.model('User', userSchema);
```

---

## Project Structure

```
mongoose practise with all zero to advance/
├── README.md                     ← This file
├── package.json
├── docker-compose.yml
├── .env.example
├── src/
│   ├── config/db.js              ← connect/disconnect helpers
│   ├── models/
│   │   ├── User.js               ← All field types, validation, virtuals, hooks, methods
│   │   ├── Post.js               ← Refs, timestamps, text index, query helpers
│   │   ├── Comment.js            ← Multiple refs, compound index
│   │   ├── Product.js            ← Decimal128, Map, compound index, plugin
│   │   └── Order.js              ← Embedded subdocs, pre-save calc, virtual
│   ├── seed/index.js             ← Seed all models with real data
│   └── server.js                 ← Auto-starts Docker + seeds + prints banner
└── examples/
    ├── 01-basics.js              ← Schema, types, create, save
    ├── 02-crud.js                ← All CRUD operations
    ├── 03-queries.js             ← All query operators and chaining
    ├── 04-middleware.js          ← All hook types
    ├── 05-validation.js          ← All validators + error handling
    ├── 06-populate.js            ← All populate patterns
    ├── 07-aggregation.js         ← Full aggregation pipeline
    └── 08-advanced.js            ← Transactions, discriminators, plugins, change streams
```
