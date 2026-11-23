import { useEffect, useRef, useState } from 'react'
import eanImage from '../assets/kodlek-ean.svg'
import matrixImage from '../assets/kodlek-ui.svg'

export default function ScanGuide({ type }) {
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const closeRef = useRef(null)
  const triggerRef = useRef(null)
  const ean = type === 'ean'
  const title = ean ? 'Tak wygląda kod EAN' : 'Tak wygląda Data Matrix'
  const alt = ean ? 'Przykładowe opakowania z podłużnym kodem kreskowym.' : 'Przykładowe opakowania z kwadratowym kodem Data Matrix.'
  const src = ean ? eanImage : matrixImage

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKeyDown = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  return <>
    <figure className="scan-guide">
      <button ref={triggerRef} type="button" className="scan-guide-image" aria-label={`Powiększ ilustrację: ${title}`} onClick={() => { setZoom(1); setOpen(true) }}>
        <img src={src} alt={alt} /><span aria-hidden="true">⌕ Powiększ</span>
      </button>
      <figcaption><strong>{title}</strong><span>{ean ? 'Szukaj podłużnego kodu kreskowego z cyframi.' : 'Szukaj małego, kwadratowego kodu na opakowaniu.'}</span><small>Ilustracja poglądowa. Zeskanuj kod ze swojego opakowania.</small></figcaption>
    </figure>
    {open && <div className="scan-zoom-overlay" onClick={close}>
      <section className="scan-zoom-dialog" role="dialog" aria-modal="true" aria-label={`Powiększona ilustracja: ${title}`} onClick={event => event.stopPropagation()}>
        <div className="scan-zoom-header"><strong>{title}</strong><button ref={closeRef} type="button" onClick={close}>Zamknij ✕</button></div>
        <div className="scan-zoom-viewport"><img src={src} alt={alt} style={{ width: `${zoom * 100}%` }} /></div>
        <div className="scan-zoom-controls"><button type="button" onClick={() => setZoom(value => Math.max(1, value - 0.5))} disabled={zoom <= 1} aria-label="Pomniejsz ilustrację">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom(value => Math.min(3, value + 0.5))} disabled={zoom >= 3} aria-label="Powiększ ilustrację">+</button></div>
      </section>
    </div>}
  </>
}
