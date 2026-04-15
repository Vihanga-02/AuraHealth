import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { name: 'Dashboard',       path: '/patient/dashboard',         icon: '📊' },
  { name: 'My Profile',      path: '/patient/profile',           icon: '👤' },
  { name: 'Book Appointment',path: '/patient/appointments/book', icon: '📅' },
  { name: 'My Appointments', path: '/patient/appointments',      icon: '🩺' },
  { name: 'Medical Reports', path: '/patient/reports',           icon: '📄' },
  { name: 'Prescriptions',   path: '/patient/prescriptions',     icon: '💊' },
  { name: 'Medical History', path: '/patient/history',           icon: '📋' },
  { name: 'Payments',        path: '/patient/payments/history',  icon: '💳' },
];

export default function PatientSidebar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed top-0 left-0 overflow-y-auto flex flex-col z-40">
      {/* Home shortcut */}
      <Link
        to="/"
        className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 hover:bg-blue-50 transition-colors group"
        title="Back to website"
      >
        <span className="text-xl">🏠</span>
        <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">AuraHealth</span>
      </Link>

      {/* Portal header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
            {(user?.full_name || user?.email || 'P')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-800 truncate">{user?.full_name || 'Patient'}</div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const isActive =
            item.path === '/patient/appointments'
              ? location.pathname === '/patient/appointments'
              : location.pathname === item.path ||
                (item.path !== '/patient/dashboard' && location.pathname.startsWith(item.path + '/'));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: find doctor + logout */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-2">
        <Link
          to="/doctors"
          className="flex items-center gap-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <span>🔍</span> Find a Doctor
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
