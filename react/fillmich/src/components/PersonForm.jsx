import { useState } from 'react'

import DateSelect from './DateSelect'
import { localDate } from '../date'

export default function PersonForm({ people, onAdd, onCancel, compact = false }) {
  const [name, setName] = useState('')
  const [includeBirthday, setIncludeBirthday] = useState(false)
  const [birthday, setBirthday] = useState('')
  const [error, setError] = useState('')
  const [added, setAdded] = useState('')
  const [today] = useState(localDate)
  function submit(event) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) { setError('Podaj imię lub nazwę osoby.'); return }
    if (people.some(person => person.toLocaleLowerCase('pl') === cleanName.toLocaleLowerCase('pl'))) { setError('Osoba o tej nazwie już istnieje. Wybierz inną nazwę.'); return }
    if (includeBirthday && birthday > today) { setError('Data urodzenia nie może być w przyszłości.'); return }
    onAdd({ name: cleanName, birthday: includeBirthday ? birthday : '' })
    setName(''); setIncludeBirthday(false); setBirthday(''); setError(''); setAdded(cleanName)
  }
  return <form className={`person-form ${compact ? 'person-form-compact' : ''}`} onSubmit={submit}>
    <label>Imię lub nazwa<input autoFocus required maxLength="60" value={name} onChange={event => { setName(event.target.value); setError(''); setAdded('') }} placeholder="Np. Ania lub Dom" /></label>
    <fieldset className="birthday-sliders"><legend>Data urodzenia <span className="optional">Opcjonalnie</span></legend><label className="birthday-toggle"><input type="checkbox" checked={includeBirthday} onChange={event => { setIncludeBirthday(event.target.checked); setBirthday(''); setError('') }} /> Podaj datę urodzenia</label>{includeBirthday && <DateSelect label="Data urodzenia" kind="birth" value={birthday} required onChange={value => { setBirthday(value); setError('') }} />}</fieldset>
    <p className="form-hint">Dane są zapisywane lokalnie na tym urządzeniu.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {added && <p className="person-success" role="status">Dodano osobę: {added}.</p>}
    <div className="person-actions">{onCancel && <button type="button" className="button-quiet" onClick={onCancel}>Zamknij</button>}<button className="primary" type="submit">Dodaj osobę</button></div>
  </form>
}
