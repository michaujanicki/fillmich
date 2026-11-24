import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner'
import { findByCode, getPackages, registryStatus, searchRegistry } from '../registry'
import { parseCode } from '../parseCode'
import { formatDate } from '../date'
import { packageTabletCount } from '../inventory'
import ScanGuide from './ScanGuide'
import StepProgress from './StepProgress'
import DateSelect from './DateSelect'
import Dialog from './Dialog'
import { FormActions, PersonSelect, QuantityInput, StockInput } from './FormFields'

const methods = [
  { id: 'registry', icon: '⌕', title: 'Znajdź w rejestrze', description: 'Wyszukaj lek po nazwie i wybierz opakowanie.' },
  { id: 'scan', icon: '▣', title: 'Zeskanuj kod EAN', description: 'Zeskanuj kod kreskowy z opakowania.' },
  { id: 'manual', icon: '✎', title: 'Dodaj własny lek', description: 'Wpisz dane samodzielnie, także bez rejestru.' },
]
const emptyForm = person => ({ name: '', person, expiry: '', quantity: '1', code: '', batch: '', stock: '' })

export default function MedicineWizard({ people, initialPerson, onClose, onSave }) {
  const [step, setStep] = useState(0)
  const [method, setMethod] = useState('')
  const [form, setForm] = useState(() => emptyForm(initialPerson))
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState([])
  const [registryState, setRegistryState] = useState('loading')
  const [packages, setPackages] = useState([])
  const [packageState, setPackageState] = useState('idle')
  const [packageRequest, setPackageRequest] = useState(0)
  const [packageError, setPackageError] = useState('')
  const [scanInput, setScanInput] = useState('')
  const [message, setMessage] = useState('')
  const [scanner, setScanner] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [readingPhoto, setReadingPhoto] = useState(false)
  const [nativeScanning, setNativeScanning] = useState(false)
  const video = useRef(null)
  const lookupId = useRef(0)
  const photoId = useRef(0)
  const scanningUi = step === 2
  const progressTotal = method === 'manual' ? 5 : 6
  const progressStep = method === 'manual' && step > 2 ? step : step + 1

  useEffect(() => {
    let active = true
    const check = () => registryStatus().then(data => { if (active) setRegistryState(data.count ? 'ready' : data.importing ? 'loading' : 'error') }).catch(() => { if (active) setRegistryState('error') })
    check(); const timer = setInterval(check, 5000)
    return () => { active = false; clearInterval(timer) }
  }, [])
  useEffect(() => {
    if (method !== 'registry' || query.trim().length < 2 || registryState !== 'ready') return
    let active = true
    const timer = setTimeout(() => searchRegistry(query.trim()).then(data => { if (active) setMatches(data) }).catch(() => { if (active) setRegistryState('error') }), 250)
    return () => { active = false; clearTimeout(timer) }
  }, [query, registryState, method])
  useEffect(() => {
    if (!form.registryId) return
    let active = true
    getPackages(form.registryId).then(items => { if (active) { setPackages(items); setPackageState('ready') } }).catch(error => { if (active) { setPackageError(error.status === 404 ? 'Serwer działa w starszej wersji. Zatrzymaj go w terminalu (Ctrl+C) i uruchom ponownie poleceniem npm.cmd run dev.' : 'Nie udało się połączyć z serwerem. Sprawdź, czy aplikacja jest uruchomiona, i spróbuj ponownie.'); setPackageState('error') } })
    return () => { active = false }
  }, [form.registryId, packageRequest])
  useEffect(() => {
    if (!scanner) return
    let stream, timer, cancelled = false
    async function start() {
      try {
        if (!('BarcodeDetector' in window)) throw new Error('Ta przeglądarka nie obsługuje skanowania. Możesz wpisać kod poniżej.')
        const supported = await window.BarcodeDetector.getSupportedFormats()
        const formats = (scanningUi ? ['data_matrix'] : ['ean_13', 'ean_8']).filter(format => supported.includes(format))
        if (!formats.length) throw new Error(scanningUi ? 'Ta przeglądarka nie obsługuje skanowania kodu UI. Wpisz dane z opakowania ręcznie.' : 'Ta przeglądarka nie obsługuje skanowania kodów EAN. Wpisz kod poniżej.')
        const detector = new window.BarcodeDetector({ formats })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return }
        video.current.srcObject = stream; await video.current.play()
        const scan = async () => {
          try {
            const codes = await detector.detect(video.current)
            if (codes.length) { setScanInput(codes[0].rawValue); setScanner(false); if (step === 2) verifyPackageCode(codes[0].rawValue); else void lookupCode(codes[0].rawValue); return }
          } catch { /* The next frame may be readable. */ }
          if (!cancelled) timer = setTimeout(scan, 250)
        }
        scan()
      } catch (error) { if (!cancelled) setMessage(error.message || 'Nie udało się uruchomić aparatu.') }
    }
    start()
    return () => { cancelled = true; clearTimeout(timer); stream?.getTracks().forEach(track => track.stop()) }
  }, [scanner])
  useEffect(() => () => { lookupId.current += 1; photoId.current += 1 }, [])

  function chooseMethod(next) {
    lookupId.current += 1; photoId.current += 1; setReadingPhoto(false); setScanner(false); setMethod(next); setForm(emptyForm(initialPerson)); setPackages([]); setPackageState('idle'); setQuery(''); setMatches([]); setScanInput(''); setMessage(''); setLookingUp(false); setStep(1)
  }
  function selectProduct(product) {
    setPackages([]); setPackageState('loading'); setPackageRequest(current => current + 1)
    setForm(current => ({ ...current, ...(current.registryId === product.id && current.code === (product.package?.code || '') ? {} : { expiry: '', batch: '' }), name: product.name, strength: product.strength, productForm: product.form, registryId: product.id, leaflet: product.leaflet || '', code: product.package?.code || '', packageDescription: product.package?.description || '', selectedPackage: product.package ? `${product.package.code}|${product.package.description}` : '' }))
    setQuery(''); setMatches([])
  }
  function selectPackage(value) {
    const pack = packages.find(item => `${item.code}|${item.description}` === value)
    setForm(current => ({ ...current, ...(current.selectedPackage === value ? {} : { expiry: '', batch: '' }), selectedPackage: value, code: pack?.code || '', packageDescription: pack?.description || '' }))
    setMessage(''); setScanInput('')
  }
  function verifyPackageCode(value) {
    const parsed = parseCode(value.trim())
    if (!parsed.code) { setMessage('Nie rozpoznano kodu produktu. Spróbuj ponownie albo uzupełnij dane ręcznie.'); return }
    if (!form.code) { setMessage('Wybrane opakowanie nie ma kodu GTIN w rejestrze, więc nie można automatycznie potwierdzić zgodności. Sprawdź opakowanie i wpisz dane ręcznie.'); return }
    if (parsed.code.padStart(14, '0') !== form.code.padStart(14, '0')) { setMessage('Zeskanowany kod nie pasuje do wybranego opakowania. Sprawdź opakowanie lub wróć i wybierz właściwy wariant.'); return }
    setForm(current => ({ ...current, ...(parsed.expiry ? { expiry: parsed.expiry } : {}), ...(parsed.batch ? { batch: parsed.batch } : {}) }))
    setMessage(parsed.expiry || parsed.batch ? 'Kod pasuje do opakowania. Uzupełniliśmy dostępne dane — sprawdź je z nadrukiem.' : 'Kod pasuje do opakowania. Nie zawiera daty ważności ani numeru partii — wpisz je z pudełka.')
  }
  async function readPhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const request = ++photoId.current
    const currentStep = step
    const ui = scanningUi
    let bitmap
    setScanner(false); setReadingPhoto(true); setMessage('')
    try {
      if (!('BarcodeDetector' in window) || typeof createImageBitmap !== 'function') throw new Error('Ta przeglądarka nie obsługuje odczytu kodów ze zdjęcia. Wpisz kod lub dane ręcznie.')
      const supported = await window.BarcodeDetector.getSupportedFormats()
      const formats = (ui ? ['data_matrix'] : ['ean_13', 'ean_8']).filter(format => supported.includes(format))
      if (!formats.length) throw new Error(ui ? 'Ta przeglądarka nie obsługuje odczytu kodu UI ze zdjęcia. Wpisz dane ręcznie.' : 'Ta przeglądarka nie obsługuje odczytu EAN ze zdjęcia. Wpisz kod ręcznie.')
      bitmap = await createImageBitmap(file)
      const codes = await new window.BarcodeDetector({ formats }).detect(bitmap)
      if (request !== photoId.current) return
      if (codes.length !== 1) throw new Error(codes.length ? 'Na zdjęciu znaleziono kilka kodów. Wybierz zdjęcie z jednym widocznym kodem.' : 'Nie znaleziono kodu na zdjęciu. Spróbuj wyraźniejszego zbliżenia.')
      setScanInput(codes[0].rawValue)
      if (currentStep === 2) verifyPackageCode(codes[0].rawValue)
      else await lookupCode(codes[0].rawValue)
    } catch (error) {
      if (request === photoId.current) setMessage(error.message || 'Nie udało się odczytać zdjęcia. Spróbuj ponownie.')
    } finally {
      bitmap?.close()
      if (request === photoId.current) setReadingPhoto(false)
    }
  }
  const photoPicker = <label className="photo-picker">{readingPhoto ? 'Odczytywanie zdjęcia…' : '▧  Wybierz zdjęcie kodu'}<input type="file" accept="image/*" disabled={readingPhoto || lookingUp} onChange={readPhoto} /></label>
  async function startScanner() {
    setMessage('')
    if (!Capacitor.isNativePlatform()) { setScanner(current => !current); return }
    const request = ++photoId.current
    setNativeScanning(true)
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({ hint: scanningUi ? CapacitorBarcodeScannerTypeHint.DATA_MATRIX : CapacitorBarcodeScannerTypeHint.ALL, scanInstructions: scanningUi ? 'Zeskanuj kod UI' : 'Zeskanuj kod EAN' })
      if (request !== photoId.current) return
      setScanInput(result.ScanResult)
      if (step === 2) verifyPackageCode(result.ScanResult)
      else await lookupCode(result.ScanResult)
    } catch {
      if (request === photoId.current) setMessage('Skanowanie anulowano lub aparat jest niedostępny. Możesz wpisać kod ręcznie.')
    } finally { if (request === photoId.current) setNativeScanning(false) }
  }
  async function lookupCode(value) {
    const request = ++lookupId.current
    const code = value.trim()
    if (!/^(?:\d{8}|\d{13}|\d{14})$/.test(code)) { setMessage('Podaj 8- lub 13-cyfrowy kod EAN albo 14-cyfrowy GTIN.'); return }
    const parsed = parseCode(code)
    setForm(current => ({ ...current, ...parsed, code, name: '', registryId: '', leaflet: '', strength: '', productForm: '', selectedPackage: '', packageDescription: '' }))
    setPackages([]); setMatches([]); setLookingUp(true); setMessage('')
    try {
      const found = await findByCode(code)
      if (request !== lookupId.current) return
      if (found.length === 1) selectProduct(found[0])
      else setMatches(found)
      setMessage(found.length > 1 ? 'Znaleziono kilka produktów. Wybierz właściwy.' : found.length ? 'Znaleziono produkt. Sprawdź dane z opakowaniem.' : 'Nie znaleziono produktu. Możesz uzupełnić jego nazwę ręcznie.')
    } catch { if (request === lookupId.current) setMessage('Nie udało się przeszukać rejestru. Możesz wpisać nazwę ręcznie.') }
    finally { if (request === lookupId.current) setLookingUp(false) }
  }
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const productReady = form.name.trim() && (method !== 'scan' || /^(?:\d{8}|\d{13}|\d{14})$/.test(form.code)) && (!form.registryId || (packageState === 'ready' && (!packages.length || form.selectedPackage)))
  const next = event => {
    event.preventDefault()
    if (step === 1 && productReady && !lookingUp && !readingPhoto && !nativeScanning) { setScanner(false); setMessage(''); setScanInput(''); setStep(method === 'manual' ? 3 : 2) }
    else if (step >= 2 && step < 5 && !readingPhoto && !nativeScanning) { setScanner(false); setMessage(''); setScanInput(''); setStep(step + 1) }
    else if (step === 5) onSave({ ...form, name: form.name.trim(), stock: form.stock === '' ? null : Number(form.stock) })
  }
  const back = () => { photoId.current += 1; setReadingPhoto(false); setScanner(false); setMessage(''); setScanInput(''); if (step === 1) { lookupId.current += 1; setLookingUp(false); setStep(0) } else setStep(step === 3 && method === 'manual' ? 1 : step - 1) }

  return <Dialog className="wizard" titleId="wizard-title" onClose={onClose}>
      <div className="eyebrow">NOWY LEK W APTECZCE</div><h2 id="wizard-title">Dodaj lek</h2>
      <StepProgress current={progressStep} total={progressTotal} />
      {step === 0 ? <div className="wizard-body"><h3>Jak chcesz dodać lek?</h3><p>Wybierz najwygodniejszy sposób. W kolejnych krokach uzupełnisz szczegóły.</p><div className="method-list">{methods.map(item => <button type="button" key={item.id} className="method-card" onClick={() => chooseMethod(item.id)}><span className="method-icon">{item.id === 'scan' ? <span className="scan-mark" aria-hidden="true" /> : item.icon}</span><span><strong>{item.title}</strong><small>{item.description}</small></span><span className="method-arrow">→</span></button>)}</div></div> : <form onSubmit={next}>
        {step === 1 && <div className="wizard-body"><h3>{method === 'registry' ? 'Znajdź swój lek' : method === 'scan' ? 'Odczytaj kod EAN' : 'Wpisz nazwę leku'}</h3>
          {method === 'registry' && <><p>Wpisz nazwę i wybierz produkt o właściwej mocy i postaci.</p><label>Wyszukaj w rejestrze<input value={query} onChange={event => { setQuery(event.target.value); setMatches([]) }} placeholder="Np. Apap" /></label><p className="registry-state">{registryState === 'loading' ? 'Trwa przygotowanie rejestru…' : registryState === 'error' ? 'Rejestr jest niedostępny. Wróć i wybierz dodawanie ręczne.' : 'Wpisz co najmniej 2 litery.'}</p></>}
          {method === 'scan' && <><p>Zeskanuj kod kreskowy EAN lub wpisz cyfry spod kodu. Oznacza on rodzaj opakowania i pomaga znaleźć lek w rejestrze.</p><ScanGuide type="ean" /><button type="button" className="scan-button" disabled={nativeScanning || readingPhoto} onClick={startScanner}><span className="scan-mark" aria-hidden="true" /><span>{scanner ? 'Zamknij aparat' : 'Skanuj EAN / GTIN'}</span></button>{scanner && <video className="camera" ref={video} playsInline muted />}{photoPicker}<label>Kod EAN<div className="code-row"><input inputMode="numeric" value={scanInput} onChange={event => { lookupId.current += 1; setLookingUp(false); setScanInput(event.target.value); setForm(current => ({ ...current, code: '', name: '', registryId: '', leaflet: '', selectedPackage: '', packageDescription: '' })); setMatches([]); setMessage('') }} placeholder="Wpisz cyfry kodu EAN" /><button type="button" className="secondary" disabled={!scanInput || lookingUp} onClick={() => lookupCode(scanInput)}>Odczytaj</button></div></label>{message && <p className="wizard-message" role="status">{message}</p>}</>}
          {matches.length > 0 && <div className="registry-results">{matches.map((product, index) => <button type="button" key={`${product.id}-${index}`} onClick={() => selectProduct(product)}><strong>{product.name}</strong><span>{[product.strength, product.form, product.package?.description].filter(Boolean).join(' · ')}</span></button>)}</div>}
          {(method === 'manual' || (method === 'scan' && !form.registryId)) && <label>Nazwa leku<input required value={form.name} onChange={event => update('name', event.target.value)} placeholder="Np. Ibuprofen" /></label>}
          {method === 'manual' && <><label>Moc lub dawka na tabletkę<input value={form.strength || ''} onChange={event => update('strength', event.target.value)} placeholder="Np. 200 mg (opcjonalnie)" /></label><label>Opis opakowania<input value={form.packageDescription || ''} onChange={event => update('packageDescription', event.target.value)} placeholder="Np. 20 tabletek (opcjonalnie)" /></label></>}
          {form.registryId && <div className="chosen-product"><small>WYBRANY PRODUKT</small><strong>{form.name}</strong><span>{[form.strength, form.productForm].filter(Boolean).join(' · ')}</span></div>}
          {form.registryId && (packageState === 'loading' ? <p>Wczytywanie opakowań…</p> : packageState === 'error' ? <div className="package-error" role="alert"><p className="error">{packageError}</p><button type="button" className="button-quiet" onClick={() => { setPackageState('loading'); setPackageRequest(current => current + 1) }}>Spróbuj ponownie</button></div> : packages.length ? <fieldset className="package-options"><legend>Wybierz opakowanie</legend>{packages.map(pack => { const value = `${pack.code}|${pack.description}`; return <label className={`package-option ${form.selectedPackage === value ? 'selected' : ''}`} key={value}><input type="radio" name="package" value={value} checked={form.selectedPackage === value} onChange={() => selectPackage(value)} /><span><strong>{pack.description || 'Opakowanie bez opisu'}</strong><small>{pack.code ? `GTIN ${pack.code}` : 'Bez kodu GTIN'}</small></span></label> })}</fieldset> : <p>Rejestr nie podaje opakowań dla tego leku.</p>)}
        </div>}
        {step === 2 && <div className="wizard-body"><h3>Kod UI (Unikalny Identyfikator)</h3><p>Opcjonalnie zeskanuj kwadratowy kod UI z tego samego opakowania lub przejdź dalej. Sprawdzimy GTIN i odczytamy datę ważności oraz numer partii, jeśli są dostępne. Możesz też uzupełnić je ręcznie poniżej.</p><ScanGuide type="matrix" /><button type="button" className="scan-button" disabled={nativeScanning || readingPhoto} onClick={startScanner}><span className="scan-mark" aria-hidden="true" /><span>{scanner ? 'Zamknij aparat' : 'Skanuj kod UI'}</span></button>{scanner && <video className="camera" ref={video} playsInline muted />}{photoPicker}<label>Dane kodu UI<div className="code-row"><input value={scanInput} onChange={event => setScanInput(event.target.value)} placeholder="Wpisz lub zeskanuj kod" /><button type="button" className="secondary" disabled={!scanInput.trim()} onClick={() => verifyPackageCode(scanInput)}>Sprawdź</button></div></label>{message && <p className="wizard-message" role="status">{message}</p>}</div>}
        {step === 3 && <div className="wizard-body"><h3>Dane opakowania</h3><p>Sprawdź dane na opakowaniu, także jeśli zostały odczytane z kodu UI.</p><DateSelect label="Termin ważności" value={form.expiry} onChange={value => update('expiry', value)} /><label>Numer partii<input value={form.batch} onChange={event => update('batch', event.target.value)} placeholder="Opcjonalnie" /></label></div>}
        {step === 4 && <div className="wizard-body"><h3>Osoba i zapas</h3><p>Przypisz lek i podaj stan swojego zapasu.</p><PersonSelect people={people} value={form.person} onChange={value => update('person', value)} /><QuantityInput value={form.quantity} onChange={value => update('quantity', value)} /><StockInput label="Ile tabletek zostało?" value={form.stock} onChange={value => update('stock', value)} limit={packageTabletCount(form.packageDescription)} placeholder="Opcjonalnie" /><p className="form-hint">{packageTabletCount(form.packageDescription) !== null ? `W opakowaniu jest maksymalnie ${packageTabletCount(form.packageDescription)} tabletek. ` : ''}Pozostaw puste, jeśli nie znasz stanu lub to nie są tabletki.</p></div>}
        {step === 5 && <div className="wizard-body"><h3>Sprawdź przed zapisaniem</h3><p>Upewnij się, że dane odpowiadają opakowaniu, które masz w domu.</p><dl className="summary-list">{[['Lek', form.name], ['Moc i postać', [form.strength, form.productForm].filter(Boolean).join(' · ')], ['Opakowanie', form.packageDescription], ['Kod', form.code], ['Dla kogo', form.person === 'Wspólne' ? 'Bez przypisania' : form.person], ['Termin ważności', formatDate(form.expiry) || 'Nie podano'], ['Liczba opakowań', form.quantity], ['Pozostało tabletek', form.stock === '' ? 'Nie podano' : form.stock], ['Numer partii', form.batch]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>}
        <FormActions><button type="button" className="button-quiet" onClick={back}>← Wstecz</button><button className="primary" disabled={readingPhoto || nativeScanning || (step === 1 && (!productReady || lookingUp))}>{step === 5 ? 'Zapisz lek' : 'Dalej →'}</button></FormActions>
      </form>}
  </Dialog>
}
