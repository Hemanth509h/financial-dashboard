import { useEffect, useState } from 'react';
import { subscribeStatus } from '../api';

export function useBackendStatus() {
  const [status, setStatus] = useState({ online: true, queueLength: 0 });
  useEffect(() => subscribeStatus(setStatus), []);
  return status;
}
