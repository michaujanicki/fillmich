import { useEffect, useState } from 'react'
import { doseKey, formatAmount, hasStock } from '../inventory'

const localDate = () => new Date().toLocaleDateString('en-CA')

export default function Dashboard({ medicines, people, plans, history, onNavigate, onAddMedicine }) {
  const [date, setDate] = useState(localDate)
  useEffect(() => { const timer = setInterval(() => setDate(localDate()), 30000); return () => clearInterval(timer) }, [])
  const limit = new Date(`${date}T12:00:00`)
  limit.setDate(limit.getDate() + 90)
  const warningDate = localDateFor(limit)
  const expired = medicines.filter(medicine => medicine.expiry && medicine.expiry < date).length
  const expiring = medicines.filter(medicine => medicine.expiry && medicine.expiry >= date && medicine.expiry <= warningDate).length
  const emptyStock = medicines.filter(medicine => hasStock(medicine) && Number(medicine.stock) === 0).length
  const byId = new Map(medicines.map(medicine => [medicine.id, medicine]))
  const doses = plans.flatMap(plan => plan.doses.map(dose => ({ ...dose, planId: plan.id, person: plan.person, medicine: byId.get(plan.medicineId) }))).filter(dose => dose.medicine).sort((a, b) => a.time.localeCompare(b.time))
  const taken = doses.filter(dose => history[doseKey(date, dose.planId, dose.id)]).length
  const remaining = doses.filter(dose => !history[doseKey(date, dose.planId, dose.id)])
  const household = people.filter(person => person !== 'Wspólne').length
  return <section className="dashboard">
    <div className="dashboard-heading"><div><div className="eyebrow">TWOJA DOMOWA APTECZKA</div><h1>Podsumowanie</h1><p>Wszystko, co ważne, w jednym miejscu.</p></div><button type="button" className="primary" onClick={onAddMedicine}>+ Dodaj lek</button></div>
    <div className="dashboard-overview"><div className="dashboard-intro"><span className="dashboard-intro-icon" aria-hidden="true">✳</span><div><h2>Twoja apteczka w skrócie</h2><p>Sprawdź zapasy i plan przyjmowania całej rodziny.</p></div></div><div className="dashboard-stats"><button type="button" onClick={() => onNavigate('cupboard')}><strong>{medicines.length}</strong><span>leków w apteczce</span></button><button type="button" onClick={() => onNavigate('cupboard')}><strong>{household}</strong><span>osoby w apteczce</span></button></div></div>
    <div className="dashboard-grid"><div className="dashboard-card"><div className="dashboard-card-head"><div><div className="eyebrow">PLAN NA DZIŚ</div><h2>Dzisiejsze dawki</h2></div><button className="button-quiet" type="button" onClick={() => onNavigate('dosage')}>Zobacz plan →</button></div>{doses.length ? <><p className="dashboard-progress">Przyjęto {taken} z {doses.length} zaplanowanych dawek.</p>{remaining.length ? <div className="dashboard-dose-list">{remaining.slice(0, 3).map(dose => <div className="dashboard-dose" key={`${dose.planId}-${dose.id}`}><span className="dashboard-time">{dose.time}</span><div><strong>{dose.medicine.name}</strong><small>{dose.person} · {formatAmount(dose.amount)} tabl.</small></div></div>)}{remaining.length > 3 && <p>Oraz {remaining.length - 3} kolejnych w planie.</p>}</div> : <div className="dashboard-message">Wszystkie dzisiejsze dawki są oznaczone jako przyjęte.</div>}</> : <div className="dashboard-message">Nie masz jeszcze zaplanowanych dawek. Dodaj plan w zakładce Dawkowanie.</div>}</div>
    <div className="dashboard-card"><div className="dashboard-card-head"><div><div className="eyebrow">STAN APTECZKI</div><h2>Warto sprawdzić</h2></div><button className="button-quiet" type="button" onClick={() => onNavigate('cupboard')}>Zobacz leki →</button></div>{expired || expiring || emptyStock ? <ul className="dashboard-alerts">{expired > 0 && <li><span className="alert-dot alert-expired" />Po terminie: <strong>{expired}</strong></li>}{expiring > 0 && <li><span className="alert-dot alert-soon" />Wygasają w ciągu 90 dni: <strong>{expiring}</strong></li>}{emptyStock > 0 && <li><span className="alert-dot alert-empty" />Stan tabletek wynosi zero: <strong>{emptyStock}</strong></li>}</ul> : <div className="dashboard-message">{medicines.length ? 'Nie ma zapisanych leków po terminie ani z zerowym stanem tabletek.' : 'Dodaj pierwszy lek, aby zobaczyć stan swojej apteczki.'}</div>}<p className="dashboard-note">Informacje opierają się na datach i stanie wpisanych w aplikacji.</p></div></div>
  </section>
}

function localDateFor(date) { return date.toLocaleDateString('en-CA') }
