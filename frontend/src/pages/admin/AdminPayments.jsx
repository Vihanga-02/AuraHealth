import { useEffect, useState } from 'react';
import { paymentApi } from '../../api';

const STATUS_STYLES = {
  completed: 'bg-green-100 text-green-800',
  succeeded: 'bg-green-100 text-green-800',
  pending:   'bg-yellow-100 text-yellow-800',
  failed:    'bg-red-100 text-red-800',
  refunded:  'bg-blue-100 text-blue-800',
};

const StatCard = ({ icon, label, value, sub, tone }) => {
  const tones = {
    blue:   'bg-blue-100 text-blue-600',
    green:  'bg-green-100 text-green-600',
    amber:  'bg-amber-100 text-amber-600',
    red:    'bg-red-100 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${tones[tone] || tones.blue}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

export default function AdminPayments() {
  const [transactions, setTransactions] = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');

  useEffect(() => {
    Promise.allSettled([
      paymentApi.transactions({ limit: 100, offset: 0 }),
      paymentApi.transactionStats(),
    ])
      .then(([t, s]) => {
        if (t.status === 'fulfilled') setTransactions(t.value.data.transactions || []);
        if (s.status === 'fulfilled') setStats(s.value.data);
      })
      .catch(() => setErr('Failed to load payments.'))
      .finally(() => setLoading(false));
  }, []);

  const ov = stats?.overview;

  const fmt = (val, currency = 'LKR') =>
    val != null ? `${currency} ${Number(val).toLocaleString()}` : '—';

  const filtered = transactions.filter((t) => {
    const matchSearch =
      !search ||
      String(t.id).includes(search) ||
      String(t.appointmentId).includes(search) ||
      t.status?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || t.status?.toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="text-sm text-slate-500 mt-1">Track all consultation payment transactions on the platform.</p>
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-3.5 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {err}
        </div>
      )}

      {/* Stat cards */}
      {ov && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="💳" label="Total Transactions" value={ov.total_transactions}          tone="blue"  />
          <StatCard icon="✅" label="Successful"         value={ov.successful}                 tone="green" />
          <StatCard icon="⏳" label="Pending"            value={ov.pending}                    tone="amber" />
          <StatCard icon="💰" label="Total Revenue"      value={fmt(ov.total_revenue)}          tone="green" sub="All completed" />
        </div>
      )}

      {/* Revenue highlight */}
      {ov?.total_revenue && (
        <div className="rounded-2xl bg-linear-to-r from-green-600 to-emerald-600 text-white px-7 py-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-green-200 text-xs font-semibold uppercase tracking-wider">Total Revenue Collected</p>
            <p className="text-4xl font-extrabold mt-1">{fmt(ov.total_revenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-sm">{ov.successful} successful payments</p>
            <p className="text-green-200 text-xs mt-0.5">{ov.pending || 0} pending</p>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Transaction History</h2>
          <div className="flex gap-2 flex-wrap">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search ID, appt…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Txn ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Appointment</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                      <div className="text-3xl mb-2">💳</div>
                      <p>No transactions found.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id || t.transactionId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-500">#{t.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">#{t.appointmentId}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {t.currency?.toUpperCase() || 'LKR'} {Number(t.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[t.status?.toLowerCase()] || 'bg-slate-100 text-slate-700'}`}>
                          {t.status || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {transactions.length} transactions
          </div>
        )}
      </div>
    </div>
  );
}
