import { useState } from 'react'
import PersonForm from './PersonForm'

const pages = [
  { icon: '✳', title: 'Witaj w Fillmich', text: 'Twoja domowa apteczka w jednym miejscu. Dodawaj leki, przypisuj je bliskim i sprawdzaj terminy ważności.' },
  { icon: '♙', title: 'Dodaj pierwszą osobę', text: 'Utwórz profil dla siebie lub bliskiej osoby, aby przypisywać do niego leki. Możesz też zrobić to później.' },
  { icon: '▤', title: 'Uzupełnij apteczkę', text: 'Wyszukaj lek w rejestrze, zeskanuj kod opakowania albo wpisz dane ręcznie. Wybierz właściwą wielkość opakowania.' },
  { icon: '◷', title: 'Sprawdzaj terminy', text: 'Dodaj datę ważności z opakowania. Fillmich oznaczy leki po terminie i te, których termin zbliża się w ciągu 90 dni.' },
]

export default function Tutorial({ onClose, people, onAddPerson }) {
  const [step, setStep] = useState(0)
  const page = pages[step]
  return <div className="overlay" onClick={onClose}>
    <section className="dialog tutorial" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" onClick={event => event.stopPropagation()}>
      <button className="close" onClick={onClose} aria-label="Zamknij przewodnik">×</button>
      <div className="tutorial-icon" aria-hidden="true">{page.icon}</div>
      <div className="eyebrow">PIERWSZE KROKI · {step + 1} / {pages.length}</div>
      <h2 id="tutorial-title">{page.title}</h2><p>{page.text}</p>
      {step === 1 && <PersonForm compact people={people} onAdd={onAddPerson} />}
      <div className="tutorial-dots" aria-hidden="true">{pages.map((item, index) => <span key={item.title} className={index === step ? 'current' : ''} />)}</div>
      <div className="wizard-actions"><button className="button-quiet" onClick={step ? () => setStep(step - 1) : onClose}>{step ? 'Wstecz' : 'Pomiń'}</button><button className="primary" onClick={step === pages.length - 1 ? onClose : () => setStep(step + 1)}>{step === pages.length - 1 ? 'Zaczynamy' : 'Dalej'} →</button></div>
    </section>
  </div>
}
