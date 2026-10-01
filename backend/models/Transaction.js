const mongoose = require('mongoose');

// Define Transaction schema
const transactionSchema = new mongoose.Schema({
  Product_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  Transaction_Type: {
    type: String,
    enum: ['Purchase', 'Sale'],
    required: [true, 'Transaction type is required']
  },
  Quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price at transaction is required'],
    min: [0, 'Purchase price cannot be negative'],
    default: 0
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative'],
    default: 0
  },
  revenue: {
    type: Number,
    min: [0, 'Revenue cannot be negative'],
    default: 0
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  Transaction_Date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
