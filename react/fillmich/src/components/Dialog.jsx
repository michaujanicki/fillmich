export default function Dialog({ children, onClose, titleId, label, descriptionId, className = '', overlayClassName = '', baseClassName = 'dialog', closeLabel = 'Zamknij', showClose = true, closeOnBackdrop = true, closeClassName = 'close' }) {
  return <div className={`overlay ${overlayClassName}`.trim()} onClick={closeOnBackdrop ? onClose : undefined}>
    <section className={`${baseClassName} ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-label={label} aria-describedby={descriptionId} tabIndex={-1} onClick={event => event.stopPropagation()}>
      {showClose && <button type="button" className={closeClassName} data-dialog-close aria-label={closeLabel} onClick={onClose}>×</button>}
      {children}
    </section>
  </div>
}
