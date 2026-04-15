import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createSchedule } from '../api';

const initialForm = {
  appointment_id: '',
  doctor_id: '',
  patient_id: '',
  title: '',
  description: '',
  date: '',
  start_time: '',
  end_time: ''
};

function ScheduleHome() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      setSaving(true);
      await createSchedule(form);
      setForm(initialForm);
      setMessage('Schedule created successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 px-4 py-6 text-slate-900">
      <div className="mx-auto grid w-[min(1040px,96vw)] gap-4">
      <header className="rounded-3xl border border-blue-200 bg-white/92 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-2xl">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">Telemedicine Microservice</p>
            <h1 className="text-xl font-bold text-blue-700 md:text-2xl">Schedule and Launch Live Consultations</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create appointments, then generate secure Agora session credentials only when a session is valid.
            </p>
          </div>
          <Link className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white" to="/manage">
            Manage
          </Link>
        </div>
      </header>

      {message && <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-3xl border border-blue-200 bg-white/92 p-4 shadow-sm md:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-blue-700">Create Schedule</h2>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Quick create</span>
        </div>
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={onSubmit}>
          <input className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500" name="appointment_id" placeholder="Appointment ID" value={form.appointment_id} onChange={onChange} />
          <input className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500" name="doctor_id" placeholder="Doctor ID" value={form.doctor_id} onChange={onChange} />
          <input className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500" name="patient_id" placeholder="Patient ID" value={form.patient_id} onChange={onChange} />
          <input className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500" name="title" placeholder="Title" value={form.title} onChange={onChange} />
          <input
            className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 md:col-span-2 xl:col-span-3"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={onChange}
          />
          <input className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500" type="date" name="date" value={form.date} onChange={onChange} />
          <input className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500" type="time" name="start_time" value={form.start_time} onChange={onChange} />
          <input className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500" type="time" name="end_time" value={form.end_time} onChange={onChange} />
          <button className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 md:col-span-2 xl:col-span-3" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Create Schedule'}
          </button>
        </form>
      </section>

      </div>
    </div>
  );
}

export default ScheduleHome;
