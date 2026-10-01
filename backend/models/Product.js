const mongoose = require('mongoose');

// Define Product schema
const productSchema = new mongoose.Schema({
  Product_Name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  Category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  Specification: {
    type: String,
    trim: true,
    default: ''
  },
  Quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative'],
    default: 0
  },
  Unit_Price: {
    type: Number,
    min: [0, 'Unit price cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock level cannot be negative']
  },
  supplier: {
    type: String,
    trim: true,
    default: ''
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  grade: {
    type: String,
    trim: true,
    default: ''
  },
  material: {
    type: String,
    trim: true,
    default: ''
  },
  batchNumber: {
    type: String,
    trim: true,
    default: ''
  },
  thickness: {
    type: String,
    trim: true,
    default: ''
  },
  size: {
    type: String,
    trim: true,
    default: ''
  },
  Created_At: {
    type: Date,
    default: Date.now
  }
});

// Middleware to sync Unit_Price and purchasePrice before saving
productSchema.pre('save', function (next) {
  if (this.purchasePrice !== undefined) {
    this.Unit_Price = this.purchasePrice;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
