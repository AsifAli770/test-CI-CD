import { formatMoney } from '../lib/format'
import { itemAmount, itemRow } from '../lib/items'
import { Button, Input } from './ui'

// Item / qty / rate / amount rows with "Add more" for extra items
export default function ItemRows({ rows, setRows }) {
  function updateRow(key, changes) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...changes } : r)))
  }

  return (
    <div>
      <div className="mb-2 hidden grid-cols-[1fr_6rem_6rem_6rem_2rem] gap-2 text-xs sm:grid font-semibold text-slate-500 uppercase">
        <span>Item</span>
        <span>Qty (kg)</span>
        <span>Rate (₹)</span>
        <span className="text-right">Amount</span>
        <span />
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          // Phone: item name on its own line, qty / rate / amount below it
          <div
            key={r.key}
            className="grid grid-cols-[1fr_1fr_5rem_2rem] items-center gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-[1fr_6rem_6rem_6rem_2rem] sm:border-0 sm:p-0"
          >
            {r.custom ? (
              <Input
                className="col-span-3 sm:col-span-1"
                value={r.name}
                onChange={(e) => updateRow(r.key, { name: e.target.value })}
                placeholder="Item name"
                maxLength={60}
              />
            ) : (
              <span className="col-span-3 px-1 text-sm font-medium sm:col-span-1">{r.name}</span>
            )}
            <Input
              type="number"
              step="0.001"
              min="0"
              className="order-2 sm:order-none"
              value={r.quantity}
              onChange={(e) => updateRow(r.key, { quantity: e.target.value })}
              placeholder="Qty (kg)"
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              className="order-2 sm:order-none"
              value={r.rate}
              onChange={(e) => updateRow(r.key, { rate: e.target.value })}
              placeholder="Rate (₹)"
            />
            <span className="order-2 text-right text-sm font-medium tabular-nums sm:order-none">{itemAmount(r) ? formatMoney(itemAmount(r)) : '-'}</span>
            {r.custom ? (
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((x) => x.key !== r.key))}
                className="order-1 text-slate-400 hover:text-red-600 sm:order-none"
                aria-label="Remove item"
              >
                ✕
              </button>
            ) : (
              <span className="order-1 sm:order-none" />
            )}
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => setRows((prev) => [...prev, itemRow('', true)])}>
        + Add more
      </Button>
      <p className="mt-2 text-xs text-slate-500">Items left without a quantity are not saved.</p>
    </div>
  )
}
