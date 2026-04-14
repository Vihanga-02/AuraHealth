import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DoctorSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: '📊' },
    { name: 'My Profile', path: '/doctor/profile', icon: '👨‍⚕️' },
    { name: 'Availability', path: '/doctor/availability', icon: '📅' },
    { name: 'Appointments', path: '/doctor/appointments', icon: '🩺' },
    { name: 'Patients', path: '/doctor/patients', icon: '👥' },
    { name: 'Settings', path: '/doctor/settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-64px)] fixed top-16 left-0 overflow-y-auto flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-bold text-lg text-slate-800">Doctor Portal</h2>
        <p className="text-sm text-slate-500 truncate">{user?.full_name || 'Doctor'}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Status</p>
          <div className="flex items-center gap-2">
             {/* Check if user active is here or doctor verification, assuming from user context */}
            <span className={`w-2.5 h-2.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className="text-sm font-medium text-slate-700">
              {user.is_active ? 'Active' : 'Pending Review'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DoctorSidebar;
