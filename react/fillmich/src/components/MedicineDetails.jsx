import { useEffect, useRef, useState } from 'react'
import { formatDate } from '../date'
import { formatAmount, hasStock, packageTabletCount } from '../inventory'
import { getProduct } from '../registry'

export default function MedicineDetails({ medicine, onClose, onEdit, onStock }) {
  const closeButton = useRef(null)
  const [leaflet, setLeaflet] = useState(medicine.leaflet || '')
  const [leafletState, setLeafletState] = useState(medicine.registryId ? 'loading' : 'ready')
  useEffect(() => {
    let active = true
    if (!medicine.registryId) return () => { active = false }
    getProduct(medicine.registryId).then(product => {
      if (active) { setLeaflet(product?.leaflet || ''); setLeafletState('ready') }
    }).catch(() => { if (active) setLeafletState('error') })
    return () => { active = false }
  }, [medicine.registryId, medicine.leaflet])
  useEffect(() => {
    const previous = document.activeElement
    closeButton.current?.focus()
    const onKey = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); previous?.focus() }
  }, [onClose])

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

  return <div className="overlay" onClick={onClose}>
    <section className="dialog medicine-details-dialog" role="dialog" aria-modal="true" aria-labelledby="medicine-details-title" onClick={event => event.stopPropagation()}>
      <button ref={closeButton} type="button" className="close" aria-label="Zamknij szczegóły" onClick={onClose}>×</button>
      <div className="eyebrow">TWOJA APTECZKA</div>
      <div className="medicine-details-header">{medicine.photo && <img src={medicine.photo} alt="" />}<div><h2 id="medicine-details-title">{medicine.name}</h2><p>Zapisane informacje o leku</p></div></div>
      <dl className="medicine-details-list">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="medicine-leaflet"><strong>Ulotka dla pacjenta</strong><p>{leafletState === 'loading' ? 'Sprawdzanie ulotki w rejestrze…' : leafletUrl ? <a href={leafletUrl} target="_blank" rel="noopener noreferrer">Otwórz ulotkę ↗</a> : leafletState === 'error' ? 'Nie udało się sprawdzić ulotki w rejestrze. Spróbuj ponownie później.' : medicine.registryId ? 'Rejestr nie udostępnia ulotki dla tego leku.' : 'Brak ulotki — lek nie jest powiązany z rejestrem.'}</p>{leafletState === 'error' && leafletUrl && <p>Nie udało się sprawdzić aktualnego adresu w rejestrze.</p>}</div>
      <div className="medicine-details-actions"><button type="button" className="button-quiet" onClick={onStock}>Stan</button><button type="button" className="primary" onClick={onEdit}>Edytuj lek</button></div>
    </section>
  </div>
}
