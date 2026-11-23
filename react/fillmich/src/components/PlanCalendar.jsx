import { useState } from 'react'
import { doseKey, formatAmount } from '../inventory'

const asKey = date => date.toLocaleDateString('en-CA')
export default function PlanCalendar({ plans, medicines, history, today }) {
  const [month, setMonth] = useState(() => new Date(`${today}T12:00:00`))
  const [selected, setSelected] = useState(today)
  const year = month.getFullYear(), monthIndex = month.getMonth()
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const days = new Date(year, monthIndex + 1, 0).getDate()
  const medicinesById = new Map(medicines.map(medicine => [medicine.id, medicine]))
  const doses = plans.flatMap(plan => plan.doses.map(dose => ({ ...dose, person: plan.person, planId: plan.id, medicine: medicinesById.get(plan.medicineId) }))).filter(dose => dose.medicine).sort((a, b) => a.time.localeCompare(b.time))
  function moveMonth(delta) { setMonth(new Date(year, monthIndex + delta, 1, 12)) }
  return <section className="calendar-card"><div className="calendar-heading"><div><div className="eyebrow">DAWKI W KALENDARZU</div><h3>Kalendarz</h3></div><div className="calendar-controls"><button type="button" aria-label="Poprzedni miesiąc" onClick={() => moveMonth(-1)}>‹</button><span>{month.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</span><button type="button" aria-label="Następny miesiąc" onClick={() => moveMonth(1)}>›</button></div></div><div className="calendar-grid calendar-weekdays">{['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(day => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => { const date = asKey(new Date(year, monthIndex, index + 1, 12)); return <button type="button" key={date} className={`${date === selected ? 'selected' : ''} ${date === today ? 'today' : ''}`} aria-label={new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', { dateStyle: 'full' })} aria-pressed={date === selected} onClick={() => setSelected(date)}>{index + 1}{doses.length > 0 && <span className="calendar-dot" />}</button> })}</div><div className="calendar-detail"><strong>{new Date(`${selected}T12:00:00`).toLocaleDateString('pl-PL', { dateStyle: 'long' })}</strong>{doses.length ? doses.map(dose => <div key={`${dose.planId}-${dose.id}`}><span>{dose.time} · {dose.medicine.name} · {dose.person}</span><span>{formatAmount(dose.amount)} tabl.{selected <= today && history[doseKey(selected, dose.planId, dose.id)] ? ' · przyjęto' : ''}</span></div>) : <p>Brak dawek w aktualnym planie.</p>}</div><p className="plan-note">Kalendarz pokazuje obecny plan codzienny, również dla innych dni. Zmiana planu zmienia jego widok w kalendarzu; nie jest to historia zaleceń.</p></section>
}
