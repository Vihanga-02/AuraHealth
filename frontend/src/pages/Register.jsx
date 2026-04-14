import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';

const Register = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Patient'); 
  
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const payload = { ...form, role: activeTab };
      await authApi.register(payload);
      
      if (activeTab === 'Doctor') {
        setSuccess('Registration successful! Your account is pending admin approval.');
        setForm({ full_name: '', email: '', phone: '', password: '' });
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 px-4 py-2 text-base w-full disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-200 w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-slate-900">Create an Account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link>
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-lg mb-8">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'Patient' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
             onClick={() => setActiveTab('Patient')}
          >
            I am a Patient
          </button>
          <button
             type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'Doctor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab('Doctor')}
          >
            I am a Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-md text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-800 border border-green-200 p-3 rounded-md text-sm">{success}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              name="full_name" type="text" required value={form.full_name}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
              onChange={handleChange} placeholder="John Doe"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input 
              name="email" type="email" required value={form.email}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
              onChange={handleChange} placeholder="you@example.com"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (Optional)</label>
            <input 
              name="phone" type="tel" value={form.phone}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
              onChange={handleChange} placeholder="e.g. 0771234567"
            />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              name="password" type="password" required value={form.password}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
              onChange={handleChange} placeholder="••••••••" minLength={6}
            />
          </div>

          <button type="submit" className={`${btnPrimary} !mt-6`} disabled={isLoading}>
            {isLoading ? 'Registering...' : `Register as ${activeTab}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
