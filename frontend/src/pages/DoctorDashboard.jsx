import { useEffect, useState } from 'react';
import { createDoctorProfile, fetchMyDoctorProfile, updateDoctorProfile } from '../api/doctorApi';

const initialForm = {
  full_name: '',
  specialty: '',
  phone_number: '',
  availability_schedule: '',
};

const DoctorDashboard = () => {
  const [form, setForm] = useState(initialForm);
  const [doctor, setDoctor] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = async () => {
    try {
      const data = await fetchMyDoctorProfile();
      setDoctor(data.doctor);
      setForm({
        full_name: data.doctor.full_name || '',
        specialty: data.doctor.specialty || '',
        phone_number: data.doctor.phone_number || '',
        availability_schedule: data.doctor.availability_schedule || '',
      });
    } catch (_err) {
      setDoctor(null);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      if (doctor) {
        const data = await updateDoctorProfile(form);
        setDoctor(data.doctor);
        setMessage('Profile updated successfully');
      } else {
        const data = await createDoctorProfile(form);
        setDoctor(data.doctor);
        setMessage('Profile created successfully');
      }
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl bg-white p-8 shadow">
        <h2 className="mb-6 text-2xl font-bold">Doctor Dashboard</h2>

        {doctor && (
          <div className="mb-6 rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
            <p><strong>Doctor ID:</strong> {doctor.doctor_id}</p>
            <p><strong>Verification:</strong> {doctor.verified ? 'Verified' : 'Pending'}</p>
          </div>
        )}

        <form onSubmit={handleCreateOrUpdate} className="grid gap-4 md:grid-cols-2">
          <input className="rounded border p-3" name="full_name" placeholder="Full name" value={form.full_name} onChange={handleChange} />
          <input className="rounded border p-3" name="specialty" placeholder="Specialty" value={form.specialty} onChange={handleChange} />
          <input className="rounded border p-3" name="phone_number" placeholder="Phone number" value={form.phone_number} onChange={handleChange} />
          <input className="rounded border p-3" name="availability_schedule" placeholder="Availability schedule" value={form.availability_schedule} onChange={handleChange} />
          <div className="md:col-span-2">
            {message && <p className="mb-3 text-sm text-green-600">{message}</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <button className="rounded bg-slate-900 px-6 py-3 text-white">
              {doctor ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorDashboard;
