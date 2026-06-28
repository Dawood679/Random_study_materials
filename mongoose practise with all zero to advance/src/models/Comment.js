'use strict';
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
      trim: true,
    },
    // Two ObjectId refs — links to both User and Post
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    // Self-referencing: reply to another comment
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

// ── Post-find middleware ──────────────────────────────────────────────────────
commentSchema.post('find', function (docs) {
  // Example: post-find hook fires after every find()
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
