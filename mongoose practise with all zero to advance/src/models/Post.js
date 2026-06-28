'use strict';
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    // ObjectId ref to User model
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Array of strings (tags)
    tags: {
      type: [String],
      default: [],
    },
    // Enum for status
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    // Number
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    // Array of ObjectIds (many-to-many style)
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: comments count (via virtual populate) ───────────────────────────
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
});

// ── Text Index (for full-text search) ────────────────────────────────────────
postSchema.index({ title: 'text', content: 'text', tags: 'text' });
postSchema.index({ author: 1, status: 1 }); // compound index
postSchema.index({ createdAt: -1 });         // sort index

// ── Query Helper ─────────────────────────────────────────────────────────────
postSchema.query.published = function () {
  return this.where({ status: 'published' });
};

// ── Static Method ─────────────────────────────────────────────────────────────
postSchema.statics.findByTag = function (tag) {
  return this.find({ tags: tag, status: 'published' });
};

// ── Pre-save middleware ───────────────────────────────────────────────────────
postSchema.pre('save', function (next) {
  // normalize tags to lowercase
  if (this.isModified('tags')) {
    this.tags = this.tags.map((t) => t.toLowerCase().trim());
  }
  next();
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
