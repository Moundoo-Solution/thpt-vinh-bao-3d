// Âm thanh tổng hợp bằng Web Audio — không cần file âm thanh.
let ac = null;

export function unlockAudio() {
  ac ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function noiseBurst(a, t, dur, cutoff, gain) {
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}

// Ba hồi trống trường: "tùng – tùng – tùng".
export function drumSound() {
  const a = unlockAudio();
  [0, 0.42, 0.84].forEach(dt => {
    const t = a.currentTime + dt;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(115, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.55);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.95, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 1.05);
    noiseBurst(a, t, 0.18, 700, 0.55);
  });
}

// Vỗ tay khán giả — vài tiếng gõ tay ngắn.
export function clapSound(bursts = 4) {
  const a = unlockAudio();
  for (let i = 0; i < bursts; i++) {
    const t = a.currentTime + i * 0.2;
    noiseBurst(a, t, 0.035, 2400, 0.28);
    noiseBurst(a, t + 0.02, 0.02, 4500, 0.12);
  }
}

export function chimeSound() {
  const a = unlockAudio();
  [880, 1174.66, 1567.98].forEach((f, i) => {
    const t = a.currentTime + i * 0.09;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 0.75);
  });
}

// Kẻng sắt: nhiều hoạ âm không điều hoà, gõ dồn 4 tiếng.
export function kengSound() {
  const a = unlockAudio();
  [0, 0.26, 0.52, 0.78].forEach(dt => {
    const t = a.currentTime + dt;
    [[523, 0.35], [1287, 0.22], [2093, 0.14], [2961, 0.08]].forEach(([f, v]) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 1.4);
      o.connect(g).connect(a.destination);
      o.start(t);
      o.stop(t + 1.45);
    });
    noiseBurst(a, t, 0.05, 6000, 0.25);
  });
}

// Pháo hoa: tiếng rít khi bắn (tần số tăng dần).
export function fireworkWhistle(vol = 0.45) {
  if (vol < 0.03) return;
  const a = unlockAudio();
  const t = a.currentTime;
  const dur = 1.12;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(320, t);
  o.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.82);
  o.frequency.exponentialRampToValueAtTime(650, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol * 0.2, t + 0.035);
  g.gain.setValueAtTime(vol * 0.16, t + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.04);
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 0.65;
  const src = a.createBufferSource();
  src.buffer = buf;
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(520, t);
  bp.frequency.exponentialRampToValueAtTime(4200, t + dur * 0.88);
  bp.Q.value = 9;
  const gn = a.createGain();
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol * 0.11, t + 0.04);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(gn).connect(a.destination);
  src.start(t);
}

// Pháo hoa: tiếng nổ (bụp trầm + nổ nhỏ phía sau với quả bông).
export function fireworkBoom(vol = 0.5, kind = 'ball') {
  if (vol < 0.03) return;
  const a = unlockAudio();
  const t = a.currentTime;
  const dur = kind === 'ray' ? 0.48 : 0.72;
  noiseBurst(a, t, dur, kind === 'ray' ? 480 : 260, vol * 0.8);
  noiseBurst(a, t, 0.07, 160, vol * 0.42);
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(kind === 'ray' ? 95 : 68, t);
  o.frequency.exponentialRampToValueAtTime(32, t + dur);
  g.gain.setValueAtTime(vol * 0.32, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
  if (kind === 'ball') {
    for (let i = 0; i < 7; i++) {
      noiseBurst(a, t + 0.04 + i * 0.065, 0.035, 1400 + i * 350, vol * 0.12);
    }
  } else {
    noiseBurst(a, t + 0.03, 0.12, 2200, vol * 0.18);
  }
}
