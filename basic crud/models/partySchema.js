const mongoose = require("mongoose");

// Deleted customers/suppliers stay in the archive this long, then MongoDB removes them
const ARCHIVE_DAYS = 30;

// Customers and suppliers have the same fields
function partySchema() {
  const schema = new mongoose.Schema(
    {
      name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
      mobile: {
        type: String,
        trim: true,
        match: [/^\d{10}$/, "Mobile number must be 10 digits"],
      },
      // Milk rate in rupees per kg
      rate: { type: Number, required: [true, "Milk rate is required"], min: [0, "Rate cannot be negative"] },
      // Set when moved to the archive; null for active records
      deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
  );

  // TTL index: MongoDB deletes the document ARCHIVE_DAYS after deletedAt.
  // Documents with deletedAt null are never touched.
  schema.index({ deletedAt: 1 }, { expireAfterSeconds: ARCHIVE_DAYS * 24 * 60 * 60 });
  return schema;
}

module.exports = partySchema;
module.exports.ARCHIVE_DAYS = ARCHIVE_DAYS;
