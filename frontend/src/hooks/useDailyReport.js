import { useEffect } from 'react';
import { showDailyMetricsReport } from '../utils/notificationUtils';

export function useDailyReport() {
  useEffect(() => {
    const checkAndShowReport = async () => {
      const enabled = localStorage.getItem('notificationsEnabled') === 'true';
      if (!enabled) return;

      const targetTime = localStorage.getItem('notificationTime') || '09:00';
      const lastShown = localStorage.getItem('lastReportShownDate');
      
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // If already shown today, skip
      if (lastShown === today) return;

      // Check if it's past the target time
      const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      if (currentHours > targetHours || (currentHours === targetHours && currentMinutes >= targetMinutes)) {
        try {
          const success = await showDailyMetricsReport();
          if (success) {
            localStorage.setItem('lastReportShownDate', today);
          }
        } catch (err) {
          // Error already logged in utility
        }
      }
    };

    // Check every minute while the app is open
    checkAndShowReport();
    const interval = setInterval(checkAndShowReport, 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
