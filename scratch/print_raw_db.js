const mongoose = require('mongoose');

const printRaw = async () => {
  try {
    const connURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocksphere';
    await mongoose.connect(connURI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    const products = await db.collection('products').find().toArray();
    console.log('\n--- RAW PRODUCTS ---');
    console.log(JSON.stringify(products.slice(0, 3), null, 2));

    const transactions = await db.collection('transactions').find().toArray();
    console.log('\n--- RAW TRANSACTIONS ---');
    console.log(JSON.stringify(transactions.slice(0, 3), null, 2));

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
};

printRaw();
