import PageHeader from './PageHeader'

export default function Settings({ theme, setTheme, textSize, setTextSize, onTutorial, version }) {
  return <section className="settings-view">
    <PageHeader eyebrow="TWOJA APLIKACJA" title="Ustawienia" description="Dostosuj Fillmich do swoich potrzeb." />
    <div className="settings-group"><h2>Wygląd</h2><div className="settings-row"><div><strong>Motyw aplikacji</strong><small>Wybierz jasny lub ciemny wygląd.</small></div><select aria-label="Motyw aplikacji" value={theme} onChange={event => setTheme(event.target.value)}><option value="light">Jasny</option><option value="dark">Ciemny</option></select></div><div className="settings-row"><div><strong>Rozmiar tekstu</strong><small>Większy tekst ułatwia czytanie.</small></div><select aria-label="Rozmiar tekstu" value={textSize} onChange={event => setTextSize(event.target.value)}><option value="standard">Standardowy</option><option value="large">Duży</option><option value="extra">Bardzo duży</option></select></div></div>
    <div className="settings-group"><h2>Pomoc i informacje</h2><div className="settings-row"><div><strong>Pierwsze kroki</strong><small>Poznaj funkcje domowej apteczki.</small></div><button type="button" className="secondary settings-action" onClick={onTutorial}>Otwórz</button></div><div className="settings-row"><div><strong>Wersja aplikacji</strong><small>Dane apteczki przechowywane są na tym urządzeniu.</small></div><span className="settings-version">{version}</span></div></div>
  </section>
}
