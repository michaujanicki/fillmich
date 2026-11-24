import PageHeader from './PageHeader'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { registryStatus, updateRegistry } from '../registry'
import { formatDate } from '../date'
import './settings-registry.css'
import ScanGuide from './ScanGuide'

export default function Settings({ theme, setTheme, textSize, setTextSize, onTutorial, version }) {
  const [registry, setRegistry] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const isChecking = updating || registry?.importing
  const updated = registry?.updatedAt ? new Date(registry.updatedAt) : null
  const updatedLabel = updated && !Number.isNaN(updated.getTime()) ? updated.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Brak danych'
  useEffect(() => {
    let active = true
    const check = () => registryStatus().then(data => { if (active) setRegistry(data) }).catch(() => { if (active) setMessage('Nie udało się sprawdzić stanu bazy.') })
    check()
    const timer = setInterval(check, 5000)
    return () => { active = false; clearInterval(timer) }
  }, [])
  async function refreshRegistry() {
    setUpdating(true); setMessage('Sprawdzanie bazy. Jeśli dostępna jest nowsza wersja, jej pobranie może potrwać kilka minut.')
    try {
      const result = await updateRegistry()
      let data = await registryStatus()
      while (data.importing) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        data = await registryStatus()
      }
      setRegistry(data)
      if (data.error) throw new Error(data.error)
      setMessage((result || data.result) === 'unchanged' ? 'Baza jest aktualna. Nie trzeba jej pobierać ponownie.' : 'Baza została pobrana i zaktualizowana.')
    } catch { setMessage('Nie udało się zaktualizować bazy. Sprawdź połączenie i spróbuj ponownie. Poprzednia baza pozostaje dostępna.') }
    finally { setUpdating(false) }
  }
  return <section className="settings-view">
    <PageHeader eyebrow="TWOJA APLIKACJA" title="Ustawienia" description="Dostosuj Fillmich do swoich potrzeb." />
    <div className="settings-group">
      <h2>Baza leków</h2>
      <section className="registry-card" aria-labelledby="registry-card-title">
        <div className="registry-card-heading">
          <span className="registry-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" /></svg></span>
          <div className="registry-card-title"><h3 id="registry-card-title">Rejestr Produktów Leczniczych</h3><p>Informacje o lekach w Twojej aplikacji</p></div>
          <span className="registry-card-badge"><span aria-hidden="true" />{isChecking || (!registry && !message) ? 'Sprawdzanie' : registry?.count ? 'Baza dostępna' : 'Brak danych'}</span>
        </div>
        <dl className="registry-card-details">
          <div><dt>Ostatnia aktualizacja</dt><dd>{updatedLabel}</dd></div>
          <div><dt>Stan rejestru na dzień</dt><dd>{registry?.registryDate ? formatDate(registry.registryDate) : 'Brak danych'}</dd></div>
          <div><dt>Liczba produktów</dt><dd>{registry?.count != null ? registry.count.toLocaleString('pl-PL') : 'Brak danych'}</dd></div>
        </dl>
        <div className="registry-card-footer">
          <p>{Capacitor.isNativePlatform() ? 'Sprawdź, czy dostępna jest nowsza baza. Pobieranie wymaga internetu.' : 'Sprawdź, czy dostępna jest nowsza baza. Serwer sprawdza ją też automatycznie.'}</p>
          <button type="button" className="secondary registry-card-action" disabled={isChecking} onClick={refreshRegistry}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-5L4 8m0 0V4m0 4h4M4 13a8 8 0 0 0 14 5l2-2m0 0v4m0-4h-4" /></svg><span>{isChecking ? 'Sprawdzanie…' : 'Sprawdź aktualizację'}</span></button>
        </div>
        {isChecking && <div className="registry-progress" role="progressbar" aria-label="Trwa sprawdzanie bazy leków"><span /></div>}
        {message && <p className="registry-card-message" role="status">{message}</p>}
      </section>
    </div>
    <div className="settings-group">
      <h2>Wygląd</h2>
      <p className="settings-group-description">Wybierz wygląd, który jest dla Ciebie najwygodniejszy.</p>
      <div className="settings-row">
        <div><label htmlFor="settings-theme">Motyw aplikacji</label><small>Wybierz jasny lub ciemny wygląd.</small></div>
        <select id="settings-theme" value={theme} onChange={event => setTheme(event.target.value)}><option value="light">Jasny</option><option value="dark">Ciemny</option></select>
      </div>
      <div className="settings-row">
        <div><label htmlFor="settings-text-size">Rozmiar tekstu</label><small>Większy tekst ułatwia czytanie.</small></div>
        <select id="settings-text-size" value={textSize} onChange={event => setTextSize(event.target.value)}><option value="standard">Mały</option><option value="medium">Średni</option><option value="large">Duży</option><option value="extra">Bardzo duży</option><option value="extreme">Ekstremalny</option></select>
      </div>
    </div>
    <div className="settings-group">
      <h2>Pomoc</h2>
      <div className="settings-row"><div><strong>Pierwsze kroki</strong><small>Poznaj funkcje domowej apteczki.</small></div><button type="button" className="secondary settings-action" onClick={onTutorial}>Otwórz instrukcję</button></div>
      <div className="settings-row code-information"><div><strong>Kod EAN (kod kreskowy)</strong><p>Pionowe kreski i cyfry pod nimi oznaczają rodzaj opakowania. Takie same opakowania leku mają ten sam kod. Aplikacja używa go do wyszukania leku w rejestrze, gdzie dostępne mogą być jego nazwa, moc, postać i opis opakowania.</p><ScanGuide type="ean" context="info" /></div></div>
      <div className="settings-row code-information"><div><strong>Kod UI (Unikalny Identyfikator)</strong><p>Mały kwadratowy kod UI przypomina kod QR. Zawiera identyfikator produktu i numer seryjny konkretnego opakowania, a także numer serii i datę ważności. Aplikacja może odczytać dostępne dane z kodu bez wyszukiwania ich w rejestrze i sprawdzić zgodność produktu z wybranym opakowaniem.</p><p>W aptece kod UI może służyć do weryfikacji opakowania w odpowiednim systemie. Fillmich nie sprawdza jego autentyczności ani statusu sprzedaży lub wycofania. Zawsze porównaj odczytane dane z opakowaniem.</p><ScanGuide type="ui" context="info" /></div></div>
      <div className="settings-row"><div><strong>Rejestr Produktów Leczniczych</strong><small>Sprawdź informacje o lekach w oficjalnym rejestrze.</small></div><a className="secondary settings-action settings-link" href="https://rejestry.ezdrowie.gov.pl/rpl/search/public" target="_blank" rel="noreferrer">Otwórz rejestr ↗</a></div>
    </div>
    <div className="settings-group">
      <h2>Informacje o aplikacji</h2>
      <div className="settings-row settings-app-info"><div><strong>Autor aplikacji</strong><small>Michał Janicki</small></div><div><strong>Wersja aplikacji</strong><small>{version}</small></div><p>Dane apteczki przechowywane są na tym urządzeniu.</p></div>
    </div>
  </section>
}
