import { useState } from 'react'
import { dateFromParts, daysInMonth, padDatePart, updateDateParts } from '../dateParts'

const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']

export default function DateSelect({ label, value = '', onChange, kind = 'expiry', required = false }) {
  const [parts, setParts] = useState(() => {
    const [year = '', month = '', day = ''] = value.split('-')
    return { year, month, day }
  })
  const [currentYear] = useState(() => new Date().getFullYear())
  const selectedYear = Number(parts.year)
  const firstYear = Math.min(kind === 'birth' ? 1900 : currentYear - 30, selectedYear || currentYear)
  const lastYear = Math.max(kind === 'birth' ? currentYear : currentYear + 50, selectedYear || currentYear)
  const years = kind === 'birth' ? Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index) : [...Array.from({ length: lastYear - currentYear + 1 }, (_, index) => currentYear + index), ...Array.from({ length: currentYear - firstYear }, (_, index) => currentYear - index - 1)]
  const days = daysInMonth(parts.year, parts.month)
  const any = Boolean(parts.day || parts.month || parts.year)
  function update(field, nextValue) {
    const next = updateDateParts(parts, field, nextValue)
    setParts(next)
    onChange(dateFromParts(next))
  }
  function clear() { setParts({ day: '', month: '', year: '' }); onChange('') }
  return <fieldset className="date-select"><legend>{label} {!required && <span className="date-optional">Opcjonalnie</span>}</legend>
    <div className="date-select-fields">
      <label>Dzień<select value={parts.day} required={required || any} onChange={event => update('day', event.target.value)}><option value="">Dzień</option>{Array.from({ length: days }, (_, index) => <option key={index + 1} value={padDatePart(index + 1)}>{index + 1}</option>)}</select></label>
      <label>Miesiąc<select value={parts.month} required={required || any} onChange={event => update('month', event.target.value)}><option value="">Miesiąc</option>{months.map((month, index) => <option key={month} value={padDatePart(index + 1)}>{month}</option>)}</select></label>
      <label>Rok<select value={parts.year} required={required || any} onChange={event => update('year', event.target.value)}><option value="">Rok</option>{years.map(year => <option key={year} value={String(year)}>{year}</option>)}</select></label>
    </div>
    {any && !required && <button type="button" className="date-clear" onClick={clear}>Wyczyść datę</button>}
    <small className="date-hint">{required ? 'Wybierz dzień, miesiąc i rok.' : 'Wybierz dzień, miesiąc i rok lub pozostaw wszystkie pola puste.'}</small>
  </fieldset>
}
