const express = require("express");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");

const router = express.Router();

// GET /api/dashboard - headline numbers (archived people are not counted)
router.get("/", async (req, res) => {
  const [customers, suppliers] = await Promise.all([
    Customer.countDocuments({ deletedAt: null }),
    Supplier.countDocuments({ deletedAt: null }),
  ]);
  res.json({ customers, suppliers });
});

module.exports = router;
