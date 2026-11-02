// Sends a record (or plain object) with a human-readable "message" that the
// frontend shows as a toast, e.g. { message: "Order created", _id, name, ... }
function respond(res, status, message, data = {}) {
  const body = typeof data.toJSON === "function" ? data.toJSON() : data;
  res.status(status).json({ ...body, message });
}

module.exports = respond;
