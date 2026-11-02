// Item rows used by bulk orders and credit sales

// Always listed; leave the quantity empty to skip an item
export const DEFAULT_ITEMS = ['Milk', 'Dahi', 'Paneer', 'Cream', 'Butter', 'Ghee']

let nextKey = 1
export const itemRow = (name, custom, quantity = '', rate = '') => ({ key: nextKey++, name, custom, quantity, rate })

// Saved items first, then any default items not in the list yet
export function initialItemRows(items = []) {
  const saved = items.map((item) =>
    itemRow(item.name, !DEFAULT_ITEMS.includes(item.name), String(item.quantity), String(item.rate)),
  )
  const missing = DEFAULT_ITEMS.filter((name) => !saved.some((item) => item.name === name)).map((name) => itemRow(name, false))
  return [...saved, ...missing]
}

export const itemAmount = (row) => Math.round(Number(row.quantity || 0) * Number(row.rate || 0) * 100) / 100

export const itemsTotal = (rows) => rows.reduce((sum, row) => sum + itemAmount(row), 0)

// What the API expects
export const itemsBody = (rows) => rows.map(({ name, quantity, rate }) => ({ name, quantity, rate }))
