// Base API URL (uses relative paths since frontend is served statically by the same Express server)
const API_URL = '/api';

// Create alert-container if it doesn't exist
let alertContainer = document.querySelector('.alert-container');
if (!alertContainer) {
  alertContainer = document.createElement('div');
  alertContainer.className = 'alert-container';
  document.body.appendChild(alertContainer);
}

// Global alert notification utility
function showAlert(title, desc, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert-toast ${type}`;
  
  let iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-times-circle';
  if (type === 'warning') iconClass = 'fa-exclamation-triangle';

  toast.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <div class="alert-content">
      <div class="alert-title">${title}</div>
      <div class="alert-desc">${desc}</div>
    </div>
    <button class="alert-close"><i class="fas fa-times"></i></button>
  `;

  alertContainer.appendChild(toast);

  // Close button handler
  toast.querySelector('.alert-close').addEventListener('click', () => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  });

  // Auto remove after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// Utility to shorten MongoDB Object ID for display
function getShortId(id) {
  if (!id) return '';
  return id.slice(-6).toUpperCase();
}

// Utility to format ISO dates to readable string
function formatDate(dateString) {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Helper to construct authorization headers for fetch requests
function getAuthHeaders() {
  const token = localStorage.getItem('stocksphere_jwt_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Parse JWT token payload on client-side
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// ROUTE GUARD / AUTHENTICATION CHECK
function checkAuth() {
  const token = localStorage.getItem('stocksphere_jwt_token');
  const path = window.location.pathname;
  const isLoginPage = path.endsWith('index.html') || path === '/' || path === '';

  if (!token) {
    if (!isLoginPage) {
      window.location.href = 'index.html';
    }
  } else {
    const payload = parseJwt(token);
    const isExpired = payload && payload.exp ? (Date.now() >= payload.exp * 1000) : true;

    if (isExpired) {
      localStorage.clear();
      if (!isLoginPage) {
        window.location.href = 'index.html';
      }
    } else if (isLoginPage) {
      window.location.href = 'home.html';
    }
  }
}

// Add event listener for logout buttons
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      showAlert('Logged Out', 'Successfully logged out of StockSphere.', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    });
  }
}

// Highlight active navbar link
function highlightActiveNav() {
  const path = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    if (section && href.includes(`section=${section}`)) {
      link.classList.add('active');
    } else if (!section && href.endsWith('home.html') && path.endsWith('home.html')) {
      link.classList.add('active');
    } else if (!section && !href.includes('section=') && path.includes(href) && !href.endsWith('home.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Render the navbar header dynamically depending on user role
function renderNavbar() {
  const navMenu = document.querySelector('.nav-menu');
  if (!navMenu) return;

  const role = localStorage.getItem('stocksphere_user_role');
  const username = localStorage.getItem('stocksphere_username');

  let menuHTML = '';

  if (role === 'owner') {
    menuHTML = `
      <li><a href="home.html" class="nav-link"><i class="fas fa-home"></i> Dashboard</a></li>
      <li><a href="inventory.html" class="nav-link"><i class="fas fa-boxes-stacked"></i> Inventory</a></li>
      <li><a href="manage-stock.html" class="nav-link"><i class="fas fa-plus-circle"></i> Manage Stock</a></li>
      <li><a href="sales.html" class="nav-link"><i class="fas fa-receipt"></i> Sales Records</a></li>
      <li><a href="home.html?section=reports" class="nav-link"><i class="fas fa-chart-line"></i> Reports</a></li>
      <li><a href="home.html?section=admin" class="nav-link"><i class="fas fa-users-cog"></i> Admin Management</a></li>
      <li><a href="home.html?section=activity" class="nav-link"><i class="fas fa-history"></i> Activity Log</a></li>
      <li><span class="nav-profile"><i class="fas fa-user-shield"></i> Owner: ${username}</span></li>
      <li><button id="logout-btn" class="btn-logout"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
    `;
  } else {
    menuHTML = `
      <li><a href="home.html" class="nav-link"><i class="fas fa-home"></i> Dashboard</a></li>
      <li><a href="inventory.html" class="nav-link"><i class="fas fa-boxes-stacked"></i> Inventory</a></li>
      <li><a href="manage-stock.html" class="nav-link"><i class="fas fa-plus-circle"></i> Manage Stock</a></li>
      <li><a href="sales.html" class="nav-link"><i class="fas fa-receipt"></i> Sales Records</a></li>
      <li><a href="home.html?section=reports" class="nav-link"><i class="fas fa-chart-line"></i> Reports</a></li>
      <li><span class="nav-profile"><i class="fas fa-user"></i> Admin: ${username}</span></li>
      <li><button id="logout-btn" class="btn-logout"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
    `;
  }

  navMenu.innerHTML = menuHTML;
  setupLogout();
  highlightActiveNav();
}

// Run basic auth check and setup on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  renderNavbar();
  
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path === '') {
    initLoginPage();
  } else if (path.endsWith('home.html')) {
    initHomePage();
  } else if (path.endsWith('inventory.html')) {
    initInventoryPage();
  } else if (path.endsWith('manage-stock.html')) {
    initManageStockPage();
  } else if (path.endsWith('sales.html')) {
    initSalesPage();
  }
});

