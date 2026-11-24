import { useState } from 'react'
import PersonForm from './PersonForm'
import StepProgress from './StepProgress'

const pages = [
  { icon: 'app', title: 'Witaj w Fillmich', text: 'Twoja domowa apteczka w jednym miejscu. Dodawaj leki, przypisuj je bliskim i sprawdzaj terminy ważności.' },
  { icon: '◐', title: 'Wybierz motyw', text: 'Wybierz jasny lub ciemny wygląd aplikacji. Możesz go później zmienić w ustawieniach.' },
  { icon: '♙', title: 'Dodaj kolejną osobę', text: 'Możesz dodać profil bliskiej osoby i przypisywać do niego leki.' },
  { icon: '▤', title: 'Uzupełnij apteczkę', text: 'Wyszukaj lek w rejestrze, zeskanuj kod opakowania albo wpisz dane ręcznie. Wybierz właściwą wielkość opakowania.' },
  { icon: '◷', title: 'Sprawdzaj terminy', text: 'Dodaj datę ważności z opakowania. Fillmich oznaczy leki po terminie i te, których termin zbliża się w ciągu 90 dni.' },
]

export default function Tutorial({ onClose, people, onAddPerson, onUndoPerson, theme, setTheme, requiredPerson = false }) {
  const [step, setStep] = useState(0)
  const [createdPerson, setCreatedPerson] = useState(null)
  const page = pages[step]
  const needsPerson = requiredPerson && !people.some(person => person !== 'Wspólne')
  const close = () => { if (!needsPerson) onClose() }
  return <div className="overlay" onClick={close}>
    <section className="dialog tutorial" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" onClick={event => event.stopPropagation()}>
      {!needsPerson && <button className="close" onClick={onClose} aria-label="Zamknij przewodnik">×</button>}
      <div className="tutorial-icon" aria-hidden="true">{page.icon === 'app' ? <img src={`${import.meta.env.BASE_URL}fillmich-icon.svg`} alt="" /> : page.icon}</div>
      <div className="eyebrow">PIERWSZE KROKI</div>
      <StepProgress current={step + 1} total={pages.length} />
      <h2 id="tutorial-title">{step === 2 && requiredPerson ? 'Dodaj osobę lub nazwę' : page.title}</h2><p>{step === 2 && requiredPerson ? 'Aby korzystać z apteczki, wpisz imię osoby albo nazwę, na przykład Dom.' : page.text}</p>
      {step === 1 && <fieldset className="tutorial-theme"><legend>Motyw aplikacji</legend>{[['light', 'Jasny'], ['dark', 'Ciemny']].map(([value, label]) => <label key={value} className={theme === value ? 'selected' : ''}><input type="radio" name="tutorial-theme" value={value} checked={theme === value} onChange={() => setTheme(value)} />{label}</label>)}</fieldset>}
      {step === 2 && <PersonForm compact people={people} onAdd={person => { onAddPerson(person); if (requiredPerson) setCreatedPerson(person.name); setStep(3) }} />}
      <div className="wizard-actions">{(step > 0 || !needsPerson) && <button className="button-quiet" onClick={step ? () => { if (step === 3 && createdPerson) { onUndoPerson(createdPerson); setCreatedPerson(null) } setStep(step - 1) } : onClose}>{step ? 'Wstecz' : 'Pomiń'}</button>}<button className="primary" disabled={step === 2 && needsPerson} onClick={step === pages.length - 1 ? onClose : () => setStep(step + 1)}>{step === pages.length - 1 ? 'Zaczynamy' : 'Dalej'} →</button></div>
    </section>
  </div>
}
