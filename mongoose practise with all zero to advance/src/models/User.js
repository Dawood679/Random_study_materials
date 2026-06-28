'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Schema ────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // String with minlength, maxlength, trim
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    // String with match (regex) validator
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    // String with enum validator
    role: {
      type: String,
      enum: {
        values: ['admin', 'moderator', 'user'],
        message: '{VALUE} is not a valid role',
      },
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },
    // Number with min/max
    age: {
      type: Number,
      min: [13, 'Must be at least 13 years old'],
      max: [120, 'Age cannot exceed 120'],
    },
    // Boolean
    isActive: {
      type: Boolean,
      default: true,
    },
    // Date
    lastLogin: {
      type: Date,
      default: null,
    },
    // Custom validator
    phone: {
      type: String,
      validate: {
        validator(v) {
          return !v || /^\+?[\d\s\-()]{7,15}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number`,
      },
    },
    // Array of strings
    interests: [String],
    // Nested object (subdocument)
    address: {
      street: String,
      city: String,
      country: { type: String, default: 'Pakistan' },
    },
  },
  {
    // Schema options
    timestamps: true,       // adds createdAt and updatedAt
    versionKey: false,      // removes __v field
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual ───────────────────────────────────────────────────────────────────
// Virtual property: not stored in DB, computed on the fly
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual populate — will show posts written by this user (defined in Post model)
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
});

// ── Middleware / Hooks ────────────────────────────────────────────────────────
// Pre-save hook: hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Post-save hook: runs after document is saved
userSchema.post('save', function (doc) {
  console.log(`[hook] User saved: ${doc.email}`);
});

// Pre-find hook: only return active users by default
// (commented out so examples work without needing isActive filter)
// userSchema.pre(/^find/, function (next) {
//   this.find({ isActive: true });
//   next();
// });

// ── Instance Methods ──────────────────────────────────────────────────────────
// Called on a document instance: user.comparePassword(...)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ── Static Methods ────────────────────────────────────────────────────────────
// Called on the Model: User.findByEmail(...)
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findAdmins = function () {
  return this.find({ role: 'admin' });
};

// ── Query Helpers ─────────────────────────────────────────────────────────────
// Chainable on queries: User.find().active().sort(...)
userSchema.query.active = function () {
  return this.where({ isActive: true });
};

userSchema.query.byRole = function (role) {
  return this.where({ role });
};

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 }); // compound index

const User = mongoose.model('User', userSchema);
module.exports = User;
