export default function StatCard({ icon: Icon, iconBg, iconColor, value, label, change }) {
  return (
    <div className="stat-card fade-in">
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ background: iconBg || 'var(--color-primary-light)', color: iconColor || 'var(--color-primary)' }}>
          {Icon && <Icon size={18} />}
        </div>
        {change && (
          <span className={`stat-card-change ${change.startsWith('+') || change.startsWith('↑') ? 'positive' : 'negative'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
