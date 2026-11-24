import { useEffect, useState } from 'react'
import { doseKey, formatAmount, hasStock } from '../inventory'
import PageHeader from './PageHeader'

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
    <PageHeader eyebrow="TWOJA DOMOWA APTECZKA" title="Podsumowanie" description="Wszystko, co ważne, w jednym miejscu." action={<button type="button" className="primary" onClick={onAddMedicine}>+ Dodaj lek</button>} />
    <div className="overview dashboard-summary-overview">
      <div className="overview-copy"><div className="eyebrow">TWOJA DOMOWA APTECZKA</div><h2>Twoja apteczka<br /><em>w skrócie.</em></h2><p>Sprawdź zapasy i plan przyjmowania całej rodziny.</p></div>
      <div className="stats">
        <button className="stat" type="button" onClick={() => onNavigate('cupboard')}><span className="stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M9 5V4h6v1M12 9v6m-3-3h6" /></svg></span><div><strong>{medicines.length}</strong><small>leków w apteczce</small></div></button>
        <button className="stat" type="button" onClick={() => onNavigate('cupboard')}><span className="stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3" /><path d="M5 20v-1a7 7 0 0 1 14 0v1" /></svg></span><div><strong>{household}</strong><small>osób</small></div></button>
      </div>
    </div>
    <div className="dashboard-grid"><div className="dashboard-card"><div className="dashboard-card-head"><div><div className="eyebrow">PLAN NA DZIŚ</div><h2>Dzisiejsze dawki</h2></div><button className="button-quiet" type="button" onClick={() => onNavigate('dosage')}>Zobacz plan →</button></div>{doses.length ? <><div className="dashboard-progress"><div><span>Dzisiejszy postęp</span><strong>{taken} / {doses.length}</strong></div><div className="dashboard-progress-track" role="progressbar" aria-label="Przyjęte dawki dzisiaj" aria-valuemin={0} aria-valuemax={doses.length} aria-valuenow={taken}><span style={{ width: `${taken / doses.length * 100}%` }} /></div><small>przyjętych dawek</small></div>{remaining.length ? <div className="dashboard-dose-list"><div className="dashboard-list-label">DO PRZYJĘCIA</div>{remaining.slice(0, 3).map(dose => <div className="dashboard-dose" key={`${dose.planId}-${dose.id}`}><span className="dashboard-time">{dose.time}</span><div><strong>{dose.medicine.name}</strong><small>{dose.person}</small></div><span className="dashboard-dose-amount">{formatAmount(dose.amount)} tabl.</span></div>)}{remaining.length > 3 && <p>Oraz {remaining.length - 3} kolejnych w planie.</p>}</div> : <div className="dashboard-message">Wszystkie dzisiejsze dawki są oznaczone jako przyjęte.</div>}</> : <div className="dashboard-message">Nie masz jeszcze zaplanowanych dawek. Dodaj plan w zakładce Dawkowanie.</div>}</div>
    <div className="dashboard-card"><div className="dashboard-card-head"><div><div className="eyebrow">STAN APTECZKI</div><h2>Warto sprawdzić</h2></div><button className="button-quiet" type="button" onClick={() => onNavigate('cupboard')}>Zobacz leki →</button></div>{expired || expiring || emptyStock ? <ul className="dashboard-alerts">{expired > 0 && <li><span className="alert-dot alert-expired" /><span>Po terminie</span><strong>{expired}</strong></li>}{expiring > 0 && <li><span className="alert-dot alert-soon" /><span>Wygasają w ciągu 90 dni</span><strong>{expiring}</strong></li>}{emptyStock > 0 && <li><span className="alert-dot alert-empty" /><span>Brak tabletek</span><strong>{emptyStock}</strong></li>}</ul> : <div className="dashboard-message">{medicines.length ? 'Nie ma zapisanych leków po terminie ani z zerowym stanem tabletek.' : 'Dodaj pierwszy lek, aby zobaczyć stan swojej apteczki.'}</div>}<p className="dashboard-note">Informacje opierają się na datach i stanie wpisanych w aplikacji.</p></div></div>
  </section>
}

function localDateFor(date) { return date.toLocaleDateString('en-CA') }
