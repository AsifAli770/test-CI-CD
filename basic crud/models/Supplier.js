const mongoose = require("mongoose");
const partySchema = require("./partySchema");

module.exports = mongoose.model("Supplier", partySchema());
