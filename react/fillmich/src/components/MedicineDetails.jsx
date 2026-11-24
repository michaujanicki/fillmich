import { useEffect, useState } from 'react'
import Dialog from './Dialog'
import { formatDate } from '../date'
import { formatAmount, hasStock, packageTabletCount } from '../inventory'
import { getProduct } from '../registry'
import LeafletViewer from './LeafletViewer'

export default function MedicineDetails({ medicine, onClose, onEdit, onStock }) {
  const [leaflet, setLeaflet] = useState(medicine.leaflet || '')
  const [leafletState, setLeafletState] = useState(medicine.registryId ? 'loading' : 'ready')
  const [showLeaflet, setShowLeaflet] = useState(false)
  useEffect(() => {
    let active = true
    if (!medicine.registryId) return () => { active = false }
    getProduct(medicine.registryId).then(product => {
      if (active) { setLeaflet(product?.leaflet || ''); setLeafletState('ready') }
    }).catch(() => { if (active) setLeafletState('error') })
    return () => { active = false }
  }, [medicine.registryId, medicine.leaflet])

  const limit = packageTabletCount(medicine.packageDescription)
  const stock = hasStock(medicine) ? `${formatAmount(medicine.stock)}${limit !== null ? ` / ${formatAmount(limit)}` : ''} tabl.` : 'Nie podano'
  let leafletUrl = ''
  try { const url = new URL(leaflet); if (url.protocol === 'https:' || url.protocol === 'http:') leafletUrl = url.href } catch { /* No valid leaflet address. */ }
  const details = [
    ['Moc', medicine.strength || 'Nie podano'],
    ['Postać', medicine.productForm || 'Nie podano'],
    ['Opakowanie', medicine.packageDescription || 'Nie podano'],
    ['Liczba opakowań', medicine.quantity || 'Nie podano'],
    ['Pozostało', stock],
    ['Termin ważności', formatDate(medicine.expiry) || 'Nie podano'],
    ['Dla kogo', medicine.person && medicine.person !== 'Wspólne' ? medicine.person : 'Bez przypisania'],
    ['Numer partii', medicine.batch || 'Nie podano'],
  ]

  return <><Dialog className="medicine-details-dialog" titleId="medicine-details-title" onClose={onClose} closeLabel="Zamknij szczegóły">
      <div className="eyebrow">TWOJA APTECZKA</div>
      <div className="medicine-details-header">{medicine.photo && <img src={medicine.photo} alt="" />}<div><h2 id="medicine-details-title">{medicine.name}</h2><p>Zapisane informacje o leku</p></div></div>
      <dl className="medicine-details-list">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="medicine-leaflet"><strong>Ulotka dla pacjenta</strong>{leafletState === 'loading' ? <p>Sprawdzanie ulotki w rejestrze…</p> : leafletUrl ? <button type="button" className="secondary leaflet-open" onClick={() => setShowLeaflet(true)}>Otwórz ulotkę</button> : <p>{leafletState === 'error' ? 'Nie udało się sprawdzić ulotki w rejestrze. Spróbuj ponownie później.' : medicine.registryId ? 'Rejestr nie udostępnia ulotki dla tego leku.' : 'Brak ulotki — lek nie jest powiązany z rejestrem.'}</p>}{leafletState === 'error' && leafletUrl && <p>Nie udało się sprawdzić aktualnego adresu w rejestrze.</p>}</div>
      <div className="medicine-details-actions"><button type="button" className="button-quiet" onClick={onStock}>Stan</button><button type="button" className="primary" onClick={onEdit}>Edytuj lek</button></div>
  </Dialog>{showLeaflet && <LeafletViewer medicine={medicine} url={leafletUrl} onClose={() => setShowLeaflet(false)} />}</>
}
