const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatMoney(amount) {
  return rupees.format(amount || 0)
}

export function formatQty(quantity) {
  return `${Number(quantity || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })} kg`
}

// Dates are "YYYY-MM-DD" strings
export function todayStr() {
  return new Date().toLocaleDateString('en-CA')
}

export function formatDate(day) {
  if (!day) return '-'
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