// ==========================================
// 1. LOGIN PAGE (index.html)
// ==========================================
function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();

    if (!usernameInput || !passwordInput) {
      showAlert('Empty Fields', 'Please fill in all the required fields.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('stocksphere_jwt_token', data.token);
      localStorage.setItem('stocksphere_user_role', data.role);
      localStorage.setItem('stocksphere_username', data.username);
      localStorage.setItem('stocksphere_last_login', data.lastLogin || '');

      showAlert('Login Successful', 'Welcome to StockSphere!', 'success');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1000);
    } catch (error) {
      showAlert('Invalid Credentials', error.message, 'error');
    }
  });
}

// Global chart instances cache
let chartRevVsCost = null;
let chartProfitTrend = null;
let chartTopProducts = null;
let chartInventoryDist = null;

// ==========================================
// 2. HOME PAGE / DASHBOARD (home.html)
// ==========================================
async function initHomePage() {
  const userRole = localStorage.getItem('stocksphere_user_role');
  const username = localStorage.getItem('stocksphere_username');
  const lastLogin = localStorage.getItem('stocksphere_last_login');

  const profileNameEl = document.getElementById('profile-username');
  const profileRoleEl = document.getElementById('profile-role');
  const profileLastLoginEl = document.getElementById('profile-last-login');

  if (profileNameEl) {
    profileNameEl.textContent = username;
    profileRoleEl.textContent = userRole;
    profileLastLoginEl.textContent = lastLogin ? formatDate(lastLogin) : 'First login';
  }

  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section');

  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  if (section === 'reports') {
    document.getElementById('reports-section').classList.add('active');
    loadReportsStats();
  } else if (section === 'admin' && userRole === 'owner') {
    document.getElementById('admin-section').classList.add('active');
    initAdminManagement();
  } else if (section === 'activity' && userRole === 'owner') {
    document.getElementById('activity-section').classList.add('active');
    initActivityLogs();
  } else {
    document.getElementById('dashboard-section').classList.add('active');
    loadDashboardStats();
  }
}

// Load Dashboard overview metrics & financial KPIs
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_URL}/products/stats`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch statistics');

    const stats = await res.json();

    // Bind Warehouse status cards
    document.getElementById('stat-total-products').textContent = stats.totalProducts;
    document.getElementById('stat-in-stock').textContent = stats.inStock;
    document.getElementById('stat-low-stock').textContent = stats.alertsLowStock;
    document.getElementById('stat-out-stock').textContent = stats.outOfStock;
    document.getElementById('stat-total-transactions').textContent = stats.totalTransactions;

    // Bind Financial KPIs
    document.getElementById('stat-total-revenue').textContent = `₹${stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('stat-total-purchase-cost').textContent = `₹${stats.totalPurchaseCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('stat-net-profit').textContent = `₹${stats.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('stat-net-loss').textContent = `₹${stats.totalLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('stat-profit-margin').textContent = `${stats.profitMargin.toFixed(2)}%`;

    // Bind Today's Summary
    document.getElementById('stat-today-sales').textContent = stats.todaySales;
    document.getElementById('stat-today-purchases').textContent = stats.todayPurchases;
    document.getElementById('stat-today-revenue').textContent = `₹${stats.todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const profitVal = stats.todayProfit;
    const profitEl = document.getElementById('stat-today-profit');
    profitEl.textContent = `₹${Math.abs(profitVal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (profitVal < 0) {
      profitEl.style.color = 'var(--danger)';
      profitEl.textContent = `Loss: -` + profitEl.textContent;
    } else {
      profitEl.style.color = 'var(--success)';
    }

    // Load reorder alert warnings box
    loadLowStockAlertsDashboard();
  } catch (error) {
    showAlert('Error', 'Unable to fetch dashboard statistics.', 'error');
    console.error(error);
  }
}

// Populate reorder alerts warning panel on dashboard
async function loadLowStockAlertsDashboard() {
  const alertContainer = document.getElementById('low-stock-alerts-box');
  const alertList = document.getElementById('alert-box-list');
  if (!alertContainer) return;

  try {
    const res = await fetch(`${API_URL}/products`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch product list');

    const products = await res.json();
    const lowStockItems = products.filter(p => p.reorderAlert === true);

    alertList.innerHTML = '';
    if (lowStockItems.length > 0) {
      alertContainer.style.display = 'block';
      lowStockItems.forEach(p => {
        const minLevel = p.minStockLevel !== undefined ? p.minStockLevel : 10;
        const li = document.createElement('li');
        li.className = 'alert-box-item';
        li.innerHTML = `
          <span>⚠ <strong>${p.Product_Name}</strong> (Category: ${p.Category})</span>
          <span>Current Stock: <strong>${p.Quantity} units</strong> (Reorder Level: ${minLevel} units) - <strong>REORDER REQUIRED</strong></span>
        `;
        alertList.appendChild(li);
      });
    } else {
      alertContainer.style.display = 'none';
    }
  } catch (error) {
    console.error(error);
  }
}

// Load advanced Reports section data and instantiate charts
async function loadReportsStats() {
  try {
    const res = await fetch(`${API_URL}/products/reports-stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reports statistics');

    const data = await res.json();

    // Bind widgets
    document.getElementById('report-total-val').textContent = `₹${data.totalInventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('report-total-rev').textContent = `₹${data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('report-total-cost').textContent = `₹${data.totalPurchaseCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('report-net-profit').textContent = `₹${data.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('report-net-loss').textContent = `₹${data.netLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('report-profit-margin').textContent = `${data.profitMargin.toFixed(2)}%`;
    document.getElementById('report-best-selling').textContent = data.bestSellingProduct;
    document.getElementById('report-highest-profit').textContent = data.highestProfitProduct;
    document.getElementById('report-turnover-ratio').textContent = `${data.turnoverRatio.toFixed(2)}x`;

    // Bind Milestones
    document.getElementById('report-max-profit-month').textContent = data.highestProfitMonth;
    document.getElementById('report-min-profit-month').textContent = data.leastProfitableMonth;
    document.getElementById('report-max-revenue-month').textContent = data.highestRevenueMonth;
    document.getElementById('report-max-sales-day').textContent = data.highestSellingDay;
    document.getElementById('report-total-purchase-qty').textContent = data.totalPurchaseQty;
    document.getElementById('report-total-sold-qty').textContent = data.totalSoldQty;
    document.getElementById('report-current-inv-qty').textContent = data.currentInventoryQty;

    // Load Charts
    renderCharts(data);

    // Bind Export Buttons
    document.getElementById('btn-export-excel').onclick = () => exportToCSV(data);
    document.getElementById('btn-export-pdf').onclick = () => window.print();

    // Load Low Stock Alerts table
    const lowStockTableBody = document.getElementById('report-low-stock-table-body');
    lowStockTableBody.innerHTML = '';
    if (data.lowStockProductsList.length === 0) {
      lowStockTableBody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state" style="padding: 20px;">
              <i class="fas fa-check-circle" style="color: var(--success); font-size: 28px;"></i>
              <p style="margin-top: 5px;">All products are fully stocked above reorder thresholds.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      data.lowStockProductsList.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">${p.Product_Name}</td>
          <td style="font-weight:700; color: #e11d48;">${p.Quantity}</td>
          <td>${p.Threshold}</td>
          <td>
            <span class="badge-reorder">
              <i class="fas fa-exclamation-triangle"></i> ${p.Status}
            </span>
          </td>
        `;
        lowStockTableBody.appendChild(tr);
      });
    }
  } catch (error) {
    showAlert('Error', 'Unable to compile reports data.', 'error');
    console.error(error);
  }
}

