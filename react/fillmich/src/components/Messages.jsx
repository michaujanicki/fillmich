import { useEffect, useRef, useState } from 'react'
import { MessageContext } from './messageContext'
import Dialog from './Dialog'
import { FormActions } from './FormFields'

function useDialogKeyboard() {
  useEffect(() => {
    const origins = new WeakMap()
    let current = null
    const dialogs = () => [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
    const controls = dialog => [...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(item => item.getClientRects().length)
    const sync = () => {
      const next = dialogs().at(-1) || null
      if (next === current) return
      const previous = current
      current = next
      if (next && !origins.has(next)) {
        origins.set(next, document.activeElement)
        ;(controls(next)[0] || next).focus()
      } else if (previous) {
        const target = origins.get(previous)
        if (target?.isConnected && (!next || next.contains(target))) target.focus()
        else if (next) (controls(next)[0] || next).focus()
      }
    }
    const onKey = event => {
      if (!current) return
      if (event.key === 'Escape') {
        const close = current.querySelector('[data-dialog-close]:not(:disabled), .close:not(:disabled)')
        if (close) { event.preventDefault(); event.stopPropagation(); close.click() }
      } else if (event.key === 'Tab') {
        const items = controls(current)
        if (!items.length) { event.preventDefault(); return }
        const index = items.indexOf(document.activeElement)
        if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus() }
        else if (!event.shiftKey && (index < 0 || index === items.length - 1)) { event.preventDefault(); items[0].focus() }
      }
    }
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('keydown', onKey, true)
    sync()
    return () => { observer.disconnect(); document.removeEventListener('keydown', onKey, true) }
  }, [])
}

export function MessageProvider({ children }) {
  const [message, setMessage] = useState(null)
  const pending = useRef(null)
  useDialogKeyboard()
  function ask(text, confirm = false) {
    return new Promise(resolve => { pending.current = resolve; setMessage({ text, confirm }) })
  }
  function finish(value) { setMessage(null); pending.current?.(value); pending.current = null }
  const api = { alert: text => ask(text), confirm: text => ask(text, true) }
  return <MessageContext.Provider value={api}>{children}{message && <Dialog overlayClassName="message-overlay" className="message-dialog" titleId="message-title" descriptionId="message-text" closeLabel="Zamknij komunikat" closeOnBackdrop={false} onClose={() => finish(false)}><h2 id="message-title">{message.confirm ? 'Potwierdź' : 'Informacja'}</h2><p id="message-text">{message.text}</p><FormActions>{message.confirm && <button type="button" className="button-quiet" onClick={() => finish(false)}>Anuluj</button>}<button type="button" className="primary" onClick={() => finish(true)}>{message.confirm ? 'Potwierdź' : 'Rozumiem'}</button></FormActions></Dialog>}</MessageContext.Provider>
}
