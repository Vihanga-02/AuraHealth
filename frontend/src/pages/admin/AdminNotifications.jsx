import { useEffect, useState } from 'react';
import { notificationApi } from '../../api';

const StatCard = ({ icon, label, value, tone }) => {
  const tones = {
    blue:   'bg-blue-100 text-blue-600',
    green:  'bg-green-100 text-green-600',
    amber:  'bg-amber-100 text-amber-600',
    red:    'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${tones[tone] || tones.blue}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      </div>
    </div>
  );
};

export default function AdminNotifications() {
  const [items,   setItems]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    notificationApi
      .list()
      .then(({ data }) => {
        const payload = data?.data || data;
        setItems(payload?.notifications || []);
        // Normalize stats keys to lowercase so SENT/PENDING/FAILED all match
        const raw = payload?.stats || null;
        if (raw) {
          const normalized = Object.fromEntries(
            Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v])
          );
          setStats(normalized);
        }
      })
      .catch((e) => setErr(e?.response?.data?.message || 'Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(
    (n) =>
      !search ||
      n.recipient_number?.includes(search) ||
      n.message_body?.toLowerCase().includes(search.toLowerCase()),
  );

  const STAT_MAP = [
    { key: 'total', label: 'Total Sent', icon: '📩', tone: 'blue' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor all SMS / email notifications sent from the platform.</p>
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-3.5 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {err}
        </div>
      )}

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_MAP.map(({ key, label, icon, tone }) =>
            stats[key] !== undefined ? (
              <StatCard key={key} icon={icon} label={label} value={stats[key]} tone={tone} />
            ) : null,
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Notification Log</h2>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search recipient, message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Recipient</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                      <div className="text-3xl mb-2">📭</div>
                      <p>No notifications found.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">#{n.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{n.recipient_number || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ✅ Sent
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">{n.message_body || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {items.length} notifications
          </div>
        )}
      </div>
    </div>
  );
}
