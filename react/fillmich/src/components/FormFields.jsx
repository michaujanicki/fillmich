export function FormActions({ children }) { return <div className="wizard-actions">{children}</div> }

export function PersonSelect({ people, value, onChange, label = 'Dla kogo', includeShared = true, required = false, placeholder }) {
  return <label>{label}<select required={required} value={value} onChange={event => onChange(event.target.value)}>
    {placeholder && <option value="">{placeholder}</option>}
    {people.filter(person => includeShared || person !== 'Wspólne').map(person => <option key={person} value={person}>{person === 'Wspólne' ? 'Bez przypisania' : person}</option>)}
  </select></label>
}

export function StockInput({ label = 'Pozostało tabletek', value, onChange, limit, placeholder = 'Nie podano', step = 'any' }) {
  return <label>{label}<input type="number" min="0" max={limit ?? 1000000} step={step} inputMode="decimal" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>
}

export function QuantityInput({ value, onChange }) {
  return <label>Liczba opakowań<input type="number" min="1" step="1" required value={value} onChange={event => onChange(event.target.value)} /></label>
}
