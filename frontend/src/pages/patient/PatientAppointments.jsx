import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentApi } from '../../api';

const STATUS_CONFIG = {
  PENDING:          { label: 'Pending Payment',    cls: 'bg-amber-100 text-amber-800',  icon: '⏳' },
  CONFIRMED:        { label: 'Confirmed',           cls: 'bg-green-100 text-green-800',  icon: '✅' },
  CHECKED_IN:       { label: 'Checked In',          cls: 'bg-blue-100 text-blue-800',    icon: '🏥' },
  IN_CONSULTATION:  { label: 'In Consultation',     cls: 'bg-purple-100 text-purple-800',icon: '📹' },
  COMPLETED:        { label: 'Completed',           cls: 'bg-slate-100 text-slate-600',  icon: '🎉' },
  CANCELLED:        { label: 'Cancelled',           cls: 'bg-red-100 text-red-700',      icon: '✕'  },
};

const FILTER_OPTIONS = [
  { value: '',          label: 'All' },
  { value: 'PENDING',   label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-slate-100 text-slate-600', icon: '•' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function PatientAppointments() {
  const navigate = useNavigate();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');
  const [toast,   setToast]   = useState({ type: '', msg: '' });
  const [filter,  setFilter]  = useState('');
  const [cancelling, setCancelling] = useState(null);

  const flash = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast({ type: '', msg: '' }), 4000); };

  const load = async () => {
    try {
      const { data } = await appointmentApi.my();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancelling(id);
    try {
      await appointmentApi.cancel(id);
      flash('success', 'Appointment cancelled.');
      await load();
    } catch (e) {
      flash('error', e?.response?.data?.message || 'Cancel failed.');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = filter ? items.filter((a) => a.status === filter) : items;

  const upcoming  = filtered.filter((a) => ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'].includes(a.status));
  const past      = filtered.filter((a) => ['COMPLETED', 'CANCELLED'].includes(a.status));

  const renderCard = (a) => {
    const isPaid  = ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED'].includes(a.status);
    const canJoin = ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'].includes(a.status) && a.visitType === 'Telemedicine';
    const canCancel   = ['PENDING', 'CONFIRMED'].includes(a.status);
    const canPay      = a.status === 'PENDING';
    const isCancelled = a.status === 'CANCELLED';

    return (
      <div key={a._id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${isCancelled ? 'opacity-60' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${a.visitType === 'Telemedicine' ? 'bg-purple-100' : 'bg-blue-100'}`}>
              {a.visitType === 'Telemedicine' ? '📹' : '🏥'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-sm">
                {a.visitType || 'Appointment'} · #{a._id}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {a.appointmentDate
                  ? new Date(a.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                  : '—'}{' '}
                at {a.appointmentTime?.slice(0, 5) || '—'}
              </div>
            </div>
          </div>
          <StatusBadge status={a.status} />
        </div>

        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Payment indicator */}
          <div className="flex items-center gap-2 text-xs">
            {isPaid ? (
              <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Payment confirmed
              </span>
            ) : a.status !== 'CANCELLED' ? (
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Awaiting payment
              </span>
            ) : null}
            {a.notes && <span className="text-slate-400">· {a.notes}</span>}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pay button — only when PENDING */}
            {canPay && (
              <Link
                to={`/patient/payments/checkout/${a._id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
              >
                💳 Pay Now
              </Link>
            )}

            {/* Join — navigates to in-app Agora room (uses appointment ID as scheduleId fallback) */}
            {canJoin && (
              <button
                type="button"
                onClick={() => navigate(`/patient/telemedicine/join/${a._id}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 shadow-sm transition"
              >
                📹 Join Call
              </button>
            )}

            {/* Telemedicine but not yet paid — locked join (only for PENDING, not completed) */}
            {!isPaid && a.visitType === 'Telemedicine' && !isCancelled && a.status !== 'COMPLETED' && (
              <span
                title="Complete payment first to unlock the video call"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
              >
                🔒 Join (pay first)
              </span>
            )}

            {/* Cancel */}
            {canCancel && (
              <button
                type="button"
                onClick={() => cancel(a._id)}
                disabled={cancelling === a._id}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
              >
                {cancelling === a._id ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your bookings and join telemedicine sessions.</p>
        </div>
        <Link
          to="/patient/appointments/book"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
        >
          + Book Appointment
        </Link>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div className={`flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium border ${toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>{toast.msg}
        </div>
      )}

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-3.5 text-sm text-red-700 flex gap-2">
          <span>⚠️</span>{err}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500 font-medium">Filter:</span>
        {FILTER_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setFilter(o.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === o.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {o.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{filtered.length} appointment{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-semibold text-slate-700">No appointments found</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter ? 'Try a different filter.' : 'Book your first appointment to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</h2>
              <div className="space-y-3">{upcoming.map(renderCard)}</div>
            </div>
          )}
          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Past ({past.length})</h2>
              <div className="space-y-3">{past.map(renderCard)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
