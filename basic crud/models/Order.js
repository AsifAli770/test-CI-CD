const mongoose = require("mongoose");

// Bulk order for a marriage, party or function. The customer is just a name
// and mobile number, not linked to the regular customer list.
const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Payment received after the order was placed
const paymentSchema = new mongoose.Schema({
  date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"] },
  amount: { type: Number, required: true, min: [0.01, "Amount must be greater than 0"] },
  method: { type: String, enum: ["cash", "online"], default: "cash" },
});

const orderSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
    mobile: { type: String, trim: true, match: [/^\d{10}$/, "Mobile number must be 10 digits"] },
    // Delivery / function date, "YYYY-MM-DD"
    date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"] },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, "Add at least one item"],
    },
    total: { type: Number, required: true, min: 0 },
    // Advance taken when the order was placed
    paid: { type: Number, default: 0, min: [0, "Paid amount cannot be negative"] },
    payments: { type: [paymentSchema], default: [] },
    note: { type: String, trim: true, maxlength: 300 },
    // "done" orders move to the Bulk Done screen and can then be deleted
    status: { type: String, enum: ["open", "done"], default: "open" },
    doneAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Advance + every later payment
orderSchema.virtual("totalPaid").get(function () {
  return Math.round((this.paid + this.payments.reduce((sum, p) => sum + p.amount, 0)) * 100) / 100;
});

orderSchema.index({ status: 1, date: -1 });

module.exports = mongoose.model("Order", orderSchema);
