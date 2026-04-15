import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      const data = await login(form);
      const role = data.user.role;
      if (role === 'Admin') navigate('/admin/dashboard');
      else if (role === 'Doctor') navigate('/doctor/dashboard');
      else if (role === 'Patient') navigate('/patient/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 px-4 py-2 text-base w-full disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-200 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-600">
            Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Sign up</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className={btnPrimary} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="mt-6 border-t border-slate-200 pt-6">
            <h4 className="text-sm font-medium text-slate-900 mb-3 text-center">Demo Accounts (Password: 123456)</h4>
            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded border border-slate-100">
                <p><strong>Admin:</strong> admin@aurahealth.lk</p>
                <p><strong>Doctor:</strong> doctor@aurahealth.lk</p>
                <p><strong>Patient:</strong> patient@aurahealth.lk</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
