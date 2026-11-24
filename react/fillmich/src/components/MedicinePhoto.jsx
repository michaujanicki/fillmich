import { useState } from 'react'
import Dialog from './Dialog'

export default function MedicinePhoto({ medicine, onClose }) {
  const [zoom, setZoom] = useState(1)
  return <Dialog overlayClassName="photo-overlay" className="photo-dialog" titleId="photo-title" onClose={onClose} closeLabel="Zamknij zdjęcie">
      <h2 id="photo-title">{medicine.name}</h2>
      <div className="photo-viewport"><img src={medicine.photo} alt={`Zdjęcie leku ${medicine.name}`} style={{ width: `${zoom * 100}%` }} /></div>
      <div className="photo-controls"><button type="button" className="secondary" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - 0.5))} aria-label="Pomniejsz zdjęcie">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" className="secondary" disabled={zoom >= 3} onClick={() => setZoom(value => Math.min(3, value + 0.5))} aria-label="Powiększ zdjęcie">+</button></div>
  </Dialog>
}
