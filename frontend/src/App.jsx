import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarLayout } from './layouts/SidebarLayout';
import { Dashboard } from './pages/Dashboard';
import { WorkLog } from './pages/WorkLog';
import { Payments } from './pages/Payments';
import { Loans } from './pages/Loans';
import { Settings } from './pages/Settings';
import toast, { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ScrollToTop } from './components/utils/ScrollToTop';
import { messaging } from './firebase';
import { onMessage } from 'firebase/messaging';

function AppContent() {
  React.useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        toast(
          (t) => (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <strong style={{ marginBottom: '4px' }}>{payload.notification?.title || 'New Notification'}</strong>
              <span className="body-sm text-muted">{payload.notification?.body}</span>
            </div>
          ),
          { duration: 5000, icon: '🔔' }
        );
      });
      return () => unsubscribe();
    }
  }, []);
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="work-log" element={<WorkLog />} />
          <Route path="payments" element={<Payments />} />
          <Route path="loans" element={<Loans />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  React.useEffect(() => {
    // Wake up the backend (helpful for Render free tier)
    fetch('/api/health').catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
