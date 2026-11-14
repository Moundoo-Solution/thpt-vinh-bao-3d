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
