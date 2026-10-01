# StockSphere - Full Stack Inventory Management System

StockSphere is a modern, production-ready, full-stack CRUD Inventory Management System built using a robust backend (Node.js, Express, MongoDB, Mongoose) and a professional, responsive vanilla frontend (HTML5, CSS3, JavaScript).

---

## Project Structure

```text
StockSphere/
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   ├── images/
│   ├── index.html
│   ├── home.html
│   ├── inventory.html
│   ├── manage-stock.html
│   └── sales.html
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── productController.js
│   │   └── transactionController.js
│   ├── models/
│   │   ├── Product.js
│   │   └── Transaction.js
│   ├── routes/
│   │   ├── productRoutes.js
│   │   └── transactionRoutes.js
│   └── server.js
├── package.json
└── README.md
```

---

## Key Features

1. **Secure Admin Authentication**: Simple login mechanism validating credentials client-side (`admin` / `admin123`).
2. **Interactive Stats Dashboard**: Displays real-time summary indicators (calculated dynamically from MongoDB):
   - **Total Products** in database.
   - **In Stock** items (Quantity > 20).
   - **Low Stock** items (Quantity 1–20).
   - **Out Of Stock** items (Quantity = 0).
   - **Total Transactions** recorded.
3. **Inventory Management**: Grid layout supporting real-time name searches, category filtering, and product deletion.
4. **Product stock form**: Manage adding new items or updating existing ones via a unified form that pre-populates based on the query parameter `?id=PRODUCT_ID`.
5. **Double-entry Transactions**: Records incoming stock ("Purchase") and outgoing orders ("Sale") with automated stock updates and negative inventory prevention.
6. **Unified client script**: A centralized script (`script.js`) coordinating route guarding, notifications, page rendering, and API fetch calls.
7. **Professional Business Theme**: Clean, responsive layout using a blue-and-white design palette, Font Awesome icons, and the Poppins typography.

---

## Prerequisites

- **Node.js** (v14+ recommended)
- **MongoDB** (Ensure your local MongoDB instance is started and running at `mongodb://127.0.0.1:27017`)

---

## Getting Started

1. Clone or copy the project files into your desired workspace directory.
2. Open a terminal in the root of the project folder.
3. Run the following command to download and configure npm packages:
   ```bash
   npm.cmd install
   ```
4. Start the Node.js Express server:
   ```bash
   npm.cmd start
   ```
5. Open your web browser and load the login page:
   [http://localhost:5000](http://localhost:5000)

---

## Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`
