export const MetricTile = ({ title, value, subtext, subtextColor = 'primary', icon: Icon, gradientFrom = '#134e4a', gradientTo = 'var(--primary)' }) => {
  const subtextColorMap = {
    primary: 'var(--primary)',
    error: 'var(--error)',
    success: 'var(--success)',
    pending: 'var(--warning)',
    muted: 'var(--on-surface-variant)',
  };
  const resolvedSubtextColor = subtextColorMap[subtextColor] || 'var(--on-surface-variant)';

  return (
    <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
      {/* Gradient Banner */}
      <div style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`, padding: '14px 16px 38px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -22, top: -22, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', right: 28, top: 45, width: 55, height: 55, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          {Icon && (
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', flexShrink: 0 }}>
              <Icon size={18} color="#fff" />
            </div>
          )}
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1.3 }}>{title}</div>
        </div>
      </div>

      {/* Floating value panel */}
      <div style={{ padding: '0 12px', marginTop: '-26px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'var(--surface-bright)', borderRadius: '12px', boxShadow: '0 4px 18px rgba(0,0,0,0.11)', padding: '12px 16px', border: '1px solid var(--outline-variant)' }}>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--on-surface)', letterSpacing: '-0.04em', lineHeight: 1, wordBreak: 'break-word' }}>{value}</div>
          {subtext && (
            <div style={{ fontSize: '12px', fontWeight: 500, marginTop: 5, color: resolvedSubtextColor }}>
              {subtext}
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 12 }} />
    </div>
  );
};
