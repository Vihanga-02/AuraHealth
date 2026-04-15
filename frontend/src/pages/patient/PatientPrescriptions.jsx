import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../api';

export default function PatientPrescriptions() {
  const [patientId,      setPatientId]     = useState(null);
  const [prescriptions,  setPrescriptions] = useState([]);
  const [uploadedRx,     setUploadedRx]    = useState([]); // reports with type "Prescription"
  const [missingProfile, setMissingProfile] = useState(false);
  const [tab,            setTab]           = useState('from-doctor'); // 'from-doctor' | 'upload'
  const [err,            setErr]           = useState('');
  const [msg,            setMsg]           = useState('');

  // Upload form state
  const [rxTitle,     setRxTitle]    = useState('');
  const [file,        setFile]       = useState(null);
  const [dragOver,    setDragOver]   = useState(false);
  const [uploading,   setUploading]  = useState(false);
  const [deleting,    setDeleting]   = useState(null);
  const fileRef = useRef();

  const flash = (m, isErr = false) => {
    if (isErr) { setErr(m); setMsg(''); } else { setMsg(m); setErr(''); }
    setTimeout(() => { setErr(''); setMsg(''); }, 5000);
  };

  const load = async () => {
    setErr('');
    try {
      const { data: me } = await patientApi.me();
      const id = me._id || me.id;
      setPatientId(id);
      setMissingProfile(false);

      const [rxRes, rptRes] = await Promise.allSettled([
        patientApi.prescriptions(id),
        patientApi.reports(id),
      ]);

      if (rxRes.status === 'fulfilled') setPrescriptions(rxRes.value.data || []);
      if (rptRes.status === 'fulfilled') {
        // Filter only reports uploaded as "Prescription" type
        setUploadedRx((rptRes.value.data || []).filter((r) => r.reportType === 'Prescription'));
      }
    } catch (e) {
      if (e?.response?.status === 404) { setMissingProfile(true); return; }
      flash(e?.response?.data?.message || 'Failed to load prescriptions', true);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileSelect = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(f.type)) { flash('Only PDF, JPG and PNG files are allowed.', true); return; }
    if (f.size > 5 * 1024 * 1024) { flash('File must be under 5 MB.', true); return; }
    setFile(f);
    setErr('');
  };

  const onUpload = async (e) => {
    e.preventDefault();
    if (!patientId) { flash('Please create your patient profile first.', true); return; }
    if (!file)      { flash('Please select a file.', true); return; }
    if (!rxTitle.trim()) { flash('Prescription title is required.', true); return; }
    setUploading(true);
    try {
      await patientApi.uploadReport(patientId, {
        reportTitle: rxTitle.trim(),
        reportType: 'Prescription',
        file,
      });
      setRxTitle(''); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      flash('Prescription uploaded successfully.');
      await load();
      setTab('upload'); // stay on upload tab to see result
    } catch (e2) {
      flash(e2?.response?.data?.message || 'Upload failed.', true);
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (reportId) => {
    if (!confirm('Delete this prescription document?')) return;
    setDeleting(reportId);
    try {
      await patientApi.deleteReport(patientId, reportId);
      flash('Deleted.');
      await load();
    } catch (e2) {
      flash(e2?.response?.data?.message || 'Delete failed.', true);
    } finally {
      setDeleting(null);
    }
  };

  const fileIcon = (name = '') => (name.toLowerCase().endsWith('.pdf') ? '📕' : '🖼️');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
        <p className="text-slate-500 text-sm mt-1">
          View prescriptions from your doctors and upload your own prescription documents.
        </p>
      </div>

      {/* Feedback */}
      {err && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{err}</div>}
      {msg && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

      {/* Missing profile */}
      {missingProfile && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between gap-4">
          <p className="text-amber-800 text-sm font-medium">You need a patient profile to view prescriptions.</p>
          <Link to="/patient/profile" className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
            Create Profile
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: 'from-doctor', label: `From Doctors (${prescriptions.length})` },
          { id: 'upload',      label: `My Uploads (${uploadedRx.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: From Doctors */}
      {tab === 'from-doctor' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {prescriptions.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <div className="text-4xl mb-2">💊</div>
              <p className="text-sm font-medium">No doctor prescriptions yet.</p>
              <p className="text-xs mt-1 text-slate-300">They appear here after a consultation.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {prescriptions.map((p) => (
                <div key={p._id || p.id} className="p-5 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">👨‍⚕️</span>
                        <span className="font-semibold text-slate-800">{p.doctorName || 'Doctor'}</span>
                      </div>
                      {p.issuedDate && (
                        <p className="text-xs text-slate-400 mb-3">
                          Issued: {new Date(p.issuedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 mt-2">
                    {p.diagnosis && (
                      <div className="rounded-lg bg-blue-50 px-3 py-2">
                        <p className="text-xs text-blue-400 font-medium mb-0.5">Diagnosis</p>
                        <p className="text-sm text-slate-800 font-medium">{p.diagnosis}</p>
                      </div>
                    )}
                    {Array.isArray(p.medications) && p.medications.length > 0 && (
                      <div className="rounded-lg bg-purple-50 px-3 py-2 sm:col-span-2">
                        <p className="text-xs text-purple-400 font-medium mb-1.5">Medications</p>
                        <ul className="space-y-1">
                          {p.medications.map((med, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm text-slate-800">
                              <span className="text-purple-400 mt-0.5">💊</span>
                              <span className="font-medium">{med}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {p.notes && (
                      <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 sm:col-span-3">
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Notes</p>
                        <p className="text-sm text-slate-700">{p.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Upload */}
      {tab === 'upload' && (
        <div className="space-y-5">
          {/* Upload form */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-4">Upload Prescription Document</h2>
            <p className="text-sm text-slate-500 mb-4">Upload a photo or PDF of a physical prescription for your records.</p>
            <form onSubmit={onUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prescription Title *</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Dr. Silva – Diabetes Medication April 2026"
                  value={rxTitle}
                  onChange={(e) => setRxTitle(e.target.value)}
                  required
                />
              </div>

              {/* Drop zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50'
                  : file    ? 'border-green-400 bg-green-50'
                            : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">{fileIcon(file.name)}</span>
                    <span className="font-semibold text-slate-800 text-sm">{file.name}</span>
                    <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline mt-1"
                      onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <span className="text-4xl">💊</span>
                    <p className="font-medium text-sm">Drag & drop or <span className="text-blue-600">browse</span></p>
                    <p className="text-xs text-slate-400">PDF, JPG, PNG — Max 5 MB</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading || !file || missingProfile}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {uploading ? 'Uploading…' : 'Upload Prescription'}
              </button>
            </form>
          </div>

          {/* Uploaded prescription docs */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Uploaded Prescriptions ({uploadedRx.length})</h2>
            </div>
            {uploadedRx.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <div className="text-3xl mb-2">📂</div>
                <p className="text-sm">No uploaded prescriptions yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {uploadedRx.map((r) => (
                  <div key={r._id || r.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-xl shrink-0">
                        {fileIcon(r.fileName)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{r.reportTitle}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.fileUrl && (
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => onDelete(r._id || r.id)}
                        disabled={deleting === (r._id || r.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deleting === (r._id || r.id) ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
