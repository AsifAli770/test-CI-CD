// Turns [{ name, quantity, rate }] from a form into saved items with amounts.
// Rows without a quantity are skipped. Used by bulk orders and credit sales.
const round2 = (value) => Math.round(value * 100) / 100;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseItems(list) {
  const items = (Array.isArray(list) ? list : [])
    .filter((item) => Number(item.quantity) > 0)
    .map((item) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);
      if (!String(item.name || "").trim()) throw httpError(400, "Every item needs a name");
      if (!(rate >= 0)) throw httpError(400, `Rate for ${item.name} is not valid`);
      return { name: item.name, quantity, rate, amount: round2(quantity * rate) };
    });
  if (items.length === 0) throw httpError(400, "Enter a quantity for at least one item");
  return { items, total: round2(items.reduce((sum, item) => sum + item.amount, 0)) };
}

// A payment can't be more than what is still due
function checkNotMoreThanBalance(amount, balance) {
  if (balance <= 0) throw httpError(400, "Nothing is due - the balance is already cleared");
  if (amount > balance + 0.001) throw httpError(400, `Amount cannot be more than the balance (₹${round2(balance)})`);
}

module.exports = { round2, httpError, parseItems, checkNotMoreThanBalance };
