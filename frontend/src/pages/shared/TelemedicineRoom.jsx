import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { telemedicineApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

// Single shared client — created once at module level (same pattern as reference impl)
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const appId = import.meta.env.VITE_AGORA_APP_ID || '';

export default function TelemedicineRoom() {
  const { scheduleId } = useParams();
  const navigate       = useNavigate();
  const location       = useLocation();
  const { user }       = useAuth();

  // Role: doctor if the route starts with /doctor/...
  const isDoctor = location.pathname.startsWith('/doctor');
  const role     = isDoctor ? 'doctor' : 'patient';

  // Refs for DOM video containers (main = big, pip = picture-in-picture)
  const mainRef  = useRef(null);
  const pipRef   = useRef(null);
  const tracksRef = useRef([]);
  const endingRef = useRef(false);

  const [tracks,      setTracks]      = useState([]);
  const [session,     setSession]     = useState(null);   // { channelName, token, uid, endsAt, title }
  const [status,      setStatus]      = useState('Connecting…');
  const [timeLeft,    setTimeLeft]    = useState('');
  const [remoteUser,  setRemoteUser]  = useState(null);
  const [focusRemote, setFocusRemote] = useState(true);
  const [micOn,       setMicOn]       = useState(true);
  const [cameraOn,    setCameraOn]    = useState(true);
  const [ending,      setEnding]      = useState(false);
  const [noticeTxt,   setNoticeTxt]   = useState('');

  const displayName = user?.full_name || user?.email || (isDoctor ? 'Doctor' : 'Patient');

  // ── Navigate back to the right dashboard on leave ──────────────────────
  const goBack = useCallback(() => {
    if (isDoctor) navigate('/doctor/telemedicine/manage');
    else          navigate('/patient/appointments');
  }, [isDoctor, navigate]);

  // ── End / leave session ─────────────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setEnding(true);
    try {
      tracksRef.current.forEach((t) => t.close());
      tracksRef.current = [];
      await client.leave();
      // Doctor calls the complete endpoint to signal session end for all
      if (isDoctor && session?.scheduleId) {
        try { await telemedicineApi.complete(session.scheduleId); } catch { /* ignore */ }
      }
    } catch { /* ignore cleanup errors */ } finally {
      endingRef.current = false;
      setEnding(false);
      goBack();
    }
  }, [goBack, isDoctor, session?.scheduleId]);

  // ── Keep tracksRef in sync ──────────────────────────────────────────────
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);

  // ── Step 1: fetch session from telemedicine service ─────────────────────
  useEffect(() => {
    if (!scheduleId) { setStatus('Missing session ID.'); return; }

    const fetchSession = async () => {
      try {
        const randomUid = Math.floor(100000 + Math.random() * 900000);
        const { data } = await telemedicineApi.generateSession(scheduleId, {
          uid:  randomUid,
          role: isDoctor ? 'publisher' : 'publisher', // both publish in full-duplex RTC
        });
        setSession({
          scheduleId,
          channelName: data.channelName,
          token:       data.token,       // may be null in AppID-only mode
          uid:         data.uid,
          endsAt:      data.ends_at,
          title:       data.title || `Session #${scheduleId}`,
        });
      } catch (err) {
        const msg = err?.response?.data?.error;
        if (err?.response?.status === 403) {
          setStatus(msg || 'This session has already ended and cannot be joined.');
        } else if (err?.response?.status === 404) {
          // No telemedicine schedule found — appointment-based join.
          // Call the /token endpoint to get a real Agora token for the derived channel.
          try {
            const channelName = `aurahealth-appt-${scheduleId}`;
            const uid         = Math.floor(100000 + Math.random() * 900000);
            const { data: tokenData } = await telemedicineApi.generateToken(channelName, uid);
            setSession({
              scheduleId:  null,
              channelName: tokenData.channelName,
              token:       tokenData.token,
              uid:         tokenData.uid,
              endsAt:      null,
              title:       `Appointment #${scheduleId}`,
            });
          } catch (tokenErr) {
            setStatus(tokenErr?.response?.data?.error || 'Failed to generate Agora token.');
          }
        } else {
          setStatus(msg || 'Failed to load session details.');
        }
      }
    };

    fetchSession();
  }, [scheduleId, isDoctor]);

  // ── Step 2: join Agora once session data is ready ───────────────────────
  useEffect(() => {
    if (!session?.channelName || !session?.uid) return;
    if (!appId) { setStatus('Agora App ID not configured (VITE_AGORA_APP_ID missing).'); return; }

    const onUserPublished = async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') setRemoteUser(user);
      if (mediaType === 'audio') user.audioTrack?.play();
    };

    const onUserLeft = () => {
      setRemoteUser(null);
      setNoticeTxt(isDoctor ? 'Patient left the session.' : 'Doctor left the session.');
    };

    client.on('user-published', onUserPublished);
    client.on('user-left', onUserLeft);

    const setup = async () => {
      try {
        const micTrack    = await AgoraRTC.createMicrophoneAudioTrack();
        const cameraTrack = await AgoraRTC.createCameraVideoTrack();

        setTracks([micTrack, cameraTrack]);
        setMicOn(true);
        setCameraOn(true);

        await client.join(appId, session.channelName, session.token || null, session.uid);
        await client.publish([micTrack, cameraTrack]);

        setStatus(`Connected · ${session.channelName}`);
      } catch (err) {
        console.error('[Agora] join error:', err);
        setStatus(err?.message || 'Failed to start video call.');
      }
    };

    setup();

    return () => {
      client.off('user-published', onUserPublished);
      client.off('user-left', onUserLeft);
      tracksRef.current.forEach((t) => t.close());
      tracksRef.current = [];
      if (pipRef.current)  pipRef.current.innerHTML  = '';
      if (mainRef.current) mainRef.current.innerHTML = '';
      client.leave().catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.channelName, session?.uid, session?.token]);

  // ── Step 3: lay out local/remote video in main + pip ───────────────────
  useEffect(() => {
    const localVideoTrack  = tracks[1];
    const remoteVideoTrack = remoteUser?.videoTrack;

    if (!mainRef.current || !pipRef.current || !localVideoTrack) return;

    mainRef.current.innerHTML = '';
    pipRef.current.innerHTML  = '';

    if (focusRemote && remoteVideoTrack) {
      remoteVideoTrack.play(mainRef.current);
      localVideoTrack.play(pipRef.current);
    } else {
      localVideoTrack.play(mainRef.current);
      if (remoteVideoTrack) remoteVideoTrack.play(pipRef.current);
    }
  }, [focusRemote, remoteUser, tracks]);

  // ── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.endsAt) { setTimeLeft(''); return; }
    const endMs = new Date(session.endsAt).getTime();
    if (!Number.isFinite(endMs)) { setTimeLeft(''); return; }

    const format = (ms) => {
      if (ms <= 0) return '00:00';
      const s = Math.floor(ms / 1000);
      return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    const tick = () => setTimeLeft(format(endMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.endsAt]);

  // ── Auto-end when schedule time expires ─────────────────────────────────
  useEffect(() => {
    if (!session?.endsAt) return;
    const delay = new Date(session.endsAt).getTime() - Date.now();
    if (delay <= 0) { endSession(); return; }
    const t = setTimeout(endSession, delay);
    return () => clearTimeout(t);
  }, [endSession, session?.endsAt]);

  // ── Poll schedule status (doctor can end for all) ───────────────────────
  useEffect(() => {
    if (!session?.scheduleId || isDoctor) return;   // patients poll; doctor drives
    const id = setInterval(async () => {
      try {
        const { data } = await telemedicineApi.getSchedule(session.scheduleId);
        if (data.session_status === 'completed' || data.session_status === 'canceled') {
          setStatus('Doctor ended the session.');
          endSession();
        }
      } catch { /* ignore transient */ }
    }, 5000);
    return () => clearInterval(id);
  }, [endSession, isDoctor, session?.scheduleId]);

  // ── Controls ─────────────────────────────────────────────────────────────
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

  const extendTime = async (minutes) => {
    if (!session?.scheduleId) return;
    try {
      const { data } = await telemedicineApi.extend(session.scheduleId, minutes);
      setSession((prev) => ({ ...prev, endsAt: data.ends_at || prev.endsAt }));
      setStatus(`Session extended by ${minutes} min.`);
    } catch (err) {
      setStatus(err?.response?.data?.error || 'Failed to extend session.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-white via-blue-50 to-blue-100 px-4 py-6 text-slate-900">
      <div className="mx-auto grid w-[min(1120px,96vw)] gap-4">

        {/* Header */}
        <header className="rounded-3xl border border-blue-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                Live Consultation
              </p>
              <h1 className="text-xl font-bold text-blue-700 md:text-2xl">
                {session?.title || 'Telemedicine Session'}
              </h1>
              <p className="mt-1 text-sm text-slate-600">{status}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${isDoctor ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                {isDoctor ? '👨‍⚕️ Doctor' : '👤 Patient'}
              </span>
              <span className="text-sm text-slate-500">{displayName}</span>
            </div>
          </div>
          {timeLeft && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              ⏱ Ends in {timeLeft}
            </p>
          )}
          {noticeTxt && (
            <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
              {noticeTxt}
            </p>
          )}
        </header>

        {/* Video area */}
        <section className="rounded-3xl border border-blue-200 bg-white p-3 shadow-sm md:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-blue-700 md:text-lg">Consultation View</h2>
            <button
              className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 transition"
              onClick={() => setFocusRemote((v) => !v)}
            >
              Switch Focus
            </button>
          </div>
          <div className="relative">
            {/* Main video */}
            <div
              ref={mainRef}
              className="h-[300px] overflow-hidden rounded-2xl bg-slate-950 md:h-[460px]"
            />
            {/* PiP */}
            <div
              ref={pipRef}
              className="absolute bottom-3 right-3 h-[108px] w-[170px] overflow-hidden rounded-xl border-2 border-white bg-slate-950 shadow-lg md:h-[150px] md:w-[230px]"
            />
          </div>
          {!remoteUser && tracks.length > 0 && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Waiting for the other participant to join…
            </p>
          )}
        </section>

        {/* Controls */}
        <section className="flex flex-wrap gap-2.5">
          <button
            className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 transition"
            onClick={toggleCamera}
          >
            {cameraOn ? '📷 Camera Off' : '📷 Camera On'}
          </button>
          <button
            className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 transition"
            onClick={toggleMic}
          >
            {micOn ? '🎙 Mute' : '🎙 Unmute'}
          </button>
          {isDoctor && (
            <>
              <button
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 transition"
                onClick={() => extendTime(5)}
              >
                +5 min
              </button>
              <button
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 transition"
                onClick={() => extendTime(10)}
              >
                +10 min
              </button>
            </>
          )}
          <button
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-60"
            onClick={endSession}
            disabled={ending}
          >
            {ending ? 'Ending…' : isDoctor ? '🔴 End Session for All' : '🚪 Leave Session'}
          </button>
          <button
            className="ml-auto rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            onClick={goBack}
          >
            ← Back to Dashboard
          </button>
        </section>

      </div>
    </div>
  );
}
