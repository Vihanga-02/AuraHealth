import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { appointmentApi, doctorApi } from '../../api';

const DAY_INDEX = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

function getAvailableDaysSet(slots) {
  return new Set(slots.map((s) => DAY_INDEX[s.day_of_week]));
}

function isDateDisabled(dateStr, availableDays) {
  if (!dateStr || availableDays.size === 0) return false;
  const day = new Date(dateStr + 'T00:00:00').getDay();
  return !availableDays.has(day);
}

export default function PatientBookAppointment() {
  const [searchParams] = useSearchParams();
  const preselectDoctorId = searchParams.get('doctorId');

  const [doctors, setDoctors]         = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [slots, setSlots]             = useState([]);   // availability_slots for selected doctor
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState({
    doctorId:        preselectDoctorId ? Number(preselectDoctorId) : '',
    doctorUserId:    '',
    appointmentDate: '',
    appointmentTime: '',
    visitType:       'Telemedicine',
    notes:           '',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load doctor list
  useEffect(() => {
    let mounted = true;
    setLoadingDoctors(true);
    doctorApi
      .list()
      .then(({ data }) => {
        if (!mounted) return;
        setDoctors(data.doctors || []);
      })
      .catch(() => {})
      .finally(() => mounted && setLoadingDoctors(false));
    return () => { mounted = false; };
  }, []);

  const selectedDoctor = useMemo(() => {
    const id = Number(form.doctorId);
    if (!id) return null;
    return doctors.find((d) => Number(d.doctor_id) === id) || null;
  }, [doctors, form.doctorId]);

  // When doctor changes, populate doctorUserId and fetch availability
  const handleDoctorChange = useCallback(
    async (rawId) => {
      const docId = rawId ? Number(rawId) : '';
      const doc   = rawId ? doctors.find((d) => Number(d.doctor_id) === Number(rawId)) : null;
      setForm((f) => ({
        ...f,
        doctorId:        docId,
        doctorUserId:    doc?.user_id || '',
        appointmentDate: '',
        appointmentTime: '',
      }));
      setSlots([]);

      if (!rawId) return;
      setLoadingSlots(true);
      try {
        const { data } = await doctorApi.publicAvailability(rawId);
        setSlots(data.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [doctors]
  );

  // On mount, if a doctor is pre-selected fetch their slots
  useEffect(() => {
    if (preselectDoctorId && doctors.length > 0) {
      handleDoctorChange(preselectDoctorId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectDoctorId, doctors]);

  // Derive available days set and time slots for the selected date
  const availableDays = useMemo(() => getAvailableDaysSet(slots), [slots]);

  const timeSlotsForDate = useMemo(() => {
    if (!form.appointmentDate || slots.length === 0) return [];
    const dayOfWeek = new Date(form.appointmentDate + 'T00:00:00').getDay();
    const dayName   = Object.keys(DAY_INDEX).find((k) => DAY_INDEX[k] === dayOfWeek);
    return slots.filter((s) => s.day_of_week === dayName);
  }, [slots, form.appointmentDate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');

    // Validate date is on an available day (if availability is set)
    if (slots.length > 0 && isDateDisabled(form.appointmentDate, availableDays)) {
      setErr('This doctor is not available on the selected day. Please choose a valid date.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await appointmentApi.create({
        doctorId:        form.doctorId,
        doctorUserId:    form.doctorUserId || undefined,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        visitType:       form.visitType,
        notes:           form.notes,
      });
      setMsg(data?.message || 'Appointment booked successfully!');
      setForm((f) => ({ ...f, appointmentDate: '', appointmentTime: '', notes: '' }));
    } catch (e2) {
      setErr(e2?.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: format "09:00:00" to "09:00"
  const fmt = (t) => String(t || '').slice(0, 5);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slateate-900">Book Appointment</h2>
      <p className="mt-1 text-slate-600 text-sm">
        Select a doctor, then pick a date from their available days and choose a time slot.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-5 md:grid-cols-2">

        {/* Doctor selector */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.doctorId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            required
          >
            <option value="">{loadingDoctors ? 'Loading doctors…' : 'Select a doctor'}</option>
            {doctors.map((d) => (
              <option key={d.doctor_id} value={d.doctor_id}>
                {d.full_name} — {d.specialty}
                {d.consultation_fee ? ` (LKR ${d.consultation_fee})` : ''}
              </option>
            ))}
          </select>

          {/* Doctor info card */}
          {selectedDoctor && (
            <div className="mt-2 rounded-md bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 flex flex-wrap gap-3">
              {selectedDoctor.hospital_affiliation && (
                <span>🏥 {selectedDoctor.hospital_affiliation}</span>
              )}
              {selectedDoctor.consultation_fee !== undefined && (
                <span>💰 Fee: LKR {selectedDoctor.consultation_fee}</span>
              )}
              {selectedDoctor.experience_years ? (
                <span>🎓 {selectedDoctor.experience_years} yrs exp</span>
              ) : null}
            </div>
          )}

          {/* Availability days badge strip */}
          {selectedDoctor && slots.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1.5">Available on:</p>
              <div className="flex flex-wrap gap-1.5">
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => {
                  const active = slots.some((s) => s.day_of_week === day);
                  return (
                    <span
                      key={day}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-400 line-through'}`}
                    >
                      {day.slice(0, 3)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {selectedDoctor && !loadingSlots && slots.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              This doctor has not set weekly availability yet. You can still request any date/time.
            </p>
          )}
          {loadingSlots && (
            <p className="mt-2 text-xs text-slate-400">Loading availability…</p>
          )}
        </div>

        {/* Date picker */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            type="date"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.appointmentDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              const d = e.target.value;
              if (slots.length > 0 && isDateDisabled(d, availableDays)) return;
              setForm((f) => ({ ...f, appointmentDate: d, appointmentTime: '' }));
            }}
            required
          />
          {form.appointmentDate && slots.length > 0 && isDateDisabled(form.appointmentDate, availableDays) && (
            <p className="mt-1 text-xs text-red-600">Doctor is not available on this day.</p>
          )}
        </div>

        {/* Time selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
          {form.appointmentDate && timeSlotsForDate.length > 0 ? (
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.appointmentTime}
              onChange={(e) => setForm((f) => ({ ...f, appointmentTime: e.target.value }))}
              required
            >
              <option value="">Select a time slot</option>
              {timeSlotsForDate.map((s) => (
                <option key={s.slot_id} value={fmt(s.start_time)}>
                  {fmt(s.start_time)} – {fmt(s.end_time)} (max {s.max_appointments} appts)
                </option>
              ))}
            </select>
          ) : (
            <input
              type="time"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.appointmentTime}
              onChange={(e) => setForm((f) => ({ ...f, appointmentTime: e.target.value }))}
              required
            />
          )}
          {form.appointmentDate && slots.length > 0 && timeSlotsForDate.length === 0 &&
            !isDateDisabled(form.appointmentDate, availableDays) && (
            <p className="mt-1 text-xs text-amber-600">No time slots defined for this day.</p>
          )}
        </div>

        {/* Visit type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Visit type</label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.visitType}
            onChange={(e) => setForm((f) => ({ ...f, visitType: e.target.value }))}
          >
            <option value="Telemedicine">Telemedicine (Video)</option>
            <option value="InPerson">In Person</option>
          </select>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe your symptoms or reason for the visit…"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm text-white font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? 'Booking…' : 'Book Appointment'}
          </button>
          {msg && <div className="text-sm text-emerald-700 font-medium">{msg}</div>}
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
      </form>
    </div>
  );
}
