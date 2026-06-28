'use strict';
const mongoose = require('mongoose');

// ── Plugin: adds an `auditLog` field to any schema ───────────────────────────
function auditPlugin(schema) {
  schema.add({ auditLog: { type: [String], default: [] } });
  schema.methods.addAuditEntry = function (entry) {
    this.auditLog.push(`${new Date().toISOString()} — ${entry}`);
  };
}

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: String,
    // Decimal128 for precise monetary values
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => parseFloat(v.toString()),   // auto-convert when reading
    },
    // Number
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    category: {
      type: String,
      enum: ['electronics', 'clothing', 'books', 'food', 'sports', 'other'],
      default: 'other',
    },
    // Map type: flexible key-value store (e.g. specifications)
    specs: {
      type: Map,
      of: String,
    },
    // Array of nested subdocuments
    images: [
      {
        url: String,
        altText: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // Sparse index example: only index docs that have this field
    sku: {
      type: String,
      sparse: true,
    },
    // TTL index example: document auto-deleted after this date
    expiresAt: {
      type: Date,
      default: null,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { getters: true }, // enables the Decimal128 getter
    toObject: { getters: true },
  }
);

// ── Apply plugin ──────────────────────────────────────────────────────────────
productSchema.plugin(auditPlugin);

// ── Indexes ───────────────────────────────────────────────────────────────────
productSchema.index({ name: 1, category: 1 });          // compound
productSchema.index({ sku: 1 }, { sparse: true });       // sparse
productSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
productSchema.index({ name: 'text', description: 'text' }); // text search

// ── Pre-save: auto-generate slug from name ────────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
  next();
});

// ── Static Methods ────────────────────────────────────────────────────────────
productSchema.statics.findByCategory = function (category) {
  return this.find({ category, isAvailable: true });
};

productSchema.statics.search = function (term) {
  return this.find({ $text: { $search: term } }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
