const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');

// Helper function to calculate stock status dynamically based on quantity
const calculateStockStatus = (quantity) => {
  if (quantity === 0) return 'Out Of Stock';
  if (quantity >= 1 && quantity <= 20) return 'Low Stock';
  return 'In Stock';
};

// GET /products - Retrieve all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();
    
    // Add dynamic Stock_Status and reorderAlert to each product object
    const productsWithStatus = products.map(product => {
      const minLevel = product.minStockLevel !== undefined ? product.minStockLevel : 10;
      return {
        ...product,
        Stock_Status: calculateStockStatus(product.Quantity),
        reorderAlert: product.Quantity <= minLevel
      };
    });

    res.status(200).json(productsWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving products', error: error.message });
  }
};

// GET /products/:id - Retrieve a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const minLevel = product.minStockLevel !== undefined ? product.minStockLevel : 10;
    product.Stock_Status = calculateStockStatus(product.Quantity);
    product.reorderAlert = product.Quantity <= minLevel;

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product', error: error.message });
  }
};

// POST /products - Create a new product (Add Stock)
exports.createProduct = async (req, res) => {
  try {
    const { 
      Product_Name, 
      Category, 
      Specification, 
      Quantity, 
      purchasePrice,
      minStockLevel,
      supplier,
      brand,
      grade,
      material,
      batchNumber,
      thickness,
      size
    } = req.body;

    // Validate request inputs
    if (!Product_Name || !Category || Quantity === undefined || purchasePrice === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields (Product Name, Category, Quantity, Purchase Price)' });
    }

    const qty = parseInt(Quantity, 10);
    const price = parseFloat(purchasePrice);
    const minLevel = minStockLevel !== undefined ? parseInt(minStockLevel, 10) : 10;

    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ message: 'Purchase price cannot be negative' });
    }

    // Create the new product
    const product = new Product({
      Product_Name,
      Category,
      Specification: Specification || '',
      Quantity: qty,
      purchasePrice: price,
      minStockLevel: isNaN(minLevel) ? 10 : minLevel,
      supplier: supplier || '',
      brand: brand || '',
      grade: grade || '',
      material: material || '',
      batchNumber: batchNumber || '',
      thickness: thickness || '',
      size: size || ''
    });

    const savedProduct = await product.save();

    // Automatically create a purchase transaction if initial quantity is greater than 0
    if (qty > 0) {
      const transaction = new Transaction({
        Product_ID: savedProduct._id,
        Transaction_Type: 'Purchase',
        Quantity: qty,
        purchasePrice: price,
        sellingPrice: 0,
        revenue: 0,
        cost: price * qty,
        profit: 0,
        profitMargin: 0,
        Transaction_Date: new Date()
      });
      await transaction.save();
    }

    // Create Activity Log
    const log = new ActivityLog({
      username: req.user.username,
      role: req.user.role,
      action: 'Product Added',
      productName: Product_Name,
      details: `Added new industrial product ${Product_Name} (Initial Stock: ${qty} units @ ₹${price.toFixed(2)})`
    });
    await log.save();

    // Return response with dynamic stock status
    const responseProduct = savedProduct.toObject();
    responseProduct.Stock_Status = calculateStockStatus(responseProduct.Quantity);
    responseProduct.reorderAlert = responseProduct.Quantity <= responseProduct.minStockLevel;

    res.status(201).json(responseProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// PUT /products/:id - Update product details (and adjust stock using WAC)
exports.updateProduct = async (req, res) => {
  try {
    const { 
      Product_Name, 
      Category, 
      Specification, 
      Quantity, 
      purchasePrice,
      minStockLevel,
      supplier,
      brand,
      grade,
      material,
      batchNumber,
      thickness,
      size
    } = req.body;

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const oldQuantity = existingProduct.Quantity;
    const oldPrice = existingProduct.purchasePrice;

    if (Product_Name !== undefined) existingProduct.Product_Name = Product_Name;
    if (Category !== undefined) existingProduct.Category = Category;
    if (Specification !== undefined) existingProduct.Specification = Specification;
    if (minStockLevel !== undefined) existingProduct.minStockLevel = parseInt(minStockLevel, 10);
    if (supplier !== undefined) existingProduct.supplier = supplier;
    if (brand !== undefined) existingProduct.brand = brand;
    if (grade !== undefined) existingProduct.grade = grade;
    if (material !== undefined) existingProduct.material = material;
    if (batchNumber !== undefined) existingProduct.batchNumber = batchNumber;
    if (thickness !== undefined) existingProduct.thickness = thickness;
    if (size !== undefined) existingProduct.size = size;

    let qtyDiff = 0;
    let newQty = oldQuantity;
    let inputPrice = purchasePrice !== undefined ? parseFloat(purchasePrice) : oldPrice;

    if (Quantity !== undefined) {
      newQty = parseInt(Quantity, 10);
      if (newQty < 0) {
        return res.status(400).json({ message: 'Quantity cannot be negative' });
      }
      qtyDiff = newQty - oldQuantity;
    }

    // Handle WAC Recalculation if updating quantity directly (for stock replenish)
    if (qtyDiff > 0) {
      // It's a purchase: update WAC
      const totalQty = oldQuantity + qtyDiff;
      let newWac = inputPrice;
      if (totalQty > 0) {
        newWac = ((oldQuantity * oldPrice) + (qtyDiff * inputPrice)) / totalQty;
      }
      existingProduct.purchasePrice = newWac;
      existingProduct.Quantity = totalQty;

      // Log purchase transaction
      const transaction = new Transaction({
        Product_ID: existingProduct._id,
        Transaction_Type: 'Purchase',
        Quantity: qtyDiff,
        purchasePrice: inputPrice,
        sellingPrice: 0,
        revenue: 0,
        cost: inputPrice * qtyDiff,
        profit: 0,
        profitMargin: 0,
        Transaction_Date: new Date()
      });
      await transaction.save();

    } else if (qtyDiff < 0) {
      // It's a sale / deduction: preserve existing WAC
      const absoluteDiff = Math.abs(qtyDiff);
      existingProduct.Quantity = newQty;
      
      // Log sale transaction (defaults selling price to current purchase price to yield 0 profit)
      const transaction = new Transaction({
        Product_ID: existingProduct._id,
        Transaction_Type: 'Sale',
        Quantity: absoluteDiff,
        purchasePrice: oldPrice,
        sellingPrice: oldPrice,
        revenue: oldPrice * absoluteDiff,
        cost: oldPrice * absoluteDiff,
        profit: 0,
        profitMargin: 0,
        Transaction_Date: new Date()
      });
      await transaction.save();
    } else if (purchasePrice !== undefined) {
      // No quantity change, but price was directly updated
      existingProduct.purchasePrice = inputPrice;
    }

    const updatedProduct = await existingProduct.save();

    // Log Activity
    const details = qtyDiff !== 0 
      ? `Updated quantity of ${updatedProduct.Product_Name} from ${oldQuantity} to ${updatedProduct.Quantity} (WAC: ₹${updatedProduct.purchasePrice.toFixed(2)})`
      : `Updated profile details for industrial product ${updatedProduct.Product_Name}`;

    const log = new ActivityLog({
      username: req.user.username,
      role: req.user.role,
      action: 'Product Edited',
      productName: updatedProduct.Product_Name,
      details
    });
    await log.save();

    // Return updated product response
    const responseProduct = updatedProduct.toObject();
    responseProduct.Stock_Status = calculateStockStatus(responseProduct.Quantity);
    responseProduct.reorderAlert = responseProduct.Quantity <= responseProduct.minStockLevel;

    res.status(200).json(responseProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// DELETE /products/:id - Delete a product and its transactions (Owner only)
exports.deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'You are not authorized to delete inventory.' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated transactions
    await Transaction.deleteMany({ Product_ID: req.params.id });

    // Create Activity Log
    const log = new ActivityLog({
      username: req.user.username,
      role: req.user.role,
      action: 'Product Deleted',
      productName: product.Product_Name,
      details: `Deleted industrial product ${product.Product_Name}`
    });
    await log.save();

    res.status(200).json({ message: 'Product and associated transactions deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// GET /products/stats - Calculate dashboard statistics dynamically from database
exports.getDashboardStats = async (req, res) => {
  try {
    const products = await Product.find().lean();
    const transactions = await Transaction.find().lean();

    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let alertsLowStock = 0; // Quantity <= minStockLevel

    products.forEach(product => {
      const status = calculateStockStatus(product.Quantity);
      if (status === 'In Stock') inStock++;
      else if (status === 'Low Stock') lowStock++;
      else if (status === 'Out Of Stock') outOfStock++;

      const minLevel = product.minStockLevel !== undefined ? product.minStockLevel : 10;
      if (product.Quantity <= minLevel) {
        alertsLowStock++;
      }
    });

    // Date filters for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Date filters for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let totalRevenue = 0;
    let totalPurchaseCost = 0;
    let totalProfit = 0;
    let totalLoss = 0;

    let todaySales = 0;
    let todayPurchases = 0;
    let todayRevenue = 0;
    let todayProfit = 0;

    let monthlyRevenue = 0;
    let monthlyProfit = 0;

    transactions.forEach(t => {
      const isToday = t.Transaction_Date >= startOfToday && t.Transaction_Date <= endOfToday;
      const isThisMonth = t.Transaction_Date >= startOfMonth;

      if (t.Transaction_Type === 'Sale') {
        totalRevenue += t.revenue;
        monthlyRevenue += isThisMonth ? t.revenue : 0;
        todayRevenue += isToday ? t.revenue : 0;
        todaySales += isToday ? 1 : 0;

        if (t.profit > 0) {
          totalProfit += t.profit;
          todayProfit += isToday ? t.profit : 0;
          monthlyProfit += isThisMonth ? t.profit : 0;
        } else if (t.profit < 0) {
          const absoluteLoss = Math.abs(t.profit);
          totalLoss += absoluteLoss;
          todayProfit -= isToday ? absoluteLoss : 0;
          monthlyProfit -= isThisMonth ? absoluteLoss : 0;
        }
      } else if (t.Transaction_Type === 'Purchase') {
        totalPurchaseCost += t.cost;
        todayPurchases += isToday ? 1 : 0;
      }
    });

    const netProfit = totalRevenue - (transactions.filter(t => t.Transaction_Type === 'Sale').reduce((acc, curr) => acc + curr.cost, 0));
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    res.status(200).json({
      totalProducts: products.length,
      inStock,
      lowStock,
      outOfStock,
      alertsLowStock,
      totalTransactions: transactions.length,
      totalRevenue,
      totalPurchaseCost,
      totalProfit: netProfit > 0 ? netProfit : 0,
      totalLoss: netProfit < 0 ? Math.abs(netProfit) : totalLoss,
      profitMargin,
      todaySales,
      todayPurchases,
      todayRevenue,
      todayProfit,
      monthlyRevenue,
      monthlyProfit
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating statistics', error: error.message });
  }
};

// GET /products/reports-stats - Advanced stats, month metrics, and charts lists
exports.getReportsStats = async (req, res) => {
  try {
    const products = await Product.find().lean();
    const transactions = await Transaction.find().populate('Product_ID').lean();
    
    // 1. Calculate Inventory Value using WAC
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    const lowStockProductsList = [];

    products.forEach(p => {
      totalInventoryValue += p.Quantity * p.purchasePrice;
      const minLevel = p.minStockLevel !== undefined ? p.minStockLevel : 10;
      if (p.Quantity <= minLevel) {
        lowStockCount++;
        lowStockProductsList.push({
          _id: p._id,
          Product_Name: p.Product_Name,
          Quantity: p.Quantity,
          Threshold: minLevel,
          Status: p.Quantity === 0 ? 'Out of Stock' : 'Reorder Required'
        });
      }
    });

    // 2. Financial Metrics
    let totalRevenue = 0;
    let totalPurchaseCost = 0;
    let totalSalesQty = 0;
    let totalPurchaseQty = 0;

    const monthlyStats = {};
    const dailySales = {};
    const productStats = {};

    transactions.forEach(t => {
      const date = new Date(t.Transaction_Date);
      
      // Grouping Keys
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // e.g. "Jul 2026"
      const dayKey = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); // e.g. "15 Jul 2026"

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { revenue: 0, costOfSales: 0, profit: 0, purchasesCost: 0 };
      }

      if (t.Transaction_Type === 'Sale') {
        totalRevenue += t.revenue;
        totalSalesQty += t.Quantity;

        monthlyStats[monthKey].revenue += t.revenue;
        monthlyStats[monthKey].costOfSales += t.cost;
        monthlyStats[monthKey].profit += t.profit;

        dailySales[dayKey] = (dailySales[dayKey] || 0) + t.Quantity;

        const prodId = t.Product_ID ? t.Product_ID._id.toString() : 'deleted';
        const prodName = t.Product_ID ? t.Product_ID.Product_Name : 'Deleted Product';

        if (!productStats[prodId]) {
          productStats[prodId] = { name: prodName, soldQty: 0, profit: 0 };
        }
        productStats[prodId].soldQty += t.Quantity;
        productStats[prodId].profit += t.profit;

      } else if (t.Transaction_Type === 'Purchase') {
        totalPurchaseCost += t.cost;
        totalPurchaseQty += t.Quantity;
        monthlyStats[monthKey].purchasesCost += t.cost;
      }
    });

    const netProfit = totalRevenue - (transactions.filter(t => t.Transaction_Type === 'Sale').reduce((acc, curr) => acc + curr.cost, 0));
    const netLoss = netProfit < 0 ? Math.abs(netProfit) : 0;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 3. Advanced Monthly Analytics
    let highestProfitMonth = '-';
    let leastProfitableMonth = '-';
    let highestRevenueMonth = '-';

    let maxProfit = -Infinity;
    let minProfit = Infinity;
    let maxRevenue = -Infinity;

    Object.keys(monthlyStats).forEach(month => {
      const stats = monthlyStats[month];
      if (stats.revenue > maxRevenue) {
        maxRevenue = stats.revenue;
        highestRevenueMonth = month;
      }
      if (stats.profit > maxProfit) {
        maxProfit = stats.profit;
        highestProfitMonth = month;
      }
      if (stats.profit < minProfit) {
        minProfit = stats.profit;
        leastProfitableMonth = month;
      }
    });

    if (maxProfit === -Infinity) highestProfitMonth = '-';
    if (minProfit === Infinity) leastProfitableMonth = '-';
    if (maxRevenue === -Infinity) highestRevenueMonth = '-';

    // 4. Highest Selling Day
    let highestSellingDay = '-';
    let maxDaySales = 0;
    Object.keys(dailySales).forEach(day => {
      if (dailySales[day] > maxDaySales) {
        maxDaySales = dailySales[day];
        highestSellingDay = day;
      }
    });

    // 5. Best Selling & Highest Profit Products
    let bestSellingProduct = '-';
    let highestProfitProduct = '-';

    let maxSoldQty = 0;
    let maxProdProfit = -Infinity;

    Object.keys(productStats).forEach(pid => {
      const stats = productStats[pid];
      if (stats.soldQty > maxSoldQty) {
        maxSoldQty = stats.soldQty;
        bestSellingProduct = stats.name;
      }
      if (stats.profit > maxProdProfit) {
        maxProdProfit = stats.profit;
        highestProfitProduct = stats.name;
      }
    });

    if (maxProdProfit === -Infinity) highestProfitProduct = '-';

    // 6. Top Selling & Top Profitable Lists (top 5)
    const topSellingProducts = Object.values(productStats)
      .sort((a, b) => b.soldQty - a.soldQty)
      .slice(0, 5)
      .map(p => ({ Product_Name: p.name, Quantity: p.soldQty }));

    const topProfitableProducts = Object.values(productStats)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)
      .map(p => ({ Product_Name: p.name, Profit: p.profit }));

    // 7. Inventory Turnover Ratio
    // COGS = Cost of goods sold (cost of all sales transactions)
    const cogs = transactions
      .filter(t => t.Transaction_Type === 'Sale')
      .reduce((acc, curr) => acc + curr.cost, 0);

    const turnoverRatio = totalInventoryValue > 0 ? (cogs / totalInventoryValue) : 0;

    // 8. Monthly stats array sorted chronologically
    const monthlyRevenueAndProfit = Object.keys(monthlyStats)
      .map(month => ({
        month,
        revenue: monthlyStats[month].revenue,
        profit: monthlyStats[month].profit,
        cost: monthlyStats[month].costOfSales
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));

    // 9. Inventory Distribution (product names vs stock value)
    const inventoryValueDistribution = products.map(p => ({
      name: p.Product_Name,
      value: p.Quantity * p.purchasePrice
    })).filter(item => item.value > 0);

    res.status(200).json({
      totalProducts: products.length,
      totalInventoryValue,
      totalRevenue,
      totalPurchaseCost,
      netProfit: netProfit > 0 ? netProfit : 0,
      netLoss,
      profitMargin,
      lowStockCount,
      lowStockProductsList,
      bestSellingProduct,
      highestProfitProduct,
      highestSellingDay,
      highestRevenueMonth,
      highestProfitMonth,
      leastProfitableMonth,
      turnoverRatio,
      totalPurchaseQty,
      totalSoldQty,
      currentInventoryQty: products.reduce((acc, curr) => acc + curr.Quantity, 0),
      topSellingProducts,
      topProfitableProducts,
      monthlyRevenueAndProfit,
      inventoryValueDistribution
    });
  } catch (error) {
    res.status(500).json({ message: 'Error compiling reports statistics', error: error.message });
  }
};
