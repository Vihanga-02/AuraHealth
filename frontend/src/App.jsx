import { Route, Routes, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorsList from './pages/DoctorsList';
import About from './pages/About';
import Services from './pages/Services';

// Layouts
import DoctorLayout from './pages/doctor/DoctorLayout';
import AdminLayout from './pages/admin/AdminLayout';
import PatientLayout from './pages/patient/PatientLayout';

// Doctor Pages
import DoctorOverview from './pages/doctor/DoctorOverview';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorAvailability from './pages/doctor/DoctorAvailability';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorTelemedicineManage from './pages/doctor/DoctorTelemedicineManage';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminProfile from './pages/admin/AdminProfile';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/PatientProfile';
import PatientReports from './pages/patient/PatientReports';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import PatientHistory from './pages/patient/PatientHistory';
import PatientBookAppointment from './pages/patient/PatientBookAppointment';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientPaymentsHistory from './pages/patient/PatientPaymentsHistory';
import PatientCheckout from './pages/patient/PatientCheckout';

// Shared
import TelemedicineRoom from './pages/shared/TelemedicineRoom';

function App() {
  return (
    <Routes>
      {/* ── Public routes (Navbar + Footer included in PublicLayout) ── */}
      <Route element={<PublicLayout />}>
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors"  element={<DoctorsList />} />
        <Route path="/about"    element={<About />} />
        <Route path="/services" element={<Services />} />
      </Route>

      {/* ── Doctor dashboard (full-screen, no Navbar/Footer) ── */}
      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['Doctor']} />}>
        {/* Telemedicine join is full-screen — outside the sidebar layout */}
        <Route path="telemedicine/join/:scheduleId" element={<TelemedicineRoom />} />
        <Route element={<DoctorLayout />}>
          <Route path="dashboard"               element={<DoctorOverview />} />
          <Route path="profile"                 element={<DoctorProfile />} />
          <Route path="availability"            element={<DoctorAvailability />} />
          <Route path="appointments"            element={<DoctorAppointments />} />
          <Route path="patients"                element={<DoctorPatients />} />
          <Route path="telemedicine/manage"     element={<DoctorTelemedicineManage />} />
          <Route path=""                        element={<Navigate to="/doctor/dashboard" replace />} />
        </Route>
      </Route>

      {/* ── Admin dashboard (full-screen, no Navbar/Footer) ── */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="dashboard"     element={<AdminOverview />} />
          <Route path="doctors"       element={<AdminDoctors />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="payments"      element={<AdminPayments />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="profile"       element={<AdminProfile />} />
          <Route path=""              element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      {/* ── Patient dashboard (full-screen, no Navbar/Footer) ── */}
      <Route path="/patient" element={<ProtectedRoute allowedRoles={['Patient']} />}>
        {/* Telemedicine join is full-screen — outside the sidebar layout */}
        <Route path="telemedicine/join/:scheduleId" element={<TelemedicineRoom />} />
        <Route element={<PatientLayout />}>
          <Route path="dashboard"                        element={<PatientDashboard />} />
          <Route path="profile"                          element={<PatientProfile />} />
          <Route path="reports"                          element={<PatientReports />} />
          <Route path="prescriptions"                    element={<PatientPrescriptions />} />
          <Route path="history"                          element={<PatientHistory />} />
          <Route path="appointments/book"                element={<PatientBookAppointment />} />
          <Route path="appointments"                     element={<PatientAppointments />} />
          <Route path="payments/history"                 element={<PatientPaymentsHistory />} />
          <Route path="payments/checkout/:appointmentId" element={<PatientCheckout />} />
          <Route path=""                                 element={<Navigate to="/patient/dashboard" replace />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
