const express = require("express");
const credit = require("../controllers/creditController");

const router = express.Router();

router.get("/", credit.list);
router.post("/", credit.create);
router.patch("/:id", credit.update);
router.delete("/:id", credit.remove);
router.post("/:id/payments", credit.addPayment);
router.delete("/:id/payments/:paymentId", credit.removePayment);

module.exports = router;
