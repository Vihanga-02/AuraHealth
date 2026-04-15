import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doctorApi, authApi } from '../../api';

const SPECIALTIES = [
  'General Practice','Cardiology','Dermatology','Endocrinology','Gastroenterology',
  'Neurology','Obstetrics & Gynecology','Oncology','Ophthalmology','Orthopedics',
  'Pediatrics','Psychiatry','Pulmonology','Radiology','Surgery','Urology','Other',
];

const inputCls = 'w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

export default function DoctorProfile() {
  const { user } = useAuth();
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState({ type: '', msg: '' });
  const [showPw,     setShowPw]     = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm,     setPwForm]     = useState({ current_password: '', new_password: '', confirm: '' });
  const [form, setForm] = useState({
    full_name: '', specialty: '', bio: '', license_number: '', qualification: '',
    experience_years: '', consultation_fee: '', phone_number: '', languages: 'English', hospital_affiliation: '',
  });

  const flash = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast({ type: '', msg: '' }), 4000); };

  useEffect(() => {
    doctorApi.myProfile().then((res) => {
      const doc = res.data.doctor;
      if (doc) {
        setProfile(doc);
        setForm({ full_name: doc.full_name || '', specialty: doc.specialty || '', bio: doc.bio || '', license_number: doc.license_number || '', qualification: doc.qualification || '', experience_years: doc.experience_years ?? '', consultation_fee: doc.consultation_fee ?? '', phone_number: doc.phone_number || '', languages: doc.languages || 'English', hospital_affiliation: doc.hospital_affiliation || '' });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = profile ? await doctorApi.updateProfile(form) : await doctorApi.createProfile(form);
      setProfile(res.data.doctor);
      flash('success', profile ? 'Profile updated successfully!' : 'Profile created successfully!');
    } catch (err) { flash('error', err?.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handlePw = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { flash('error', 'Passwords do not match.'); return; }
    setChangingPw(true);
    try {
      await authApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      flash('success', 'Password changed!');
      setPwForm({ current_password: '', new_password: '', confirm: '' }); setShowPw(false);
    } catch (err) { flash('error', err?.response?.data?.message || 'Failed.'); }
    finally { setChangingPw(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const initial = (form.full_name || user?.full_name || 'D')[0].toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">{profile ? 'Update your professional details visible to patients.' : 'Set up your profile so patients can find and book with you.'}</p>
      </div>

      {toast.msg && (
        <div className={`flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium border ${toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>{toast.msg}
        </div>
      )}

      {!profile && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800">
          <strong>Profile not set up.</strong> Fill in the form below. Patients won't find you until your profile is complete and verified by an admin.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Left — avatar + summary */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-linear-to-b from-blue-600 to-indigo-700 p-6 text-white text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-bold mx-auto mb-4">{initial}</div>
            <div className="text-lg font-bold">{form.full_name || user?.full_name || 'Doctor'}</div>
            {form.specialty && <div className="text-blue-100 text-sm mt-0.5">{form.specialty}</div>}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${user?.is_active ? 'bg-green-400/80 text-white' : 'bg-amber-400/80 text-amber-900'}`}>
                {user?.is_active ? '✓ Verified' : '⏳ Pending'}
              </span>
              {form.experience_years && <span className="rounded-md bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{form.experience_years}yr exp</span>}
            </div>
          </div>

          {profile && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 font-bold text-slate-800 text-sm">Public Preview</div>
              <div className="divide-y divide-slate-50">
                {[
                  ['🏥 Hospital',    form.hospital_affiliation || '—'],
                  ['⏱  Experience',  form.experience_years ? `${form.experience_years} years` : '—'],
                  ['💰 Fee',         form.consultation_fee ? `LKR ${Number(form.consultation_fee).toLocaleString()}` : '—'],
                  ['⭐ Rating',      profile.rating ? `${Number(profile.rating).toFixed(1)} / 5` : 'No ratings yet'],
                  ['🗣  Languages',  form.languages || '—'],
                ].map(([l, v]) => (
                  <div key={l} className="px-5 py-3 flex justify-between items-center gap-2 text-sm">
                    <span className="text-slate-400 whitespace-nowrap shrink-0">{l}</span>
                    <span className="font-medium text-slate-800 truncate text-right">{v}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-slate-100">
                <Link to="/doctor/availability" className="block text-center text-sm font-semibold text-blue-600 hover:underline">
                  Set Availability →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right — form sections */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Identity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="text-base">👨‍⚕️</span><h2 className="font-bold text-slate-800">Professional Identity</h2>
            </div>
            <div className="px-6 py-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input name="full_name" required value={form.full_name} onChange={onChange} placeholder="Dr. John Smith" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialty <span className="text-red-500">*</span></label>
                <select name="specialty" required value={form.specialty} onChange={onChange} className={inputCls}>
                  <option value="">Select specialty</option>
                  {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">License Number</label>
                <input name="license_number" value={form.license_number} onChange={onChange} placeholder="SLMC-XXXXX" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Qualifications</label>
                <input name="qualification" value={form.qualification} onChange={onChange} placeholder="MBBS, MD, MRCP" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                <input name="phone_number" value={form.phone_number} onChange={onChange} placeholder="+94 7X XXX XXXX" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Languages Spoken</label>
                <input name="languages" value={form.languages} onChange={onChange} placeholder="English, Sinhala" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Practice */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="text-base">🏥</span><h2 className="font-bold text-slate-800">Practice Details</h2>
            </div>
            <div className="px-6 py-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hospital / Clinic Affiliation</label>
                <input name="hospital_affiliation" value={form.hospital_affiliation} onChange={onChange} placeholder="e.g. National Hospital, Colombo" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
                <input name="experience_years" type="number" min="0" value={form.experience_years} onChange={onChange} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Consultation Fee (LKR)</label>
                <input name="consultation_fee" type="number" min="0" value={form.consultation_fee} onChange={onChange} placeholder="2500" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="text-base">📝</span><h2 className="font-bold text-slate-800">About You</h2>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio / Professional Summary</label>
              <textarea name="bio" rows={4} value={form.bio} onChange={onChange} placeholder="Tell patients about your approach, experience, and what to expect in a consultation…" className={`${inputCls} resize-y`} />
              <p className="mt-1.5 text-xs text-slate-400">Shown on your public profile card visible to all patients.</p>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm transition-all">
              {saving ? 'Saving…' : profile ? 'Save Changes' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button type="button" onClick={() => setShowPw((v) => !v)} className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition">
          <h2 className="font-bold text-slate-800">Change Password</h2>
          <span className="text-slate-400">{showPw ? '▲' : '▼'}</span>
        </button>
        {showPw && (
          <form onSubmit={handlePw} className="px-6 py-5 grid gap-5 sm:grid-cols-2">
            {[['Current Password', 'current_password', 'sm:col-span-2'], ['New Password', 'new_password', ''], ['Confirm Password', 'confirm', '']].map(([l, k, sp]) => (
              <div key={k} className={sp}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{l}</label>
                <input type="password" className={inputCls} value={pwForm[k]} onChange={(e) => setPwForm((f) => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={changingPw} className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition">
                {changingPw ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
