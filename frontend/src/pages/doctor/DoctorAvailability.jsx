import { useState, useEffect } from 'react';
import { doctorApi } from '../../api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EMPTY_FORM = { day_of_week: 'Monday', start_time: '09:00', end_time: '17:00', max_appointments: 10 };

const DAY_COLORS = {
  Monday:    'bg-blue-100 text-blue-700',
  Tuesday:   'bg-indigo-100 text-indigo-700',
  Wednesday: 'bg-violet-100 text-violet-700',
  Thursday:  'bg-purple-100 text-purple-700',
  Friday:    'bg-pink-100 text-pink-700',
  Saturday:  'bg-orange-100 text-orange-700',
  Sunday:    'bg-red-100 text-red-700',
};

export default function DoctorAvailability() {
  const [slots,    setSlots]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [saving,   setSaving]  = useState(false);
  const [error,    setError]   = useState('');
  const [toast,    setToast]   = useState('');

  // form state — null = hidden, 'add' = new slot, slot_id = editing that slot
  const [mode, setMode]   = useState(null);
  const [form, setForm]   = useState(EMPTY_FORM);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const loadSlots = () => {
    doctorApi.myAvailability()
      .then((res) => setSlots(res.data.slots || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSlots(); }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setError('');
    setMode('add');
  };

  const openEdit = (slot) => {
    setForm({
      day_of_week:      slot.day_of_week,
      start_time:       slot.start_time.slice(0, 5),
      end_time:         slot.end_time.slice(0, 5),
      max_appointments: slot.max_appointments,
    });
    setError('');
    setMode(slot.slot_id);
  };

  const closeForm = () => { setMode(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (mode === 'add') {
        await doctorApi.addSlot(form);
        showToast('Time slot added successfully!');
      } else {
        await doctorApi.updateSlot(mode, form);
        showToast('Time slot updated successfully!');
      }
      closeForm();
      loadSlots();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving slot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (slot) => {
    try {
      await doctorApi.updateSlot(slot.slot_id, { is_available: !slot.is_available });
      loadSlots();
      showToast(`Slot ${slot.is_available ? 'disabled' : 'enabled'}.`);
    } catch {
      showToast('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this availability slot? This action cannot be undone.')) return;
    try {
      await doctorApi.deleteSlot(id);
      loadSlots();
      showToast('Slot deleted.');
    } catch {
      showToast('Failed to delete slot.');
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

  // Group slots by day for the card view
  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = slots.filter((s) => s.day_of_week === d);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Weekly Availability</h1>
          <p className="text-sm text-slate-500 mt-1">Set the days and times you are available for appointments.</p>
        </div>
        <button
          onClick={mode ? closeForm : openAdd}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            mode
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
        >
          {mode ? '✕ Cancel' : '+ Add Time Slot'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-3 text-sm text-green-800 font-medium flex items-center gap-2">
          ✅ {toast}
        </div>
      )}

      {/* Add / Edit form */}
      {mode && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
            <span className="text-lg">{mode === 'add' ? '➕' : '✏️'}</span>
            <h2 className="font-bold text-blue-900 text-sm">
              {mode === 'add' ? 'Add New Time Slot' : 'Edit Time Slot'}
            </h2>
          </div>
          {error && (
            <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Day</label>
              <select className={inputCls} value={form.day_of_week} onChange={set('day_of_week')}>
                {DAYS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Start Time</label>
              <input type="time" className={inputCls} value={form.start_time} onChange={set('start_time')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">End Time</label>
              <input type="time" className={inputCls} value={form.end_time} onChange={set('end_time')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Max Appointments</label>
              <input
                type="number" min={1} max={50}
                className={inputCls}
                value={form.max_appointments}
                onChange={set('max_appointments')}
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-[42px] rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {saving ? 'Saving…' : mode === 'add' ? 'Add Slot' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Slots list */}
      {slots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center">
          <div className="text-5xl mb-3">📅</div>
          <p className="font-semibold text-slate-700">No availability slots yet</p>
          <p className="text-sm text-slate-400 mt-1">Click <strong>+ Add Time Slot</strong> above to set your schedule.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS.filter((d) => byDay[d].length > 0).map((day) => (
            <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Day header */}
              <div className={`px-5 py-3 flex items-center gap-2 border-b border-slate-100`}>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DAY_COLORS[day]}`}>{day}</span>
                <span className="text-xs text-slate-400">{byDay[day].length} slot{byDay[day].length !== 1 ? 's' : ''}</span>
              </div>

              <div className="divide-y divide-slate-100">
                {byDay[day].map((s) => (
                  <div
                    key={s.slot_id}
                    className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors ${
                      mode === s.slot_id ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Time + capacity */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-sm font-bold text-slate-800 whitespace-nowrap">
                        🕐 {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                      </div>
                      <div className="text-xs text-slate-500">
                        👥 {s.max_appointments} appointment{s.max_appointments !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle active/disabled */}
                      <button
                        onClick={() => toggleStatus(s)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          s.is_available
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {s.is_available ? '✓ Active' : '✕ Disabled'}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => mode === s.slot_id ? closeForm() : openEdit(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          mode === s.slot_id
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {mode === s.slot_id ? 'Editing…' : '✏️ Edit'}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(s.slot_id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      {slots.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
          <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-800">{slots.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total Slots</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{slots.filter((s) => s.is_available).length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-400">{slots.filter((s) => !s.is_available).length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Disabled</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
