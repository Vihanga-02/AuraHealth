import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { doctorApi } from '../../api/doctorApi';

const StatCard = ({ icon, label, value, sub, tone, to }) => {
  const tones = {
    blue:   { wrap: 'bg-white border-slate-200',          icon: 'bg-blue-100 text-blue-600' },
    green:  { wrap: 'bg-white border-slate-200',          icon: 'bg-green-100 text-green-600' },
    indigo: { wrap: 'bg-white border-slate-200',          icon: 'bg-indigo-100 text-indigo-600' },
    amber:  { wrap: 'bg-amber-50 border-amber-200',       icon: 'bg-amber-100 text-amber-600' },
  };
  const t = tones[tone] || tones.blue;
  const inner = (
    <div className={`flex items-center gap-4 rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${t.wrap}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${t.icon}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
};

const QuickAction = ({ icon, title, desc, to, tone = 'blue' }) => {
  const tones = {
    blue:  'group-hover:bg-blue-600 group-hover:text-white bg-blue-50 text-blue-600',
    green: 'group-hover:bg-green-600 group-hover:text-white bg-green-50 text-green-600',
    rose:  'group-hover:bg-rose-600 group-hover:text-white bg-rose-50 text-rose-600',
    indigo:'group-hover:bg-indigo-600 group-hover:text-white bg-indigo-50 text-indigo-600',
    amber: 'group-hover:bg-amber-500 group-hover:text-white bg-amber-50 text-amber-600',
  };
  return (
    <Link
      to={to}
      className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors ${tones[tone]}`}>
        {icon}
      </div>
      <div>
        <div className="font-bold text-slate-800 text-base">{title}</div>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
      <div className="mt-auto text-slate-300 group-hover:text-blue-600 transition-colors text-lg">›</div>
    </Link>
  );
};

const AdminOverview = () => {
  const { user }    = useAuth();
  const [stats,      setStats]      = useState(null);
  const [docStats,   setDocStats]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.allSettled([
      authApi.adminStats(),
      doctorApi.adminStats(),
    ]).then(([authRes, docRes]) => {
      if (authRes.status === 'fulfilled') setStats(authRes.value.data.stats);
      if (docRes.status  === 'fulfilled') setDocStats(docRes.value.data.stats);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-xl bg-linear-to-r from-slate-800 to-slate-900 text-white px-7 py-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Admin Portal</p>
          <h1 className="text-2xl font-bold">Welcome back, {user?.full_name || 'Admin'}</h1>
          <p className="text-slate-400 text-sm mt-1">Here's your platform overview for today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/doctors"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition"
          >
            Verify Doctors
          </Link>
          <Link
            to="/admin/users"
            className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 transition"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon="👥" label="Total Users"         value={stats?.total    ?? 0} sub="All registered accounts"      tone="blue"   to="/admin/users"    />
          <StatCard icon="🩺" label="Patients"            value={stats?.patients ?? 0} sub="Registered patients"          tone="indigo" to="/admin/users"    />
          <StatCard icon="🔓" label="Active Doctors"      value={docStats?.total    ?? stats?.doctors ?? 0} sub="Step 1 — account active"    tone="green"  to="/admin/doctors" />
          <StatCard icon="✅" label="Verified Doctors"    value={docStats?.verified  ?? 0}                 sub="Step 2 — credentials approved" tone="amber"  to="/admin/doctors" />
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon="✅"
            title="Verify Doctors"
            desc="Review and approve pending doctor registrations."
            to="/admin/doctors"
            tone="green"
          />
          <QuickAction
            icon="👥"
            title="Manage Users"
            desc="View and manage all patient and doctor accounts."
            to="/admin/users"
            tone="blue"
          />
          <QuickAction
            icon="💳"
            title="Payments"
            desc="Monitor all transactions and payment statuses."
            to="/admin/payments"
            tone="indigo"
          />
          <QuickAction
            icon="📩"
            title="Notifications"
            desc="Review notification logs and delivery statuses."
            to="/admin/notifications"
            tone="amber"
          />
        </div>
      </div>

      {/* Platform health */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Platform Health</h2>
        </div>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {[
            { label: 'Verified Doctors',  value: stats ? (stats.doctors - (stats.pendingDoctors || 0)) : '—', icon: '✅', color: 'text-green-600' },
            { label: 'Pending Approval',  value: stats?.pendingDoctors ?? '—',  icon: '⏳', color: 'text-amber-600' },
            { label: 'Total Accounts',    value: stats?.total ?? '—',           icon: '🌐', color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="px-6 py-5 flex items-center gap-4">
              <div className={`text-3xl ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
