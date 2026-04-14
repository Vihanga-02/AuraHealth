import { Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorsList from './pages/DoctorsList';

// Layouts
import DoctorLayout from './pages/doctor/DoctorLayout';
import AdminLayout from './pages/admin/AdminLayout';

// Doctor Pages
import DoctorOverview from './pages/doctor/DoctorOverview';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorAvailability from './pages/doctor/DoctorAvailability';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminUsers from './pages/admin/AdminUsers';

// Catch-all placeholder
const Placeholder = ({ title }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-xl font-bold">{title}</h2>
    <p className="text-slate-500 mt-2">Coming soon...</p>
  </div>
);

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/"        element={<Home />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<DoctorsList />} />

        {/* Doctor Protected Routes */}
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['Doctor']} />}>
          <Route element={<DoctorLayout />}>
            <Route path="dashboard"    element={<DoctorOverview />} />
            <Route path="profile"      element={<DoctorProfile />} />
            <Route path="availability" element={<DoctorAvailability />} />
            <Route path="appointments" element={<Placeholder title="My Appointments" />} />
            <Route path="patients"     element={<Placeholder title="My Patients" />} />
            <Route path="settings"     element={<Placeholder title="Settings" />} />
            <Route path=""             element={<Navigate to="/doctor/dashboard" replace />} />
          </Route>
        </Route>

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="doctors"   element={<AdminDoctors />} />
            <Route path="users"     element={<AdminUsers />} />
            <Route path="settings"  element={<Placeholder title="Settings" />} />
            <Route path=""          element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
