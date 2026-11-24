import { useState } from 'react'
import Dialog from './Dialog'
import eanImage from '../assets/kodlek-ean.svg'
import matrixImage from '../assets/kodlek-ui.svg'

export default function ScanGuide({ type }) {
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const ean = type === 'ean'
  const title = ean ? 'Tak wygląda kod EAN' : 'Tak wygląda kod UI (Unikalny Identyfikator)'
  const alt = ean ? 'Przykładowe opakowania z podłużnym kodem kreskowym.' : 'Przykładowe opakowania z kwadratowym kodem Data Matrix.'
  const src = ean ? eanImage : matrixImage

  function close() { setOpen(false) }

  return <>
    <figure className="scan-guide">
      <button type="button" className="scan-guide-image" aria-label={`Powiększ ilustrację: ${title}`} onClick={() => { setZoom(1); setOpen(true) }}>
        <img src={src} alt={alt} /><span aria-hidden="true">⌕ Powiększ</span>
      </button>
      <figcaption><strong>{title}</strong><span>{ean ? 'Szukaj podłużnego kodu kreskowego z cyframi.' : 'Szukaj małego, kwadratowego kodu na opakowaniu.'}</span><small>Ilustracja poglądowa. Zeskanuj kod ze swojego opakowania.</small></figcaption>
    </figure>
    {open && <Dialog overlayClassName="scan-zoom-overlay" baseClassName="" className="scan-zoom-dialog" label={`Powiększona ilustracja: ${title}`} showClose={false} onClose={close}>
        <div className="scan-zoom-header"><strong>{title}</strong><button data-dialog-close type="button" onClick={close}>Zamknij ✕</button></div>
        <div className="scan-zoom-viewport"><img src={src} alt={alt} style={{ width: `${zoom * 100}%` }} /></div>
        <div className="scan-zoom-controls"><button type="button" onClick={() => setZoom(value => Math.max(1, value - 0.5))} disabled={zoom <= 1} aria-label="Pomniejsz ilustrację">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom(value => Math.min(3, value + 0.5))} disabled={zoom >= 3} aria-label="Powiększ ilustrację">+</button></div>
    </Dialog>}
  </>
}
