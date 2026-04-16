import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { telemedicineApi } from '../../api';

const SESSION_COLORS = {
  scheduled:    'bg-blue-100 text-blue-800',
  active:       'bg-green-100 text-green-800',
  completed:    'bg-slate-100 text-slate-600',
  cancelled:    'bg-red-100 text-red-800',
};

const emptyForm = { title: '', date: '', start_time: '', end_time: '' };

export default function DoctorTelemedicineManage() {
  const navigate = useNavigate();

  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [err, setErr]               = useState('');
  const [msg, setMsg]               = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [creating, setCreating]     = useState(false);
  const [actionId, setActionId]     = useState(null);

  const flash = (m, isErr = false) => {
    if (isErr) { setErr(m); setMsg(''); }
    else        { setMsg(m); setErr(''); }
    setTimeout(() => { setErr(''); setMsg(''); }, 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await telemedicineApi.listSchedules();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      flash(e?.response?.data?.error || 'Failed to load schedules', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.start_time || !form.end_time) {
      flash('All fields are required.', true);
      return;
    }
    setCreating(true);
    try {
      await telemedicineApi.createSchedule(form);
      setForm(emptyForm);
      setShowForm(false);
      flash('Schedule created successfully.');
      load();
    } catch (e2) {
      flash(e2?.response?.data?.error || 'Failed to create schedule', true);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (id) => {
    const patientLink = `${window.location.origin}/patient/telemedicine/join/${id}`;
    navigator.clipboard.writeText(patientLink)
      .then(() => flash('Patient join link copied to clipboard!'))
      .catch(() => flash('Could not copy to clipboard.', true));
  };

  const handleJoin = (id) => {
    navigate(`/doctor/telemedicine/join/${id}`);
  };

  const handleComplete = async (id) => {
    setActionId(id);
    try {
      await telemedicineApi.complete(id);
      setItems((prev) => prev.map((s) => (s.id === id ? { ...s, session_status: 'completed' } : s)));
      flash('Session marked as completed.');
    } catch (e) {
      flash(e?.response?.data?.error || 'Failed to complete session', true);
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this telemedicine session?')) return;
    setActionId(id);
    try {
      await telemedicineApi.cancel(id);
      setItems((prev) => prev.map((s) => (s.id === id ? { ...s, session_status: 'cancelled' } : s)));
      flash('Session cancelled.');
    } catch (e) {
      flash(e?.response?.data?.error || 'Failed to cancel session', true);
    } finally {
      setActionId(null);
    }
  };

  const inputClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Telemedicine Sessions</h1>
          <p className="text-slate-500 text-sm">Create and manage your video consultation sessions.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
        >
          {showForm ? 'Cancel' : '+ New Session'}
        </button>
      </div>

      {/* Feedback */}
      {err && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{err}</div>}
      {msg && <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{msg}</div>}

      {/* Create form */}
      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Create New Session</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Session Title</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Cardiology Consultation"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                <input
                  type="time"
                  className={inputClass}
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                <input
                  type="time"
                  className={inputClass}
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions list */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading sessions…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-3">📹</div>
            <p className="font-medium">No telemedicine sessions yet.</p>
            <p className="text-sm mt-1">Click "New Session" to schedule your first video consultation.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((s) => {
              const isActive = actionId === s.id;
              const isDone   = s.session_status === 'completed' || s.session_status === 'cancelled';
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-900 truncate">{s.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SESSION_COLORS[s.session_status] || 'bg-slate-100 text-slate-600'}`}>
                        {s.session_status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {s.date} &nbsp;•&nbsp;
                      {String(s.start_time || '').slice(0, 5)}–{String(s.end_time || '').slice(0, 5)}
                    </div>
                  </div>

                  {!isDone && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => handleJoin(s.id)}
                        disabled={isActive}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        Join
                      </button>
                      <button
                        onClick={() => handleCopyLink(s.id)}
                        disabled={isActive}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
                      >
                        Copy Patient Link
                      </button>
                      {s.session_status === 'active' || s.session_status === 'scheduled' ? (
                        <button
                          onClick={() => handleComplete(s.id)}
                          disabled={isActive}
                          className="rounded-md bg-green-100 px-3 py-1.5 text-xs text-green-700 font-medium hover:bg-green-200 disabled:opacity-50"
                        >
                          Complete
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleCancel(s.id)}
                        disabled={isActive}
                        className="rounded-md bg-red-100 px-3 py-1.5 text-xs text-red-700 font-medium hover:bg-red-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
