import { useEffect, useState } from 'react'
import './App.css'
import brandBanner from './assets/fillmich-banner.svg'
import MedicineWizard from './components/MedicineWizard'
import Tutorial from './components/Tutorial'
import PersonForm from './components/PersonForm'
import MedicationPlan from './components/MedicationPlan'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import StockEditor from './components/StockEditor'
import { formatAmount, hasStock } from './inventory'
import version from './version.json'

const read = (key, fallback) => {
  try {
    const data = JSON.parse(localStorage.getItem(key)) ?? fallback
    const fixPerson = person => person === 'Wsp\u0102\u0142lne' ? 'Wspólne' : person
    if (Array.isArray(data) && key === 'fillmich-people') return [...new Set(data.map(fixPerson))]
    if (Array.isArray(data) && key === 'fillmich-medicines') return data.map(item => ({ ...item, person: fixPerson(item.person) }))
    return data
  } catch { return fallback }
}
const today = () => new Date().toLocaleDateString('en-CA')
function status(date) {
  if (!date) return { label: 'Brak daty', type: 'neutral' }
  if (date < today()) return { label: 'Po terminie', type: 'expired' }
  const limit = new Date(); limit.setDate(limit.getDate() + 90)
  return date <= limit.toLocaleDateString('en-CA') ? { label: 'Wkrótce wygasa', type: 'soon' } : { label: 'W terminie', type: 'good' }
}
function App() {
  const [theme, setTheme] = useState(() => read('fillmich-theme', 'light') === 'dark' ? 'dark' : 'light')
  const [textSize, setTextSize] = useState(() => { const saved = read('fillmich-text-size', 'large'); return ['standard', 'large', 'extra'].includes(saved) ? saved : 'large' })
  const [medicines, setMedicines] = useState(() => read('fillmich-medicines', []))
  const [people, setPeople] = useState(() => read('fillmich-people', ['Wspólne']))
  const [profiles, setProfiles] = useState(() => read('fillmich-profiles', {}))
  const [plans, setPlans] = useState(() => read('fillmich-plans', []))
  const [doseHistory, setDoseHistory] = useState(() => read('fillmich-dose-history', {}))
  const [filter, setFilter] = useState('Wszystkie')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [personModal, setPersonModal] = useState(false)
  const [stockMedicine, setStockMedicine] = useState(null)
  const [personToRemove, setPersonToRemove] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState('summary')
  const [removeMedicines, setRemoveMedicines] = useState(false)
  const [tutorial, setTutorial] = useState(() => !read('fillmich-tutorial-seen', false))
  useEffect(() => { localStorage.setItem('fillmich-theme', JSON.stringify(theme)); document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme }, [theme])
  useEffect(() => { localStorage.setItem('fillmich-text-size', JSON.stringify(textSize)); document.documentElement.dataset.textSize = textSize }, [textSize])
  useEffect(() => { localStorage.setItem('fillmich-medicines', JSON.stringify(medicines)) }, [medicines])
  useEffect(() => { localStorage.setItem('fillmich-people', JSON.stringify(people)) }, [people])
  useEffect(() => { localStorage.setItem('fillmich-profiles', JSON.stringify(profiles)) }, [profiles])
  useEffect(() => { localStorage.setItem('fillmich-plans', JSON.stringify(plans)) }, [plans])
  useEffect(() => { localStorage.setItem('fillmich-dose-history', JSON.stringify(doseHistory)) }, [doseHistory])
  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = event => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape) }
  }, [menuOpen])
  function closeTutorial() { localStorage.setItem('fillmich-tutorial-seen', JSON.stringify(true)); setTutorial(false) }
  function navigate(next) { setView(next); setMenuOpen(false); window.scrollTo({ top: 0 }) }
  function addMedicine(medicine) { setMedicines(current => [{ ...medicine, id: crypto.randomUUID() }, ...current]); setModal(false) }
  function addPerson({ name, birthday }) { setPeople(current => [...current, name]); setProfiles(current => ({ ...current, [name]: { birthday } })) }
  function removePlans(ids) {
    const removed = new Set(ids)
    setPlans(current => current.filter(plan => !removed.has(plan.id)))
    setDoseHistory(current => Object.fromEntries(Object.entries(current).filter(([key]) => !removed.has(key.split('|')[1]))))
  }
  function deleteMedicine(medicine) {
    const associated = plans.filter(plan => plan.medicineId === medicine.id)
    if (!window.confirm(`Usunąć ${medicine.name} z apteczki?${associated.length ? ' Powiązane plany przyjmowania również zostaną usunięte.' : ''}`)) return
    setMedicines(current => current.filter(item => item.id !== medicine.id))
    removePlans(associated.map(plan => plan.id))
  }
  function deletePerson() {
    if (!personToRemove || personToRemove === 'Wspólne') return
    const deletedMedicineIds = new Set(removeMedicines ? medicines.filter(medicine => medicine.person === personToRemove).map(medicine => medicine.id) : [])
    removePlans(plans.filter(plan => plan.person === personToRemove || deletedMedicineIds.has(plan.medicineId)).map(plan => plan.id))
    setMedicines(current => removeMedicines ? current.filter(medicine => medicine.person !== personToRemove) : current.map(medicine => medicine.person === personToRemove ? { ...medicine, person: 'Wspólne' } : medicine))
    setPeople(current => current.filter(person => person !== personToRemove))
    setProfiles(current => { const next = { ...current }; delete next[personToRemove]; return next })
    setFilter(current => current === personToRemove ? 'Wszystkie' : current)
    setPersonToRemove(null)
  }
  const visible = medicines.filter(m => (filter === 'Wszystkie' || m.person === filter) && `${m.name} ${m.code}`.toLowerCase().includes(search.toLowerCase()))
  const expiring = medicines.filter(m => ['expired', 'soon'].includes(status(m.expiry).type)).length
  return <div className="layout">
    {menuOpen && <button className="drawer-backdrop" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)} />}
    <aside id="app-menu" className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}><button className="drawer-close" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)}>&times;</button><div className="brand brand-banner"><img src={brandBanner} alt="Fillmich" /></div><div className="side-label">TWOJA PRZESTRZEŃ</div><button type="button" className={`nav ${view === 'summary' ? 'active' : ''}`} aria-current={view === 'summary' ? 'page' : undefined} onClick={() => navigate('summary')}><span>⌂</span> Podsumowanie</button><button type="button" className={`nav ${view === 'cupboard' ? 'active' : ''}`} aria-current={view === 'cupboard' ? 'page' : undefined} onClick={() => navigate('cupboard')}><span>▦</span> Apteczka <b>{medicines.length}</b></button><button type="button" className={`nav ${view === 'dosage' ? 'active' : ''}`} aria-current={view === 'dosage' ? 'page' : undefined} onClick={() => navigate('dosage')}><span>◷</span> Dawkowanie</button><div className="side-label people-label">OSOBY</div><button className={`person-nav ${filter === 'Wszystkie' ? 'selected' : ''}`} onClick={() => { setFilter('Wszystkie'); navigate('cupboard') }}><span className="avatar all">✳</span> Wszyscy</button>{people.map((person, index) => <div className="person-row" key={person}><button className={`person-nav ${filter === person ? 'selected' : ''}`} onClick={() => { setFilter(person); navigate('cupboard') }}><span className={`avatar color-${index % 3}`}>{person === 'Wspólne' ? '⌂' : person.charAt(0).toUpperCase()}</span>{person}</button>{person !== 'Wspólne' && <button type="button" className="remove-person" aria-label={`Usuń osobę ${person}`} title={`Usuń osobę ${person}`} onClick={() => { setRemoveMedicines(false); setPersonToRemove(person); setMenuOpen(false) }}>×</button>}</div>)}<button className="add-person-button" onClick={() => { setPersonModal(true); setMenuOpen(false) }}>+ &nbsp; Dodaj osobę</button><div className="sidebar-bottom"><button type="button" className={`nav settings-nav ${view === 'settings' ? 'active' : ''}`} aria-current={view === 'settings' ? 'page' : undefined} onClick={() => navigate('settings')}><span>⚙</span> Ustawienia</button><div className="sidebar-version">Fillmich · {version.name}</div></div></aside>
    <main className="main"><header className="topbar"><button className="menu-trigger" type="button" aria-label="Otwórz menu" aria-expanded={menuOpen} aria-controls="app-menu" onClick={() => setMenuOpen(true)}><span></span><span></span><span></span></button><div className="header-banner"><img src={brandBanner} alt="Fillmich" /></div><div className="breadcrumb">Twoja przestrzeń <span> / </span> <strong>{view === 'summary' ? 'Podsumowanie' : view === 'cupboard' ? 'Apteczka' : view === 'dosage' ? 'Dawkowanie' : 'Ustawienia'}</strong></div><div className="top-actions"><button type="button" className="help-button" onClick={() => setTutorial(true)}>Jak korzystać?</button><span className="local-badge">● &nbsp; Zapisano na urządzeniu</span><button type="button" className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Włącz ciemny motyw' : 'Włącz jasny motyw'} title={theme === 'light' ? 'Włącz ciemny motyw' : 'Włącz jasny motyw'}><span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span><span>{theme === 'light' ? 'Ciemny motyw' : 'Jasny motyw'}</span></button></div></header><div className="content">{view === 'summary' && <Dashboard medicines={medicines} people={people} plans={plans} history={doseHistory} onNavigate={destination => { if (destination === 'cupboard') setFilter('Wszystkie'); navigate(destination) }} onAddMedicine={() => { setFilter('Wszystkie'); setModal(true) }} />}{view === 'cupboard' && <><div className="heading"><div><div className="eyebrow">TWOJE ZDROWIE, W JEDNYM MIEJSCU</div><h1>Moja apteczka <span>✳</span></h1><p>Wszystko, czego potrzebujesz, żeby zadbać o swoich bliskich.</p></div><button className="primary" onClick={() => setModal(true)}>+ &nbsp; Dodaj lek</button></div>
    <div className="overview"><div className="overview-copy"><div className="eyebrow">DOBRZE MIEĆ TO POD KONTROLĄ</div><h2>Mały porządek,<br /><em>wielki spokój.</em></h2><p>Miej oko na domowe zapasy i terminy ważności leków całej rodziny.</p><div className="overview-decoration">✳ <span>♡</span></div></div><div className="stats"><div className="stat"><span className="stat-icon">▤</span><div><strong>{medicines.length}</strong><small>leków w apteczce</small></div></div><div className="stat"><span className="stat-icon peach">◷</span><div><strong>{expiring}</strong><small>do sprawdzenia</small></div></div></div></div>
    <section className="med-section">{profiles[filter]?.birthday && <p className="profile-info">Data urodzenia: {new Date(`${profiles[filter].birthday}T12:00:00`).toLocaleDateString('pl-PL')}</p>}<div className="section-heading"><div><div className="eyebrow">TWOJE ZAPASY</div><h2>Leki w apteczce <span className="count">{visible.length}</span></h2></div><label className="search"><span>⌕</span><input placeholder="Szukaj leku lub kodu..." value={search} onChange={e => setSearch(e.target.value)} /></label></div><div className="filters">{['Wszystkie', ...people].map(person => <button key={person} className={filter === person ? 'chosen' : ''} onClick={() => setFilter(person)}>{person}</button>)}</div>
    {visible.length ? <div className="medicine-list">{visible.map(m => { const s = status(m.expiry); return <article className="medicine" key={m.id}><div className="medicine-icon">✚</div><div className="medicine-name"><h3>{m.name}</h3><p>{[m.strength, m.productForm, m.packageDescription].filter(Boolean).join(' · ')}{m.strength || m.productForm || m.packageDescription ? ' · ' : ''}{m.code ? `Kod: ${m.code}` : 'Kod nie został dodany'}{m.batch ? ` · Partia: ${m.batch}` : ''}</p><button type="button" className="stock-button" onClick={() => setStockMedicine(m)}>{hasStock(m) ? `Pozostało: ${formatAmount(m.stock)} tabl. · Zmień` : 'Ustaw liczbę tabletek'}</button></div><div className="medicine-meta"><small>DLA KOGO</small><span>{m.person}</span></div><div className="medicine-meta"><small>WAŻNY DO</small><span>{m.expiry || 'Nie podano'}</span></div><span className={`status ${s.type}`}>{s.label}</span><button className="delete" onClick={() => deleteMedicine(m)} aria-label={`Usuń ${m.name}`}>&times;</button></article> })}</div> : <div className="empty"><div className="empty-icon">✚</div><h3>{medicines.length ? 'Nie znaleziono leków' : 'Tu zaczyna się Twoja apteczka'}</h3><p>{medicines.length ? 'Zmień wyszukiwanie lub wybierz inną osobę.' : 'Dodaj pierwszy lek i miej swoje domowe zapasy zawsze pod kontrolą.'}</p>{!medicines.length && <button className="text-button" onClick={() => setModal(true)}>Dodaj pierwszy lek →</button>}</div>}</section></>}{view === 'dosage' && <MedicationPlan medicines={medicines} setMedicines={setMedicines} people={people} plans={plans} setPlans={setPlans} history={doseHistory} setHistory={setDoseHistory} />}{view === 'settings' && <Settings theme={theme} setTheme={setTheme} textSize={textSize} setTextSize={setTextSize} onTutorial={() => setTutorial(true)} version={version.name} />}<div className="footer-note"><span>✳</span> Małe rzeczy robią wielką różnicę. <a href="https://rejestry.ezdrowie.gov.pl/rpl/search/public" target="_blank" rel="noreferrer">Otwórz Rejestr Produktów Leczniczych ↗</a><small className="app-version">Wersja {version.name}</small></div></div></main>
    {modal && <MedicineWizard people={people} initialPerson={filter === 'Wszystkie' ? 'Wspólne' : filter} onClose={() => setModal(false)} onSave={addMedicine} />}
    {stockMedicine && <StockEditor medicine={stockMedicine} onClose={() => setStockMedicine(null)} onSave={stock => { setMedicines(current => current.map(medicine => medicine.id === stockMedicine.id ? { ...medicine, stock } : medicine)); setStockMedicine(null) }} />}
    {personModal && <div className="overlay" onClick={() => setPersonModal(false)}><section className="dialog person-dialog" role="dialog" aria-modal="true" aria-labelledby="person-title" onClick={event => event.stopPropagation()}><button className="close" aria-label="Zamknij" onClick={() => setPersonModal(false)}>×</button><div className="eyebrow">TWOJA APTECZKA</div><h2 id="person-title">Dodaj osobę</h2><p>Utwórz profil, aby przypisywać do niego leki.</p><PersonForm people={people} onAdd={person => { addPerson(person); setPersonModal(false) }} onCancel={() => setPersonModal(false)} /></section></div>}
    {personToRemove && <div className="overlay" onClick={() => setPersonToRemove(null)}><section className="dialog remove-person-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-person-title" onClick={event => event.stopPropagation()}><button className="close" aria-label="Zamknij" onClick={() => setPersonToRemove(null)}>&times;</button><div className="eyebrow">OSOBY W APTECZCE</div><h2 id="remove-person-title">Usuń osobę</h2><p>Czy chcesz usunąć profil: <strong>{personToRemove}</strong>? Wybierz, co zrobić z przypisanymi lekami ({medicines.filter(medicine => medicine.person === personToRemove).length}). Plany przyjmowania tej osoby zostaną usunięte.</p><fieldset className="remove-options"><legend>Przypisane leki</legend><label><input type="radio" name="remove-medicines" checked={!removeMedicines} onChange={() => setRemoveMedicines(false)} /> Przenieś do wspólnej apteczki</label><label><input type="radio" name="remove-medicines" checked={removeMedicines} onChange={() => setRemoveMedicines(true)} /> Usuń razem z osobą</label></fieldset><div className="wizard-actions"><button className="button-quiet" onClick={() => setPersonToRemove(null)}>Anuluj</button><button className="primary danger-button" onClick={deletePerson}>Usuń osobę</button></div></section></div>}
    {tutorial && <Tutorial onClose={closeTutorial} people={people} onAddPerson={addPerson} />}

  </div>
}
export default App


