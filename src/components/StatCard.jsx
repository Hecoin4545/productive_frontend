export default function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  change,
  metricCode,
  tag,
  subtext,
  targetInfo
}) {
  return (
    <div className="stat-card fade-in">
      <div className="stat-card-header">
        <div className="stat-card-meta-left">
          {metricCode ? (
            <span className="stat-card-metric-code">{metricCode}</span>
          ) : (
            Icon && (
              <div
                className="stat-card-icon"
                style={{
                  background: iconBg || 'var(--color-surface-hover)',
                  color: iconColor || 'var(--color-text)'
                }}
              >
                <Icon size={16} />
              </div>
            )
          )}
          {tag && <span className="stat-card-tag">{tag}</span>}
        </div>

        {change && (
          <span
            className={`stat-card-change ${change.startsWith('+') || change.startsWith('↑') ? 'positive' : 'negative'
              }`}
          >
            {change}
          </span>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>

      {(subtext || targetInfo) && (
        <div className="stat-card-footer">
          {targetInfo && <span className="stat-card-target">{targetInfo}</span>}
          {subtext && <span className="stat-card-subtext">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
