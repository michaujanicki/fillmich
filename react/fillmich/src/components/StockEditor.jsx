import { useState } from 'react'
import { hasStock } from '../inventory'

export default function StockEditor({ medicine, onSave, onClose }) {
  const [value, setValue] = useState(() => hasStock(medicine) ? String(medicine.stock) : '')
  function submit(event) { event.preventDefault(); onSave(value === '' ? null : Number(value)) }
  return <div className="overlay" onClick={onClose}><section className="dialog stock-dialog" role="dialog" aria-modal="true" aria-labelledby="stock-title" onClick={event => event.stopPropagation()}><button type="button" className="close" aria-label="Zamknij" onClick={onClose}>×</button><div className="eyebrow">STAN APTECZKI</div><h2 id="stock-title">Stan tabletek</h2><p>{medicine.name}{medicine.strength ? ` · ${medicine.strength}` : ''}</p><form onSubmit={submit}><label>Ile tabletek pozostało?<input type="number" min="0" max="1000000" step="0.01" value={value} onChange={event => setValue(event.target.value)} placeholder="Nieznany stan" /></label><p className="form-hint">Wpisz aktualny łączny stan. Puste pole oznacza, że stan jest nieznany. Liczba opakowań nie jest przeliczana automatycznie.</p><div className="wizard-actions"><button type="button" className="button-quiet" onClick={onClose}>Anuluj</button><button className="primary">Zapisz stan</button></div></form></section></div>
}
