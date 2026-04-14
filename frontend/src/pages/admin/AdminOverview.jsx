import { useEffect, useState } from 'react';
import { authApi } from '../../api';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.adminStats()
      .then(res => setStats(res.data.stats))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  const cardStyle = "bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md p-6";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Platform Overview</h1>
         <p className="text-slate-500">System statistics and recent activities.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={cardStyle}>
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xl">👥</div>
             <div><p className="text-sm text-slate-500 font-medium">Total Users</p><p className="text-2xl font-bold text-slate-800">{stats?.total || 0}</p></div>
           </div>
        </div>

        <div className={cardStyle}>
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center text-xl">👨‍⚕️</div>
             <div><p className="text-sm text-slate-500 font-medium">Doctors</p><p className="text-2xl font-bold text-slate-800">{stats?.doctors || 0}</p></div>
           </div>
        </div>

        <div className={cardStyle}>
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">🩺</div>
             <div><p className="text-sm text-slate-500 font-medium">Patients</p><p className="text-2xl font-bold text-slate-800">{stats?.patients || 0}</p></div>
           </div>
        </div>

        <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 transition-all duration-200 hover:shadow-md p-6">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center text-xl">⚠️</div>
             <div><p className="text-sm text-yellow-700 font-medium">Pending Doctors</p><p className="text-2xl font-bold text-yellow-800">{stats?.pendingDoctors || 0}</p></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
