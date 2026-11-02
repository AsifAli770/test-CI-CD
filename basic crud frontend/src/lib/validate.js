import { useState } from 'react'

// Letters (any language), spaces, dots, apostrophes and hyphens - no digits
export const NAME_PATTERN = /^[\p{L}\s.'-]+$/u

const isBlank = (value) => value === undefined || value === null || String(value).trim() === ''

// Each check returns an error message, or undefined when the value is fine
export const checks = {
  required: (label) => (value) => (isBlank(value) ? `${label} is required` : undefined),

  name: (label = 'Name') => (value) => {
    if (isBlank(value)) return `${label} is required`
    if (!NAME_PATTERN.test(String(value).trim())) return `${label} can only contain letters, no numbers`
  },

  mobile: () => (value) => {
    if (!isBlank(value) && !/^\d{10}$/.test(value)) return 'Mobile number must be exactly 10 digits'
  },

  positive: (label) => (value) => {
    if (isBlank(value)) return `${label} is required`
    if (!(Number(value) > 0)) return `${label} must be greater than 0`
  },

  notNegative: (label) => (value) => {
    if (isBlank(value)) return undefined
    if (!(Number(value) >= 0)) return `${label} cannot be negative`
  },

  requiredNotNegative: (label) => (value) => {
    if (isBlank(value)) return `${label} is required`
    if (!(Number(value) >= 0)) return `${label} cannot be negative`
  },
}

// Per-field error messages for a form.
//   const { errors, validate, clear } = useErrors()
//   if (!validate({ name: [form.name, checks.name()] })) return
//   <Field error={errors.name}> ... onChange: clear('name')
export function useErrors() {
  const [errors, setErrors] = useState({})

  function validate(rules) {
    const next = {}
    for (const [field, [value, ...fieldChecks]] of Object.entries(rules)) {
      for (const check of fieldChecks) {
        const message = check(value)
        if (message) {
          next[field] = message
          break
        }
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function clear(field) {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  return { errors, validate, clear, setErrors }
}

// Item rows: at least one quantity, and every filled row needs a name and rate
export function checkItems(rows) {
  const filled = rows.filter((row) => Number(row.quantity) > 0)
  if (rows.some((row) => row.quantity !== '' && !(Number(row.quantity) >= 0))) return 'Quantities cannot be negative'
  if (filled.length === 0) return 'Enter a quantity for at least one item'
  const unnamed = filled.find((row) => !String(row.name).trim())
  if (unnamed) return 'Every added item needs a name'
  const noRate = filled.find((row) => row.rate === '' || !(Number(row.rate) >= 0))
  if (noRate) return `Enter a rate for ${noRate.name}`
}
