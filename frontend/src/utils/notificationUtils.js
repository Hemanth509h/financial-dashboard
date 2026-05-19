export async function showDailyMetricsReport() {
  try {
    // Fetch metrics
    const res = await fetch('/api/dashboard/summary');
    if (!res.ok) throw new Error('Failed to fetch summary');
    const metrics = await res.json();

    const currencyCode = localStorage.getItem('currency') || 'INR';
    const currency = currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : '₹';
    
    const title = 'Daily Financial Summary';
    const body = `Earned: ${currency}${metrics.totalEarnedThisMonth.toLocaleString()} | Pending: ${currency}${metrics.pendingPayments.toLocaleString()} | Loans: ${currency}${metrics.totalLoanBalance.toLocaleString()}`;

    // Show notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const options = { 
        body, 
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'daily-report',
        renotify: true
      };

      // Try service worker first (best for mobile/background)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, options);
          return true;
        }
      }

      // Fallback to standard Notification API
      new Notification(title, options);
      return true;
    } else {
      throw new Error('Notification permission not granted');
    }
  } catch (err) {
    console.error('Failed to show daily report notification', err);
    throw err;
  }
}
