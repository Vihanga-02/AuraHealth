import { useEffect, useState } from 'react';
import { appointmentApi } from '../../api';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState('');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    appointmentApi
      .doctorMy()
      .then(({ data }) => {
        if (!mounted) return;
        // Deduplicate by patientUserId, keep most recent appointment per patient
        const map = new Map();
        const appts = Array.isArray(data) ? data : [];
        // Sort descending so newest appointment is first
        appts
          .slice()
          .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
          .forEach((appt) => {
            if (!map.has(appt.patientUserId)) {
              map.set(appt.patientUserId, {
                patientUserId: appt.patientUserId,
                patientName: appt.patientName,
                lastDate: appt.appointmentDate,
                lastStatus: appt.status,
                lastVisitType: appt.visitType,
                totalVisits: 0,
                videoLink: appt.videoLink,
              });
            }
            map.get(appt.patientUserId).totalVisits += 1;
          });
        setPatients([...map.values()]);
      })
      .catch((e) => {
        if (mounted) setErr(e?.response?.data?.message || 'Failed to load patients');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const STATUS_COLORS = {
    COMPLETED:  'bg-green-100 text-green-800',
    CONFIRMED:  'bg-blue-100 text-blue-800',
    PENDING:    'bg-yellow-100 text-yellow-800',
    CANCELLED:  'bg-red-100 text-red-800',
  };

  const filtered = patients.filter((p) =>
    !search || p.patientName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Patients</h1>
          <p className="text-slate-500 text-sm">All patients who have booked appointments with you.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search by name…"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm w-52"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {err && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{err}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading patients…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium">No patients yet.</p>
          <p className="text-sm mt-1">Patients appear here after they book appointments with you.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.patientUserId}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold select-none">
                  {(p.patientName || 'P')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {p.patientName || `Patient #${p.patientUserId}`}
                  </div>
                  <div className="text-xs text-slate-400">ID #{p.patientUserId}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-md bg-slate-50 px-3 py-2 text-center">
                  <div className="text-xs text-slate-500 mb-0.5">Total Visits</div>
                  <div className="text-lg font-bold text-slate-800">{p.totalVisits}</div>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-center">
                  <div className="text-xs text-slate-500 mb-0.5">Last Visit</div>
                  <div className="text-sm font-medium text-slate-700">
                    {p.lastDate
                      ? new Date(p.lastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Last appointment details */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 capitalize">{p.lastVisitType || '—'}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.lastStatus] || 'bg-slate-100 text-slate-600'}`}>
                  {p.lastStatus}
                </span>
              </div>

              {/* Video link if last was telemedicine */}
              {p.videoLink && p.lastStatus === 'CONFIRMED' && (
                <a
                  href={p.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block w-full text-center rounded-md bg-purple-50 border border-purple-200 px-3 py-1.5 text-xs text-purple-700 font-medium hover:bg-purple-100"
                >
                  Join active video call
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary bar */}
      {!loading && patients.length > 0 && (
        <div className="text-sm text-slate-400 text-right">
          Showing {filtered.length} of {patients.length} patient{patients.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
