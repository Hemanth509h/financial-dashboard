import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { SidebarLayout } from './layouts/SidebarLayout';
import { Dashboard } from './pages/Dashboard';
import { WorkLog } from './pages/WorkLog';
import { Expenses } from './pages/Expenses';
import { Payments } from './pages/Payments';
import { Loans } from './pages/Loans';
import { Settings } from './pages/Settings';
import { MonthlyHistory } from './pages/MonthlyHistory';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageLoading, SplashScreen } from './components/ui/Loading';
import { ScrollToTop } from './components/utils/ScrollToTop';

function ProtectedRoute({ children }) {
  const { loading } = useAuth();
  if (loading) return <PageLoading />;
  return children;
}

function GuestRoute({ children }) {
  return <Navigate to="/" replace />;
}

function AppContent() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="work-log" element={<WorkLog />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="payments" element={<Payments />} />
          <Route path="loans" element={<Loans />} />
          <Route path="monthly-history" element={<MonthlyHistory />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function AppWithSplash() {
  const { loading } = useAuth();
  if (loading) return <SplashScreen />;
  return <AppContent />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppWithSplash />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
