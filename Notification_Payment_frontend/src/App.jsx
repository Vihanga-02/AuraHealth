import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PaymentPage from './pages/user/PaymentPage';
import UserHistory from './pages/user/UserHistory';
import PaymentDashboard from './pages/admin/PaymentDashboard';
import NotificationDashboard from './pages/admin/NotificationDashboard';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<PaymentPage />} />
        <Route path="/history" element={<UserHistory />} />

        {/* Unified Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Index or default sub-route */}
          <Route index element={<Navigate to="/admin/payments" replace />} />
          <Route path="payments" element={<PaymentDashboard />} />
          <Route path="notifications" element={<NotificationDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
