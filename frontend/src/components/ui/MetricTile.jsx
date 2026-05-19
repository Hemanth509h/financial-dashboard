import React from 'react';
import { Card } from './Card';
import { Bell } from 'lucide-react';
import './MetricTile.css';

export const MetricTile = ({ title, value, subtext, subtextColor = 'primary', icon: Icon, iconBgColor, onNotify }) => {
  return (
    <Card className="metric-tile">
      <div className="metric-header flex justify-between items-center">
        <h3 className="metric-title">{title}</h3>
        <div className="flex gap-xs items-center">
          {onNotify && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onNotify();
              }}
              className="metric-notify-btn"
              title="Send notification for this metric"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--on-surface-variant)',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-container-high)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Bell size={16} />
            </button>
          )}
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
