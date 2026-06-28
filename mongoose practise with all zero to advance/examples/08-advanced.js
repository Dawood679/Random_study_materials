'use strict';
/**
 * 08 — ADVANCED TOPICS
 * Topics: Transactions & Sessions, Discriminators, Schema Plugins,
 *         Indexes, Instance/Static/Query methods, Change Streams (demo)
 */
const { connect, disconnect, MONGO_URI } = require('../src/config/db');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Post = require('../src/models/Post');

async function run() {
  await connect();

  // ══════════════════════════════════════════════════════════════════
  // 1. INSTANCE METHODS, STATIC METHODS, QUERY HELPERS
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── INSTANCE / STATIC / QUERY METHODS ──────────');

  // Static method: User.findByEmail()
  const admin = await User.findByEmail('ali@example.com');
  console.log('Static findByEmail():', admin?.fullName, admin?.role);

  // Static method: User.findAdmins()
  const admins = await User.findAdmins();
  console.log('Static findAdmins():', admins.map((u) => u.firstName));

  // Instance method: user.comparePassword()
  if (admin) {
    const withPwd = await User.findById(admin._id).select('+password');
    const isMatch = await withPwd.comparePassword('password123');
    console.log('Instance comparePassword():', isMatch);

    const safeObj = withPwd.toSafeObject();
    console.log('Instance toSafeObject() — has password?', 'password' in safeObj);
  }

  // Query helpers: .active(), .byRole()
  const activeUsers = await User.find().active().select('firstName isActive');
  console.log('Query helper .active():', activeUsers.map((u) => u.firstName));

  const mods = await User.find().byRole('moderator').select('firstName role');
  console.log('Query helper .byRole("moderator"):', mods.map((u) => u.firstName));

  // Post query helper + static
  const publishedPosts = await Post.find().published().limit(3).select('title');
  console.log('Post query helper .published():', publishedPosts.map((p) => p.title.substring(0, 30)));

  const taggedPosts = await Post.findByTag('mongoose');
  console.log('Post static findByTag("mongoose"):', taggedPosts.map((p) => p.title.substring(0, 30)));

  // ══════════════════════════════════════════════════════════════════
  // 2. TRANSACTIONS & SESSIONS
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── TRANSACTIONS & SESSIONS ─────────────────────');

  // Transactions require a replica set or mongos. In standalone mode, they throw.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customer = await User.findOne({ role: 'user' });
    const product = await Product.findOne({ stock: { $gt: 0 } });

    if (!customer || !product) throw new Error('No customer or product found');

    // All operations use the session
    const [newOrder] = await Order.create(
      [
        {
          customer: customer._id,
          items: [
            {
              product: product._id,
              productName: product.name,
              quantity: 1,
              unitPrice: parseFloat(product.price.toString()),
            },
          ],
          status: 'pending',
          paymentMethod: 'card',
        },
      ],
      { session }
    );

    // Decrement stock
    await Product.updateOne(
      { _id: product._id },
      { $inc: { stock: -1 } },
      { session }
    );

    await session.commitTransaction();
    console.log('Transaction committed! Order:', newOrder._id, '— Product stock decremented');

    // Cleanup
    await Order.deleteOne({ _id: newOrder._id });
    await Product.updateOne({ _id: product._id }, { $inc: { stock: 1 } }); // restore
  } catch (err) {
    await session.abortTransaction();
    console.log('Transaction aborted (expected on standalone):', err.message);
  } finally {
    session.endSession();
  }

  // ══════════════════════════════════════════════════════════════════
  // 3. DISCRIMINATORS (Schema Inheritance)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── DISCRIMINATORS ──────────────────────────────');

  // Base schema
  const notificationSchema = new mongoose.Schema(
    {
      recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      message: { type: String, required: true },
      isRead: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false, discriminatorKey: 'type' }
  );

  const Notification = mongoose.model('Notification', notificationSchema);

  // Discriminator 1: Email notification (extra fields)
  const EmailNotification = Notification.discriminator(
    'EmailNotification',
    new mongoose.Schema({
      subject: { type: String, required: true },
      emailTo: { type: String, required: true },
    }, { versionKey: false })
  );

  // Discriminator 2: SMS notification
  const SmsNotification = Notification.discriminator(
    'SmsNotification',
    new mongoose.Schema({
      phoneNumber: { type: String, required: true },
    }, { versionKey: false })
  );

  const user = await User.findOne();
  if (user) {
    // All stored in same 'notifications' collection, distinguished by 'type' field
    const emailNotif = await EmailNotification.create({
      recipient: user._id,
      message: 'Your order has been shipped!',
      subject: 'Order Update',
      emailTo: user.email,
    });

    const smsNotif = await SmsNotification.create({
      recipient: user._id,
      message: 'OTP: 123456',
      phoneNumber: '+92-300-0000000',
    });

    console.log('EmailNotification type:', emailNotif.type, '— subject:', emailNotif.subject);
    console.log('SmsNotification type:', smsNotif.type, '— phone:', smsNotif.phoneNumber);

    // Query all notifications for user (includes all subtypes)
    const allNotifs = await Notification.find({ recipient: user._id });
    console.log('All notifications (base model):', allNotifs.map((n) => n.type));

    // Query only email notifications
    const emailOnly = await EmailNotification.find({ recipient: user._id });
    console.log('EmailNotification only:', emailOnly.length);

    await Notification.deleteMany({ recipient: user._id });
  }

  // ══════════════════════════════════════════════════════════════════
  // 4. SCHEMA PLUGINS
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── SCHEMA PLUGINS ──────────────────────────────');

  // A plugin adds reusable functionality across schemas
  function softDeletePlugin(schema) {
    schema.add({ deletedAt: { type: Date, default: null } });
    schema.methods.softDelete = function () {
      this.deletedAt = new Date();
      return this.save();
    };
    schema.methods.restore = function () {
      this.deletedAt = null;
      return this.save();
    };
    schema.statics.findActive = function () {
      return this.find({ deletedAt: null });
    };
  }

  const taskSchema = new mongoose.Schema({ title: String }, { versionKey: false });
  taskSchema.plugin(softDeletePlugin);
  const Task = mongoose.model('Task', taskSchema);

  const t = await Task.create({ title: 'Learn Mongoose' });
  console.log('Before softDelete — deletedAt:', t.deletedAt);

  await t.softDelete();
  console.log('After softDelete — deletedAt:', t.deletedAt);

  const activeTasks = await Task.findActive();
  console.log('findActive() count (should be 0):', activeTasks.length);

  await t.restore();
  console.log('After restore — deletedAt:', t.deletedAt);

  // Product model already uses the auditPlugin
  const prod = await Product.findOne();
  if (prod) {
    prod.addAuditEntry('Price updated');
    prod.addAuditEntry('Stock adjusted');
    // Note: auditLog is added by the plugin, not part of original schema
    console.log('Product audit log:', prod.auditLog);
  }

  // ══════════════════════════════════════════════════════════════════
  // 5. INDEX INFORMATION
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── INDEXES ─────────────────────────────────────');
  const userIndexes = await User.collection.indexes();
  console.log('User indexes:', userIndexes.map((i) => `${JSON.stringify(i.key)} unique:${!!i.unique}`));

  const postIndexes = await Post.collection.indexes();
  console.log('Post indexes:', postIndexes.map((i) => `${JSON.stringify(i.key)}`));

  // ══════════════════════════════════════════════════════════════════
  // 6. CHANGE STREAMS (observe real-time changes — standalone mode demo)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── CHANGE STREAMS (demo — requires replica set) ─');
  try {
    const stream = User.watch();
    stream.on('change', (change) => {
      console.log('[changestream] Change detected:', change.operationType);
    });

    // Trigger a change
    const tempUser = await User.create({
      firstName: 'Stream',
      lastName: 'Test',
      email: `stream_${Date.now()}@test.com`,
      password: 'abc123',
    });
    await new Promise((r) => setTimeout(r, 300));
    await User.deleteOne({ _id: tempUser._id });
    await new Promise((r) => setTimeout(r, 300));
    stream.close();
    console.log('Change stream opened and closed');
  } catch (err) {
    console.log('Change streams require a replica set:', err.message.substring(0, 80));
  }

  // Cleanup
  await Task.deleteMany({});
  await disconnect();
}

run().catch(console.error);
