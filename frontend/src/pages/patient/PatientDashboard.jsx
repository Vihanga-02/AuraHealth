import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { patientApi, appointmentApi } from '../../api';

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
    amber:  'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    rose:   'bg-rose-100 text-rose-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 ${tones[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      </div>
    </div>
  );
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile]           = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports]           = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const [meRes, apptRes] = await Promise.allSettled([
          patientApi.me(),
          appointmentApi.my(),
        ]);

        if (!mounted) return;

        let patientId = null;
        if (meRes.status === 'fulfilled') {
          const p = meRes.value.data;
          setProfile(p);
          patientId = p._id || p.id;
        }

        if (apptRes.status === 'fulfilled') {
          setAppointments(apptRes.value.data || []);
        }

        if (patientId) {
          const [rptRes, rxRes] = await Promise.allSettled([
            patientApi.reports(patientId),
            patientApi.prescriptions(patientId),
          ]);
          if (mounted && rptRes.status === 'fulfilled') setReports(rptRes.value.data || []);
          if (mounted && rxRes.status === 'fulfilled') setPrescriptions(rxRes.value.data || []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  const upcoming = appointments.filter((a) => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  const nextAppt  = upcoming[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-linear-to-r from-blue-600 to-blue-700 text-white p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Patient Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold">
              Welcome back, {user?.full_name || 'Patient'}
            </h1>
            <p className="mt-1 text-blue-100 text-sm">
              {profile
                ? 'Your health records are up to date.'
                : 'Complete your profile to unlock all features.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/patient/appointments/book"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
            >
              📅 Book Appointment
            </Link>
            <Link
              to="/patient/reports"
              className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              📄 Upload Report
            </Link>
          </div>
        </div>
      </div>

      {/* Profile missing alert */}
      {!profile && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between gap-4">
          <p className="text-amber-800 text-sm font-medium">
            You haven't created your patient profile yet. Reports and prescriptions require a profile.
          </p>
          <Link
            to="/patient/profile"
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Create Profile
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon="📅" label="Upcoming"      value={upcoming.length} tone="blue" />
        <StatCard icon="✅" label="Completed"      value={completed}       tone="green" />
        <StatCard icon="📄" label="Reports"        value={reports.filter(r => r.reportType !== 'Prescription').length} tone="amber" />
        <StatCard
          icon="💊"
          label="Prescriptions"
          tone="purple"
          value={
            prescriptions.length +
            reports.filter((r) => r.reportType === 'Prescription').length
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Left: upcoming appointments */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Upcoming Appointments</h2>
            <Link to="/patient/appointments" className="text-xs text-blue-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No upcoming appointments.</p>
              <Link
                to="/patient/appointments/book"
                className="mt-3 inline-block text-sm text-blue-600 hover:underline font-medium"
              >
                Book your first appointment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.slice(0, 5).map((a) => (
                <div key={a._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">
                      {a.visitType === 'Telemedicine' ? '📹' : '🏥'}&nbsp;
                      {a.visitType} Consultation
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      {a.appointmentDate
                        ? new Date(a.appointmentDate).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })
                        : '—'}{' '}
                      at {a.appointmentTime?.slice(0, 5)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600'}`}>
                      {a.status}
                    </span>
                    {a.videoLink && a.status === 'CONFIRMED' && (
                      <a
                        href={a.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-purple-600 hover:underline"
                      >
                        Join Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: profile summary + quick actions */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-3">Health Profile</h3>
            {profile ? (
              <div className="space-y-2 text-sm">
                {[
                  ['Blood Group', profile.bloodGroup],
                  ['Phone',       profile.phone],
                  ['Gender',      profile.gender],
                  ['Emergency',   profile.emergencyContactName],
                ].map(([label, val]) => (
                  val ? (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-800 truncate max-w-[140px]">{val}</span>
                    </div>
                  ) : null
                ))}
                <Link
                  to="/patient/profile"
                  className="mt-2 block text-center text-sm text-blue-600 hover:underline font-medium"
                >
                  Edit profile
                </Link>
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-4">
                No profile yet.
                <Link to="/patient/profile" className="block mt-2 text-blue-600 hover:underline">
                  Create now →
                </Link>
              </div>
            )}
          </div>

          {/* Next appointment spotlight */}
          {nextAppt && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Next Appointment</p>
              <div className="font-bold text-slate-800">
                {nextAppt.visitType === 'Telemedicine' ? '📹 Video Call' : '🏥 In Person'}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {nextAppt.appointmentDate
                  ? new Date(nextAppt.appointmentDate).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric'
                    })
                  : '—'}{' '}
                at {nextAppt.appointmentTime?.slice(0, 5)}
              </div>
              {nextAppt.videoLink && nextAppt.status === 'CONFIRMED' && (
                <a
                  href={nextAppt.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block w-full text-center rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  Join Video Call
                </a>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                ['/doctors',                       '🔍', 'Find a Doctor'],
                ['/patient/appointments/book',     '📅', 'Book Appointment'],
                ['/patient/reports',               '📄', 'Upload Report'],
                ['/patient/prescriptions',         '💊', 'View Prescriptions'],
                ['/patient/payments/history',      '💳', 'Payment History'],
              ].map(([to, icon, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors"
                >
                  <span className="text-base">{icon}</span>
                  <span className="font-medium">{label}</span>
                  <span className="ml-auto text-slate-300">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent reports strip */}
      {reports.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Recent Reports</h2>
            <Link to="/patient/reports" className="text-xs text-blue-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.slice(0, 3).map((r) => (
              <div key={r._id || r.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {(r.fileName || '').endsWith('.pdf') ? '📕' : '🖼️'}
                  </span>
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{r.reportTitle}</div>
                    <div className="text-xs text-slate-400">{r.reportType}</div>
                  </div>
                </div>
                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
