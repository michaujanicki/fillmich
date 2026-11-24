import { useEffect, useRef, useState } from 'react'

export default function MedicinePhoto({ medicine, onClose }) {
  const [zoom, setZoom] = useState(1)
  const closeButton = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    closeButton.current?.focus()
    const onKey = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); previous?.focus() }
  }, [onClose])
  return <div className="overlay photo-overlay" onClick={onClose}>
    <section className="dialog photo-dialog" role="dialog" aria-modal="true" aria-labelledby="photo-title" onClick={event => event.stopPropagation()}>
      <button ref={closeButton} type="button" className="close" aria-label="Zamknij zdjęcie" onClick={onClose}>×</button>
      <h2 id="photo-title">{medicine.name}</h2>
      <div className="photo-viewport"><img src={medicine.photo} alt={`Zdjęcie leku ${medicine.name}`} style={{ width: `${zoom * 100}%` }} /></div>
      <div className="photo-controls"><button type="button" className="secondary" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - 0.5))} aria-label="Pomniejsz zdjęcie">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" className="secondary" disabled={zoom >= 3} onClick={() => setZoom(value => Math.min(3, value + 0.5))} aria-label="Powiększ zdjęcie">+</button></div>
    </section>
  </div>
}
