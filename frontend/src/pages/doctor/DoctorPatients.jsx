import { useEffect, useState } from 'react';
import { appointmentApi } from '../../api';
import { patientApi } from '../../api/patientApi';

const STATUS_COLORS = {
  COMPLETED:  'bg-green-100 text-green-800',
  CONFIRMED:  'bg-blue-100 text-blue-800',
  PENDING:    'bg-yellow-100 text-yellow-800',
  CANCELLED:  'bg-red-100 text-red-800',
};

/* ── Small sub-component: medical records panel ────────────────────── */
function PatientRecords({ patientUserId }) {
  const [tab,           setTab]      = useState('reports');
  const [reports,       setReports]  = useState([]);
  const [prescriptions, setRx]       = useState([]);
  const [loading,       setLoading]  = useState(true);
  const [err,           setErr]      = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr('');

    // 1. Resolve patient profile ID from their auth user ID
    patientApi.getByUserId(patientUserId)
      .then(async ({ data: profile }) => {
        if (!mounted) return;
        const id = profile._id || profile.id;
        const [rptRes, rxRes] = await Promise.allSettled([
          patientApi.reports(id),
          patientApi.prescriptions(id),
        ]);
        if (!mounted) return;
        if (rptRes.status === 'fulfilled') setReports(rptRes.value.data || []);
        if (rxRes.status  === 'fulfilled') setRx(rxRes.value.data     || []);
      })
      .catch(() => {
        if (mounted) setErr('Could not load records — patient may not have a profile yet.');
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [patientUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (err) {
    return <p className="text-xs text-slate-400 text-center py-4 italic">{err}</p>;
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-3">
        {[
          { id: 'reports',       label: `📄 Reports (${reports.length})` },
          { id: 'doctor-rx',     label: `💊 Prescriptions (${prescriptions.length})` },
          { id: 'patient-rx',    label: `📁 Uploaded Docs (${reports.filter(r => r.reportType === 'Prescription').length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Medical Reports (non-prescription) */}
      {tab === 'reports' && (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {reports.filter(r => r.reportType !== 'Prescription').length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No medical reports uploaded.</p>
          ) : (
            reports.filter(r => r.reportType !== 'Prescription').map((r) => (
              <div key={r._id || r.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">
                    {(r.fileName || '').toLowerCase().endsWith('.pdf') ? '📕' : '🖼️'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{r.reportTitle || 'Untitled'}</p>
                    <p className="text-xs text-slate-400">{r.reportType}</p>
                  </div>
                </div>
                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
                  >
                    View
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Doctor-issued Prescriptions */}
      {tab === 'doctor-rx' && (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {prescriptions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No doctor-issued prescriptions yet.</p>
          ) : (
            prescriptions.map((p) => (
              <div key={p._id} className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-800">Dr. {p.doctorName}</span>
                  {p.issuedDate && (
                    <span className="text-xs text-slate-400">
                      {new Date(p.issuedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
                {p.diagnosis && (
                  <p className="text-xs text-slate-700"><span className="font-medium">Dx:</span> {p.diagnosis}</p>
                )}
                {Array.isArray(p.medications) && p.medications.length > 0 && (
                  <ul className="text-xs text-slate-600 space-y-0.5 pl-1">
                    {p.medications.map((m, i) => (
                      <li key={i} className="flex gap-1"><span className="text-indigo-400">•</span>{m}</li>
                    ))}
                  </ul>
                )}
                {p.notes && <p className="text-xs text-slate-500 italic">{p.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Patient-uploaded Prescription documents */}
      {tab === 'patient-rx' && (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {reports.filter(r => r.reportType === 'Prescription').length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Patient has not uploaded any prescription documents.</p>
          ) : (
            reports.filter(r => r.reportType === 'Prescription').map((r) => (
              <div key={r._id || r.id} className="flex items-center justify-between gap-2 rounded-lg bg-purple-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">
                    {(r.fileName || '').toLowerCase().endsWith('.pdf') ? '📕' : '🖼️'}
                  </span>
                  <p className="text-xs font-semibold text-slate-700 truncate">{r.reportTitle || 'Prescription doc'}</p>
                </div>
                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-medium text-purple-600 hover:underline"
                  >
                    View
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */
export default function DoctorPatients() {
  const [patients,    setPatients]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [err,         setErr]         = useState('');
  const [search,      setSearch]      = useState('');
  const [expandedId,  setExpandedId]  = useState(null);  // patientUserId with open records panel

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    appointmentApi
      .doctorMy()
      .then(({ data }) => {
        if (!mounted) return;
        const map = new Map();
        const appts = Array.isArray(data) ? data : [];
        appts
          .slice()
          .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
          .forEach((appt) => {
            if (!map.has(appt.patientUserId)) {
              map.set(appt.patientUserId, {
                patientUserId: appt.patientUserId,
                patientName:   appt.patientName,
                lastDate:      appt.appointmentDate,
                lastStatus:    appt.status,
                lastVisitType: appt.visitType,
                totalVisits:   0,
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

  const filtered = patients.filter((p) =>
    !search || p.patientName?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRecords = (userId) =>
    setExpandedId((prev) => (prev === userId ? null : userId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Patients</h1>
          <p className="text-slate-500 text-sm">All patients who have booked appointments with you. Click "View Records" to see their reports and prescriptions.</p>
        </div>
        <input
          type="search"
          placeholder="Search by name…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-14 text-center text-slate-400 shadow-sm">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium text-slate-600">No patients yet.</p>
          <p className="text-sm mt-1">Patients appear here after they book appointments with you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <div
              key={p.patientUserId}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Patient summary row */}
              <div className="flex flex-wrap items-center gap-4 p-5">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shrink-0 select-none">
                    {(p.patientName || 'P')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {p.patientName || `Patient #${p.patientUserId}`}
                    </div>
                    <div className="text-xs text-slate-400">User ID #{p.patientUserId}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-600 shrink-0">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-0.5">Visits</div>
                    <div className="font-bold text-slate-800 text-lg leading-none">{p.totalVisits}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-0.5">Last visit</div>
                    <div className="font-medium text-slate-700 text-sm">
                      {p.lastDate
                        ? new Date(p.lastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[p.lastStatus] || 'bg-slate-100 text-slate-600'}`}>
                    {p.lastStatus}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{p.lastVisitType || '—'}</span>
                </div>

                {/* View Records toggle */}
                <button
                  type="button"
                  onClick={() => toggleRecords(p.patientUserId)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    expandedId === p.patientUserId
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {expandedId === p.patientUserId ? '✕ Close Records' : '📂 View Records'}
                </button>
              </div>

              {/* Expandable records panel */}
              {expandedId === p.patientUserId && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                  <PatientRecords patientUserId={p.patientUserId} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && patients.length > 0 && (
        <div className="text-xs text-slate-400 text-right">
          Showing {filtered.length} of {patients.length} patient{patients.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
