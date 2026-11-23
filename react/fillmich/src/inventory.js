export const doseKey = (date, planId, doseId) => `${date}|${planId}|${doseId}`
export const formatAmount = value => Number(value).toLocaleString('pl-PL', { maximumFractionDigits: 2 })
export const hasStock = medicine => medicine.stock !== null && medicine.stock !== undefined && medicine.stock !== '' && Number.isFinite(Number(medicine.stock)) && Number(medicine.stock) >= 0
const round = value => Math.round((value + Number.EPSILON) * 100) / 100

// Returns the first planned dose for which the current stock is insufficient.
export function forecastShortage(medicine, plans, history, today) {
  if (!hasStock(medicine)) return null
  const doses = plans.filter(plan => plan.medicineId === medicine.id).flatMap(plan => plan.doses.map(dose => ({ ...dose, planId: plan.id, person: plan.person }))).sort((a, b) => a.time.localeCompare(b.time))
  if (!doses.length) return null
  let remaining = Number(medicine.stock)
  const date = new Date(`${today}T12:00:00`)
  for (let day = 0; day < 1826; day += 1) {
    const key = date.toLocaleDateString('en-CA')
    for (const dose of doses) {
      if (day === 0 && history[doseKey(today, dose.planId, dose.id)]) continue
      if (round(remaining) < round(Number(dose.amount))) return { date: key, time: dose.time, person: dose.person }
      remaining = round(remaining - Number(dose.amount))
    }
    date.setDate(date.getDate() + 1)
  }
  return { beyondHorizon: true }
}

export function stockTransition(medicine, dose, existing) {
  if (existing) return { delta: typeof existing === 'object' && existing.deducted ? Number(existing.amount) : 0, entry: null }
  if (!hasStock(medicine)) return { delta: 0, entry: { amount: Number(dose.amount), deducted: false, medicineId: medicine.id } }
  if (round(Number(medicine.stock)) < round(Number(dose.amount))) return { error: true }
  return { delta: -Number(dose.amount), entry: { amount: Number(dose.amount), deducted: true, medicineId: medicine.id } }
}

export const adjustStock = (value, delta) => round(Number(value) + delta)
