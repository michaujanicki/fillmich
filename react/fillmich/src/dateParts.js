export const padDatePart = value => String(value).padStart(2, '0')
export const daysInMonth = (year, month) => month ? new Date(Number(year) || 2000, Number(month), 0).getDate() : 31
export function updateDateParts(parts, field, value) {
  const next = { ...parts, [field]: value }
  if (next.day && next.month && Number(next.day) > daysInMonth(next.year, next.month)) next.day = ''
  return next
}
export const dateFromParts = parts => parts.day && parts.month && parts.year ? `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}` : ''
