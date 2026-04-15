import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { telemedicineApi } from '../../api';

const appId = import.meta.env.VITE_AGORA_APP_ID || '';

export default function PatientTelemedicineJoin() {
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'patient';

  const [status, setStatus] = useState('idle');
  const [err, setErr] = useState('');
  const [session, setSession] = useState(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const localVideoRef = useRef(null);
  const remoteContainerRef = useRef(null);

  useEffect(() => {
    if (!appId) {
      setErr('Missing VITE_AGORA_APP_ID in frontend env.');
      return;
    }

    let mounted = true;
    (async () => {
      setStatus('loading');
      setErr('');
      const uid = Math.floor(Math.random() * 100000);
      const { data } = await telemedicineApi.generateSession(scheduleId, {
        uid,
        role: role === 'doctor' ? 'publisher' : 'subscriber'
      });
      if (!mounted) return;
      setSession(data);
      setStatus('ready');
    })().catch((e) => {
      setErr(e?.response?.data?.error || 'Failed to create session');
      setStatus('error');
    });
    return () => {
      mounted = false;
    };
  }, [scheduleId, role]);

  const join = async () => {
    if (!session) return;
    setErr('');
    setStatus('joining');
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        const player = document.createElement('div');
        player.style.width = '100%';
        player.style.height = '260px';
        player.className = 'rounded-md border border-slate-200 bg-black';
        player.id = `remote-${user.uid}`;
        remoteContainerRef.current?.appendChild(player);
        user.videoTrack?.play(player);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    client.on('user-unpublished', (user) => {
      const el = document.getElementById(`remote-${user.uid}`);
      if (el) el.remove();
    });

    try {
      await client.join(appId, session.channelName, session.token, session.uid);
      const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current.audio = audio;
      localTracksRef.current.video = video;
      if (localVideoRef.current) {
        video.play(localVideoRef.current);
      }
      await client.publish([audio, video]);
      setStatus('in_call');
    } catch (e) {
      setErr(e?.message || 'Failed to join Agora');
      setStatus('error');
    }
  };

  const leave = async () => {
    setErr('');
    const client = clientRef.current;
    const { audio, video } = localTracksRef.current;
    try {
      if (audio) {
        audio.stop();
        audio.close();
      }
      if (video) {
        video.stop();
        video.close();
      }
      localTracksRef.current = { audio: null, video: null };
      if (client) {
        await client.leave();
      }
    } finally {
      clientRef.current = null;
      if (remoteContainerRef.current) remoteContainerRef.current.innerHTML = '';
      setStatus('ready');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Telemedicine Session</h2>
        <p className="mt-1 text-slate-600">Schedule #{scheduleId}</p>
        {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={join}
            disabled={status !== 'ready'}
            className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Join call
          </button>
          <button
            type="button"
            onClick={leave}
            disabled={status !== 'in_call'}
            className="rounded-md border border-slate-300 px-4 py-2 hover:bg-white disabled:opacity-50"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">You</div>
          <div ref={localVideoRef} className="mt-3 h-[260px] rounded-md border border-slate-200 bg-black" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Remote</div>
          <div ref={remoteContainerRef} className="mt-3 space-y-3" />
        </div>
      </div>
    </div>
  );
}

