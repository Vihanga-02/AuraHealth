import { useState, useEffect } from 'react';
import { doctorApi } from '../../api';

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    full_name: '', specialty: '', bio: '', license_number: '', qualification: '',
    experience_years: 0, consultation_fee: 0, phone_number: '',
    languages: 'English', hospital_affiliation: ''
  });

  useEffect(() => {
    doctorApi.myProfile()
      .then(res => {
        if (res.data.doctor) {
          setProfile(res.data.doctor);
          setForm(res.data.doctor);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      let res;
      if (profile) res = await doctorApi.updateProfile(form);
      else res = await doctorApi.createProfile(form);
      setProfile(res.data.doctor);
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error saving profile' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const btnClass = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 transition-all duration-200 disabled:opacity-60";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h2>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type==='success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {loading ? (<div>Loading...</div>) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelClass}>Full Name</label>
            <input name="full_name" required value={form.full_name} onChange={handleChange} className={inputClass} />
          </div>
          
          <div>
            <label className={labelClass}>Specialty</label>
            <input name="specialty" required value={form.specialty||''} onChange={handleChange} className={inputClass} placeholder="e.g. Cardiology" />
          </div>
          
          <div>
            <label className={labelClass}>License Number</label>
            <input name="license_number" value={form.license_number||''} onChange={handleChange} className={inputClass} />
          </div>
          
          <div>
            <label className={labelClass}>Consultation Fee (LKR)</label>
            <input name="consultation_fee" type="number" step="0.01" value={form.consultation_fee||0} onChange={handleChange} className={inputClass} />
          </div>
          
          <div>
            <label className={labelClass}>Experience (Years)</label>
            <input name="experience_years" type="number" value={form.experience_years||0} onChange={handleChange} className={inputClass} />
          </div>

           <div>
            <label className={labelClass}>Phone Number</label>
            <input name="phone_number" value={form.phone_number||''} onChange={handleChange} className={inputClass} />
          </div>

          <div>
             <label className={labelClass}>Languages</label>
            <input name="languages" value={form.languages||''} onChange={handleChange} className={inputClass} placeholder="English, Sinhala" />
          </div>

          <div className="md:col-span-2">
             <label className={labelClass}>Qualifications</label>
             <input name="qualification" value={form.qualification||''} onChange={handleChange} className={inputClass} placeholder="MBBS, MD" />
          </div>

          <div className="md:col-span-2">
             <label className={labelClass}>Hospital Affiliation</label>
             <input name="hospital_affiliation" value={form.hospital_affiliation||''} onChange={handleChange} className={inputClass} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Bio / Description</label>
            <textarea name="bio" rows="4" value={form.bio||''} onChange={handleChange} className={`${inputClass} resize-y`}></textarea>
          </div>

          <div className="md:col-span-2 mt-4 text-right">
             <button type="submit" disabled={saving} className={btnClass}>
               {saving ? 'Saving...' : 'Save Profile'}
             </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DoctorProfile;
