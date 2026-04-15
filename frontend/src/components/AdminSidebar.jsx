import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { name: 'Overview',      path: '/admin/dashboard',       icon: '📈' },
  { name: 'Doctors',       path: '/admin/doctors',         icon: '👨‍⚕️' },
  { name: 'Users',         path: '/admin/users',           icon: '👥' },
  { name: 'Payments',      path: '/admin/payments',        icon: '💳' },
  { name: 'Notifications', path: '/admin/notifications',   icon: '📩' },
  { name: 'My Profile',    path: '/admin/profile',         icon: '👤' },
];

const AdminSidebar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-64 bg-slate-900 h-screen fixed top-0 left-0 overflow-y-auto flex flex-col z-40">
      {/* Home shortcut */}
      <Link
        to="/"
        className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors group"
        title="Back to website"
      >
        <span className="text-xl">🏠</span>
        <span className="text-sm font-medium text-slate-300 group-hover:text-white">AuraHealth</span>
      </Link>

      {/* Portal header */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {(user?.full_name || user?.email || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.full_name || 'Administrator'}</div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="text-base">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
