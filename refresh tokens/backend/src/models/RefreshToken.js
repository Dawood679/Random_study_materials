'use strict';

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    // The signed JWT string itself.
    // Production tip: store SHA-256 hash of the token instead of the raw token
    // so a DB breach doesn't expose usable tokens.
    token: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // When true, this token is permanently dead (logout / rotation)
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

// TTL index: MongoDB automatically deletes expired documents
// (runs every ~60 seconds — tokens may linger up to a minute after expiry)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for fast lookup during refresh + for revoking all user tokens
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
