/**
 * Format a number as Ethiopian Birr — number first, ETB after.
 * e.g. formatETB(45250) → "45,250 ETB"
 */
export function formatETB(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return '0 ETB'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0 ETB'
  return `${num.toLocaleString()} ETB`
}

/**
 * Format with unit, e.g. "450 ETB/kg"
 */
export function formatETBPerUnit(amount: number, unit: string): string {
  return `${amount.toLocaleString()} ETB/${unit}`
}
