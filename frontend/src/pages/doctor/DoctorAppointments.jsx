import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentApi } from '../../api';
import { patientApi } from '../../api/patientApi';

const STATUS_COLORS = {
  PENDING:         'bg-yellow-100 text-yellow-800',
  CONFIRMED:       'bg-blue-100 text-blue-800',
  CHECKED_IN:      'bg-indigo-100 text-indigo-800',
  IN_CONSULTATION: 'bg-purple-100 text-purple-800',
  COMPLETED:       'bg-green-100 text-green-800',
  CANCELLED:       'bg-red-100 text-red-800',
};

const EMPTY_RX = {
  diagnosis:   '',
  notes:       '',
  issuedDate:  new Date().toISOString().slice(0, 10),
  medications: [{ name: '', dosage: '', frequency: '' }],
};

function MedicationRow({ med, idx, onChange, onRemove, isLast }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
      <input
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Medication name"
        value={med.name}
        onChange={(e) => onChange(idx, 'name', e.target.value)}
      />
      <input
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Dosage (e.g. 500mg)"
        value={med.dosage}
        onChange={(e) => onChange(idx, 'dosage', e.target.value)}
      />
      <input
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Frequency (e.g. 2×/day)"
        value={med.frequency}
        onChange={(e) => onChange(idx, 'frequency', e.target.value)}
      />
      <button
        type="button"
        onClick={() => onRemove(idx)}
        disabled={isLast}
        className="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-30 flex items-center justify-center text-sm font-bold transition"
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments,  setAppointments]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [err,           setErr]           = useState('');
  const [filter,        setFilter]        = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Prescription form state
  const [rxFor,        setRxFor]        = useState(null);   // appointment _id
  const [rxForm,       setRxForm]       = useState(EMPTY_RX);
  const [rxSaving,     setRxSaving]     = useState(false);
  const [rxError,      setRxError]      = useState('');
  const [rxSuccess,    setRxSuccess]    = useState('');
  // Track appointments that already received a prescription this session
  const [prescribedIds, setPrescribedIds] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const { data } = await appointmentApi.doctorMy(filter ? { status: filter } : {});
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    setActionLoading(id + status);
    try {
      await appointmentApi.doctorSetStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a))
      );
    } catch (e) {
      alert(e?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Prescription helpers ────────────────────────────────────────────────
  const openRx = (appt) => {
    setRxFor(appt._id);
    setRxForm(EMPTY_RX);
    setRxError('');
    setRxSuccess('');
  };

  const closeRx = () => { setRxFor(null); setRxError(''); setRxSuccess(''); };

  const updateMed = (idx, field, val) => {
    setRxForm((f) => {
      const meds = f.medications.map((m, i) => i === idx ? { ...m, [field]: val } : m);
      return { ...f, medications: meds };
    });
  };

  const addMed = () =>
    setRxForm((f) => ({ ...f, medications: [...f.medications, { name: '', dosage: '', frequency: '' }] }));

  const removeMed = (idx) =>
    setRxForm((f) => ({ ...f, medications: f.medications.filter((_, i) => i !== idx) }));

  const submitRx = async (appt) => {
    if (!appt.patientUserId) {
      setRxError('Patient user ID not available for this appointment.');
      return;
    }
    const validMeds = rxForm.medications.filter((m) => m.name.trim());
    if (!rxForm.diagnosis.trim() && validMeds.length === 0) {
      setRxError('Please enter a diagnosis or at least one medication.');
      return;
    }
    setRxSaving(true);
    setRxError('');
    try {
      // Format each medication object into a readable string for CSV storage
      const medStrings = validMeds.map((m) =>
        [m.name.trim(), m.dosage.trim(), m.frequency.trim()].filter(Boolean).join(' · ')
      );
      await patientApi.addPrescriptionForUser(appt.patientUserId, {
        doctorName:  user?.full_name || 'Doctor',
        diagnosis:   rxForm.diagnosis  || null,
        medications: medStrings,
        notes:       rxForm.notes      || null,
        issuedDate:  rxForm.issuedDate || null,
      });
      setPrescribedIds((prev) => new Set([...prev, appt._id]));
      setRxSuccess('Prescription saved successfully!');
      setTimeout(closeRx, 1800);
    } catch (e) {
      setRxError(e?.response?.data?.message || 'Failed to save prescription.');
    } finally {
      setRxSaving(false);
    }
  };

  const filtered = filter ? appointments.filter((a) => a.status === filter) : appointments;

  // Which statuses allow adding a prescription
  const canAddRx = (status) => ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED'].includes(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
          <p className="text-slate-500 text-sm">Manage, treat, and issue prescriptions to your patients.</p>
        </div>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-sm">
          <div className="text-4xl mb-3">🩺</div>
          <p className="font-medium">No appointments found.</p>
          {filter && <p className="text-sm mt-1">Try a different filter.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => (
            <div key={appt._id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

              {/* Appointment row */}
              <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                {/* Left */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-lg">{appt.visitType === 'Telemedicine' ? '📹' : '🏥'}</span>
                    <span className="font-semibold text-slate-900">
                      {appt.patientName || `Patient #${appt.patientUserId}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[appt.status] || 'bg-slate-100 text-slate-600'}`}>
                      {appt.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 flex flex-wrap gap-3">
                    <span>
                      {appt.appointmentDate
                        ? new Date(appt.appointmentDate).toLocaleDateString('en-US', {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                          })
                        : '—'}
                    </span>
                    <span>{appt.appointmentTime?.slice(0, 5) || '—'}</span>
                    <span className="capitalize">{appt.visitType}</span>
                  </div>
                  {appt.notes && (
                    <p className="mt-1.5 text-xs text-slate-400 italic line-clamp-2">{appt.notes}</p>
                  )}
                </div>

                {/* Right: action buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {appt.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => setStatus(appt._id, 'CONFIRMED')}
                        disabled={actionLoading === appt._id + 'CONFIRMED'}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => setStatus(appt._id, 'CANCELLED')}
                        disabled={actionLoading === appt._id + 'CANCELLED'}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50 transition"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {appt.status === 'CONFIRMED' && (
                    <>
                      {appt.visitType === 'Telemedicine' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/doctor/telemedicine/join/${appt._id}`)}
                          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition"
                        >
                          📹 Join Call
                        </button>
                      )}
                      <button
                        onClick={() => setStatus(appt._id, 'COMPLETED')}
                        disabled={actionLoading === appt._id + 'COMPLETED'}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => setStatus(appt._id, 'CANCELLED')}
                        disabled={actionLoading === appt._id + 'CANCELLED'}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {appt.status === 'COMPLETED' && (
                    <span className="text-xs text-green-600 font-semibold">✅ Completed</span>
                  )}
                  {appt.status === 'CANCELLED' && (
                    <span className="text-xs text-red-400 font-semibold">✕ Cancelled</span>
                  )}

                  {/* Add Prescription button / Prescribed badge */}
                  {canAddRx(appt.status) && (
                    prescribedIds.has(appt._id) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                        💊 Prescription Given
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => rxFor === appt._id ? closeRx() : openRx(appt)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          rxFor === appt._id
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {rxFor === appt._id ? '✕ Close' : '📋 Add Prescription'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* ── Inline prescription form ────────────────────────── */}
              {rxFor === appt._id && (
                <div className="border-t border-indigo-100 bg-indigo-50 px-5 py-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-indigo-600 text-lg">📋</span>
                    <h3 className="font-bold text-indigo-800 text-base">
                      New Prescription — {appt.patientName || `Patient #${appt.patientUserId}`}
                    </h3>
                  </div>

                  {rxError && (
                    <div className="rounded-lg bg-red-100 border border-red-200 px-4 py-2.5 text-sm text-red-700 flex gap-2">
                      <span>⚠️</span>{rxError}
                    </div>
                  )}
                  {rxSuccess && (
                    <div className="rounded-lg bg-green-100 border border-green-200 px-4 py-2.5 text-sm text-green-700 flex gap-2">
                      <span>✅</span>{rxSuccess}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Diagnosis */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Diagnosis</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Hypertension, Type 2 Diabetes…"
                        value={rxForm.diagnosis}
                        onChange={(e) => setRxForm((f) => ({ ...f, diagnosis: e.target.value }))}
                      />
                    </div>

                    {/* Issue date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Issue Date</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={rxForm.issuedDate}
                        onChange={(e) => setRxForm((f) => ({ ...f, issuedDate: e.target.value }))}
                      />
                    </div>

                    {/* Doctor name (read-only) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Prescribing Doctor</label>
                      <input
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-default"
                        value={user?.full_name || 'Dr. —'}
                      />
                    </div>
                  </div>

                  {/* Medications */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-600">Medications</label>
                      <button
                        type="button"
                        onClick={addMed}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                      >
                        + Add medication
                      </button>
                    </div>
                    <div className="space-y-2">
                      {/* Column headers */}
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-slate-400 font-medium px-1">
                        <span>Name</span><span>Dosage</span><span>Frequency</span><span />
                      </div>
                      {rxForm.medications.map((med, idx) => (
                        <MedicationRow
                          key={idx}
                          med={med}
                          idx={idx}
                          onChange={updateMed}
                          onRemove={removeMed}
                          isLast={rxForm.medications.length === 1}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Notes</label>
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Any special instructions or notes…"
                      value={rxForm.notes}
                      onChange={(e) => setRxForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeRx}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => submitRx(appt)}
                      disabled={rxSaving}
                      className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                    >
                      {rxSaving ? 'Saving…' : '💾 Save Prescription'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
