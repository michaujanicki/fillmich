import PageHeader from './PageHeader'

export default function Settings({ theme, setTheme, textSize, setTextSize, onTutorial, version }) {
  return <section className="settings-view">
    <PageHeader eyebrow="TWOJA APLIKACJA" title="Ustawienia" description="Dostosuj Fillmich do swoich potrzeb." />
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
      <div className="settings-row code-information"><div><strong>Kod EAN — kod kreskowy</strong><p>Pionowe kreski i cyfry pod nimi oznaczają rodzaj opakowania. Takie same opakowania leku mają ten sam kod. Aplikacja używa go do wyszukania leku w rejestrze, gdzie dostępne mogą być jego nazwa, moc, postać i opis opakowania.</p></div></div>
      <div className="settings-row code-information"><div><strong>Kod UI (Unikalny Identyfikator)</strong><p>Mały kwadratowy kod UI przypomina kod QR. Zawiera identyfikator produktu i numer seryjny konkretnego opakowania, a także numer serii i datę ważności. Aplikacja może odczytać dostępne dane z kodu bez wyszukiwania ich w rejestrze i sprawdzić zgodność produktu z wybranym opakowaniem.</p><p>W aptece kod UI może służyć do weryfikacji opakowania w odpowiednim systemie. Fillmich nie sprawdza jego autentyczności ani statusu sprzedaży lub wycofania. Zawsze porównaj odczytane dane z opakowaniem.</p></div></div>
      <div className="settings-row"><div><strong>Rejestr Produktów Leczniczych</strong><small>Sprawdź informacje o lekach w oficjalnym rejestrze.</small></div><a className="secondary settings-action settings-link" href="https://rejestry.ezdrowie.gov.pl/rpl/search/public" target="_blank" rel="noreferrer">Otwórz rejestr ↗</a></div>
    </div>
    <div className="settings-group">
      <h2>Informacje o aplikacji</h2>
      <div className="settings-row settings-app-info"><div><strong>Autor aplikacji</strong><small>Michał Janicki</small></div><div><strong>Wersja aplikacji</strong><small>{version}</small></div><p>Dane apteczki przechowywane są na tym urządzeniu.</p></div>
    </div>
  </section>
}
