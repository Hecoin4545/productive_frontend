import {
  BookOpen, BookText, CalendarDays, FolderOpen,
  Timer, BarChart3, Settings
} from 'lucide-react';

const iconMap = {
  BookOpen, BookText, CalendarDays, FolderOpen,
  Timer, BarChart3, Settings
};

export default function PlaceholderPage({ title, description, icon }) {
  const Icon = iconMap[icon] || BookOpen;

  return (
    <div className="placeholder-page fade-in">
      <div className="placeholder-icon">
        <Icon size={36} />
      </div>
      <h1 className="placeholder-title">{title}</h1>
      <p className="placeholder-desc">{description}</p>
      <div className="placeholder-badge">Coming soon</div>
    </div>
  );
}
