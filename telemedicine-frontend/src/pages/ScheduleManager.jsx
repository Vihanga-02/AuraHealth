import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  cancelSession,
  extendSession,
  fetchSchedules,
  generateSession
} from '../api';

const classifySchedule = (item) => {
  if (item.session_status === 'canceled') {
    return 'canceled';
  }

  if (item.session_status === 'completed') {
    return 'finished';
  }

  const end = new Date(`${item.date}T${item.end_time}`).getTime();
  if (Number.isFinite(end) && end < Date.now()) {
    return 'finished';
  }

  return 'pending';
};

function ScheduleManager() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const grouped = useMemo(() => {
    const groups = {
      pending: [],
      finished: [],
      canceled: []
    };

    schedules.forEach((item) => {
      groups[classifySchedule(item)].push(item);
    });

    return groups;
  }, [schedules]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await fetchSchedules();
      setSchedules(data);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleDoctorJoin = async (item) => {
    try {
      setBusyId(item.id);
      const uid = Math.floor(100000 + Math.random() * 900000);
      const session = await generateSession(item.id, uid);

      navigate('/telemedicine', {
        state: {
          scheduleId: item.id,
          title: item.title,
          channelName: session.channelName,
          token: session.token,
          uid: session.uid,
          endsAt: session.ends_at,
          role: 'doctor'
        }
      });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to start doctor session');
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyClientLink = async (item) => {
    try {
      setBusyId(item.id);
      const uid = Math.floor(100000 + Math.random() * 900000);
      const session = await generateSession(item.id, uid);
      await navigator.clipboard.writeText(`${session.share_link}?role=patient`);
      setMessage('Client join link copied');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to copy client link');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (item) => {
    try {
      setBusyId(item.id);
      await cancelSession(item.id);
      await loadSchedules();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to cancel schedule');
    } finally {
      setBusyId(null);
    }
  };

  const handleExtend = async (item, minutes) => {
    try {
      setBusyId(item.id);
      await extendSession(item.id, minutes);
      await loadSchedules();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to extend schedule');
    } finally {
      setBusyId(null);
    }
  };

  const activeItems = grouped[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 px-4 py-6 text-slate-900">
      <div className="mx-auto grid w-[min(1120px,96vw)] gap-4">
        <header className="rounded-3xl border border-blue-200 bg-white/92 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">Doctor Console</p>
              <h1 className="text-xl font-bold text-blue-700 md:text-2xl">Manage Schedules</h1>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700"
                disabled={loading}
                onClick={loadSchedules}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white" to="/">
                Home
              </Link>
            </div>
          </div>
          {message && <p className="mt-3 text-sm text-orange-700">{message}</p>}
        </header>

        <section className="rounded-3xl border border-blue-200 bg-white/92 p-4 shadow-sm md:p-5">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {['pending', 'finished', 'canceled'].map((tab) => (
              <button
                key={tab}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'border border-blue-200 bg-white text-slate-700 hover:bg-blue-50'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {grouped[tab].length}
                </span>
              </button>
            ))}
          </div>

          {activeItems.length === 0 && <p className="text-sm text-slate-500">No {activeTab} schedules.</p>}

          <div className="grid gap-3">
            {activeItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 md:text-lg">{item.title}</h3>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${item.session_status === 'canceled' ? 'border-orange-200 bg-orange-50 text-orange-700' : item.session_status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                        {item.session_status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{item.description || 'No description'}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.date} | {item.start_time} - {item.end_time}</p>
                  </div>

                  {activeTab === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-blue-300" disabled={busyId === item.id} onClick={() => handleDoctorJoin(item)}>
                        Join as Doctor
                      </button>
                      <button className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={busyId === item.id} onClick={() => handleCopyClientLink(item)}>
                        Copy Client Link
                      </button>
                      <button className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={busyId === item.id} onClick={() => handleExtend(item, 5)}>
                        +5 min
                      </button>
                      <button className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={busyId === item.id} onClick={() => handleCancel(item)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ScheduleManager;
