const mongoose = require("mongoose");
const Order = require("../models/Order");
const { round2, httpError, parseItems, checkNotMoreThanBalance } = require("../utils/items");
const respond = require("../utils/respond");

// Builds the saved fields from the request; amounts are always worked out here
function orderInput(body = {}) {
  const { items, total } = parseItems(body.items);

  const paid = body.paid === undefined || body.paid === "" ? 0 : Number(body.paid);
  if (!(paid >= 0)) throw httpError(400, "Advance amount is not valid");

  return {
    name: body.name,
    mobile: body.mobile,
    date: body.date,
    items,
    total,
    paid: round2(paid),
    note: body.note,
  };
}

async function findOrder(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, "Invalid id");
  const order = await Order.findById(id);
  if (!order) throw httpError(404, "Order not found");
  return order;
}

// GET /?status=open|done (default open). Not lean, so "totalPaid" is included.
exports.list = async (req, res) => {
  const status = req.query.status === "done" ? "done" : "open";
  const sort = status === "done" ? { doneAt: -1 } : { date: -1, createdAt: -1 };
  // Orders saved before statuses existed have no status field and count as open
  const filter = status === "done" ? { status: "done" } : { status: { $ne: "done" } };
  res.json(await Order.find(filter).sort(sort));
};

exports.create = async (req, res) => {
  const order = await Order.create(orderInput(req.body));
  respond(res, 201, `Order created for ${order.name}: ₹${order.total}`, order);
};

exports.update = async (req, res) => {
  const order = await findOrder(req.params.id);
  order.set(orderInput(req.body));
  await order.save();
  respond(res, 200, `Order for ${order.name} updated`, order);
};

// POST /:id/payments { date, amount, method: "cash" | "online" }
exports.addPayment = async (req, res) => {
  const order = await findOrder(req.params.id);
  const { date, amount, method } = req.body || {};
  const value = Number(amount);
  if (!(value > 0)) throw httpError(400, "Amount must be greater than 0");
  checkNotMoreThanBalance(value, order.total - order.totalPaid);
  order.payments.push({ date, amount: round2(value), method: method === "online" ? "online" : "cash" });
  await order.save();
  const fullyPaid = order.totalPaid >= order.total;
  respond(
    res,
    201,
    `Payment of ₹${round2(value)} received from ${order.name}${fullyPaid ? " - order fully paid" : ""}`,
    order
  );
};

exports.removePayment = async (req, res) => {
  const order = await findOrder(req.params.id);
  const payment = order.payments.id(req.params.paymentId);
  if (!payment) throw httpError(404, "Payment not found");
  payment.deleteOne();
  await order.save();
  respond(res, 200, "Payment deleted", order);
};

// POST /:id/done - move to Bulk Done
exports.markDone = async (req, res) => {
  const order = await findOrder(req.params.id);
  order.status = "done";
  order.doneAt = new Date();
  await order.save();
  respond(res, 200, `Order for ${order.name} marked as done`, order);
};

// POST /:id/reopen - back to Bulk Orders
exports.reopen = async (req, res) => {
  const order = await findOrder(req.params.id);
  order.status = "open";
  order.doneAt = undefined;
  await order.save();
  respond(res, 200, `Order for ${order.name} moved back to Bulk Orders`, order);
};

// DELETE /:id - permanent, only for done orders
exports.remove = async (req, res) => {
  const order = await findOrder(req.params.id);
  if (order.status !== "done") throw httpError(400, "Mark the order as done before deleting it");
  await order.deleteOne();
  respond(res, 200, `Order for ${order.name} deleted permanently`);
};
