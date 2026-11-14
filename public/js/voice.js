// Gọi thoại 1-1 bằng WebRTC (âm thanh đi thẳng giữa hai trình duyệt, máy chủ chỉ chuyển tín hiệu).
// Luồng: A bấm "Gọi thoại" → gửi 'ring' → B bấm "Nghe" (bật mic) → gửi 'ready' → A tạo offer → B trả answer.
const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];

export function createVoice({ signal, onState }) {
  let pc = null, mic = null, audio = null, pendingIce = [], state = 'idle';
  const set = s => { state = s; onState?.(s); };

  async function getMic() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Trình duyệt không hỗ trợ micro (cần mở qua https hoặc localhost).');
    mic ??= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    return mic;
  }

  function makePC() {
    pc = new RTCPeerConnection({ iceServers: ICE });
    for (const t of mic.getTracks()) pc.addTrack(t, mic);
    pc.onicecandidate = e => e.candidate && signal({ k: 'ice', c: e.candidate.toJSON() });
    pc.ontrack = e => {
      audio ??= Object.assign(document.createElement('audio'), { autoplay: true });
      audio.srcObject = e.streams[0];
      audio.play?.().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (pc?.connectionState === 'connected') set('live');
      else if (['failed', 'disconnected'].includes(pc?.connectionState)) set('failed');
    };
  }

  async function flushIce() {
    for (const c of pendingIce) await pc.addIceCandidate(c).catch(() => {});
    pendingIce = [];
  }

  function stop(notify = true) {
    if (notify && state !== 'idle') signal({ k: 'hang' });
    pc?.close();
    pc = null;
    mic?.getTracks().forEach(t => t.stop());
    mic = null;
    if (audio) audio.srcObject = null;
    pendingIce = [];
    set('idle');
  }

  return {
    get state() { return state; },
    async call() {
      await getMic();
      set('ringing-out');
      signal({ k: 'ring' });
    },
    async accept() {
      await getMic();
      makePC();
      set('connecting');
      signal({ k: 'ready' });
    },
    decline() {
      signal({ k: 'hang' });
      set('idle');
    },
    hangup: () => stop(true),
    reset: () => stop(false),
    setMuted(m) { mic?.getAudioTracks().forEach(t => (t.enabled = !m)); },
    async onSignal(d) {
      try {
        if (d.k === 'ring') set('ringing-in');
        else if (d.k === 'ready' && state === 'ringing-out') {
          makePC();
          set('connecting');
          await pc.setLocalDescription(await pc.createOffer());
          signal({ k: 'sdp', sdp: pc.localDescription.toJSON() });
        } else if (d.k === 'sdp' && pc) {
          await pc.setRemoteDescription(d.sdp);
          await flushIce();
          if (d.sdp.type === 'offer') {
            await pc.setLocalDescription(await pc.createAnswer());
            signal({ k: 'sdp', sdp: pc.localDescription.toJSON() });
          }
        } else if (d.k === 'ice' && d.c) {
          if (pc?.remoteDescription) await pc.addIceCandidate(d.c).catch(() => {});
          else pendingIce.push(d.c);
        } else if (d.k === 'hang') stop(false);
      } catch (e) {
        console.warn('voice', e);
        set('failed');
      }
    },
  };
}
