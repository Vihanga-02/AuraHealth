import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: '📈' },
    { name: 'Doctors', path: '/admin/doctors', icon: '👨‍⚕️' },
    { name: 'Users', path: '/admin/users', icon: '👥' },
    { name: 'Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-slate-900 h-[calc(100vh-64px)] fixed top-16 left-0 overflow-y-auto flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h2 className="font-bold text-lg text-white">Admin Portal</h2>
        <p className="text-sm text-slate-400 truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
