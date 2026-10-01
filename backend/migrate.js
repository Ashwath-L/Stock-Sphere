const mongoose = require('mongoose');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');

const migrate = async () => {
  try {
    const connURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocksphere';
    await mongoose.connect(connURI);
    console.log('Connected to MongoDB for migration');

    // 1. Migrate Products using lean to see raw DB values
    const rawProducts = await Product.find().lean();
    console.log(`Found ${rawProducts.length} raw products to check`);
    for (const raw of rawProducts) {
      let updated = false;
      const doc = await Product.findById(raw._id);
      
      // If purchasePrice is missing or default 0, but Unit_Price exists
      if ((raw.purchasePrice === undefined || raw.purchasePrice === null || raw.purchasePrice === 0) && raw.Unit_Price > 0) {
        doc.purchasePrice = raw.Unit_Price;
        updated = true;
      }
      if (raw.Unit_Price === undefined || raw.Unit_Price === null || raw.Unit_Price === 0) {
        doc.Unit_Price = doc.purchasePrice || raw.Unit_Price || 0;
        updated = true;
      }
      if (updated) {
        await doc.save();
        console.log(`Migrated product: ${doc.Product_Name} (purchasePrice: ${doc.purchasePrice}, Unit_Price: ${doc.Unit_Price})`);
      }
    }

    // 2. Migrate Transactions using lean to see raw DB values
    const rawTransactions = await Transaction.find().lean();
    console.log(`Found ${rawTransactions.length} raw transactions to check`);
    for (const raw of rawTransactions) {
      let updated = false;
      const doc = await Transaction.findById(raw._id);
      
      const product = await Product.findById(raw.Product_ID);
      const activePrice = product ? (product.purchasePrice || product.Unit_Price || 0) : 100; // default to 100 if product not found

      if (raw.purchasePrice === undefined || raw.purchasePrice === null || raw.purchasePrice === 0) {
        doc.purchasePrice = activePrice;
        updated = true;
      }
      if (raw.sellingPrice === undefined || raw.sellingPrice === null || raw.sellingPrice === 0) {
        // If it's a sale, set a default markup of 20%, otherwise 0
        doc.sellingPrice = raw.Transaction_Type === 'Sale' ? (doc.purchasePrice || activePrice) * 1.2 : 0;
        updated = true;
      }
      if (raw.cost === undefined || raw.cost === null || raw.cost === 0) {
        doc.cost = doc.purchasePrice * raw.Quantity;
        updated = true;
      }
      if (raw.revenue === undefined || raw.revenue === null || raw.revenue === 0) {
        doc.revenue = raw.Transaction_Type === 'Sale' ? (doc.sellingPrice * raw.Quantity) : 0;
        updated = true;
      }
      if (raw.profit === undefined || raw.profit === null || raw.profit === 0) {
        doc.profit = raw.Transaction_Type === 'Sale' ? (doc.revenue - doc.cost) : 0;
        updated = true;
      }
      if (raw.profitMargin === undefined || raw.profitMargin === null || raw.profitMargin === 0) {
        doc.profitMargin = raw.Transaction_Type === 'Sale' && doc.revenue > 0 ? (doc.profit / doc.revenue) * 100 : 0;
        updated = true;
      }

      if (updated) {
        await doc.save();
        console.log(`Migrated transaction: ID ${doc._id} Type ${doc.Transaction_Type} (Cost: ${doc.cost}, Revenue: ${doc.revenue}, Profit: ${doc.profit})`);
      }
    }

    console.log('Migration completed successfully.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();
