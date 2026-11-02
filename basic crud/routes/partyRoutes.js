const express = require("express");
const createPartyController = require("../controllers/partyController");

// Same routes for /api/customers and /api/suppliers
function partyRoutes(Party) {
  const controller = createPartyController(Party);
  const router = express.Router();
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/archive", controller.archive);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);
  router.post("/:id/restore", controller.restore);
  router.delete("/:id/permanent", controller.destroy);
  router.get("/:id/ledger", controller.ledger);
  router.post("/:id/entries", controller.addEntry);
  router.delete("/:id/entries/:entryId", controller.removeEntry);
  return router;
}

module.exports = partyRoutes;
