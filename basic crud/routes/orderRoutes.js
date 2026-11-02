const express = require("express");
const order = require("../controllers/orderController");

const router = express.Router();

router.get("/", order.list);
router.post("/", order.create);
router.patch("/:id", order.update);
router.delete("/:id", order.remove);
router.post("/:id/payments", order.addPayment);
router.delete("/:id/payments/:paymentId", order.removePayment);
router.post("/:id/done", order.markDone);
router.post("/:id/reopen", order.reopen);

module.exports = router;
