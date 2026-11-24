import { useState } from 'react'
import { packageTabletCount } from '../inventory'
import DateSelect from './DateSelect'
import Dialog from './Dialog'
import { FormActions, PersonSelect, QuantityInput, StockInput } from './FormFields'

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

  return <Dialog className="medicine-editor" titleId="medicine-editor-title" onClose={onClose}>
    <div className="eyebrow">TWOJA APTECZKA</div><h2 id="medicine-editor-title">Edytuj lek</h2>
    <form onSubmit={submit}>
      <label>Nazwa leku<input required value={form.name} onChange={event => update('name', event.target.value)} /></label>
      <div className="form-row"><label>Moc<input value={form.strength || ''} onChange={event => update('strength', event.target.value)} /></label><label>Postać<input value={form.productForm || ''} onChange={event => update('productForm', event.target.value)} /></label></div>
      <label>Opis opakowania<input value={form.packageDescription || ''} onChange={event => update('packageDescription', event.target.value)} /></label>
      <PersonSelect people={people} value={form.person} onChange={value => update('person', value)} />
      <DateSelect label="Termin ważności" value={form.expiry || ''} onChange={value => update('expiry', value)} />
      <div className="form-row"><QuantityInput value={form.quantity ?? '1'} onChange={value => update('quantity', value)} /><StockInput value={form.stock} onChange={value => update('stock', value)} limit={limit} /></div>
      {limit !== null && <p className="form-hint">W opakowaniu jest maksymalnie {limit} tabletek.</p>}
      <div className="form-row"><label>Kod<input value={form.code || ''} onChange={event => update('code', event.target.value)} /></label><label>Numer partii<input value={form.batch || ''} onChange={event => update('batch', event.target.value)} /></label></div>
      <div className="medicine-photo-field"><strong>Zdjęcie leku</strong><p>Dodaj zdjęcie samego leku, aby łatwiej go rozpoznać.</p>{form.photo && <img src={form.photo} alt="Podgląd zdjęcia leku" />}<label className="photo-picker">{loading ? 'Wczytywanie zdjęcia…' : form.photo ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}<input type="file" accept="image/*" disabled={loading} onChange={choosePhoto} /></label>{form.photo && <button type="button" className="button-quiet" onClick={() => update('photo', '')}>Usuń zdjęcie</button>}</div>
      {error && <p className="error" role="alert">{error}</p>}
      <FormActions><button type="button" className="button-quiet" onClick={onClose}>Anuluj</button><button className="primary" disabled={loading}>Zapisz zmiany</button></FormActions>
    </form>
  </Dialog>
}
