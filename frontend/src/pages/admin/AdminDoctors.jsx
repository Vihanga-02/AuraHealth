import { useState, useEffect } from 'react';
import { doctorApi } from '../../api/doctorApi';

const StatCard = ({ icon, label, value, tone }) => {
  const tones = {
    blue:   'bg-blue-100 text-blue-600',
    green:  'bg-green-100 text-green-600',
    amber:  'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${tones[tone] || tones.blue}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      </div>
    </div>
  );
};

const AdminDoctors = () => {
  const [doctors,   setDoctors]   = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [specialty, setSpecialty] = useState('');
  const [verifying, setVerifying] = useState(null);
  const [error,     setError]     = useState('');

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search)    params.search    = search;
      if (specialty) params.specialty = specialty;
      const [docRes, statRes] = await Promise.all([
        doctorApi.adminAll(params),
        doctorApi.adminStats(),
      ]);
      setDoctors(docRes.data.doctors || []);
      setStats(statRes.data.stats || null);
    } catch (err) {
      setError('Failed to load doctors.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDoctors(); }, [search, specialty]);

  const handleVerify = async (id, currentVerified) => {
    setVerifying(id);
    try {
      await doctorApi.adminVerify(id, !currentVerified);
      setDoctors(prev => prev.map(d =>
        d.doctor_id === id ? { ...d, verified: !currentVerified } : d
      ));
      setStats(prev => prev ? {
        ...prev,
        verified: prev.verified + (!currentVerified ? 1 : -1),
        pending:  prev.pending  + (!currentVerified ? -1 : 1),
      } : prev);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating verification status');
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manage Doctors</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Review and verify doctor registrations. Verification is a <strong>2-step process</strong>:
          account activation (automatic on registration) then manual details verification.
        </p>
      </div>

      {/* Two-step process legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
          <div>
            <p className="font-semibold text-blue-800">Account Activated</p>
            <p className="text-blue-600 text-xs">Doctor registered &amp; profile created → counts as an Active Doctor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
          <div>
            <p className="font-semibold text-green-800">Details Verified</p>
            <p className="text-green-600 text-xs">Admin manually approves credentials → counts as a Verified Doctor &amp; appears in public listings</p>
          </div>
        </div>
      </div>

      {/* Stats — 4 cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👨‍⚕️" label="Total Registered"        value={stats.total}    tone="blue"   />
          <StatCard icon="🔓"  label="Step 1 — Account Active"  value={stats.total}    tone="purple" />
          <StatCard icon="✅"  label="Step 2 — Details Verified" value={stats.verified} tone="green"  />
          <StatCard icon="⏳"  label="Awaiting Verification"     value={stats.pending}  tone="amber"  />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, specialty, hospital…"
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder="Filter by specialty…"
          className="w-48 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>No doctors found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Doctor</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Specialty</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Hospital</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Fee</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Step 1 — Account</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Step 2 — Verification</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.doctor_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {/* Doctor info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {d.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{d.full_name}</p>
                          {d.license_number && (
                            <p className="text-xs text-slate-400">Lic: {d.license_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">{d.specialty || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{d.hospital_affiliation || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {d.consultation_fee ? `LKR ${d.consultation_fee}` : '—'}
                    </td>

                    {/* Step 1: Account status — always Active once profile exists */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        🔓 Account Active
                      </span>
                    </td>

                    {/* Step 2: Details verification */}
                    <td className="py-3 px-4">
                      {d.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ✅ Details Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          ⏳ Pending Verification
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        disabled={verifying === d.doctor_id}
                        onClick={() => handleVerify(d.doctor_id, d.verified)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                          d.verified
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {verifying === d.doctor_id
                          ? '…'
                          : d.verified
                          ? 'Revoke Verification'
                          : 'Verify Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {doctors.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDoctors;
