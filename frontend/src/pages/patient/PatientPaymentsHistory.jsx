import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentApi } from '../../api';

const STATUS_CFG = {
  succeeded: { cls: 'bg-green-100 text-green-800',  label: 'Paid',     icon: '✅' },
  completed: { cls: 'bg-green-100 text-green-800',  label: 'Paid',     icon: '✅' },
  pending:   { cls: 'bg-amber-100 text-amber-800',  label: 'Pending',  icon: '⏳' },
  failed:    { cls: 'bg-red-100 text-red-700',      label: 'Failed',   icon: '❌' },
  refunded:  { cls: 'bg-blue-100 text-blue-800',    label: 'Refunded', icon: '↩️' },
};

function StatusBadge({ status }) {
  const s = STATUS_CFG[status?.toLowerCase()] || { cls: 'bg-slate-100 text-slate-600', label: status || '—', icon: '•' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

export default function PatientPaymentsHistory() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    paymentApi.transactions({ limit: 50, offset: 0 })
      .then(({ data }) => setItems(data.transactions || []))
      .catch((e) => setErr(e?.response?.data?.error || e?.response?.data?.message || 'Failed to load payment history.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = items
    .filter((t) => ['succeeded', 'completed'].includes(t.status?.toLowerCase()))
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payment History</h1>
        <p className="text-sm text-slate-500 mt-1">All your consultation payment transactions.</p>
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-3.5 text-sm text-red-700 flex gap-2">
          <span>⚠️</span>{err}
        </div>
      )}

      {/* Summary cards */}
      {!loading && items.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">🧾</div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Transactions</p>
              <p className="text-2xl font-bold text-slate-800">{items.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-xl">✅</div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Successful</p>
              <p className="text-2xl font-bold text-slate-800">{items.filter((t) => ['succeeded', 'completed'].includes(t.status?.toLowerCase())).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Paid</p>
              <p className="text-2xl font-bold text-slate-800">LKR {totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">Transactions</div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">🧾</div>
            <p className="font-semibold text-slate-700">No transactions yet</p>
            <p className="text-sm text-slate-400 mt-1">Book and pay for an appointment to see your history here.</p>
            <Link to="/patient/appointments/book" className="inline-block mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
              Book Appointment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((t) => (
              <div key={t.id || t.transactionId} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${['succeeded','completed'].includes(t.status?.toLowerCase()) ? 'bg-green-100' : 'bg-slate-100'}`}>
                    {['succeeded','completed'].includes(t.status?.toLowerCase()) ? '✅' : '🧾'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">
                      Appointment #{t.appointmentId}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">
                      Txn #{t.id} · {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-slate-800">
                      {(t.currency || 'LKR').toUpperCase()} {Number(t.amount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {t.createdAt ? new Date(t.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
