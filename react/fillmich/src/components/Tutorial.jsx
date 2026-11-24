import { useEffect, useState } from 'react'
import PersonForm from './PersonForm'
import StepProgress from './StepProgress'
import Dialog from './Dialog'
import { FormActions } from './FormFields'
import ScanGuide from './ScanGuide'

const pages = [
  { icon: 'app', title: 'Witaj w Fillmich', text: 'Twoja domowa apteczka w jednym miejscu. Dodawaj leki, przypisuj je bliskim i sprawdzaj terminy ważności.' },
  { icon: '◐', title: 'Wybierz motyw', text: 'Wybierz jasny lub ciemny wygląd aplikacji. Możesz go później zmienić w ustawieniach.' },
  { icon: '♙', title: 'Dodaj kolejną osobę', text: 'Możesz dodać profil bliskiej osoby i przypisywać do niego leki.' },
  { icon: '▤', title: 'Dodaj lek do apteczki', text: 'Wyszukaj lek w rejestrze, zeskanuj kod kreskowy albo wpisz jego dane samodzielnie. Wybierz odpowiedni produkt i opakowanie.' },
  { icon: '▣', title: 'Znajdź kod EAN', text: 'Kod kreskowy EAN pomaga znaleźć w rejestrze rodzaj opakowania. Porównaj znaleziony lek z tym, który masz w domu.', guide: 'ean' },
  { icon: '▣', title: 'Sprawdź kod UI', text: 'Kwadratowy kod UI może zawierać numer partii i datę ważności. Zawsze porównaj odczytane dane z opakowaniem.', guide: 'ui' },
  { icon: '◷', title: 'Sprawdzaj terminy ważności', text: 'Wpisz datę z opakowania. Fillmich oznaczy leki po terminie oraz te, których termin upływa w ciągu 90 dni.' },
  { icon: '✚', title: 'Kontroluj zapasy', text: 'Zapisz liczbę pozostałych tabletek i aktualizuj ją w apteczce. Możesz przypisać lek do osoby albo pozostawić go jako wspólny.' },
  { icon: '◷', title: 'Zaplanuj przyjmowanie', text: 'W zakładce Dawkowanie zapisz codzienne pory i dawki ustalone przez lekarza lub zgodne z ulotką. Oznaczaj przyjęte dawki i sprawdzaj kalendarz.' },
  { icon: '▥', title: 'Sprawdzaj prognozę zapasu', text: 'Jeśli podasz stan tabletek, aplikacja odliczy oznaczone dawki i oszacuje, kiedy może zabraknąć leku. Fillmich nie wysyła obecnie przypomnień.' },
  { icon: '▤', title: 'Ulotki i baza leków', text: 'W szczegółach leku otworzysz ulotkę, jeśli jest dostępna w rejestrze. W ustawieniach możesz pobrać aktualną bazę; pobieranie wymaga internetu.' },
  { icon: '⌂', title: 'Twoje dane na urządzeniu', text: 'Apteczka, osoby i plany są zapisywane lokalnie. Nie synchronizują się automatycznie między urządzeniami, a wyczyszczenie danych aplikacji może je usunąć.' },
  { icon: '✓', title: 'Wszystko gotowe', text: 'Wrócisz do tego przewodnika w ustawieniach lub przez przycisk „Jak korzystać?”. Możesz teraz zacząć porządkować swoją apteczkę.' },
]

export default function Tutorial({ onClose, people, onAddPerson, onUndoPerson, theme, setTheme, requiredPerson = false }) {
  const [step, setStep] = useState(0)
  const [createdPerson, setCreatedPerson] = useState(null)
  const page = pages[step]
  const needsPerson = requiredPerson && !people.some(person => person !== 'Wspólne')
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])
  return <Dialog overlayClassName="tutorial-overlay" className="tutorial tutorial-fullscreen" titleId="tutorial-title" onClose={onClose} closeLabel="Zamknij przewodnik" showClose={!needsPerson} closeOnBackdrop={false}>
      <div className="tutorial-content">
      <div className="tutorial-icon" aria-hidden="true">{page.icon === 'app' ? <img src={`${import.meta.env.BASE_URL}fillmich-icon.svg`} alt="" /> : page.icon}</div>
      <div className="eyebrow">PIERWSZE KROKI</div>
      <StepProgress current={step + 1} total={pages.length} />
      <h2 id="tutorial-title">{step === 2 && requiredPerson ? 'Dodaj osobę lub nazwę' : page.title}</h2><p>{step === 2 && requiredPerson ? 'Aby korzystać z apteczki, wpisz imię osoby albo nazwę, na przykład Dom.' : page.text}</p>
      {page.guide && <ScanGuide type={page.guide} context="info" />}
      {step === 1 && <fieldset className="tutorial-theme"><legend>Motyw aplikacji</legend>{[['light', 'Jasny'], ['dark', 'Ciemny']].map(([value, label]) => <label key={value} className={theme === value ? 'selected' : ''}><input type="radio" name="tutorial-theme" value={value} checked={theme === value} onChange={() => setTheme(value)} />{label}</label>)}</fieldset>}
      {step === 2 && <PersonForm compact people={people} onAdd={person => { onAddPerson(person); if (requiredPerson) setCreatedPerson(person.name); setStep(3) }} />}
      {step === 2 && needsPerson && <p className="tutorial-person-hint" role="status">Wpisz nazwę powyżej i naciśnij „Dodaj osobę”, aby przejść dalej.</p>}
      <FormActions>{(step > 0 || !needsPerson) && <button className="button-quiet" onClick={step ? () => { if (step === 3 && createdPerson) { onUndoPerson(createdPerson); setCreatedPerson(null) } setStep(step - 1) } : onClose}>{step ? 'Wstecz' : 'Pomiń'}</button>}<button className="primary" disabled={step === 2 && needsPerson} onClick={step === pages.length - 1 ? onClose : () => setStep(step + 1)}>{step === pages.length - 1 ? 'Zaczynamy' : 'Dalej'} →</button></FormActions>
      </div>
  </Dialog>
}
