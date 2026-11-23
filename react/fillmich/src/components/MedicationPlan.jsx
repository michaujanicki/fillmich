import { useEffect, useState } from 'react'
import { adjustStock, doseKey, forecastShortage, formatAmount, hasStock, stockTransition } from '../inventory'
import PlanCalendar from './PlanCalendar'

const localDate = () => new Date().toLocaleDateString('en-CA')
const newDose = () => ({ id: crypto.randomUUID(), time: '08:00', amount: '1' })

function PlanEditor({ medicines, people, existing, onCancel, onSave }) {
  const persons = people.filter(person => person !== 'Wspólne')
  const [person, setPerson] = useState(existing?.person || persons[0] || '')
  const [medicineId, setMedicineId] = useState(existing?.medicineId || '')
  const [doses, setDoses] = useState(() => existing?.doses.map(dose => ({ ...dose, amount: String(dose.amount) })) || [newDose()])
  const [error, setError] = useState('')
  const eligible = medicines.filter(medicine => medicine.person === person || medicine.person === 'Wspólne')
  function submit(event) {
    event.preventDefault()
    if (!person || !eligible.some(medicine => medicine.id === medicineId)) { setError('Wybierz osobę i lek z jej apteczki lub lek wspólny.'); return }
    if (doses.some(dose => !dose.time || !Number.isFinite(Number(dose.amount)) || Number(dose.amount) <= 0 || Number(dose.amount) > 100)) { setError('Podaj godzinę i liczbę tabletek większą od zera.'); return }
    if (new Set(doses.map(dose => dose.time)).size !== doses.length) { setError('Każda pora musi mieć inną godzinę.'); return }
    onSave({ id: existing?.id || crypto.randomUUID(), person, medicineId, doses: doses.map(dose => ({ ...dose, amount: Number(dose.amount) })).sort((a, b) => a.time.localeCompare(b.time)) })
  }
  const changeDose = (id, field, value) => setDoses(current => current.map(dose => dose.id === id ? { ...dose, [field]: value } : dose))
  return <div className="overlay" onClick={onCancel}><section className="dialog plan-dialog" role="dialog" aria-modal="true" aria-labelledby="plan-editor-title" onClick={event => event.stopPropagation()}>
    <button className="close" aria-label="Zamknij" onClick={onCancel}>×</button><div className="eyebrow">CODZIENNY PLAN</div><h2 id="plan-editor-title">{existing ? 'Edytuj plan' : 'Ustaw przyjmowanie'}</h2><p>Wpisz dawkowanie ustalone przez lekarza lub zgodne z ulotką.</p>
    <form onSubmit={submit}><label>Osoba<select required value={person} onChange={event => { setPerson(event.target.value); setMedicineId('') }}><option value="">Wybierz osobę</option>{persons.map(item => <option key={item}>{item}</option>)}</select></label>
      {!persons.length && <p className="error">Najpierw dodaj osobę w panelu bocznym.</p>}
      <label>Lek<select required value={medicineId} onChange={event => setMedicineId(event.target.value)}><option value="">Wybierz lek</option>{eligible.map(medicine => <option key={medicine.id} value={medicine.id}>{[medicine.name, medicine.strength, medicine.packageDescription].filter(Boolean).join(' · ')}</option>)}</select></label>
      {person && !eligible.length && <p>Dodaj najpierw lek tej osoby lub lek wspólny do apteczki.</p>}
      <div className="dose-heading"><strong>Pory przyjmowania</strong><button type="button" className="button-quiet" onClick={() => setDoses(current => [...current, newDose()])}>+ Dodaj porę</button></div>
      {doses.map((dose, index) => <div className="dose-input-row" key={dose.id}><label>Godzina<input type="time" required value={dose.time} onChange={event => changeDose(dose.id, 'time', event.target.value)} /></label><label>Tabletek<input type="number" min="0.01" max="100" step="0.01" required value={dose.amount} onChange={event => changeDose(dose.id, 'amount', event.target.value)} /></label><button type="button" className="delete" aria-label={`Usuń porę ${index + 1}`} disabled={doses.length === 1} onClick={() => setDoses(current => current.filter(item => item.id !== dose.id))}>×</button></div>)}
      <p className="form-hint">Plan powtarza się codziennie. Ułamkowe części tabletki wpisz tylko, jeśli sposób podziału jest zgodny z zaleceniem.</p>{error && <p className="error" role="alert">{error}</p>}
      <div className="wizard-actions"><button className="button-quiet" type="button" onClick={onCancel}>Anuluj</button><button className="primary">Zapisz plan</button></div>
    </form>
  </section></div>
}

