const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');

// GET /transactions - Retrieve all transactions (sorted newest first, populated with product name/info)
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('Product_ID', 'Product_Name Category')
      .sort({ Transaction_Date: -1 })
      .lean();

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving transactions', error: error.message });
  }
};

// POST /transactions - Record a transaction ('Purchase' or 'Sale') and update product quantity and WAC
exports.createTransaction = async (req, res) => {
  try {
    const { Product_ID, Transaction_Type, Quantity, Transaction_Date, purchasePrice, sellingPrice } = req.body;

    // Validate request inputs
    if (!Product_ID || !Transaction_Type || Quantity === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const qty = parseInt(Quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive integer greater than zero' });
    }

    if (Transaction_Type !== 'Purchase' && Transaction_Type !== 'Sale') {
      return res.status(400).json({ message: 'Transaction type must be Purchase or Sale' });
    }

    // Check if the product exists
    const product = await Product.findById(Product_ID);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let transPurchasePrice = 0;
    let transSellingPrice = 0;
    let revenue = 0;
    let cost = 0;
    let profit = 0;
    let profitMargin = 0;
    let logDetails = '';

    if (Transaction_Type === 'Sale') {
      if (sellingPrice === undefined || parseFloat(sellingPrice) < 0) {
        return res.status(400).json({ message: 'A valid non-negative selling price is required for sales' });
      }

      if (product.Quantity < qty) {
        return res.status(400).json({ 
          message: `Insufficient stock for sale. Current stock: ${product.Quantity}. Requested: ${qty}.` 
        });
      }

      transSellingPrice = parseFloat(sellingPrice);
      transPurchasePrice = product.purchasePrice; // Retrieve active Weighted Average Cost (WAC)
      
      cost = transPurchasePrice * qty;
      revenue = transSellingPrice * qty;
      profit = revenue - cost;
      profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      // Deduct quantity
      product.Quantity -= qty;
      await product.save();

      logDetails = `Sold ${qty} units of ${product.Product_Name} @ ₹${transSellingPrice.toFixed(2)} (Cost: ₹${transPurchasePrice.toFixed(2)}, Profit: ₹${profit.toFixed(2)})`;

    } else if (Transaction_Type === 'Purchase') {
      if (purchasePrice === undefined || parseFloat(purchasePrice) < 0) {
        return res.status(400).json({ message: 'A valid non-negative purchase price is required for purchases' });
      }

      const inputPurchasePrice = parseFloat(purchasePrice);
      const existingQty = product.Quantity;
      const existingPrice = product.purchasePrice;

      // Calculate Weighted Average Cost (WAC)
      const totalQty = existingQty + qty;
      let newWac = inputPurchasePrice;
      if (totalQty > 0) {
        newWac = ((existingQty * existingPrice) + (qty * inputPurchasePrice)) / totalQty;
      }

      transPurchasePrice = inputPurchasePrice;
      transSellingPrice = 0;
      cost = inputPurchasePrice * qty;
      revenue = 0;
      profit = 0;
      profitMargin = 0;

      // Update product quantity and WAC
      product.Quantity = totalQty;
      product.purchasePrice = newWac;
      await product.save();

      logDetails = `Purchased ${qty} units of ${product.Product_Name} @ ₹${inputPurchasePrice.toFixed(2)} (New WAC: ₹${newWac.toFixed(2)})`;
    }

    // Save the transaction
    const transaction = new Transaction({
      Product_ID,
      Transaction_Type,
      Quantity: qty,
      purchasePrice: transPurchasePrice,
      sellingPrice: transSellingPrice,
      revenue,
      cost,
      profit,
      profitMargin,
      Transaction_Date: Transaction_Date || new Date()
    });

    const savedTransaction = await transaction.save();

    // Log this activity to ActivityLog
    const actionType = Transaction_Type === 'Purchase' ? 'Product Edited' : 'Product Edited';
    const log = new ActivityLog({
      username: req.user.username,
      role: req.user.role,
      action: actionType,
      productName: product.Product_Name,
      details: logDetails
    });
    await log.save();
    
    // Return saved transaction populated with product name
    const responseTransaction = await Transaction.findById(savedTransaction._id)
      .populate('Product_ID', 'Product_Name Category')
      .lean();

    res.status(201).json(responseTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Error creating transaction', error: error.message });
  }
};
