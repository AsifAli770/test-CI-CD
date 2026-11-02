const mongoose = require("mongoose");
const { ARCHIVE_DAYS } = require("./partySchema");

// One line of a customer's or supplier's ledger.
// milk:    milk given to a customer / received from a supplier (amount = quantity x rate)
// payment: money received from a customer / paid to a supplier
// The rate is saved on each milk entry, so changing a person's rate later
// does not change old entries.
const entrySchema = new mongoose.Schema(
  {
    partyType: { type: String, enum: ["Customer", "Supplier"], required: true },
    party: { type: mongoose.Schema.Types.ObjectId, refPath: "partyType", required: true },
    kind: { type: String, enum: ["milk", "payment"], required: true },
    // "YYYY-MM-DD" so dates sort correctly and never shift with timezones
    date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"] },
    quantity: { type: Number, min: 0 },
    rate: { type: Number, min: 0 },
    amount: { type: Number, required: true, min: [0, "Amount cannot be negative"] },
    // Payments only: how the money was paid
    method: { type: String, enum: ["cash", "online"] },
    note: { type: String, trim: true, maxlength: 200 },
    // Set when the person is archived, so the entries expire together with them
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

entrySchema.index({ party: 1, date: 1, createdAt: 1 });
entrySchema.index({ archivedAt: 1 }, { expireAfterSeconds: ARCHIVE_DAYS * 24 * 60 * 60 });

module.exports = mongoose.model("Entry", entrySchema);
