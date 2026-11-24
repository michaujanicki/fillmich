export default function StepProgress({ current, total }) {
  return <div className="step-progress"><div className="step-progress-label">Krok {current} z {total}</div><div className="step-progress-track" role="progressbar" aria-label="Postęp" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}><div className="step-progress-fill" style={{ width: `${current / total * 100}%` }} /></div></div>
}
