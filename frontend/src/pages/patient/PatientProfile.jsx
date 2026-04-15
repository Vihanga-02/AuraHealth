import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientApi, authApi } from '../../api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS      = ['Male', 'Female', 'Other', 'Prefer not to say'];

const inputCls = (ro = false) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    ro ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-default' : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
  }`;

export default function PatientProfile() {
  const { user } = useAuth();
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [patient,    setPatient]    = useState(null);
  const [toast,      setToast]      = useState({ type: '', msg: '' });
  const [showPw,     setShowPw]     = useState(false);
  const [form, setForm] = useState({ phone: '', address: '', gender: '', bloodGroup: '', date_of_birth: '', emergency_contact: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });

  const flash = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast({ type: '', msg: '' }), 4000); };

  useEffect(() => {
    patientApi.me().then(({ data }) => {
      setPatient(data);
      setForm({ phone: data.phone || '', address: data.address || '', gender: data.gender || '', bloodGroup: data.bloodGroup || '', date_of_birth: data.date_of_birth || '', emergency_contact: data.emergency_contact || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fn = patient ? patientApi.update(patient._id || patient.id, form) : patientApi.createProfile(form);
      const { data } = await fn;
      setPatient(data.patient || data);
      flash('success', patient ? 'Profile updated successfully!' : 'Profile created successfully!');
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

  const initial = (user?.full_name || user?.email || 'P')[0].toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal and medical information.</p>
      </div>

      {toast.msg && (
        <div className={`flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium border ${toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>{toast.msg}
        </div>
      )}

      {!patient && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800">
          <strong>No profile found.</strong> Fill in the details below and click <em>Create Profile</em> to get started.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Left — avatar + health summary */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-linear-to-b from-blue-600 to-indigo-700 p-6 text-white text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold mx-auto mb-4">{initial}</div>
            <div className="text-lg font-bold">{user?.full_name || 'Patient'}</div>
            <div className="text-blue-100 text-sm mt-1 truncate">{user?.email}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {form.bloodGroup && <span className="rounded-md bg-white/20 px-2.5 py-0.5 text-xs font-semibold">🩸 {form.bloodGroup}</span>}
              {form.gender && <span className="rounded-md bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{form.gender}</span>}
              {!patient && <span className="rounded-md bg-amber-400/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Setup required</span>}
            </div>
          </div>

          {patient && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 font-bold text-slate-800 text-sm">Health Summary</div>
              <div className="divide-y divide-slate-50">
                {[
                  ['🩸 Blood Group',    form.bloodGroup        || '—'],
                  ['⚧  Gender',         form.gender            || '—'],
                  ['📅 Date of Birth',  form.date_of_birth     || '—'],
                  ['📞 Emergency',      form.emergency_contact || '—'],
                  ['📍 Address',        form.address           || '—'],
                ].map(([l, v]) => (
                  <div key={l} className="px-5 py-3 flex justify-between items-start gap-2 text-sm">
                    <span className="text-slate-400 whitespace-nowrap shrink-0">{l}</span>
                    <span className="font-medium text-slate-800 text-right truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — form + password */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">Personal Information</div>
            <form onSubmit={handleSave} className="px-6 py-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                <input className={inputCls()} value={form.phone} onChange={set('phone')} required placeholder="+94 7X XXX XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                <select className={inputCls()} value={form.gender} onChange={set('gender')}>
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Blood Group</label>
                <select className={inputCls()} value={form.bloodGroup} onChange={set('bloodGroup')}>
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
                <input type="date" className={inputCls()} value={form.date_of_birth} onChange={set('date_of_birth')} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Emergency Contact</label>
                <input className={inputCls()} value={form.emergency_contact} onChange={set('emergency_contact')} placeholder="Name — +94 7X XXX XXXX" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Home Address</label>
                <textarea rows={2} className={`${inputCls()} resize-none`} value={form.address} onChange={set('address')} placeholder="123 Main St, Colombo" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {saving ? 'Saving…' : patient ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change password */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button onClick={() => setShowPw((v) => !v)} className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition">
              <h2 className="font-bold text-slate-800">Change Password</h2>
              <span className="text-slate-400">{showPw ? '▲' : '▼'}</span>
            </button>
            {showPw && (
              <form onSubmit={handlePw} className="px-6 py-5 grid gap-5 sm:grid-cols-2">
                {[['Current Password', 'current_password', 'sm:col-span-2'], ['New Password', 'new_password', ''], ['Confirm Password', 'confirm', '']].map(([l, k, span]) => (
                  <div key={k} className={span}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{l}</label>
                    <input type="password" className={inputCls()} value={pwForm[k]} onChange={(e) => setPwForm((f) => ({ ...f, [k]: e.target.value }))} />
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
      </div>
    </div>
  );
}
