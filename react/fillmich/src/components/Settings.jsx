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
      <h2>Pomoc i informacje</h2>
      <div className="settings-row"><div><strong>Pierwsze kroki</strong><small>Poznaj funkcje domowej apteczki.</small></div><button type="button" className="secondary settings-action" onClick={onTutorial}>Otwórz instrukcję</button></div>
      <div className="settings-row"><div><strong>Autor aplikacji</strong><small>Michał Janicki</small></div></div>
      <div className="settings-row"><div><strong>Wersja aplikacji</strong><small>Dane apteczki przechowywane są na tym urządzeniu.</small></div><span className="settings-version">{version}</span></div>
    </div>
  </section>
}
