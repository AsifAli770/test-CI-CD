// Load variables from .env when it exists (Render sets them directly instead)
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const requireAuth = require("./middleware/auth");
const Customer = require("./models/Customer");
const Entry = require("./models/Entry");
const Order = require("./models/Order");
const Supplier = require("./models/Supplier");
const Credit = require("./models/Credit");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const partyRoutes = require("./routes/partyRoutes");
const creditRoutes = require("./routes/creditRoutes");

for (const name of ["ADMIN_USERNAME", "ADMIN_PASSWORD", "JWT_SECRET"]) {
  if (!process.env[name]) {
    console.error(`${name} is not set in .env`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Allow the frontend to call the API from another origin.
// CORS_ORIGIN: comma-separated frontend URLs; empty allows any origin.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.length === 0) {
    res.header("Access-Control-Allow-Origin", "*");
  } else if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.use("/api/auth", authRoutes);
// Everything below needs a logged-in admin
app.use("/api", requireAuth);
app.use("/api/customers", partyRoutes(Customer));
app.use("/api/suppliers", partyRoutes(Supplier));
app.use("/api/orders", orderRoutes);
app.use("/api/credit", creditRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Express 5 forwards errors from async handlers here
app.use((err, req, res, next) => {
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors)[0].message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

connectDB()
  // Make the database indexes match the models; this also drops old indexes
  // (like the unique "code" index from the earlier version) that no longer exist
  .then(() => Promise.all([Customer, Supplier, Entry, Order, Credit].map((model) => model.syncIndexes())))
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
