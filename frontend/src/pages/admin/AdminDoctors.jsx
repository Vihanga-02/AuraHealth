import { useState, useEffect } from 'react';
import { doctorApi } from '../../api/doctorApi';

const AdminDoctors = () => {
  const [doctors, setDoctors]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [specialty, setSpecialty]   = useState('');
  const [verifying, setVerifying]   = useState(null);
  const [error, setError]           = useState('');

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search)   params.search    = search;
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
      // Update stats locally
      setStats(prev => prev ? {
        ...prev,
        verified: prev.verified + (!currentVerified ? 1 : -1),
        pending:  prev.pending  + (!currentVerified ? -1 : 1),
      } : prev);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating doctor status');
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manage Doctors</h1>
        <p className="text-slate-500 mt-1">Review, verify and manage all doctor profiles.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Doctors',    value: stats.total,    color: 'bg-blue-50   text-blue-600',   icon: '👨‍⚕️' },
            { label: 'Verified',         value: stats.verified, color: 'bg-green-50  text-green-600',  icon: '✅' },
            { label: 'Pending Approval', value: stats.pending,  color: 'bg-yellow-50 text-yellow-600', icon: '⏳' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="admin-doctor-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, specialty, hospital…"
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          id="admin-doctor-specialty"
          type="text"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder="Filter by specialty…"
          className="w-48 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <div className="text-red-600 font-medium text-sm">{error}</div>}

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
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Exp.</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Fee</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.doctor_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {d.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{d.full_name}</p>
                          {d.phone_number && <p className="text-xs text-slate-400">{d.phone_number}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">{d.specialty}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{d.hospital_affiliation || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{d.experience_years ? `${d.experience_years}y` : '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{d.consultation_fee ? `₹${d.consultation_fee}` : '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                        d.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {d.verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        id={`verify-${d.doctor_id}`}
                        disabled={verifying === d.doctor_id}
                        onClick={() => handleVerify(d.doctor_id, d.verified)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                          d.verified
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {verifying === d.doctor_id ? '…' : d.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDoctors;
