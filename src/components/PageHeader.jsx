export default function PageHeader({ eyebrow, title, subtitle, date }) {
  return (
    <div className="page-header fade-in">
      {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
      <h1 className="page-header-title">{title}</h1>
      {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      {date && <p className="page-header-date">{date}</p>}
    </div>
  );
}
