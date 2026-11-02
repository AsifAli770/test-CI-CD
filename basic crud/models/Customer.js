const mongoose = require("mongoose");
const partySchema = require("./partySchema");

module.exports = mongoose.model("Customer", partySchema());
