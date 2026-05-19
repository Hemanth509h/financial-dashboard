import React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useBackendStatus } from '../../hooks/useBackendStatus';

export const SyncStatus = () => {
  const { online, queueLength } = useBackendStatus();

  if (online && queueLength === 0) return null;

  const offline = !online;
  const label = offline
    ? queueLength > 0
      ? `Offline · ${queueLength} change${queueLength === 1 ? '' : 's'} pending`
      : 'Offline · using saved data'
    : `Syncing ${queueLength} change${queueLength === 1 ? '' : 's'}…`;

  const Icon = offline ? CloudOff : RefreshCw;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '16px',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '999px',
        backgroundColor: offline ? 'rgba(31, 41, 55, 0.92)' : 'rgba(0, 106, 106, 0.92)',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 500,
        boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
        backdropFilter: 'blur(6px)',
        pointerEvents: 'none',
      }}
    >
      <Icon size={14} className={offline ? '' : 'spin'} />
      <span>{label}</span>
      <style>{`
        .spin { animation: gf-spin 1s linear infinite; }
        @keyframes gf-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
