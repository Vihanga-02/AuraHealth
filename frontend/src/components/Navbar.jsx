import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const btnGhost = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-4 py-2 text-base";
  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 px-4 py-2 text-base";
  const btnSecondarySm = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-400 px-3 py-1.5 text-sm";
  const btnGhostSm = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3 py-1.5 text-sm";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">AuraHealth</span>
            </Link>
            
            <div className="hidden md:flex ml-10 space-x-8">
              <Link to="/" className="text-slate-600 hover:text-blue-600 font-medium">Home</Link>
              <Link to="/doctors" className="text-slate-600 hover:text-blue-600 font-medium">Find a Doctor</Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="text-sm">
                  <span className="text-slate-500">Welcome, </span>
                  <span className="font-semibold text-slate-800">{user.full_name || user.email}</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-bold">{user.role}</span>
                </div>
                
                {user.role === 'Admin' && (
                  <Link to="/admin/dashboard" className={btnSecondarySm}>Dashboard</Link>
                )}
                {user.role === 'Doctor' && (
                  <Link to="/doctor/dashboard" className={btnSecondarySm}>Dashboard</Link>
                )}
                
                <button onClick={handleLogout} className={btnGhostSm}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className={btnGhost}>Log In</Link>
                <Link to="/register" className={btnPrimary}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
