import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { completeSession, extendSession, fetchScheduleById, generateSession } from '../api';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

function TelemedicinePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scheduleId: scheduleIdParam } = useParams();
  const localRef = useRef(null);
  const mainRef = useRef(null);
  const pipRef = useRef(null);
  const tracksRef = useRef([]);
  const endingRef = useRef(false);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [tracks, setTracks] = useState([]);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('Connecting...');
  const [timeLeft, setTimeLeft] = useState('');
  const [remoteUser, setRemoteUser] = useState(null);
  const [patientLeftNotice, setPatientLeftNotice] = useState('');
  const [focusRemote, setFocusRemote] = useState(true);
  const [ending, setEnding] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');

  const leaveStateKey = scheduleIdParam ? `telemedicine:left:${scheduleIdParam}` : '';

  const state = location.state || {};
  const { channelName, token, uid, scheduleId, title, endsAt, role: roleFromState } = state;
  const appId = import.meta.env.VITE_AGORA_APP_ID;
  const effectiveScheduleId = scheduleId || scheduleIdParam;
  const isSharedGuest = Boolean(scheduleIdParam) && !scheduleId;
  const urlRole = new URLSearchParams(location.search).get('role');
  const role = roleFromState || urlRole || (isSharedGuest ? 'patient' : 'doctor');
  const isDoctor = role === 'doctor';

  useEffect(() => {
    if (isSharedGuest && leaveStateKey && sessionStorage.getItem(leaveStateKey) === 'left') {
      setBlockedMessage('You already left this session. Refreshing will not rejoin it.');
    }
  }, [isSharedGuest, leaveStateKey]);

  const closeCurrentWindow = useCallback(() => {
    try {
      window.open('', '_self');
      window.close();
    } catch (error) {
      // ignore window close failures
    }

    document.body.innerHTML = '<div style="font-family:sans-serif;padding:24px">Session ended. You can close this tab.</div>';
  }, []);

  const leaveAndBlockRejoin = useCallback(() => {
    if (leaveStateKey) {
      sessionStorage.setItem(leaveStateKey, 'left');
    }

    setBlockedMessage('You left this session. Refreshing will not rejoin it.');
    closeCurrentWindow();
  }, [closeCurrentWindow, leaveStateKey]);

  const endSession = useCallback(async () => {
    if (endingRef.current) {
      return;
    }

    endingRef.current = true;
    setEnding(true);

    try {
      tracksRef.current.forEach((track) => track.close());
      tracksRef.current = [];

      await client.leave();

      if (effectiveScheduleId && !isSharedGuest) {
        await completeSession(effectiveScheduleId);
      }

      if (isDoctor) {
        navigate('/manage');
        return;
      }

      leaveAndBlockRejoin();
    } catch (error) {
      console.error(error);
      if (isDoctor) {
        navigate('/manage');
      } else {
        leaveAndBlockRejoin();
      }
    } finally {
      endingRef.current = false;
      setEnding(false);
    }
  }, [closeCurrentWindow, effectiveScheduleId, isDoctor, isSharedGuest, leaveAndBlockRejoin, navigate]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    if (channelName) {
      setSession({
        channelName,
        token,
        uid,
        endsAt,
        title,
        role
      });
      return;
    }

    const loadSessionFromLink = async () => {
      if (!scheduleIdParam) {
        setStatus('Missing Agora session details.');
        return;
      }

      try {
        const randomUid = Math.floor(100000 + Math.random() * 900000);
        const data = await generateSession(scheduleIdParam, randomUid);
        if (leaveStateKey && sessionStorage.getItem(leaveStateKey) === 'left') {
          setBlockedMessage('You already left this session. Refreshing will not rejoin it.');
          return;
        }
        setSession({
          channelName: data.channelName,
          token: data.token,
          uid: data.uid,
          endsAt: data.ends_at,
          title: data.title || title,
          role
        });
      } catch (error) {
        const apiMessage = error.response?.data?.error;
        if (error.response?.status === 403) {
          setStatus(apiMessage || 'This schedule has expired or finished and cannot be joined again.');
        } else {
          setStatus(apiMessage || 'Failed to load session details.');
        }
      }
    };

    loadSessionFromLink();
  }, [channelName, endsAt, role, scheduleIdParam, token, title, uid]);

  useEffect(() => {
    if (blockedMessage) {
      return undefined;
    }

    if (!appId || !session?.channelName || !session?.uid) {
      setStatus('Missing Agora session details.');
      return undefined;
    }

    const onUserPublished = async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === 'video') {
        setRemoteUser(user);
      }

      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    };

    const onUserLeft = () => {
      setRemoteUser(null);
      setPatientLeftNotice('Patient left the session.');
    };

    client.on('user-published', onUserPublished);
    client.on('user-left', onUserLeft);

    const setup = async () => {
      try {
        const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const cameraTrack = await AgoraRTC.createCameraVideoTrack();

        setTracks([micTrack, cameraTrack]);
        setMicOn(true);
        setCameraOn(true);

        await client.join(appId, session.channelName, session.token || null, session.uid);
        await client.publish([micTrack, cameraTrack]);

        if (localRef.current) {
          cameraTrack.play(localRef.current);
        }

        setStatus(`Connected to ${session.channelName}`);
      } catch (error) {
        console.error(error);
        setStatus(error.message || 'Unable to start session.');
      }
    };

    setup();

    return () => {
      client.off('user-published', onUserPublished);
      client.off('user-left', onUserLeft);

      tracksRef.current.forEach((track) => track.close());
      tracksRef.current = [];

      if (pipRef.current) {
        pipRef.current.innerHTML = '';
      }
      if (mainRef.current) {
        mainRef.current.innerHTML = '';
      }

      client.leave().catch(() => undefined);
    };
  }, [appId, blockedMessage, session?.channelName, session?.token, session?.uid]);

  if (blockedMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 px-4 py-8 text-slate-900">
        <div className="mx-auto flex w-[min(760px,94vw)] flex-col gap-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Session Closed</p>
          <h1 className="text-2xl font-bold text-blue-700">Telemedicine session ended</h1>
          <p className="text-sm text-slate-600">{blockedMessage}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white" onClick={() => navigate('/')}>Go Home</button>
            <button className="rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-medium text-slate-700" onClick={() => navigate('/manage')}>Manage Schedules</button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const localVideoTrack = tracks[1];
    const remoteVideoTrack = remoteUser?.videoTrack;

    if (!mainRef.current || !pipRef.current || !localVideoTrack) {
      return;
    }

    mainRef.current.innerHTML = '';
    pipRef.current.innerHTML = '';

    if (focusRemote && remoteVideoTrack) {
      remoteVideoTrack.play(mainRef.current);
      localVideoTrack.play(pipRef.current);
      return;
    }

    localVideoTrack.play(mainRef.current);
    if (remoteVideoTrack) {
      remoteVideoTrack.play(pipRef.current);
    }
  }, [focusRemote, remoteUser, tracks]);

  useEffect(() => {
    if (!session?.endsAt) {
      return;
    }

    const endMs = new Date(session.endsAt).getTime();
    if (!Number.isFinite(endMs)) {
      return;
    }

    const delay = endMs - Date.now();
    if (delay <= 0) {
      setStatus('Session ended by schedule time.');
      endSession();
      return;
    }

    const timer = setTimeout(() => {
      setStatus('Session ended by schedule time.');
      endSession();
    }, delay);

    return () => clearTimeout(timer);
  }, [endSession, session?.endsAt]);

  useEffect(() => {
    if (!effectiveScheduleId) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const schedule = await fetchScheduleById(effectiveScheduleId);
        if (schedule.session_status === 'completed' || schedule.session_status === 'canceled') {
          setStatus('Doctor ended the session.');
          endSession();
        }
      } catch (error) {
        // keep existing call state on transient poll failures
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [endSession, effectiveScheduleId]);

  useEffect(() => {
    if (!session?.endsAt) {
      setTimeLeft('');
      return;
    }

    const formatRemaining = (ms) => {
      if (ms <= 0) return '00:00';
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60)
        .toString()
        .padStart(2, '0');
      const sec = (totalSec % 60).toString().padStart(2, '0');
      return `${min}:${sec}`;
    };

    const endMs = new Date(session.endsAt).getTime();
    if (!Number.isFinite(endMs)) {
      setTimeLeft('');
      return;
    }

    const update = () => {
      setTimeLeft(formatRemaining(endMs - Date.now()));
    };

    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [session?.endsAt]);

  const toggleMic = async () => {
    if (!tracks[0]) return;
    const next = !micOn;
    await tracks[0].setEnabled(next);
    setMicOn(next);
  };

  const toggleCamera = async () => {
    if (!tracks[1]) return;
    const next = !cameraOn;
    await tracks[1].setEnabled(next);
    setCameraOn(next);
  };

  const onExtendTime = async (minutes) => {
    if (!effectiveScheduleId || !isDoctor) {
      return;
    }

    try {
      const updated = await extendSession(effectiveScheduleId, minutes);
      setSession((prev) => ({
        ...prev,
        endsAt: updated.ends_at || prev.endsAt
      }));
      setStatus(`Session extended by ${minutes} minutes.`);
    } catch (error) {
      setStatus(error.response?.data?.error || 'Failed to extend session.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 px-4 py-6 text-slate-900">
      <div className="mx-auto grid w-[min(1120px,96vw)] gap-4">
        <header className="rounded-3xl border border-blue-200 bg-white/92 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">Live Consultation</p>
              <h1 className="text-xl font-bold text-blue-700 md:text-2xl">{session?.title || title || 'Telemedicine Session'}</h1>
              <p className="mt-1 text-sm text-slate-600">{status}</p>
            </div>
            <p className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">{role}</p>
          </div>
          {timeLeft && <p className="mt-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Ends in {timeLeft}</p>}
          {patientLeftNotice && (
            <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
              {patientLeftNotice}
            </p>
          )}
        </header>

        <section className="rounded-3xl border border-blue-200 bg-white p-3 shadow-sm md:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-blue-700 md:text-lg">Consultation View</h2>
            <button className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setFocusRemote((prev) => !prev)}>
              Switch Focus
            </button>
          </div>
          <div className="relative">
            <div className="h-[300px] overflow-hidden rounded-2xl bg-slate-950 md:h-[460px]" ref={mainRef} />
            <div className="absolute bottom-3 right-3 h-[108px] w-[170px] overflow-hidden rounded-xl border-2 border-white bg-slate-950 shadow-lg md:h-[150px] md:w-[230px]" ref={pipRef} />
            <div className="hidden" ref={localRef} />
          </div>
        </section>

        <section className="flex flex-wrap gap-2.5">
          <button className="rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50" onClick={toggleCamera}>{cameraOn ? 'Camera Off' : 'Camera On'}</button>
          <button className="rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50" onClick={toggleMic}>{micOn ? 'Voice Off' : 'Voice On'}</button>
          {isDoctor && (
            <>
              <button className="rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50" onClick={() => onExtendTime(5)}>
                Add 5 min
              </button>
              <button className="rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50" onClick={() => onExtendTime(10)}>
                Add 10 min
              </button>
            </>
          )}
          <button className="rounded-xl bg-orange-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-orange-600" onClick={endSession} disabled={ending}>
            {isDoctor ? 'End Session for All' : 'Leave Session'}
          </button>
        </section>
      </div>
    </div>
  );
}

export default TelemedicinePage;
