const mongoose = require("mongoose");
const Credit = require("../models/Credit");
const { round2, httpError, parseItems, checkNotMoreThanBalance } = require("../utils/items");
const respond = require("../utils/respond");

async function findCredit(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, "Invalid id");
  const credit = await Credit.findById(id);
  if (!credit) throw httpError(404, "Credit sale not found");
  return credit;
}

function creditInput(body = {}) {
  const { items, total } = parseItems(body.items);
  return { name: body.name, mobile: body.mobile, date: body.date, items, total, note: body.note };
}

// Not lean, so the "paid" virtual is included
exports.list = async (req, res) => {
  res.json(await Credit.find().sort({ date: -1, createdAt: -1 }));
};

exports.create = async (req, res) => {
  const credit = await Credit.create(creditInput(req.body));
  respond(res, 201, `Credit sale created for ${credit.name}: ₹${credit.total}`, credit);
};

exports.update = async (req, res) => {
  const credit = await findCredit(req.params.id);
  credit.set(creditInput(req.body));
  await credit.save();
  respond(res, 200, `Credit sale for ${credit.name} updated`, credit);
};

exports.remove = async (req, res) => {
  const credit = await findCredit(req.params.id);
  await credit.deleteOne();
  respond(res, 200, `Credit sale for ${credit.name} deleted`);
};

// POST /:id/payments { date, amount, method: "cash" | "online" }
exports.addPayment = async (req, res) => {
  const credit = await findCredit(req.params.id);
  const { date, amount, method } = req.body || {};
  const paid = Number(amount);
  if (!(paid > 0)) throw httpError(400, "Amount must be greater than 0");
  checkNotMoreThanBalance(paid, credit.total - credit.paid);
  credit.payments.push({ date, amount: round2(paid), method: method === "online" ? "online" : "cash" });
  await credit.save();
  const fullyPaid = credit.paid >= credit.total;
  const message = fullyPaid
    ? `Payment of ₹${round2(paid)} received. ${credit.name} has fully paid - moved to Credit Done`
    : `Payment of ₹${round2(paid)} received from ${credit.name}`;
  respond(res, 201, message, credit);
};

exports.removePayment = async (req, res) => {
  const credit = await findCredit(req.params.id);
  const payment = credit.payments.id(req.params.paymentId);
  if (!payment) throw httpError(404, "Payment not found");
  payment.deleteOne();
  await credit.save();
  respond(res, 200, "Payment deleted", credit);
};
