import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../api';

export default function PatientHistory() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [missingProfile, setMissingProfile] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: me } = await patientApi.me();
      const id = me._id || me.id;
      const { data: history } = await patientApi.history(id);
      setData(history);
    })().catch((e) => {
      const status = e?.response?.status;
      if (status === 404) {
        setMissingProfile(true);
        return;
      }
      setErr(e?.response?.data?.message || 'Failed to load history');
    });
  }, []);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Medical History</h2>
      <p className="mt-1 text-slate-600">Reports and prescriptions summary.</p>
      {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}
      {missingProfile ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Your patient profile is not created yet. Create it first to see history.
          <div className="mt-2">
            <Link className="font-semibold text-blue-700 hover:underline" to="/patient/profile">
              Go to Profile →
            </Link>
          </div>
        </div>
      ) : null}

      {data ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Reports</div>
            <div className="mt-2 text-sm text-slate-700">{(data.reports || []).length}</div>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Prescriptions</div>
            <div className="mt-2 text-sm text-slate-700">{(data.prescriptions || []).length}</div>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-sm text-slate-500">{missingProfile ? '' : 'Loading…'}</div>
      )}
    </div>
  );
}

