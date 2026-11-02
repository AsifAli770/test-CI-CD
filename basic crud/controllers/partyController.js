const mongoose = require("mongoose");
const Entry = require("../models/Entry");
const { ARCHIVE_DAYS } = require("../models/partySchema");
const { round2, httpError } = require("../utils/items");
const respond = require("../utils/respond");

const DAY_MS = 24 * 60 * 60 * 1000;

// Balance per party: milk total minus payments.
// Customer: what they owe you. Supplier: what you owe them.
async function balances(partyIds) {
  const rows = await Entry.aggregate([
    { $match: { party: { $in: partyIds } } },
    {
      $group: {
        _id: "$party",
        taken: { $sum: { $cond: [{ $ne: ["$kind", "payment"] }, "$amount", 0] } },
        paid: { $sum: { $cond: [{ $eq: ["$kind", "payment"] }, "$amount", 0] } },
      },
    },
  ]);
  return new Map(rows.map((row) => [String(row._id), round2(row.taken - row.paid)]));
}

// Same handlers for customers and suppliers
function createPartyController(Party) {
  const label = Party.modelName;
  // Active (not archived) by default
  async function findParty(id, { archived = false } = {}) {
    if (!mongoose.isValidObjectId(id)) throw httpError(400, "Invalid id");
    const party = await Party.findOne({ _id: id, deletedAt: archived ? { $ne: null } : null });
    if (!party) throw httpError(404, `${Party.modelName} not found`);
    return party;
  }

  async function withBalances(parties) {
    const balanceById = await balances(parties.map((party) => party._id));
    return parties.map((party) => ({ ...party, balance: balanceById.get(String(party._id)) || 0 }));
  }

  return {
    // GET / - everyone active with their current balance
    async list(req, res) {
      const parties = await Party.find({ deletedAt: null }).sort({ name: 1 }).lean();
      res.json(await withBalances(parties));
    },

    // GET /archive - archived people with the date they will be deleted for good
    async archive(req, res) {
      const parties = await Party.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 }).lean();
      const rows = await withBalances(parties);
      res.json(
        rows.map((party) => {
          const purgeAt = new Date(party.deletedAt.getTime() + ARCHIVE_DAYS * DAY_MS);
          return { ...party, purgeAt, daysLeft: Math.max(Math.ceil((purgeAt - Date.now()) / DAY_MS), 0) };
        })
      );
    },

    async create(req, res) {
      const { name, mobile, rate } = req.body || {};
      const party = await Party.create({ name, mobile, rate });
      respond(res, 201, `${label} ${party.name} added`, party);
    },

    // PATCH /:id - a new rate applies to new milk entries only
    async update(req, res) {
      const party = await findParty(req.params.id);
      for (const field of ["name", "mobile", "rate"]) {
        if (req.body?.[field] !== undefined) party[field] = req.body[field];
      }
      await party.save();
      respond(res, 200, `${label} ${party.name} updated`, party);
    },

    // DELETE /:id - move to the archive. The person and their ledger entries
    // are deleted permanently by MongoDB after ARCHIVE_DAYS (TTL indexes).
    async remove(req, res) {
      const party = await findParty(req.params.id);
      const now = new Date();
      party.deletedAt = now;
      await party.save();
      await Entry.updateMany({ party: party._id }, { archivedAt: now });
      respond(res, 200, `${party.name} moved to ${label} Archive`);
    },

    // POST /:id/restore - back from the archive
    async restore(req, res) {
      const party = await findParty(req.params.id, { archived: true });
      party.deletedAt = null;
      await party.save();
      await Entry.updateMany({ party: party._id }, { $unset: { archivedAt: 1 } });
      respond(res, 200, `${party.name} restored`, party);
    },

    // DELETE /:id/permanent - delete an archived person and their entries now
    async destroy(req, res) {
      const party = await findParty(req.params.id, { archived: true });
      await Entry.deleteMany({ party: party._id });
      await party.deleteOne();
      respond(res, 200, `${party.name} deleted permanently`);
    },

    // GET /:id/ledger?from=&to= - entries with running balance
    async ledger(req, res) {
      const party = await findParty(req.params.id);
      const { from, to } = req.query;
      const all = await Entry.find({ party: party._id }).sort({ date: 1, createdAt: 1 }).lean();

      let balance = 0;
      let opening = 0;
      const rows = [];
      for (const entry of all) {
        balance = round2(balance + (entry.kind === "payment" ? -entry.amount : entry.amount));
        if (from && entry.date < from) {
          opening = balance;
        } else if (!to || entry.date <= to) {
          rows.push({ ...entry, balance });
        }
      }

      const sum = (kind, field) => round2(rows.filter((row) => row.kind === kind).reduce((s, row) => s + row[field], 0));
      res.json({
        party,
        opening,
        rows,
        totalQuantity: sum("milk", "quantity"),
        totalMilk: sum("milk", "amount"),
        totalPaid: sum("payment", "amount"),
        closing: rows.length ? rows[rows.length - 1].balance : opening,
      });
    },

    // POST /:id/entries
    // milk:    { kind: "milk", date, quantity, rate? (defaults to the person's rate), note }
    // payment: { kind: "payment", date, amount, method: "cash" | "online", note }
    async addEntry(req, res) {
      const party = await findParty(req.params.id);
      const { kind, date, quantity, rate, amount, method, note } = req.body || {};
      const entry = { partyType: Party.modelName, party: party._id, kind, date, note };

      if (kind === "milk") {
        const qty = Number(quantity);
        const milkRate = rate === undefined || rate === "" ? party.rate : Number(rate);
        if (!(qty > 0)) throw httpError(400, "Quantity must be greater than 0");
        if (!(milkRate >= 0)) throw httpError(400, "Rate is not valid");
        Object.assign(entry, { quantity: qty, rate: milkRate, amount: round2(qty * milkRate) });
      } else if (kind === "payment") {
        const paid = Number(amount);
        if (!(paid > 0)) throw httpError(400, "Amount must be greater than 0");
        entry.amount = round2(paid);
        entry.method = method === "online" ? "online" : "cash";
      } else {
        throw httpError(400, "kind must be milk or payment");
      }

      const saved = await Entry.create(entry);
      const message =
        kind === "milk"
          ? `Milk entry added for ${party.name}: ${saved.quantity} kg, ₹${saved.amount}`
          : `Payment of ₹${saved.amount} (${saved.method}) recorded for ${party.name}`;
      respond(res, 201, message, saved);
    },

    // DELETE /:id/entries/:entryId
    async removeEntry(req, res) {
      if (!mongoose.isValidObjectId(req.params.entryId)) throw httpError(400, "Invalid entry id");
      const deleted = await Entry.findOneAndDelete({ _id: req.params.entryId, party: req.params.id });
      if (!deleted) throw httpError(404, "Entry not found");
      respond(res, 200, deleted.kind === "milk" ? "Milk entry deleted" : "Payment deleted");
    },
  };
}

module.exports = createPartyController;
