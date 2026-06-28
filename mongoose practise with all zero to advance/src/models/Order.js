'use strict';
const mongoose = require('mongoose');

// ── Embedded subdocument schema for order items ───────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: String, // denormalized snapshot at time of purchase
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: Number,
  },
  { _id: true, versionKey: false }
);

// ── Main Order schema ─────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Array of embedded subdocuments
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    // Auto-calculated total
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    // Mixed type — any shape of data allowed
    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'easypaisa', 'jazzcash'],
      default: 'cash',
    },
    notes: String,
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual ───────────────────────────────────────────────────────────────────
orderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// ── Pre-save: calculate subtotals and total ───────────────────────────────────
orderSchema.pre('save', function (next) {
  this.items.forEach((item) => {
    item.subtotal = item.quantity * item.unitPrice;
  });
  this.totalAmount = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// ── Static Methods ────────────────────────────────────────────────────────────
orderSchema.statics.findByCustomer = function (customerId) {
  return this.find({ customer: customerId }).sort({ createdAt: -1 });
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
