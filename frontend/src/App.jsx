import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarLayout } from './layouts/SidebarLayout';
import { Dashboard } from './pages/Dashboard';
import { WorkLog } from './pages/WorkLog';
import { Payments } from './pages/Payments';
import { Loans } from './pages/Loans';

import { ScrollToTop } from './components/utils/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="work-log" element={<WorkLog />} />
          <Route path="payments" element={<Payments />} />
          <Route path="loans" element={<Loans />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
