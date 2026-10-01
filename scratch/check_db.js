const mongoose = require('mongoose');
const Product = require('../backend/models/Product');
const Transaction = require('../backend/models/Transaction');

const checkDB = async () => {
  try {
    const connURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocksphere';
    await mongoose.connect(connURI);
    console.log('Connected to MongoDB');

    const products = await Product.find().lean();
    console.log('\n--- PRODUCTS ---');
    products.forEach(p => {
      console.log(`ID: ${p._id}, Name: ${p.Product_Name}, Qty: ${p.Quantity}, PurchasePrice: ${p.purchasePrice}`);
    });

    const transactions = await Transaction.find().lean();
    console.log('\n--- TRANSACTIONS ---');
    transactions.forEach(t => {
      console.log(`ID: ${t._id}, Product: ${t.Product_ID}, Type: ${t.Transaction_Type}, Qty: ${t.Quantity}, Cost: ${t.cost}, Rev: ${t.revenue}, Profit: ${t.profit}, Price: ${t.purchasePrice}, SellPrice: ${t.sellingPrice}`);
    });

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
};

checkDB();
