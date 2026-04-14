import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi } from '../../api';

const DoctorOverview = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorApi.myProfile()
      .then(res => setProfile(res.data.doctor))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.full_name || 'Doctor'}</h1>
          <p className="text-slate-500">Here's what's happening with your practice today.</p>
        </div>
      </div>

      {!user.is_active && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Account Pending Verification.</strong> Your account is currently pending approval from an administrator. You will not be listed in the public directory until approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {user.is_active && !profile && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              You haven't set up your professional profile yet. Information like your specialty and bio are required for patients to find you.
            </p>
            <a href="/doctor/profile" className="text-sm font-medium text-blue-800 underline">Set up profile</a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
            📅
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium tracking-wide">Today's Appts</p>
            <p className="text-2xl font-bold text-slate-800">0</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xl">
            👥
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium tracking-wide">Total Patients</p>
            <p className="text-2xl font-bold text-slate-800">0</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md p-6 flex items-center gap-4">
           <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
            ⭐
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium tracking-wide">My Rating</p>
            <p className="text-2xl font-bold text-slate-800">{profile?.rating || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;
