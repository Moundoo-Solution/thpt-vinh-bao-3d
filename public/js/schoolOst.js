// Nhạc nền — Ký ức sân trường OST by FRANK (Phạm Ngọc Trường Giang)
import { unlockAudio } from './sound.js';

const DAY_TRACKS = [
  'audio/ost/ra-choi.mp3?v=1',      // OST1 — Ra chơi!
  'audio/ost/tan-hoc.mp3?v=1',      // OST2 — Tan học
];
const NIGHT_TRACK = 'audio/ost/hanh-lang-chieu.mp3?v=1'; // OST3 — Hành lang chiều
const BG_GAIN = 0.48;
const NIGHT_THRESH = 0.42;
const OST_KEY = 'vinhbao-ost-on';

let enabled = typeof localStorage !== 'undefined' && localStorage.getItem(OST_KEY) !== '0';

const bus = {
  el: null,
  gain: null,
  ctx: null,
  armed: false,
  playing: false,
  mode: 'day', // 'day' | 'night'
  dayIdx: 0,
  endedBound: false,
};

function setGain(value, tc = 0.35) {
  if (!bus.gain || !bus.ctx) return;
  const v = Math.max(0, Math.min(BG_GAIN, value));
  const t = bus.ctx.currentTime;
  if (!Number.isFinite(t)) {
    bus.gain.gain.value = v;
    return;
  }
  bus.gain.gain.setTargetAtTime(v, t, tc);
}

function bindEnded(el) {
  if (bus.endedBound) return;
  bus.endedBound = true;
  el.addEventListener('ended', () => {
    if (!bus.armed || bus.mode !== 'day') return;
    bus.dayIdx = (bus.dayIdx + 1) % DAY_TRACKS.length;
    el.loop = false;
    el.src = DAY_TRACKS[bus.dayIdx];
    el.load();
    el.play().then(() => { bus.playing = true; }).catch(() => { bus.playing = false; });
  });
}

function ensureBus() {
  if (bus.gain) return bus;
  const ctx = unlockAudio();
  const el = new Audio(DAY_TRACKS[0]);
  el.loop = false;
  el.preload = 'auto';
  el.crossOrigin = 'anonymous';
  bindEnded(el);
  const src = ctx.createMediaElementSource(el);
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(gain).connect(ctx.destination);
  bus.el = el;
  bus.gain = gain;
  bus.ctx = ctx;
  bus.dayIdx = 0;
  bus.mode = 'day';
  return bus;
}

async function startPlay() {
  const b = ensureBus();
  try {
    if (!b.el.src || b.el.ended) {
      const src = b.mode === 'night' ? NIGHT_TRACK : DAY_TRACKS[b.dayIdx];
      b.el.src = src;
      b.el.loop = b.mode === 'night';
      b.el.load();
    }
    await b.el.play();
    b.playing = true;
  } catch (e) {
    console.warn('school OST play', e);
  }
}

function applyMode(night) {
  const want = night > NIGHT_THRESH ? 'night' : 'day';
  if (want === bus.mode) return;
  bus.mode = want;
  if (!bus.el) return;
  const wasPlaying = bus.playing && !bus.el.paused;
  if (want === 'night') {
    bus.el.loop = true;
    bus.el.src = NIGHT_TRACK;
  } else {
    bus.el.loop = false;
    bus.el.src = DAY_TRACKS[bus.dayIdx];
  }
  bus.el.load();
  if (bus.armed && wasPlaying) {
    bus.el.play().then(() => { bus.playing = true; }).catch(() => { bus.playing = false; });
  }
}

export function isSchoolOstEnabled() {
  return enabled;
}

export function setSchoolOstEnabled(on) {
  enabled = !!on;
  try {
    localStorage.setItem(OST_KEY, enabled ? '1' : '0');
  } catch { /* private mode */ }
  if (!enabled) stopSchoolOst();
  else if (bus.armed) {
    startPlay().then(() => setGain(BG_GAIN, 0.5)).catch(() => {});
  }
  return enabled;
}

export function toggleSchoolOst() {
  return setSchoolOstEnabled(!enabled);
}

/** Bật nhạc nền sau khi người chơi vào trường (cần tương tác âm thanh). */
export function armSchoolOst() {
  ensureBus();
  bus.armed = true;
  if (!enabled) {
    setGain(0);
    return;
  }
  startPlay().then(() => {
    setGain(BG_GAIN, 0.8);
  }).catch(() => {
    setGain(0);
  });
}

/** Cập nhật buổi sáng/chiều vs tối theo đồng hồ game. */
export function tickSchoolOst(dnInfo) {
  if (!bus.armed) return;
  if (!enabled) {
    if (bus.playing || (bus.gain?.gain?.value ?? 0) > 0.001) stopSchoolOst();
    return;
  }
  const night = dnInfo?.night ?? 0;
  applyMode(night);
  if (!bus.playing || bus.el?.paused) startPlay();
  const target = night > 0.15 ? BG_GAIN * (0.55 + night * 0.45) : BG_GAIN;
  setGain(target);
}

export function stopSchoolOst() {
  setGain(0, 0.15);
  if (bus.el && bus.playing) {
    try { bus.el.pause(); } catch { /* */ }
    bus.playing = false;
  }
}