export default function MedicationPlan({ medicines, setMedicines, people, plans, setPlans, history, setHistory }) {
  const [editor, setEditor] = useState(null)
  const [personFilter, setPersonFilter] = useState('Wszyscy')
  const [date, setDate] = useState(localDate)
  useEffect(() => { const timer = setInterval(() => setDate(localDate()), 30000); return () => clearInterval(timer) }, [])
  const byId = new Map(medicines.map(medicine => [medicine.id, medicine]))
  const selected = plans.filter(plan => byId.has(plan.medicineId) && (personFilter === 'Wszyscy' || plan.person === personFilter))
  const doses = selected.flatMap(plan => plan.doses.map(dose => ({ ...dose, planId: plan.id, person: plan.person, medicine: byId.get(plan.medicineId) }))).sort((a, b) => a.time.localeCompare(b.time))
  const totals = Object.entries(doses.reduce((all, dose) => { const item = all[dose.person] || { total: 0, taken: 0 }; item.total += dose.amount; if (history[doseKey(date, dose.planId, dose.id)]) item.taken += dose.amount; all[dose.person] = item; return all }, {}))
  function save(plan) { setPlans(current => current.some(item => item.id === plan.id) ? current.map(item => item.id === plan.id ? plan : item) : [...current, plan]); setEditor(null) }
  function remove(plan) { if (window.confirm(`Usunąć plan przyjmowania dla ${plan.person}?`)) { setPlans(current => current.filter(item => item.id !== plan.id)); setHistory(current => Object.fromEntries(Object.entries(current).filter(([key]) => key.split('|')[1] !== plan.id))) } }
  function toggle(dose) {
    const key = doseKey(date, dose.planId, dose.id)
    const transition = stockTransition(dose.medicine, dose, history[key])
    if (transition.error) { window.alert('Wpisany stan jest mniejszy niż ta dawka. Sprawdź zapas i w razie potrzeby popraw go w apteczce.'); return }
    if (transition.delta && hasStock(dose.medicine)) setMedicines(current => current.map(medicine => medicine.id === dose.medicine.id ? { ...medicine, stock: adjustStock(medicine.stock, transition.delta) } : medicine))
    setHistory(current => { const next = { ...current }; if (transition.entry) next[key] = transition.entry; else delete next[key]; return next })
  }
  function edit(plan) {
    if (plan.doses.some(dose => history[doseKey(date, plan.id, dose.id)])) { window.alert('Aby zmienić plan, najpierw cofnij oznaczenia przyjętych dawek z dzisiaj.'); return }
    setEditor(plan)
  }
  return <section className="plan-section"><div className="section-heading"><div><div className="eyebrow">TWOJA CODZIENNA RUTYNA</div><h2>Plan przyjmowania</h2><p className="plan-intro">Zapisz ustalone dawkowanie i zaznaczaj przyjęte dawki.</p></div><button className="primary" onClick={() => setEditor('new')}>+ Dodaj plan</button></div>
    <div className="plan-toolbar"><label>Osoba<select value={personFilter} onChange={event => setPersonFilter(event.target.value)}><option>Wszyscy</option>{people.filter(person => person !== 'Wspólne').map(person => <option key={person}>{person}</option>)}</select></label><span>Dzisiaj · {new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
    {doses.length ? <><div className="dose-totals">{totals.map(([person, total]) => <div key={person}><span>{person}</span><strong>{formatAmount(total.taken)} / {formatAmount(total.total)}</strong><small>tabletek przyjęto / zaplanowano</small></div>)}</div><div className="daily-doses">{doses.map(dose => { const taken = !!history[doseKey(date, dose.planId, dose.id)]; return <label className={`daily-dose ${taken ? 'taken' : ''}`} key={`${dose.planId}-${dose.id}`}><input type="checkbox" checked={taken} onChange={() => toggle(dose)} /><span className="dose-time">{dose.time}</span><span className="dose-details"><strong>{dose.medicine.name}</strong><small>{dose.person}{dose.medicine.strength ? ` · ${dose.medicine.strength}` : ''}</small></span><span className="dose-amount">{formatAmount(dose.amount)} tabl.</span><span className="dose-state">{taken ? 'Przyjęto' : 'Do przyjęcia'}</span></label> })}</div></> : <div className="empty plan-empty"><div className="empty-icon">◷</div><h3>Nie ma jeszcze dawek na dziś</h3><p>Dodaj plan przyjmowania dla osoby i leku z apteczki.</p><button className="text-button" onClick={() => setEditor('new')}>Ustaw pierwszy plan →</button></div>}
    <div className="plan-saved"><h3>Zapisane plany</h3>{selected.length ? selected.map(plan => <div className="saved-plan" key={plan.id}><div><strong>{byId.get(plan.medicineId).name}</strong><small>{plan.person} · {plan.doses.map(dose => `${dose.time} (${formatAmount(dose.amount)} tabl.)`).join(', ')}</small></div><button className="button-quiet" onClick={() => edit(plan)}>Edytuj</button><button className="button-quiet" onClick={() => remove(plan)}>Usuń</button></div>) : <p>Brak zapisanych planów dla wybranego widoku.</p>}</div>
    <div className="forecast-section"><h3>Prognoza zapasów</h3>{[...new Set(selected.map(plan => plan.medicineId))].map(id => { const medicine = byId.get(id); const forecast = forecastShortage(medicine, plans, history, date); return <div className="forecast-item" key={id}><strong>{medicine.name}</strong><span>{!hasStock(medicine) ? 'Uzupełnij liczbę tabletek w apteczce.' : !forecast ? 'Brak dawek w planie.' : forecast.beyondHorizon ? 'Zapas wystarcza na ponad 5 lat według planu.' : `Może zabraknąć: ${new Date(`${forecast.date}T12:00:00`).toLocaleDateString('pl-PL')} o ${forecast.time} (${forecast.person}).`}</span></div> })}{!selected.length && <p>Dodaj plan, aby zobaczyć prognozę.</p>}<p className="plan-note">Szacunek zakłada realizację wszystkich pozostałych dawek według obecnego planu, bez uzupełniania zapasów. Nie uwzględnia zmiany dawkowania ani terminu ważności.</p></div>
    <PlanCalendar plans={selected} medicines={medicines} history={history} today={date} /><p className="plan-note">Aplikacja nie wysyła jeszcze przypomnień. Po oznaczeniu dawki odlicza tabletki tylko wtedy, gdy podano ich stan.</p>
    {editor && <PlanEditor medicines={medicines} people={people} existing={editor === 'new' ? null : editor} onCancel={() => setEditor(null)} onSave={save} />}
  </section>
}
