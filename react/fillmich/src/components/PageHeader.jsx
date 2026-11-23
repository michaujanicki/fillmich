export default function PageHeader({ eyebrow, title, description, action }) {
  return <header className="page-heading">
    <div className="page-heading-copy">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {action && <div className="page-heading-action">{action}</div>}
  </header>
}