// Render business statistics charts using Chart.js
function renderCharts(data) {
  // Clear any existing chart instances to prevent overlap issues
  if (chartRevVsCost) chartRevVsCost.destroy();
  if (chartProfitTrend) chartProfitTrend.destroy();
  if (chartTopProducts) chartTopProducts.destroy();
  if (chartInventoryDist) chartInventoryDist.destroy();

  const months = data.monthlyRevenueAndProfit.map(item => item.month);
  const revenues = data.monthlyRevenueAndProfit.map(item => item.revenue);
  const profits = data.monthlyRevenueAndProfit.map(item => item.profit);
  const costs = data.monthlyRevenueAndProfit.map(item => item.cost);

  // 1. Chart: Revenue vs Cost Comparison
  const ctx1 = document.getElementById('chart-rev-vs-cost').getContext('2d');
  chartRevVsCost = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: months.length > 0 ? months : ['No Data'],
      datasets: [
        {
          label: 'Revenue (₹)',
          data: revenues.length > 0 ? revenues : [0],
          backgroundColor: '#3b82f6',
          borderRadius: 4
        },
        {
          label: 'Cost of Goods Sold (₹)',
          data: costs.length > 0 ? costs : [0],
          backgroundColor: '#94a3b8',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // 2. Chart: Monthly Profit Trend
  const ctx2 = document.getElementById('chart-profit-trend').getContext('2d');
  chartProfitTrend = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: months.length > 0 ? months : ['No Data'],
      datasets: [{
        label: 'Net Profit (₹)',
        data: profits.length > 0 ? profits : [0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // 3. Chart: Top 5 Products Comparison
  const topProdNames = [...new Set([
    ...data.topSellingProducts.map(p => p.Product_Name),
    ...data.topProfitableProducts.map(p => p.Product_Name)
  ])].slice(0, 5);

  const topSellingQty = topProdNames.map(name => {
    const match = data.topSellingProducts.find(p => p.Product_Name === name);
    return match ? match.Quantity : 0;
  });

  const topProfits = topProdNames.map(name => {
    const match = data.topProfitableProducts.find(p => p.Product_Name === name);
    return match ? match.Profit : 0;
  });

  const ctx3 = document.getElementById('chart-top-products').getContext('2d');
  chartTopProducts = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: topProdNames.length > 0 ? topProdNames : ['No Data'],
      datasets: [
        {
          label: 'Quantity Sold (Units)',
          data: topSellingQty.length > 0 ? topSellingQty : [0],
          backgroundColor: '#60a5fa',
          yAxisID: 'y'
        },
        {
          label: 'Total Profit Generated (₹)',
          data: topProfits.length > 0 ? topProfits : [0],
          backgroundColor: '#34d399',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Quantity Sold (Units)' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Profit (₹)' }
        }
      }
    }
  });

  // 4. Chart: Inventory Value Distribution
  const distNames = data.inventoryValueDistribution.map(item => item.name);
  const distValues = data.inventoryValueDistribution.map(item => item.value);

  const ctx4 = document.getElementById('chart-inventory-dist').getContext('2d');
  chartInventoryDist = new Chart(ctx4, {
    type: 'doughnut',
    data: {
      labels: distNames.length > 0 ? distNames : ['Empty Inventory'],
      datasets: [{
        data: distValues.length > 0 ? distValues : [1],
        backgroundColor: [
          '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
          '#10b981', '#34d399', '#059669', '#06b6d4', '#67e8f9'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12, font: { size: 10 } }
        }
      }
    }
  });
}

// CSV summary downloader helper
function exportToCSV(data) {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "StockSphere Business Performance Report Summary\r\n";
  csvContent += `Generated Date,${new Date().toLocaleDateString('en-IN')}\r\n\r\n`;

  csvContent += "METRICS,VALUES\r\n";
  csvContent += `Total Inventory Value (Cost Price WAC),INR ${data.totalInventoryValue.toFixed(2)}\r\n`;
  csvContent += `Total Business Revenue,INR ${data.totalRevenue.toFixed(2)}\r\n`;
  csvContent += `Total Purchase Costs,INR ${data.totalPurchaseCost.toFixed(2)}\r\n`;
  csvContent += `Net Profit / Loss,INR ${data.netProfit.toFixed(2)}\r\n`;
  csvContent += `Net Profit Margin %,${data.profitMargin.toFixed(2)}%\r\n`;
  csvContent += `Stock Turnover Ratio,${data.turnoverRatio.toFixed(2)}x\r\n`;
  csvContent += `Best Selling Product,${data.bestSellingProduct}\r\n`;
  csvContent += `Highest Profit Product,${data.highestProfitProduct}\r\n`;
  csvContent += `Highest Selling Day,${data.highestSellingDay}\r\n`;
  csvContent += `Highest Revenue Month,${data.highestRevenueMonth}\r\n`;
  csvContent += `Highest Profit Month,${data.highestProfitMonth}\r\n`;
  csvContent += `Least Profitable Month,${data.leastProfitableMonth}\r\n`;
  csvContent += `Total Purchase Volume (Units),${data.totalPurchaseQty}\r\n`;
  csvContent += `Total Sold Volume (Units),${data.totalSoldQty}\r\n`;
  csvContent += `Current Stock Volume (Units),${data.currentInventoryQty}\r\n`;

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `StockSphere_Business_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// 3. ADMIN MANAGEMENT PANEL (Owner only)
// ==========================================
function initAdminManagement() {
  const adminForm = document.getElementById('admin-form');
  const tableBody = document.getElementById('admin-table-body');
  if (!adminForm) return;

  async function loadAdmins() {
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load users');
      
      const admins = await res.json();
      tableBody.innerHTML = '';

      if (admins.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="4">
              <div class="empty-state">
                <i class="fas fa-user-lock"></i>
                <p>No admin accounts available.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      admins.forEach(admin => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">${admin.username}</td>
          <td><span class="profile-role" style="font-size:10px; padding:2px 8px;">${admin.role}</span></td>
          <td>${formatDate(admin.Created_Date)}</td>
          <td>
            <button class="btn-icon edit btn-reset-password" data-id="${admin._id}" data-username="${admin.username}" title="Reset Password">
              <i class="fas fa-key"></i>
            </button>
            <button class="btn-icon delete btn-delete-admin" data-id="${admin._id}" data-username="${admin.username}" title="Delete Admin">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        `;
        tableBody.appendChild(tr);
      });

      document.querySelectorAll('.btn-reset-password').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const username = btn.getAttribute('data-username');
          resetPassword(id, username);
        });
      });

      document.querySelectorAll('.btn-delete-admin').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const username = btn.getAttribute('data-username');
          if (confirm(`Are you sure you want to delete the Admin account for "${username}"?`)) {
            deleteAdmin(id);
          }
        });
      });

    } catch (error) {
      showAlert('Error', 'Unable to fetch admin list.', 'error');
      console.error(error);
    }
  }

  async function deleteAdmin(id) {
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Deletion failed');

      showAlert('Admin Deleted', data.message, 'success');
      loadAdmins();
    } catch (error) {
      showAlert('Delete Error', error.message, 'error');
    }
  }

  async function resetPassword(id, username) {
    const password = prompt(`Enter new password for admin "${username}":`);
    if (password === null) return;
    if (password.trim() === '') {
      showAlert('Validation Error', 'Password cannot be empty.', 'error');
      return;
    }

    const confirmPassword = prompt('Confirm new password:');
    if (confirmPassword === null) return;
    if (password !== confirmPassword) {
      showAlert('Validation Error', 'Passwords do not match.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/${id}/reset`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');

      showAlert('Password Reset', data.message, 'success');
    } catch (error) {
      showAlert('Reset Error', error.message, 'error');
    }
  }

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    const confirmPassword = document.getElementById('admin-confirm-password').value;

    if (!username || !password || !confirmPassword) {
      showAlert('Empty Fields', 'All form fields are required.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Mismatch', 'Passwords do not match.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, password, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      showAlert('Admin Created', `Successfully added Admin account for "${username}".`, 'success');
      adminForm.reset();
      loadAdmins();
    } catch (error) {
      showAlert('Creation Failed', error.message, 'error');
    }
  });

  loadAdmins();
}

