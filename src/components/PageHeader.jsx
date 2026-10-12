export default function PageHeader({ eyebrow, title, subtitle, date, actions, metricTag }) {
  return (
    <div className="page-header fade-in">
      <div className="page-header-main">
        {eyebrow && (
          <div className="page-header-eyebrow">
            <span>{eyebrow}</span>
            {metricTag && <span className="eyebrow-metric-tag">{metricTag}</span>}
          </div>
        )}
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        {date && <p className="page-header-date">{date}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
