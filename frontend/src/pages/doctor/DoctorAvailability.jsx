import { useState, useEffect } from 'react';
import { doctorApi } from '../../api';

const DoctorAvailability = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ day_of_week: 'Monday', start_time: '09:00', end_time: '12:00', max_appointments: 10 });
  const [error, setError] = useState('');

  const loadSlots = () => {
    doctorApi.myAvailability()
      .then(res => setSlots(res.data.slots))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSlots(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await doctorApi.addSlot(form);
      setShowForm(false);
      loadSlots();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding slot');
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Delete this slot?')) {
      await doctorApi.deleteSlot(id);
      loadSlots();
    }
  };

  const toggleStatus = async (slot) => {
    await doctorApi.updateSlot(slot.slot_id, { is_available: !slot.is_available });
    loadSlots();
  };

  const btnClass = "px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700";
  const btnDanger = "px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200";
  const inputClass = "w-full border-slate-300 rounded border px-3 py-2";

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Availability</h2>
        <button onClick={() => setShowForm(!showForm)} className={btnClass}>
          {showForm ? 'Cancel' : '+ Add Time Slot'}
        </button>
      </div>

      {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

      {showForm && (
        <form onSubmit={handleAdd} className="mb-8 p-4 bg-slate-50 border border-slate-100 rounded-lg grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Day</label>
            <select className={inputClass} value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})}>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label><input type="time" className={inputClass} value={form.start_time} onChange={e=>setForm({...form, start_time: e.target.value})} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">End Time</label><input type="time" className={inputClass} value={form.end_time} onChange={e=>setForm({...form, end_time: e.target.value})} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Max Appts</label><input type="number" className={inputClass} value={form.max_appointments} onChange={e=>setForm({...form, max_appointments: e.target.value})} /></div>
          <button type="submit" className={`w-full ${btnClass} h-[42px]`}>Save Slot</button>
        </form>
      )}

      {slots.length === 0 ? (
        <p className="text-slate-500 py-8 text-center bg-slate-50 rounded">No availability slots set up yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 font-semibold text-sm text-slate-600">Day</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600">Time</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600">Capacity</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600">Status</th>
                <th className="py-3 px-4 font-semibold text-sm text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(s => (
                <tr key={s.slot_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-800">{s.day_of_week}</td>
                  <td className="py-3 px-4 text-slate-600">{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</td>
                  <td className="py-3 px-4 text-slate-600">{s.max_appointments} appts</td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleStatus(s)} className={`px-2 py-1 text-xs rounded-full font-medium ${s.is_available ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                      {s.is_available ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDelete(s.slot_id)} className={btnDanger}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;