// ==========================================
// 4. ACTIVITY LOG MODULE (Owner only)
// ==========================================
function initActivityLogs() {
  const tableBody = document.getElementById('activity-table-body');
  const searchInput = document.getElementById('log-search');
  if (!tableBody) return;

  let searchTimeout = null;

  async function loadLogs(searchQuery = '') {
    try {
      const url = searchQuery 
        ? `${API_URL}/activity-logs?search=${encodeURIComponent(searchQuery)}`
        : `${API_URL}/activity-logs`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve logs');

      const logs = await res.json();
      tableBody.innerHTML = '';

      if (logs.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No activity logs found matching the filters.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      logs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:var(--text-muted); font-size:12px;">${formatDate(log.Timestamp)}</td>
          <td style="font-weight:600;">${log.username}</td>
          <td><span class="profile-role" style="font-size:9px; padding:1px 6px;">${log.role}</span></td>
          <td style="font-weight:500; color:var(--primary)">${log.action}</td>
          <td style="font-weight:500;">${log.productName || '-'}</td>
          <td style="font-size:13px; color:var(--text-muted);">${log.details}</td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (error) {
      showAlert('Error', 'Unable to load activity logs.', 'error');
      console.error(error);
    }
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadLogs(searchInput.value);
    }, 300);
  });

  loadLogs();
}

