import { useEffect, useState } from 'react'
import './App.css'
import brandBanner from './assets/fillmich-banner.svg'
import MedicineWizard from './components/MedicineWizard'
import Tutorial from './components/Tutorial'
import PersonForm from './components/PersonForm'
import MedicationPlan from './components/MedicationPlan'
import Dashboard from './components/Dashboard'
import PageHeader from './components/PageHeader'
import Settings from './components/Settings'
import StockEditor from './components/StockEditor'
import MedicineEditor from './components/MedicineEditor'
import MedicinePhoto from './components/MedicinePhoto'
import MedicineDetails from './components/MedicineDetails'
import { formatAmount, hasStock, packageTabletCount } from './inventory'
import { formatDate } from './date'
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
const packageLabel = medicine => {
  const description = medicine.packageDescription || ''
  if (!hasStock(medicine) || packageTabletCount(description) === null) return description
  return description.replace(/\b(\d+)\s*(tabl\.|tablet(?:ka|ki|ek)\b)/i, (match, count, unit) => `${formatAmount(medicine.stock)}/${count} ${unit}`)
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
  const [textSize, setTextSize] = useState(() => { const saved = read('fillmich-text-size', 'medium'); return ['standard', 'medium', 'large', 'extra', 'extreme'].includes(saved) ? saved : 'medium' })
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
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [photoMedicine, setPhotoMedicine] = useState(null)
  const [detailsMedicine, setDetailsMedicine] = useState(null)
  const [personToRemove, setPersonToRemove] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState('summary')
  const [removeMedicines, setRemoveMedicines] = useState(false)
  const [tutorial, setTutorial] = useState(() => !read('fillmich-tutorial-seen', false))
  const [firstRun, setFirstRun] = useState(() => !people.some(person => person !== 'Wspólne'))
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
  function saveMedicine(updated) {
    const next = medicines.map(medicine => medicine.id === updated.id ? updated : medicine)
    try { localStorage.setItem('fillmich-medicines', JSON.stringify(next)) } catch { return false }
    setMedicines(next)
    setEditingMedicine(null)
    return true
  }
  function addPerson({ name, birthday }) { setPeople(current => [...current, name]); setProfiles(current => ({ ...current, [name]: { birthday } })) }
  function undoFirstPerson(name) { setPeople(current => current.filter(person => person !== name)); setProfiles(current => { const next = { ...current }; delete next[name]; return next }) }
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
    if (people.filter(person => person !== 'Wspólne').length <= 1) { window.alert('W apteczce musi pozostać co najmniej jedna osoba lub nazwa. Aby usunąć tę pozycję, najpierw dodaj inną.'); setPersonToRemove(null); return }
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
  if (firstRun || !people.some(person => person !== 'Wspólne')) return <main className="first-person-screen"><Tutorial people={people} onAddPerson={addPerson} onUndoPerson={undoFirstPerson} theme={theme} setTheme={setTheme} onClose={() => { setFirstRun(false); closeTutorial() }} requiredPerson /></main>
  return <div className="layout">
    {menuOpen && <button className="drawer-backdrop" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)} />}
    <aside id="app-menu" className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}><button className="drawer-close" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)}>&times;</button><div className="brand brand-banner"><img src={brandBanner} alt="Fillmich" /></div><div className="side-label">TWOJA PRZESTRZEŃ</div><button type="button" className={`nav ${view === 'summary' ? 'active' : ''}`} aria-current={view === 'summary' ? 'page' : undefined} onClick={() => navigate('summary')}><span>⌂</span> Podsumowanie</button><button type="button" className={`nav ${view === 'cupboard' ? 'active' : ''}`} aria-current={view === 'cupboard' ? 'page' : undefined} onClick={() => navigate('cupboard')}><span>▦</span> Apteczka <b>{medicines.length}</b></button><button type="button" className={`nav ${view === 'dosage' ? 'active' : ''}`} aria-current={view === 'dosage' ? 'page' : undefined} onClick={() => navigate('dosage')}><span>◷</span> Dawkowanie</button><div className="side-label people-label">OSOBY</div><button className={`person-nav ${filter === 'Wszystkie' ? 'selected' : ''}`} onClick={() => { setFilter('Wszystkie'); navigate('cupboard') }}><span className="avatar all"><img src={`${import.meta.env.BASE_URL}fillmich-icon.svg`} alt="" /></span> Wszyscy</button>{people.filter(person => person !== 'Wspólne').map((person, index) => <div className="person-row" key={person}><button className={`person-nav ${filter === person ? 'selected' : ''}`} onClick={() => { setFilter(person); navigate('cupboard') }}><span className={`avatar color-${index % 3}`}>{person === 'Wspólne' ? '⌂' : person.charAt(0).toUpperCase()}</span>{person}</button>{person !== 'Wspólne' && <button type="button" className="remove-person" aria-label={`Usuń osobę ${person}`} title={`Usuń osobę ${person}`} onClick={() => { if (people.filter(item => item !== 'Wspólne').length <= 1) { window.alert('W apteczce musi pozostać co najmniej jedna osoba lub nazwa. Aby usunąć tę pozycję, najpierw dodaj inną.'); return } setRemoveMedicines(false); setPersonToRemove(person); setMenuOpen(false) }}>×</button>}</div>)}<button className="add-person-button" onClick={() => { setPersonModal(true); setMenuOpen(false) }}>+ &nbsp; Dodaj osobę</button><div className="sidebar-bottom"><button type="button" className={`nav settings-nav ${view === 'settings' ? 'active' : ''}`} aria-current={view === 'settings' ? 'page' : undefined} onClick={() => navigate('settings')}><span>⚙</span> Ustawienia</button><div className="sidebar-version">Fillmich · {version.name}</div></div></aside>
    <main className="main"><header className="topbar"><button className="menu-trigger" type="button" aria-label="Otwórz menu" aria-expanded={menuOpen} aria-controls="app-menu" onClick={() => setMenuOpen(true)}><span></span><span></span><span></span></button><div className="header-banner"><img src={brandBanner} alt="Fillmich" /></div><div className="breadcrumb">Twoja przestrzeń <span> / </span> <strong>{view === 'summary' ? 'Podsumowanie' : view === 'cupboard' ? 'Apteczka' : view === 'dosage' ? 'Dawkowanie' : 'Ustawienia'}</strong></div><div className="top-actions"><button type="button" className="help-button" onClick={() => setTutorial(true)}>Jak korzystać?</button><span className="local-badge">● &nbsp; Zapisano na urządzeniu</span><button type="button" className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Włącz ciemny motyw' : 'Włącz jasny motyw'} title={theme === 'light' ? 'Włącz ciemny motyw' : 'Włącz jasny motyw'}><span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span><span>{theme === 'light' ? 'Ciemny motyw' : 'Jasny motyw'}</span></button></div></header><div className="content">{view === 'summary' && <Dashboard medicines={medicines} people={people} plans={plans} history={doseHistory} onNavigate={destination => { if (destination === 'cupboard') setFilter('Wszystkie'); navigate(destination) }} onAddMedicine={() => { setFilter('Wszystkie'); setModal(true) }} />}{view === 'cupboard' && <><PageHeader eyebrow="TWOJE ZDROWIE, W JEDNYM MIEJSCU" title="Apteczka" description="Twoje domowe zapasy w jednym miejscu." action={<button className="primary" onClick={() => setModal(true)}>+ Dodaj lek</button>} />
    <div className="overview"><div className="overview-copy"><div className="eyebrow">DOBRZE MIEĆ TO POD KONTROLĄ</div><h2>Mały porządek,<br /><em>wielki spokój.</em></h2><p>Miej oko na domowe zapasy i terminy ważności leków całej rodziny.</p><div className="overview-decoration" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}fillmich-icon.svg`} alt="" /> <span>♡</span></div></div><div className="stats"><div className="stat"><span className="stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M9 5V4h6v1M12 9v6m-3-3h6"/></svg></span><div><strong>{medicines.length}</strong><small>leków w apteczce</small></div></div><div className="stat"><span className="stat-icon peach" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg></span><div><strong>{expiring}</strong><small>do sprawdzenia</small></div></div></div></div>
    <section className="med-section">{profiles[filter]?.birthday && <p className="profile-info">Data urodzenia: {new Date(`${profiles[filter].birthday}T12:00:00`).toLocaleDateString('pl-PL')}</p>}<div className="section-heading"><div><div className="eyebrow">TWOJE ZAPASY</div><h2>Leki w apteczce <span className="count">{visible.length}</span></h2></div><label className="search"><span>⌕</span><input placeholder="Szukaj leku lub kodu..." value={search} onChange={e => setSearch(e.target.value)} /></label></div><div className="filters">{['Wszystkie', ...people.filter(person => person !== 'Wspólne')].map(person => <button key={person} className={filter === person ? 'chosen' : ''} onClick={() => setFilter(person)}>{person}</button>)}</div>
    {visible.length ? <div className="medicine-list">{visible.map(m => { const s = status(m.expiry); return <article className="medicine" key={m.id} onClick={event => { if (!event.target.closest('button, a, input, select')) setDetailsMedicine(m) }}>
      {m.photo ? <button type="button" className="medicine-icon medicine-photo-button" onClick={() => setPhotoMedicine(m)} aria-label={`Powiększ zdjęcie leku ${m.name}`}><img src={m.photo} alt="" /></button> : <div className="medicine-icon" aria-hidden="true">✚</div>}
      <div className="medicine-name"><h3><button type="button" className="medicine-title-button" onClick={() => setDetailsMedicine(m)} aria-label={`Pokaż szczegóły leku ${m.name}`}>{m.name}</button></h3><p>{[m.strength, packageLabel(m)].filter(Boolean).join(' · ') || 'Brak szczegółów opakowania'}</p>{m.batch && <p className="medicine-code">Partia: {m.batch}</p>}</div>
      {hasStock(m) && <div className="medicine-stock-preview" role="img" aria-label={`Pozostało ${formatAmount(m.stock)} tabletek`}><span className="medicine-stock-preview-label">POZOSTAŁO</span><div className="medicine-pills" aria-hidden="true">{Array.from({ length: Math.min(5, Math.ceil(Number(m.stock))) }, (_, index) => <span className="medicine-pill" key={index} style={{ '--pill-fill': `${Math.max(0, Math.min(1, Number(m.stock) - index)) * 100}%` }} />)}{Number(m.stock) > 5 && <span className="medicine-pill-extra">+{formatAmount(Number(m.stock) - 5)}</span>}{Number(m.stock) === 0 && <span className="medicine-pill-empty">0 tabl.</span>}</div></div>}
      <div className="medicine-actions"><button type="button" className="button-quiet medicine-edit" onClick={() => setEditingMedicine(m)} aria-label={`Edytuj ${m.name}`}>Edytuj</button><button type="button" className="button-quiet medicine-stock-action" onClick={() => setStockMedicine(m)} aria-label={`Zmień stan leku ${m.name}`}>Stan</button><button type="button" className="button-quiet medicine-remove" onClick={() => deleteMedicine(m)} aria-label={`Usuń ${m.name}`}>Usuń</button></div>
      <div className="medicine-details"><div className="medicine-meta medicine-expiry"><small>WAŻNY DO</small><span>{formatDate(m.expiry) || 'Nie podano'}</span></div>{m.expiry && <span className={`status ${s.type}`}>{s.label}</span>}</div>
    </article> })}</div> : <div className="empty"><div className="empty-icon">✚</div><h3>{medicines.length ? 'Nie znaleziono leków' : 'Tu zaczyna się Twoja apteczka'}</h3><p>{medicines.length ? 'Zmień wyszukiwanie lub wybierz inną osobę.' : 'Dodaj pierwszy lek i miej swoje domowe zapasy zawsze pod kontrolą.'}</p>{!medicines.length && <button className="text-button" onClick={() => setModal(true)}>Dodaj pierwszy lek →</button>}</div>}</section></>}{view === 'dosage' && <MedicationPlan medicines={medicines} setMedicines={setMedicines} people={people} plans={plans} setPlans={setPlans} history={doseHistory} setHistory={setDoseHistory} />}{view === 'settings' && <Settings theme={theme} setTheme={setTheme} textSize={textSize} setTextSize={setTextSize} onTutorial={() => setTutorial(true)} version={version.name} />}</div></main>
    {modal && <MedicineWizard people={people} initialPerson={filter === 'Wszystkie' ? 'Wspólne' : filter} onClose={() => setModal(false)} onSave={addMedicine} />}
    {stockMedicine && <StockEditor medicine={stockMedicine} onClose={() => setStockMedicine(null)} onSave={stock => { setMedicines(current => current.map(medicine => medicine.id === stockMedicine.id ? { ...medicine, stock } : medicine)); setStockMedicine(null) }} />}
    {editingMedicine && <MedicineEditor medicine={editingMedicine} people={people} onClose={() => setEditingMedicine(null)} onSave={saveMedicine} />}
    {detailsMedicine && <MedicineDetails medicine={detailsMedicine} onClose={() => setDetailsMedicine(null)} onEdit={() => { setEditingMedicine(detailsMedicine); setDetailsMedicine(null) }} onStock={() => { setStockMedicine(detailsMedicine); setDetailsMedicine(null) }} />}
    {photoMedicine && <MedicinePhoto medicine={photoMedicine} onClose={() => setPhotoMedicine(null)} />}
    {personModal && <div className="overlay" onClick={() => setPersonModal(false)}><section className="dialog person-dialog" role="dialog" aria-modal="true" aria-labelledby="person-title" onClick={event => event.stopPropagation()}><button className="close" aria-label="Zamknij" onClick={() => setPersonModal(false)}>×</button><div className="eyebrow">TWOJA APTECZKA</div><h2 id="person-title">Dodaj osobę</h2><p>Utwórz profil, aby przypisywać do niego leki.</p><PersonForm people={people} onAdd={person => { addPerson(person); setPersonModal(false) }} onCancel={() => setPersonModal(false)} /></section></div>}
    {personToRemove && <div className="overlay" onClick={() => setPersonToRemove(null)}><section className="dialog remove-person-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-person-title" onClick={event => event.stopPropagation()}><button className="close" aria-label="Zamknij" onClick={() => setPersonToRemove(null)}>&times;</button><div className="eyebrow">OSOBY W APTECZCE</div><h2 id="remove-person-title">Usuń osobę</h2><p>Czy chcesz usunąć profil: <strong>{personToRemove}</strong>? Wybierz, co zrobić z przypisanymi lekami ({medicines.filter(medicine => medicine.person === personToRemove).length}). Plany przyjmowania tej osoby zostaną usunięte.</p><fieldset className="remove-options"><legend>Przypisane leki</legend><label><input type="radio" name="remove-medicines" checked={!removeMedicines} onChange={() => setRemoveMedicines(false)} /> Pozostaw w apteczce bez przypisania</label><label><input type="radio" name="remove-medicines" checked={removeMedicines} onChange={() => setRemoveMedicines(true)} /> Usuń razem z osobą</label></fieldset><div className="wizard-actions"><button className="button-quiet" onClick={() => setPersonToRemove(null)}>Anuluj</button><button className="primary danger-button" onClick={deletePerson}>Usuń osobę</button></div></section></div>}
    {tutorial && <Tutorial onClose={closeTutorial} people={people} onAddPerson={addPerson} theme={theme} setTheme={setTheme} />}

  </div>
}
export default App


