import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';

const inputCls = (ro = false) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    ro ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-default' : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
  }`;

export default function AdminProfile() {
  const { user, setUser } = useAuth();
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [toast,      setToast]      = useState({ type: '', msg: '' });
  const [form,       setForm]       = useState({ full_name: '', email: '' });
  const [pwForm,     setPwForm]     = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPw,     setShowPw]     = useState(false);

  const flash = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast({ type: '', msg: '' }), 4000); };

  useEffect(() => {
    authApi.me()
      .then(({ data }) => { const u = data.user || data; setForm({ full_name: u.full_name || '', email: u.email || '' }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await authApi.updateMe({ full_name: form.full_name });
      if (setUser) setUser((p) => ({ ...p, full_name: data.user?.full_name || form.full_name }));
      flash('success', 'Profile updated successfully.');
    } catch (err) { flash('error', err?.response?.data?.message || 'Failed to update.'); }
    finally { setSaving(false); }
  };

  const handlePw = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { flash('error', 'Passwords do not match.'); return; }
    setChangingPw(true);
    try {
      await authApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      flash('success', 'Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm: '' }); setShowPw(false);
    } catch (err) { flash('error', err?.response?.data?.message || 'Failed to change password.'); }
    finally { setChangingPw(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const initial = (user?.full_name || user?.email || 'A')[0].toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your administrator account details.</p>
      </div>

      {toast.msg && (
        <div className={`flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium border ${toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>{toast.msg}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        {/* Left panel — avatar card */}
        <div className="space-y-4">
          <div className="bg-linear-to-b from-slate-800 to-slate-900 rounded-2xl p-6 text-white text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-4xl font-bold mx-auto mb-4">{initial}</div>
            <div className="text-lg font-bold">{form.full_name || 'Administrator'}</div>
            <div className="text-slate-400 text-sm mt-1 truncate">{form.email}</div>
            <span className="mt-3 inline-block rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold">Admin</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 font-bold text-slate-800 text-sm">Account Details</div>
            <div className="px-5 py-3 divide-y divide-slate-50">
              {[['Role', 'Administrator'], ['Status', 'Active'], ['Access', 'Full Platform']].map(([l, v]) => (
                <div key={l} className="flex justify-between py-2.5 text-sm">
                  <span className="text-slate-400">{l}</span>
                  <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — forms */}
        <div className="space-y-5">
          {/* Edit info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">Account Information</div>
            <form onSubmit={handleSave} className="px-6 py-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input className={inputCls()} value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input className={inputCls(true)} value={form.email} readOnly />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {saving ? 'Saving…' : 'Save Changes'}
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
                {[['Current Password', 'current_password'], ['New Password', 'new_password'], ['Confirm New Password', 'confirm']].map(([l, k]) => (
                  <div key={k} className={k === 'current_password' ? 'sm:col-span-2' : ''}>
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
