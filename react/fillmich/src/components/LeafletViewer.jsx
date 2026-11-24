import { useEffect, useRef, useState } from 'react'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { fetchLeaflet } from '../leaflet'
import Dialog from './Dialog'
import '../leaflet.css'

export default function LeafletViewer({ medicine, url, onClose }) {
  const [document, setDocument] = useState(null)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [width, setWidth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const viewport = useRef(null)
  const canvas = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true, task
    async function load() {
      try {
        const [bytes, pdfjs] = await Promise.all([fetchLeaflet(medicine.registryId, url, controller.signal), import('pdfjs-dist/legacy/build/pdf.mjs')])
        if (!active) return
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
        const resources = new URL(`${import.meta.env.BASE_URL}pdfjs/`, window.location.href).href
        task = pdfjs.getDocument({ data: bytes, useSystemFonts: true, cMapUrl: `${resources}cmaps/`, cMapPacked: true, standardFontDataUrl: `${resources}standard_fonts/`, wasmUrl: `${resources}wasm/` })
        const pdf = await task.promise
        if (active) { setDocument(pdf); setPage(1); setLoading(false) }
      } catch (reason) {
        if (active && reason.name !== 'AbortError') { setError('Nie udało się otworzyć ulotki. Sprawdź połączenie z internetem i spróbuj ponownie.'); setLoading(false) }
      }
    }
    void load()
    return () => { active = false; controller.abort(); void task?.destroy() }
  }, [medicine.registryId, url, attempt])

  useEffect(() => {
    const element = viewport.current
    const update = () => setWidth(element.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!document || !width || !canvas.current) return
    let cancelled = false, renderTask
    async function renderPage() {
      setRendering(true)
      try {
        const pdfPage = await document.getPage(page)
        if (cancelled) return
        const original = pdfPage.getViewport({ scale: 1 })
        const view = pdfPage.getViewport({ scale: Math.max(0.1, (width - 32) / original.width) * zoom })
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        const element = canvas.current
        element.width = Math.ceil(view.width * ratio); element.height = Math.ceil(view.height * ratio)
        element.style.width = `${Math.ceil(view.width)}px`; element.style.height = `${Math.ceil(view.height)}px`
        renderTask = pdfPage.render({ canvas: element, canvasContext: element.getContext('2d'), viewport: view, transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] })
        await renderTask.promise
      } catch (reason) {
        if (!cancelled && reason.name !== 'RenderingCancelledException') setError('Nie udało się wyświetlić tej strony ulotki.')
      } finally { if (!cancelled) setRendering(false) }
    }
    void renderPage()
    return () => { cancelled = true; renderTask?.cancel() }
  }, [document, page, width, zoom])

  function retry() { setDocument(null); setError(''); setLoading(true); setAttempt(value => value + 1) }
  return <Dialog overlayClassName="leaflet-overlay" className="leaflet-dialog" titleId="leaflet-title" closeLabel="Zamknij ulotkę" onClose={onClose} closeOnBackdrop={false}>
    <header className="leaflet-header"><div><div className="eyebrow">ULOTKA DLA PACJENTA</div><h2 id="leaflet-title">{medicine.name}</h2><p>Dokument z Rejestru Produktów Leczniczych</p></div></header>
    <div className="leaflet-toolbar" aria-label="Sterowanie ulotką">
      <div className="leaflet-pages"><button type="button" className="secondary" disabled={!document || page <= 1} onClick={() => setPage(value => value - 1)}>← Poprzednia</button><span aria-live="polite">Strona {document ? page : '–'} z {document?.numPages || '–'}</span><button type="button" className="secondary" disabled={!document || page >= document.numPages} onClick={() => setPage(value => value + 1)}>Następna →</button></div>
      <div className="leaflet-zoom"><button type="button" className="secondary" disabled={!document || zoom <= 0.75} onClick={() => setZoom(value => Math.max(0.75, value - 0.25))} aria-label="Pomniejsz ulotkę">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" className="secondary" disabled={!document || zoom >= 2} onClick={() => setZoom(value => Math.min(2, value + 0.25))} aria-label="Powiększ ulotkę">+</button></div>
    </div>
    <div className="leaflet-viewport" ref={viewport} tabIndex={0} aria-label="Treść ulotki">
      {loading && <p role="status">Pobieranie ulotki…</p>}
      {error && <div className="leaflet-error" role="alert"><p>{error}</p><button type="button" className="secondary" onClick={retry}>Spróbuj ponownie</button></div>}
      {document && <><canvas ref={canvas} aria-label={`Ulotka, strona ${page} z ${document.numPages}`} />{rendering && <span className="leaflet-rendering" role="status">Wczytywanie strony…</span>}</>}
    </div>
  </Dialog>
}
