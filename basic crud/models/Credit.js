const mongoose = require("mongoose");

// Items taken on credit by someone (just a name and mobile, not linked to
// the customer list). Payments come later and are kept in `payments`.
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema({
  date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"] },
  amount: { type: Number, required: true, min: [0.01, "Amount must be greater than 0"] },
  method: { type: String, enum: ["cash", "online"], default: "cash" },
});

const creditSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
    mobile: { type: String, trim: true, match: [/^\d{10}$/, "Mobile number must be 10 digits"] },
    date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"] },
    items: {
      type: [itemSchema],
      validate: [(items) => items.length > 0, "Add at least one item"],
    },
    total: { type: Number, required: true, min: 0 },
    payments: { type: [paymentSchema], default: [] },
    note: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

creditSchema.virtual("paid").get(function () {
  return Math.round(this.payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
});

creditSchema.index({ date: -1 });

module.exports = mongoose.model("Credit", creditSchema, "credits");