// ==========================================
// 5. INVENTORY PAGE (inventory.html)
// ==========================================
let allProducts = [];

async function initInventoryPage() {
  const tableBody = document.getElementById('inventory-table-body');
  const searchInput = document.getElementById('search-bar');
  const categoryFilter = document.getElementById('category-filter');
  
  const userRole = localStorage.getItem('stocksphere_user_role');
  const isOwner = userRole === 'owner';

  if (!tableBody) return;

  if (!isOwner) {
    const deleteHeader = document.querySelector('.data-table th:last-child');
    if (deleteHeader) deleteHeader.remove();
  }

  async function loadProducts() {
    try {
      const res = await fetch(`${API_URL}/products`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load products');
      
      allProducts = await res.json();
      
      renderProducts(allProducts);
    } catch (error) {
      showAlert('Error', 'Unable to load products from database.', 'error');
      console.error(error);
    }
  }

  function renderProducts(products) {
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="${isOwner ? 9 : 8}">
            <div class="empty-state">
              <i class="fas fa-box-open"></i>
              <p>No products found.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    products.forEach(product => {
      const mainTr = document.createElement('tr');
      mainTr.className = 'product-main-row';
      if (product.reorderAlert === true) {
        mainTr.className += ' low-stock-alert-row';
      }

      // Stock Status details
      let badgeClass = 'in-stock';
      if (product.Stock_Status === 'Low Stock') badgeClass = 'low-stock';
      if (product.Stock_Status === 'Out Of Stock') badgeClass = 'out-of-stock';

      const warningIcon = product.reorderAlert === true 
        ? '<i class="fas fa-exclamation-triangle low-stock-warning-icon" title="⚠ Reorder Required"></i>' 
        : '';

      const reorderBadge = product.reorderAlert === true
        ? '<span class="badge-reorder"><i class="fas fa-bell"></i> Reorder</span>'
        : `<span class="status-badge ${badgeClass}"><i class="fas ${product.Quantity === 0 ? 'fa-times-circle' : (product.Quantity <= 20 ? 'fa-exclamation-circle' : 'fa-check-circle')}"></i> ${product.Stock_Status}</span>`;

      // Value Calculation
      const valuation = product.Quantity * product.purchasePrice;

      mainTr.innerHTML = `
        <td style="font-weight:600; color:var(--primary)">${getShortId(product._id)}</td>
        <td style="font-weight:600">
          <button class="btn-details-toggle" data-id="${product._id}">
            <i class="fas fa-chevron-right details-arrow"></i> ${product.Product_Name}
          </button>
        </td>
        <td>${product.Category}</td>
        <td style="font-weight:700">${warningIcon}${product.Quantity}</td>
        <td style="font-weight:600">₹${product.purchasePrice.toFixed(2)}</td>
        <td style="font-weight:700; color: var(--primary);">₹${valuation.toFixed(2)}</td>
        <td>${reorderBadge}</td>
        <td>
          <button class="btn-icon edit" data-id="${product._id}" title="Edit product details">
            <i class="fas fa-edit"></i>
          </button>
        </td>
        ${isOwner ? `
        <td>
          <button class="btn-icon delete" data-id="${product._id}" title="Delete product">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
        ` : ''}
      `;

      tableBody.appendChild(mainTr);

      // Collapsible details row
      const detailsTr = document.createElement('tr');
      detailsTr.className = 'details-row';
      detailsTr.id = `details-${product._id}`;
      detailsTr.style.display = 'none';

      detailsTr.innerHTML = `
        <td colspan="${isOwner ? 9 : 8}">
          <div class="details-grid">
            <div class="details-item">
              <span class="details-label">Brand</span>
              <span class="details-val">${product.brand || 'N/A'}</span>
            </div>
            <div class="details-item">
              <span class="details-label">Grade</span>
              <span class="details-val">${product.grade || 'N/A'}</span>
            </div>
            <div class="details-item">
              <span class="details-label">Material</span>
              <span class="details-val">${product.material || 'N/A'}</span>
            </div>
            <div class="details-item">
              <span class="details-label">Thickness</span>
              <span class="details-val">${product.thickness || 'N/A'}</span>
            </div>
            <div class="details-item">
              <span class="details-label">Size / Dimension</span>
              <span class="details-val">${product.size || 'N/A'}</span>
            </div>
            <div class="details-item">
              <span class="details-label">Supplier</span>
              <span class="details-val">${product.supplier || 'N/A'}</span>
            </div>
            <div class="details-item">
              <span class="details-label">Batch Number</span>
              <span class="details-val">${product.batchNumber || 'N/A'}</span>
            </div>
            <div class="details-item" style="grid-column: 1 / -1;">
              <span class="details-label">Specification / Description</span>
              <span class="details-val" style="font-weight: 500;">${product.Specification || 'No description recorded.'}</span>
            </div>
          </div>
        </td>
      `;
      tableBody.appendChild(detailsTr);
    });

    // Attach collapsible triggers
    document.querySelectorAll('.btn-details-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const detailsRow = document.getElementById(`details-${id}`);
        const arrow = btn.querySelector('.details-arrow');

        if (detailsRow.style.display === 'none') {
          detailsRow.style.display = 'table-row';
          arrow.className = 'fas fa-chevron-down details-arrow';
        } else {
          detailsRow.style.display = 'none';
          arrow.className = 'fas fa-chevron-right details-arrow';
        }
      });
    });

    // Edit Product Trigger
    document.querySelectorAll('.btn-icon.edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        window.location.href = `manage-stock.html?id=${prodId}`;
      });
    });

    // Delete Product Trigger
    if (isOwner) {
      document.querySelectorAll('.btn-icon.delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const prodId = btn.getAttribute('data-id');
          if (confirm('Are you sure you want to delete this product? All transaction history for this product will also be deleted.')) {
            deleteProduct(prodId);
          }
        });
      });
    }
  }

  async function deleteProduct(id) {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Deletion failed');
      
      showAlert('Product Deleted', 'Successfully deleted the product and its transaction history.', 'success');
      loadProducts();
    } catch (error) {
      showAlert('Delete Error', error.message, 'error');
    }
  }

  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const cat = categoryFilter.value;

    const filtered = allProducts.filter(p => {
      const matchesSearch = p.Product_Name.toLowerCase().includes(query) || 
                            getShortId(p._id).toLowerCase().includes(query) ||
                            (p.brand && p.brand.toLowerCase().includes(query)) ||
                            (p.batchNumber && p.batchNumber.toLowerCase().includes(query));
      const matchesCategory = !cat || p.Category === cat;
      return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
  }

  searchInput.addEventListener('input', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);

  loadProducts();
}

