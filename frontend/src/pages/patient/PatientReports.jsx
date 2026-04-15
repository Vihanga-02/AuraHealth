import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../api';

const REPORT_TYPES = ['General', 'Blood Test', 'X-Ray', 'MRI', 'CT Scan', 'ECG', 'Ultrasound', 'Prescription', 'Other'];

export default function PatientReports() {
  const [patientId,      setPatientId]     = useState(null);
  const [reports,        setReports]       = useState([]);
  const [title,          setTitle]         = useState('');
  const [type,           setType]          = useState('General');
  const [file,           setFile]          = useState(null);
  const [dragOver,       setDragOver]      = useState(false);
  const [uploading,      setUploading]     = useState(false);
  const [err,            setErr]           = useState('');
  const [msg,            setMsg]           = useState('');
  const [missingProfile, setMissingProfile] = useState(false);
  const [deleting,       setDeleting]      = useState(null);
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
      const { data } = await patientApi.reports(id);
      setReports(data || []);
    } catch (e) {
      if (e?.response?.status === 404) { setMissingProfile(true); return; }
      flash(e?.response?.data?.message || 'Failed to load reports', true);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileSelect = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      flash('Only PDF, JPG and PNG files are allowed.', true);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      flash('File must be under 5 MB.', true);
      return;
    }
    setFile(f);
    setErr('');
  };

  const onUpload = async (e) => {
    e.preventDefault();
    if (!patientId) { flash('Please create your patient profile first.', true); return; }
    if (!file)      { flash('Please select a file.', true); return; }
    if (!title.trim()) { flash('Report title is required.', true); return; }
    setUploading(true);
    try {
      await patientApi.uploadReport(patientId, { reportTitle: title.trim(), reportType: type, file });
      setTitle(''); setType('General'); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      flash('Report uploaded successfully.');
      await load();
    } catch (e2) {
      flash(e2?.response?.data?.message || 'Upload failed. Please try again.', true);
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (reportId) => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    setDeleting(reportId);
    try {
      await patientApi.deleteReport(patientId, reportId);
      flash('Report deleted.');
      await load();
    } catch (e2) {
      flash(e2?.response?.data?.message || 'Delete failed.', true);
    } finally {
      setDeleting(null);
    }
  };

  const fileIcon = (name = '') => {
    if (name.toLowerCase().endsWith('.pdf')) return '📕';
    return '🖼️';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Medical Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Upload and manage your medical documents (PDF, JPG, PNG — max 5 MB).</p>
      </div>

      {/* Feedback */}
      {err && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{err}</div>}
      {msg && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

      {/* Missing profile */}
      {missingProfile && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between gap-4">
          <p className="text-amber-800 text-sm font-medium">
            You need a patient profile to upload reports.
          </p>
          <Link
            to="/patient/profile"
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Create Profile
          </Link>
        </div>
      )}

      {/* Upload form */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="font-bold text-slate-800 mb-4">Upload New Report</h2>
        <form onSubmit={onUpload} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Report Title *</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Blood Test — March 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Report Type</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {REPORT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : file
                ? 'border-green-400 bg-green-50'
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
                <span className="text-4xl">📂</span>
                <p className="font-medium text-sm">Drag & drop your file here, or <span className="text-blue-600">browse</span></p>
                <p className="text-xs text-slate-400">PDF, JPG, PNG — Max 5 MB</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading || !file || missingProfile}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {uploading ? 'Uploading…' : 'Upload Report'}
          </button>
        </form>
      </div>

      {/* Reports list */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">My Reports ({reports.length})</h2>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-2">📂</div>
            <p className="text-sm">No reports uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((r) => (
              <div key={r._id || r.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl shrink-0">
                    {fileIcon(r.fileName)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{r.reportTitle}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {r.reportType} &nbsp;•&nbsp;
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
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
  );
}
