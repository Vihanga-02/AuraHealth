import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doctorApi, appointmentApi } from '../../api';

const STATUS_COLORS = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  CONFIRMED:  'bg-blue-100 text-blue-800',
  COMPLETED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-800',
};

const StatCard = ({ icon, label, value, tone = 'blue' }) => {
  const tones = {
    blue:   'bg-blue-100 text-blue-600',
    green:  'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber:  'bg-amber-100 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${tones[tone]}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      </div>
    </div>
  );
};

const DoctorOverview = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [profile,  setProfile]  = useState(null);
  const [appts,    setAppts]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      doctorApi.myProfile(),
      appointmentApi.doctorMy(),
    ]).then(([pRes, aRes]) => {
      if (!mounted) return;
      if (pRes.status === 'fulfilled') setProfile(pRes.value.data.doctor);
      if (aRes.status === 'fulfilled') setAppts(Array.isArray(aRes.value.data) ? aRes.value.data : []);
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const today    = new Date().toISOString().slice(0, 10);
  const todayAppts  = appts.filter((a) => a.appointmentDate?.slice(0, 10) === today);
  const pending     = appts.filter((a) => a.status === 'PENDING');
  const confirmed   = appts.filter((a) => a.status === 'CONFIRMED');
  const uniquePatients = new Set(appts.map((a) => a.patientUserId)).size;

  const upcoming = appts
    .filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status))
    .sort((a, b) => new Date(`${a.appointmentDate}T${a.appointmentTime}`) - new Date(`${b.appointmentDate}T${b.appointmentTime}`))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Welcome banner */}
      <div className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white px-7 py-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Doctor Dashboard</p>
          <h1 className="text-2xl font-bold">Welcome, Dr. {user?.full_name || 'Doctor'}</h1>
          <p className="text-blue-100 text-sm mt-1">
            {todayAppts.length > 0
              ? `You have ${todayAppts.length} appointment${todayAppts.length !== 1 ? 's' : ''} today.`
              : 'No appointments scheduled for today.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/doctor/appointments" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
            View Appointments
          </Link>
          <Link to="/doctor/availability" className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
            Set Availability
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {!user?.is_active && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3 items-start">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Account Pending Verification</p>
            <p className="text-amber-700 text-sm mt-0.5">
              An admin needs to verify your account. You won't appear in the public doctor directory until approved.
            </p>
          </div>
        </div>
      )}
      {user?.is_active && !profile && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-blue-700 text-sm font-medium">
            Your professional profile is incomplete. Patients need it to find and book with you.
          </p>
          <Link to="/doctor/profile" className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Complete Profile
          </Link>
        </div>
      )}
      {pending.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-yellow-800 text-sm font-medium">
            You have <strong>{pending.length}</strong> pending appointment request{pending.length !== 1 ? 's' : ''} waiting for your response.
          </p>
          <Link to="/doctor/appointments" className="shrink-0 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600">
            Review Now
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon="📅" label="Today's Appointments" value={todayAppts.length}  tone="blue"   />
        <StatCard icon="⏳" label="Pending Requests"     value={pending.length}     tone="amber"  />
        <StatCard icon="✅" label="Confirmed"            value={confirmed.length}   tone="green"  />
        <StatCard icon="👥" label="Total Patients"       value={uniquePatients}     tone="purple" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Upcoming appointments list */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Upcoming Appointments</h2>
            <Link to="/doctor/appointments" className="text-xs text-blue-600 hover:underline font-medium">View all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No upcoming appointments.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map((a) => (
                <div key={a._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">
                      {a.visitType === 'Telemedicine' ? '📹' : '🏥'} {a.patientName || `Patient #${a.patientUserId}`}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {a.appointmentDate
                        ? new Date(a.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        : '—'}{' '} at {a.appointmentTime?.slice(0, 5)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600'}`}>
                      {a.status}
                    </span>
                    {['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'].includes(a.status) && a.visitType === 'Telemedicine' && (
                      <button
                        type="button"
                        onClick={() => navigate(`/doctor/telemedicine/join/${a._id}`)}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        📹 Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel: profile card + quick actions */}
        <div className="space-y-4">
          {/* Profile summary */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-3">My Profile</h3>
            {profile ? (
              <div className="space-y-2 text-sm">
                {[
                  ['Specialty',    profile.specialty],
                  ['Hospital',     profile.hospital_affiliation],
                  ['Experience',   profile.experience_years ? `${profile.experience_years} years` : null],
                  ['Fee',          profile.consultation_fee ? `LKR ${profile.consultation_fee}` : null],
                  ['Rating',       profile.rating ? `${Number(profile.rating).toFixed(1)} / 5` : null],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-slate-800 truncate max-w-[150px]">{val}</span>
                  </div>
                ))}
                <Link to="/doctor/profile" className="block text-center text-sm text-blue-600 hover:underline mt-2 font-medium">
                  Edit profile
                </Link>
              </div>
            ) : (
              <div className="text-sm text-center text-slate-400 py-4">
                No profile yet.
                <Link to="/doctor/profile" className="block mt-2 text-blue-600 hover:underline">Set up now →</Link>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-3">Quick Actions</h3>
            <div className="space-y-1">
              {[
                ['/doctor/appointments',      '🩺', 'Review Appointments'],
                ['/doctor/patients',          '👥', 'My Patients'],
                ['/doctor/availability',      '📅', 'Set Availability'],
                ['/doctor/telemedicine/manage', '📹', 'Telemedicine Sessions'],
              ].map(([to, icon, label]) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors">
                  <span>{icon}</span>
                  <span className="font-medium">{label}</span>
                  <span className="ml-auto text-slate-300">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;