// ==========================================
// 6. MANAGE STOCK PAGE (manage-stock.html)
// ==========================================
async function initManageStockPage() {
  const stockForm = document.getElementById('stock-form');
  const addBtn = document.getElementById('btn-add-stock');
  const updateBtn = document.getElementById('btn-update-stock');
  const pageHeading = document.getElementById('form-page-heading');
  const pageSub = document.getElementById('form-page-sub');
  
  if (!stockForm) return;

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  let originalDetails = null;

  if (editId) {
    try {
      const res = await fetch(`${API_URL}/products/${editId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Product not found');
      
      const product = await res.json();
      originalDetails = product;

      // Populate Form Fields
      document.getElementById('product-name').value = product.Product_Name;
      document.getElementById('product-category').value = product.Category;
      document.getElementById('product-spec').value = product.Specification || '';
      document.getElementById('product-qty').value = product.Quantity;
      document.getElementById('product-price').value = product.purchasePrice;
      document.getElementById('product-min-stock').value = product.minStockLevel !== undefined ? product.minStockLevel : 10;
      
      document.getElementById('product-brand').value = product.brand || '';
      document.getElementById('product-grade').value = product.grade || '';
      document.getElementById('product-material').value = product.material || '';
      document.getElementById('product-thickness').value = product.thickness || '';
      document.getElementById('product-size').value = product.size || '';
      document.getElementById('product-supplier').value = product.supplier || '';
      document.getElementById('product-batch-number').value = product.batchNumber || '';

      const today = new Date().toISOString().split('T')[0];
      document.getElementById('product-date').value = today;

      // Update UI headings
      pageHeading.innerHTML = '<i class="fas fa-edit"></i> Edit Product';
      pageSub.textContent = `Modify specifications for product ${getShortId(product._id)}`;
      addBtn.style.display = 'none';
      updateBtn.style.display = 'inline-flex';
    } catch (error) {
      showAlert('Load Error', 'Unable to fetch product details for edit.', 'error');
      console.error(error);
    }
  } else {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('product-date').value = today;
    
    pageHeading.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Product';
    pageSub.textContent = 'Add a new product stock to your warehouse inventory';
    addBtn.style.display = 'inline-flex';
    updateBtn.style.display = 'none';
  }

  // Create Product Stock trigger
  addBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const data = getFormData();
    if (!data) return;

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Saving product failed');

      showAlert('Product Added', `Successfully added product "${data.Product_Name}" to inventory.`, 'success');
      stockForm.reset();
      document.getElementById('product-date').value = new Date().toISOString().split('T')[0];
    } catch (error) {
      showAlert('Submit Error', error.message, 'error');
    }
  });

  // Update Product Stock details trigger (replenishment recalculates WAC backend-side)
  updateBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const data = getFormData();
    if (!data) return;

    try {
      const res = await fetch(`${API_URL}/products/${editId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Updating product failed');

      showAlert('Product Updated', `Successfully updated product "${data.Product_Name}".`, 'success');
      setTimeout(() => {
        window.location.href = 'inventory.html';
      }, 1000);
    } catch (error) {
      showAlert('Update Error', error.message, 'error');
    }
  });

  stockForm.addEventListener('reset', (e) => {
    e.preventDefault();
    if (editId && originalDetails) {
      document.getElementById('product-name').value = originalDetails.Product_Name;
      document.getElementById('product-category').value = originalDetails.Category;
      document.getElementById('product-spec').value = originalDetails.Specification || '';
      document.getElementById('product-qty').value = originalDetails.Quantity;
      document.getElementById('product-price').value = originalDetails.purchasePrice;
      document.getElementById('product-min-stock').value = originalDetails.minStockLevel !== undefined ? originalDetails.minStockLevel : 10;
      
      document.getElementById('product-brand').value = originalDetails.brand || '';
      document.getElementById('product-grade').value = originalDetails.grade || '';
      document.getElementById('product-material').value = originalDetails.material || '';
      document.getElementById('product-thickness').value = originalDetails.thickness || '';
      document.getElementById('product-size').value = originalDetails.size || '';
      document.getElementById('product-supplier').value = originalDetails.supplier || '';
      document.getElementById('product-batch-number').value = originalDetails.batchNumber || '';

      document.getElementById('product-date').value = new Date().toISOString().split('T')[0];
      showAlert('Form Reset', 'Reverted fields back to original values.', 'warning');
    } else {
      stockForm.reset();
      document.getElementById('product-date').value = new Date().toISOString().split('T')[0];
      showAlert('Form Cleared', 'All fields cleared.', 'warning');
    }
  });

  function getFormData() {
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value.trim();
    const spec = document.getElementById('product-spec').value.trim();
    const qtyStr = document.getElementById('product-qty').value.trim();
    const priceStr = document.getElementById('product-price').value.trim();
    const minStockStr = document.getElementById('product-min-stock').value.trim();
    
    const brand = document.getElementById('product-brand').value.trim();
    const grade = document.getElementById('product-grade').value.trim();
    const material = document.getElementById('product-material').value.trim();
    const thickness = document.getElementById('product-thickness').value.trim();
    const size = document.getElementById('product-size').value.trim();
    const supplier = document.getElementById('product-supplier').value.trim();
    const batchNumber = document.getElementById('product-batch-number').value.trim();

    if (!name || !category || qtyStr === '' || priceStr === '' || minStockStr === '') {
      showAlert('Empty Fields', 'Please fill in all the required fields.', 'error');
      return null;
    }

    const qty = parseInt(qtyStr, 10);
    const price = parseFloat(priceStr);
    const minStock = parseInt(minStockStr, 10);

    if (isNaN(qty) || qty < 0) {
      showAlert('Invalid Input', 'Quantity cannot be negative.', 'error');
      return null;
    }

    if (isNaN(price) || price < 0) {
      showAlert('Invalid Input', 'Purchase price cannot be negative.', 'error');
      return null;
    }

    if (isNaN(minStock) || minStock < 0) {
      showAlert('Invalid Input', 'Minimum stock level cannot be negative.', 'error');
      return null;
    }

    return {
      Product_Name: name,
      Category: category,
      Specification: spec,
      Quantity: qty,
      purchasePrice: price,
      minStockLevel: minStock,
      brand,
      grade,
      material,
      thickness,
      size,
      supplier,
      batchNumber
    };
  }
}

// ==========================================
// 7. SALES RECORD PAGE (sales.html)
// ==========================================
async function initSalesPage() {
  const selectProduct = document.getElementById('txn-product');
  const txnTypeSelect = document.getElementById('txn-type');
  const sellingContainer = document.getElementById('txn-selling-price-container');
  const purchaseContainer = document.getElementById('txn-purchase-price-container');
  const sellingInput = document.getElementById('txn-selling-price');
  const purchaseInput = document.getElementById('txn-purchase-price');
  
  const txnForm = document.getElementById('txn-form');
  const tableBody = document.getElementById('transactions-table-body');

  if (!txnForm) return;

  // Toggle dynamic fields visibility depending on selected type
  txnTypeSelect.addEventListener('change', () => {
    const val = txnTypeSelect.value;
    if (val === 'Sale') {
      sellingContainer.style.display = 'block';
      sellingInput.setAttribute('required', 'true');
      purchaseContainer.style.display = 'none';
      purchaseInput.removeAttribute('required');
    } else if (val === 'Purchase') {
      purchaseContainer.style.display = 'block';
      purchaseInput.setAttribute('required', 'true');
      sellingContainer.style.display = 'none';
      sellingInput.removeAttribute('required');
    } else {
      sellingContainer.style.display = 'none';
      sellingInput.removeAttribute('required');
      purchaseContainer.style.display = 'none';
      purchaseInput.removeAttribute('required');
    }
  });

  async function loadProductsDropdown() {
    try {
      const res = await fetch(`${API_URL}/products`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load products');
      
      const products = await res.json();
      selectProduct.innerHTML = '<option value="">-- Select Product --</option>';
      
      products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p._id;
        opt.textContent = `${p.Product_Name} (Stock: ${p.Quantity}, WAC: ₹${p.purchasePrice.toFixed(2)})`;
        selectProduct.appendChild(opt);
      });
    } catch (error) {
      showAlert('Error', 'Unable to load products for selection.', 'error');
      console.error(error);
    }
  }

  async function loadTransactions() {
    try {
      const res = await fetch(`${API_URL}/transactions`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load transaction history');
      
      const transactions = await res.json();
      tableBody.innerHTML = '';

      if (transactions.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="11">
              <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No transactions available.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      transactions.forEach(txn => {
        const tr = document.createElement('tr');
        
        let typeBadgeClass = 'purchase';
        if (txn.Transaction_Type === 'Sale') typeBadgeClass = 'sale';

        const prodName = txn.Product_ID ? txn.Product_ID.Product_Name : '<span style="color:var(--danger)">Deleted Product</span>';

        // Profit / Loss text color
        let profitStyle = '';
        let profitText = '-';
        let marginText = '-';

        if (txn.Transaction_Type === 'Sale') {
          const val = txn.profit;
          profitText = `₹${val.toFixed(2)}`;
          marginText = `${txn.profitMargin.toFixed(1)}%`;
          
          if (val > 0) profitStyle = 'color: var(--success); font-weight:700;';
          else if (val < 0) profitStyle = 'color: var(--danger); font-weight:700;';
        }

        tr.innerHTML = `
          <td style="font-weight:600; color:var(--primary); font-size:11px;">${getShortId(txn._id)}</td>
          <td style="font-weight:500">${prodName}</td>
          <td>
            <span class="badge-type ${typeBadgeClass}">
              <i class="fas ${txn.Transaction_Type === 'Purchase' ? 'fa-arrow-circle-down' : 'fa-arrow-circle-up'}"></i>
              ${txn.Transaction_Type}
            </span>
          </td>
          <td style="font-weight:700">${txn.Quantity}</td>
          <td>₹${txn.purchasePrice.toFixed(2)}</td>
          <td>${txn.Transaction_Type === 'Sale' ? `₹${txn.sellingPrice.toFixed(2)}` : '-'}</td>
          <td>₹${txn.revenue.toFixed(2)}</td>
          <td>₹${txn.cost.toFixed(2)}</td>
          <td style="${profitStyle}">${profitText}</td>
          <td style="${profitStyle}">${marginText}</td>
          <td style="font-size:12px; color:var(--text-muted);">${formatDate(txn.Transaction_Date)}</td>
        `;

        tableBody.appendChild(tr);
      });
    } catch (error) {
      showAlert('Error', 'Unable to load transaction history.', 'error');
      console.error(error);
    }
  }

  txnForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = selectProduct.value;
    const type = txnTypeSelect.value;
    const qtyStr = document.getElementById('txn-qty').value.trim();
    const dateStr = document.getElementById('txn-date').value;

    if (!productId || !type || !qtyStr || !dateStr) {
      showAlert('Empty Fields', 'All fields are required to log a transaction.', 'error');
      return;
    }

    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) {
      showAlert('Invalid Input', 'Quantity must be a positive integer.', 'error');
      return;
    }

    const reqData = {
      Product_ID: productId,
      Transaction_Type: type,
      Quantity: qty,
      Transaction_Date: dateStr
    };

    if (type === 'Sale') {
      const sPrice = parseFloat(sellingInput.value);
      if (isNaN(sPrice) || sPrice < 0) {
        showAlert('Invalid Input', 'Selling price cannot be negative.', 'error');
        return;
      }
      reqData.sellingPrice = sPrice;
    } else if (type === 'Purchase') {
      const pPrice = parseFloat(purchaseInput.value);
      if (isNaN(pPrice) || pPrice < 0) {
        showAlert('Invalid Input', 'Purchase price cannot be negative.', 'error');
        return;
      }
      reqData.purchasePrice = pPrice;
    }

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reqData)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to record transaction');

      showAlert('Transaction Logged', `Successfully recorded the ${type} transaction.`, 'success');
      txnForm.reset();
      
      document.getElementById('txn-date').value = new Date().toISOString().split('T')[0];
      sellingContainer.style.display = 'none';
      purchaseContainer.style.display = 'none';

      await loadProductsDropdown();
      await loadTransactions();
    } catch (error) {
      showAlert('Transaction Failed', error.message, 'error');
    }
  });

  document.getElementById('txn-date').value = new Date().toISOString().split('T')[0];

  await loadProductsDropdown();
  await loadTransactions();
}
