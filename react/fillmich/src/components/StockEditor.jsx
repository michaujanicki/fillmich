import { useState } from 'react'
import { formatAmount, hasStock, packageTabletCount } from '../inventory'
import Dialog from './Dialog'
import { FormActions, StockInput } from './FormFields'

export default function StockEditor({ medicine, onSave, onClose }) {
  const [value, setValue] = useState(() => hasStock(medicine) ? String(medicine.stock) : '')
  const limit = packageTabletCount(medicine.packageDescription)
  const stock = hasStock(medicine) ? Number(medicine.stock) : null
  function submit(event) { event.preventDefault(); onSave(value === '' ? null : Number(value)) }

  return <Dialog className="stock-dialog" titleId="stock-title" onClose={onClose}>
      <div className="eyebrow">TWOJA APTECZKA</div>
      <h2 id="stock-title">Stan tabletek</h2>
      <p className="stock-medicine-name">{medicine.name}{medicine.strength ? ` · ${medicine.strength}` : ''}</p>
      {stock !== null && stock <= 20 ? <div className="blister-summary">
        <div className="blister-heading"><div><span>TWÓJ ZAPAS</span><strong>{formatAmount(stock)} <small>tabl.</small></strong></div><span className="blister-caption">Pozostało<br />z 20 miejsc</span></div>
        <div className="blister" role="img" aria-label={`Listek: pozostało ${formatAmount(stock)} z 20 tabletek`}>
          {Array.from({ length: 20 }, (_, index) => <span key={index} className="blister-slot" style={{ '--fill': `${Math.max(0, Math.min(1, stock - index)) * 100}%` }}><span className="blister-icon" /></span>)}
        </div>
        <div className="blister-legend"><span><i className="legend-full" /> Pozostałe</span><span><i /> Puste miejsce</span></div>
      </div> : <div className="blister-locked"><strong>Twój listek</strong><span>{stock === null ? 'Podaj stan tabletek, aby zobaczyć listek. Odblokuje się przy 20 tabletkach lub mniej.' : 'Listek odblokuje się, gdy pozostanie 20 tabletek lub mniej.'}</span></div>}
      <form onSubmit={submit}>
        <StockInput label="Ile tabletek pozostało?" value={value} onChange={setValue} limit={limit} placeholder="Nieznany stan" />
        <p className="form-hint">{limit !== null ? `W opakowaniu jest maksymalnie ${formatAmount(limit)} tabletek. ` : ''}Puste pole oznacza nieznany stan.</p>
        <FormActions><button type="button" className="button-quiet" onClick={onClose}>Anuluj</button><button className="primary">Zapisz stan</button></FormActions>
      </form>
  </Dialog>
}
