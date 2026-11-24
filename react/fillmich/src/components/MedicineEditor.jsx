import { useState } from 'react'
import { packageTabletCount } from '../inventory'

export default function MedicineEditor({ medicine, people, onClose, onSave }) {
  const [form, setForm] = useState(() => ({ ...medicine, stock: medicine.stock ?? '' }))
  const limit = packageTabletCount(form.packageDescription)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))

  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setLoading(true); setError('')
    try {
      const url = URL.createObjectURL(file)
      try {
        const image = new Image()
        image.src = url
        await image.decode()
        const scale = Math.min(1, 400 / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        update('photo', canvas.toDataURL('image/jpeg', 0.75))
      } finally { URL.revokeObjectURL(url) }
    } catch { setError('Nie udało się odczytać zdjęcia. Wybierz inny plik.') }
    finally { setLoading(false) }
  }

  function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) { setError('Podaj nazwę leku.'); return }
    const result = onSave({ ...form, name: form.name.trim(), stock: form.stock === '' ? null : Number(form.stock) })
    if (result === false) setError('Nie udało się zapisać leku. Może brakować miejsca na urządzeniu — spróbuj usunąć zdjęcie.')
  }

  return <div className="overlay" onClick={onClose}><section className="dialog medicine-editor" role="dialog" aria-modal="true" aria-labelledby="medicine-editor-title" onClick={event => event.stopPropagation()}>
    <button type="button" className="close" aria-label="Zamknij" onClick={onClose}>×</button>
    <div className="eyebrow">TWOJA APTECZKA</div><h2 id="medicine-editor-title">Edytuj lek</h2>
    <form onSubmit={submit}>
      <label>Nazwa leku<input required value={form.name} onChange={event => update('name', event.target.value)} /></label>
      <div className="form-row"><label>Moc<input value={form.strength || ''} onChange={event => update('strength', event.target.value)} /></label><label>Postać<input value={form.productForm || ''} onChange={event => update('productForm', event.target.value)} /></label></div>
      <label>Opis opakowania<input value={form.packageDescription || ''} onChange={event => update('packageDescription', event.target.value)} /></label>
      <div className="form-row"><label>Dla kogo<select value={form.person} onChange={event => update('person', event.target.value)}>{people.map(person => <option key={person} value={person}>{person === 'Wspólne' ? 'Bez przypisania' : person}</option>)}</select></label><label>Termin ważności<input type="date" lang="pl" value={form.expiry || ''} onChange={event => update('expiry', event.target.value)} /></label></div>
      <div className="form-row"><label>Liczba opakowań<input type="number" min="1" step="1" required value={form.quantity ?? '1'} onChange={event => update('quantity', event.target.value)} /></label><label>Pozostało tabletek<input type="number" min="0" max={limit ?? 1000000} step="any" inputMode="decimal" value={form.stock} onChange={event => update('stock', event.target.value)} placeholder="Nie podano" /></label></div>
      {limit !== null && <p className="form-hint">W opakowaniu jest maksymalnie {limit} tabletek.</p>}
      <div className="form-row"><label>Kod<input value={form.code || ''} onChange={event => update('code', event.target.value)} /></label><label>Numer partii<input value={form.batch || ''} onChange={event => update('batch', event.target.value)} /></label></div>
      <div className="medicine-photo-field"><strong>Zdjęcie leku</strong><p>Dodaj zdjęcie samego leku, aby łatwiej go rozpoznać.</p>{form.photo && <img src={form.photo} alt="Podgląd zdjęcia leku" />}<label className="photo-picker">{loading ? 'Wczytywanie zdjęcia…' : form.photo ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}<input type="file" accept="image/*" disabled={loading} onChange={choosePhoto} /></label>{form.photo && <button type="button" className="button-quiet" onClick={() => update('photo', '')}>Usuń zdjęcie</button>}</div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="wizard-actions"><button type="button" className="button-quiet" onClick={onClose}>Anuluj</button><button className="primary" disabled={loading}>Zapisz zmiany</button></div>
    </form>
  </section></div>
}
