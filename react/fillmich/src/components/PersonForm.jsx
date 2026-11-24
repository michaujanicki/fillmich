import { useState } from 'react'

export default function PersonForm({ people, onAdd, onCancel, compact = false }) {
  const [name, setName] = useState('')
  const [includeBirthday, setIncludeBirthday] = useState(false)
  const [birthDay, setBirthDay] = useState(1)
  const [birthMonth, setBirthMonth] = useState(1)
  const [birthYear, setBirthYear] = useState(() => new Date().getFullYear())
  const [error, setError] = useState('')
  const [added, setAdded] = useState('')
  const [today] = useState(() => new Date().toLocaleDateString('en-CA'))
  function submit(event) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) { setError('Podaj imię lub nazwę osoby.'); return }
    if (people.some(person => person.toLocaleLowerCase('pl') === cleanName.toLocaleLowerCase('pl'))) { setError('Osoba o tej nazwie już istnieje. Wybierz inną nazwę.'); return }
    const birthday = includeBirthday ? `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}` : ''
    if (includeBirthday && birthDay > new Date(birthYear, birthMonth, 0).getDate()) { setError('Wybrany dzień nie istnieje w tym miesiącu.'); return }
    if (birthday && birthday > today) { setError('Data urodzenia nie może być w przyszłości.'); return }
    onAdd({ name: cleanName, birthday })
    setName(''); setIncludeBirthday(false); setBirthDay(1); setBirthMonth(1); setBirthYear(new Date().getFullYear()); setError(''); setAdded(cleanName)
  }
  return <form className={`person-form ${compact ? 'person-form-compact' : ''}`} onSubmit={submit}>
    <label>Imię lub nazwa<input autoFocus required maxLength="60" value={name} onChange={event => { setName(event.target.value); setError(''); setAdded('') }} placeholder="Np. Ania lub Dom" /></label>
    <fieldset className="birthday-sliders"><legend>Data urodzenia <span className="optional">Opcjonalnie</span></legend><label className="birthday-toggle"><input type="checkbox" checked={includeBirthday} onChange={event => { setIncludeBirthday(event.target.checked); setError('') }} /> Podaj datę urodzenia</label>{includeBirthday && <div className="birthday-selects"><label>Dzień<select value={birthDay} onChange={event => { setBirthDay(Number(event.target.value)); setError('') }}>{Array.from({ length: 31 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label>Miesiąc<select value={birthMonth} onChange={event => { setBirthMonth(Number(event.target.value)); setError('') }}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index, 1).toLocaleDateString('pl-PL', { month: 'long' })}</option>)}</select></label><label>Rok<select value={birthYear} onChange={event => { setBirthYear(Number(event.target.value)); setError('') }}>{Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) => <option key={index} value={new Date().getFullYear() - index}>{new Date().getFullYear() - index}</option>)}</select></label></div>}</fieldset>
    <p className="form-hint">Dane są zapisywane lokalnie na tym urządzeniu.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {added && <p className="person-success" role="status">Dodano osobę: {added}.</p>}
    <div className="person-actions">{onCancel && <button type="button" className="button-quiet" onClick={onCancel}>Zamknij</button>}<button className="primary" type="submit">Dodaj osobę</button></div>
  </form>
}
