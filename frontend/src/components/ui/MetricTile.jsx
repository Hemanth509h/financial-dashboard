import { Card } from './Card';
import './MetricTile.css';

export const MetricTile = ({ title, value, subtext, subtextColor = 'primary', icon: Icon, iconBgColor }) => {
  return (
    <Card className="metric-tile">
      <div className="metric-header flex justify-between items-center">
        <h3 className="metric-title">{title}</h3>
        <div className="flex gap-xs items-center">
          {Icon && (
            <div className="metric-icon" style={{ backgroundColor: iconBgColor || 'var(--surface-container-low)' }}>
              <Icon size={20} color={iconBgColor?.includes('#ff') ? 'var(--error)' : 'var(--primary)'} />
            </div>
          )}
        </div>
      </div>
      <div className="metric-value numeric-display">{value}</div>
      {subtext && (
        <div className={`metric-subtext text-${subtextColor}`}>
          {subtext}
        </div>
      )}
    </Card>
  );
};
