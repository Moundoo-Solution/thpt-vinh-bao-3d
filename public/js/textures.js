// Mọi texture được vẽ bằng canvas lúc chạy — không cần file ảnh ngoài.
import * as THREE from 'three';

const FONT = '"Helvetica Neue", Arial, "Segoe UI", sans-serif';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, repeat = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function fitFont(ctx, text, maxW, size, weight = 'bold') {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (ctx.measureText(text).width > maxW && s > 8) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

// Gạch đỏ lát sân (gạch lá nem), n×n viên mỗi ô texture.
export function tileTexture(base = '#b4553c', grout = '#7d3a2a', n = 4, seed = 7) {
  const [c, x] = makeCanvas(256, 256);
  const r = seeded(seed);
  const s = 256 / n;
  x.fillStyle = grout;
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      x.fillStyle = shade(base, (r() - 0.5) * 0.12);
      x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      for (let k = 0; k < 30; k++) {
        x.fillStyle = `rgba(0,0,0,${r() * 0.08})`;
        x.fillRect(i * s + 3 + r() * (s - 8), j * s + 3 + r() * (s - 8), 2, 2);
      }
    }
  }
  return toTexture(c, true);
}

// Cỏ sân bóng nhân tạo (xanh đậm hơn cỏ khuôn viên).
export function turfTexture() {
  const [c, x] = makeCanvas(256, 256);
  const r = seeded(17);
  x.fillStyle = '#2f7d3a';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8000; i++) {
    const g = 55 + Math.floor(r() * 45);
    x.fillStyle = `rgb(${g - 20},${g + 10},${g - 30})`;
    x.fillRect(r() * 256, r() * 256, 1, 3 + r() * 4);
  }
  x.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 6; i++) {
    x.beginPath();
    x.arc(128, 128, 30 + i * 22, 0, Math.PI * 2);
    x.stroke();
  }
  return toTexture(c, true);
}

export function grassTexture() {
  const [c, x] = makeCanvas(256, 256);
  const r = seeded(11);
  x.fillStyle = '#5b8c3a';
  x.fillRect(0, 0, 256, 256);
  const greens = ['#4d7d30', '#6a9c44', '#557f34', '#79a84d', '#46742b'];
  for (let i = 0; i < 4000; i++) {
    x.fillStyle = greens[Math.floor(r() * greens.length)];
    x.fillRect(r() * 256, r() * 256, 1 + r() * 2, 2 + r() * 3);
  }
  return toTexture(c, true);
}

export function asphaltTexture() {
  const [c, x] = makeCanvas(256, 256);
  const r = seeded(5);
  x.fillStyle = '#55595f';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = Math.floor(70 + r() * 40);
    x.fillStyle = `rgb(${v},${v},${v + 4})`;
    x.fillRect(r() * 256, r() * 256, 1.5, 1.5);
  }
  return toTexture(c, true);
}

// Một gian lớp học (rộng ~4 m, cao 1 tầng): cửa ra vào + cửa sổ.
export function facadeTexture(withDoor = true) {
  const [c, x] = makeCanvas(512, 512);
  x.fillStyle = '#f2d98c';
  x.fillRect(0, 0, 512, 512);
  x.fillStyle = '#d9b96a';
  x.fillRect(0, 470, 512, 42);
  const frame = (fx, fy, fw, fh) => {
    x.fillStyle = '#fbf6e6';
    x.fillRect(fx - 8, fy - 8, fw + 16, fh + 16);
  };
  if (withDoor) {
    frame(40, 190, 118, 282);
    x.fillStyle = '#7a4128';
    x.fillRect(40, 190, 118, 282);
    x.strokeStyle = '#5a2e1b';
    x.lineWidth = 4;
    x.strokeRect(52, 205, 42, 110);
    x.strokeRect(104, 205, 42, 110);
    x.strokeRect(52, 330, 42, 125);
    x.strokeRect(104, 330, 42, 125);
    x.fillStyle = '#c9a54a';
    x.fillRect(92, 320, 14, 6);
    // ô thoáng phía trên cửa
    frame(40, 120, 118, 46);
    x.fillStyle = '#5a2e1b';
    x.fillRect(40, 120, 118, 46);
    x.fillStyle = '#f2d98c';
    for (let i = 0; i < 6; i++) x.fillRect(46 + i * 19, 126, 8, 34);
  }
  const wx = withDoor ? 220 : 120, ww = withDoor ? 250 : 280;
  frame(wx, 170, ww, 205);
  const g = x.createLinearGradient(0, 170, 0, 375);
  g.addColorStop(0, '#6f8f98');
  g.addColorStop(1, '#3d555e');
  x.fillStyle = g;
  x.fillRect(wx, 170, ww, 205);
  x.fillStyle = '#7a4128';
  for (let i = 1; i < 4; i++) x.fillRect(wx + (ww / 4) * i - 4, 170, 8, 205);
  x.fillRect(wx, 262, ww, 7);
  // khung gỗ nâu quanh cửa sổ
  x.strokeStyle = '#7a4128';
  x.lineWidth = 10;
  x.strokeRect(wx, 170, ww, 205);
  // song sắt bảo vệ
  x.fillStyle = 'rgba(60,70,60,0.55)';
  for (let i = 0; i < 12; i++) x.fillRect(wx + 10 + i * (ww - 20) / 11, 170, 3, 205);
  return toTexture(c, true);
}

// Lan can con tiện (nền trong suốt, dùng alphaTest).
export function balustradeTexture() {
  const [c, x] = makeCanvas(256, 128);
  x.clearRect(0, 0, 256, 128);
  x.fillStyle = '#fbf6e6';
  x.fillRect(0, 0, 256, 16);
  x.fillRect(0, 112, 256, 16);
  for (let i = 0; i < 4; i++) {
    const cx = 32 + i * 64;
    x.beginPath();
    x.moveTo(cx - 9, 16);
    x.quadraticCurveTo(cx - 22, 60, cx - 7, 72);
    x.quadraticCurveTo(cx - 20, 92, cx - 12, 112);
    x.lineTo(cx + 12, 112);
    x.quadraticCurveTo(cx + 20, 92, cx + 7, 72);
    x.quadraticCurveTo(cx + 22, 60, cx + 9, 16);
    x.closePath();
    x.fill();
  }
  const t = toTexture(c, true);
  return t;
}

// Ô tường rào: nền đỏ sẫm, hoa văn tròn màu vàng (theo ảnh cổng trường).
export function fencePanelTexture() {
  const [c, x] = makeCanvas(256, 160);
  x.fillStyle = '#f3cf55';
  x.fillRect(0, 0, 256, 160);
  x.fillStyle = '#8e2a22';
  x.fillRect(8, 8, 240, 144);
  x.strokeStyle = 'rgba(0,0,0,0.12)';
  x.lineWidth = 1;
  for (let y = 20; y < 150; y += 14) {
    x.beginPath();
    x.moveTo(8, y);
    x.lineTo(248, y);
    x.stroke();
  }
  const cx = 128, cy = 80;
  x.fillStyle = '#f3cf55';
  x.beginPath();
  x.arc(cx, cy, 52, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = '#8e2a22';
  x.lineWidth = 5;
  for (const r of [40, 28, 16]) {
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.stroke();
  }
  x.fillStyle = '#8e2a22';
  x.beginPath();
  x.arc(cx, cy, 5, 0, Math.PI * 2);
  x.fill();
  return toTexture(c);
}

// Biển chữ nhiều dòng, tự co cỡ chữ cho vừa.
export function signTexture(lines, o = {}) {
  const { w = 1024, h = 192, bg = '#b71c1c', fg = '#ffd54a', border = '#ffd54a', size = 110 } = o;
  const [c, x] = makeCanvas(w, h);
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  if (border) {
    x.strokeStyle = border;
    x.lineWidth = Math.max(4, h * 0.04);
    x.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
  }
  x.fillStyle = fg;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const rows = Array.isArray(lines) ? lines : [lines];
  const rowH = h / rows.length;
  rows.forEach((line, i) => {
    const text = typeof line === 'string' ? line : line.text;
    const s = typeof line === 'string' ? size / rows.length * 1.15 : line.size;
    x.fillStyle = (typeof line !== 'string' && line.color) || fg;
    fitFont(x, text, w * 0.9, s, (typeof line !== 'string' && line.weight) || 'bold');
    x.fillText(text, w / 2, rowH * (i + 0.55));
  });
  return toTexture(c);
}

function drawGoldExtrudeTitle(ctx, text, cx, cy, maxPx, maxW) {
  const size = fitFont(ctx, text, maxW, maxPx, '900');
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 10; i >= 1; i--) {
    const t = i / 10;
    ctx.fillStyle = `rgb(${Math.round(52 + 38 * t)}, ${Math.round(32 + 28 * t)}, ${Math.round(6 + 6 * t)})`;
    ctx.fillText(text, cx + i * 1.05, cy + i * 1.12);
  }
  const face = ctx.createLinearGradient(0, cy - size * 0.58, 0, cy + size * 0.42);
  face.addColorStop(0, '#fff8e6');
  face.addColorStop(0.08, '#ffe97a');
  face.addColorStop(0.22, '#f5d542');
  face.addColorStop(0.48, '#e6b42e');
  face.addColorStop(0.72, '#c98c1c');
  face.addColorStop(0.9, '#9a6612');
  face.addColorStop(1, '#7a4e0c');
  ctx.fillStyle = face;
  ctx.fillText(text, cx, cy);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(text, cx - 1.2, cy - size * 0.14);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(90,55,8,0.45)';
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = 'rgba(255,255,220,0.22)';
  ctx.fillText(text, cx - 0.5, cy - size * 0.08);
  return size;
}

// Biển POPPY PET — texture vẽ chuẩn (1 Zalo, FB + địa chỉ đủ).
export function poppyPetBillboardTexture() {
  const w = 1600;
  const h = 443;
  const [c, x] = makeCanvas(w, h);
  const bg = x.createRadialGradient(w * 0.48, h * 0.32, 30, w * 0.5, h * 0.45, w * 0.92);
  bg.addColorStop(0, '#b8f286');
  bg.addColorStop(0.35, '#7ce05e');
  bg.addColorStop(0.75, '#58c843');
  bg.addColorStop(1, '#45b236');
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  const rnd = seeded(771);
  for (let i = 0; i < 11000; i++) {
    x.fillStyle = `rgba(255,255,255,${rnd() * 0.04})`;
    x.fillRect(rnd() * w, rnd() * h, 1.4, 1.4);
  }
  const title = 'POPPY PET';
  const ty = h * 0.32;
  drawGoldExtrudeTitle(x, title, w / 2, ty, 156, w * 0.92);
  const sub = 'CẮT TỈA - THỨC ĂN - PHỤ KIỆN THÚ CƯNG';
  let ts = fitFont(x, sub, w * 0.95, 52, '700');
  x.font = `700 ${ts}px ${FONT}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const subY = h * 0.585;
  x.fillStyle = '#0a0a0a';
  x.fillText(sub, w / 2, subY);
  const subW = x.measureText(sub).width;
  const lineY = subY + ts * 0.62;
  x.strokeStyle = '#101010';
  x.lineWidth = 2.2;
  x.beginPath();
  x.moveTo(32, lineY);
  x.lineTo(w / 2 - subW / 2 - 28, lineY);
  x.moveTo(w / 2 + subW / 2 + 28, lineY);
  x.lineTo(w - 32, lineY);
  x.stroke();
  const footY = h * 0.875;
  const footSize = fitFont(x, 'ĐC : 118A TÂN HÒA - VĨNH BẢO', (w / 3) - 24, 36, '600');
  x.font = `600 ${footSize}px ${FONT}`;
  x.textAlign = 'left';
  x.fillStyle = '#111';
  const colW = w / 3;
  x.fillText('ZALO : 0829.982.682', 24, footY);
  x.fillText('FACEBOOK : PHẠM VĂN LỊCH', colW + 12, footY);
  x.fillText('ĐC : 118A TÂN HÒA - VĨNH BẢO', colW * 2 + 8, footY);
  x.strokeStyle = 'rgba(0,0,0,0.12)';
  x.lineWidth = 3;
  x.strokeRect(10, 10, w - 20, h - 20);
  return toTexture(c);
}

// Biển quảng cáo Tý Cưng — lan can xanh đối diện cổng trường (Vinh Quang 2).
export function tyCungBillboardTexture() {
  const [c, x] = makeCanvas(1200, 900);
  const g = x.createLinearGradient(0, 0, 0, 900);
  g.addColorStop(0, '#ececef');
  g.addColorStop(1, '#dcdfe3');
  x.fillStyle = g;
  x.fillRect(0, 0, 1200, 900);
  x.strokeStyle = '#5a5a5a';
  x.lineWidth = 10;
  x.strokeRect(18, 18, 1164, 864);
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const cx = 600;
  const yTitle = 310;
  const yTag = 500;
  const yAddr = 640;
  x.fillStyle = '#2f73b8';
  let tsize = fitFont(x, 'Tý Cưng', 1000, 200, '900');
  x.font = `900 ${tsize}px ${FONT}`;
  x.fillText('Tý Cưng', cx, yTitle);
  x.strokeStyle = '#1b4f86';
  x.lineWidth = 4;
  x.strokeText('Tý Cưng', cx, yTitle);
  x.fillStyle = '#1a1a1a';
  tsize = fitFont(x, 'Thời Trang Cho Cả Gia Đình', 960, 68, 'bold');
  x.font = `bold ${tsize}px ${FONT}`;
  x.fillText('Thời Trang Cho Cả Gia Đình', cx, yTag);
  x.fillStyle = '#444';
  tsize = fitFont(x, 'Vinh Quang 2 · Vĩnh Bảo · Hải Phòng', 920, 52, '600');
  x.font = `600 ${tsize}px ${FONT}`;
  x.fillText('Vinh Quang 2 · Vĩnh Bảo · Hải Phòng', cx, yAddr);
  return toTexture(c);
}

// Sao pháo hoa (tâm sáng, viền mờ).
export function fireworkSparkTexture() {
  const [c, x] = makeCanvas(128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,245,200,1)');
  g.addColorStop(0.35, 'rgba(255,160,80,0.85)');
  g.addColorStop(0.65, 'rgba(255,60,120,0.35)');
  g.addColorStop(1, 'rgba(255,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return toTexture(c);
}

// Nồi luộc bánh chưng ngoài trời (mô phỏng ảnh báo chí / Pixabay: nồi gang, bánh xếp chặt, lá dong xanh).
export function banhChungBoilTexture() {
  const [c, x] = makeCanvas(512, 640);
  const night = x.createLinearGradient(0, 0, 0, 640);
  night.addColorStop(0, '#1a2530');
  night.addColorStop(0.55, '#2a2218');
  night.addColorStop(1, '#3d2818');
  x.fillStyle = night;
  x.fillRect(0, 0, 512, 640);
  // lửa củi phản chiếu
  const fire = x.createRadialGradient(256, 580, 10, 256, 580, 220);
  fire.addColorStop(0, 'rgba(255,180,60,0.55)');
  fire.addColorStop(0.5, 'rgba(255,90,20,0.15)');
  fire.addColorStop(1, 'rgba(255,0,0,0)');
  x.fillStyle = fire;
  x.fillRect(0, 380, 512, 260);
  // nồi gang
  x.fillStyle = '#2b2b2e';
  x.beginPath();
  x.ellipse(256, 520, 200, 52, 0, 0, Math.PI * 2);
  x.fill();
  const potGrad = x.createLinearGradient(80, 200, 430, 520);
  potGrad.addColorStop(0, '#4a4a50');
  potGrad.addColorStop(0.35, '#1e1e22');
  potGrad.addColorStop(1, '#0d0d10');
  x.fillStyle = potGrad;
  x.fillRect(108, 200, 296, 330);
  x.fillStyle = '#5a5a62';
  x.fillRect(96, 188, 320, 24);
  x.fillStyle = '#3a3a42';
  x.fillRect(108, 210, 296, 12);
  // nước sôi
  x.fillStyle = 'rgba(120,150,170,0.35)';
  x.fillRect(120, 240, 272, 38);
  for (let i = 0; i < 14; i++) {
    const bx = 135 + i * 18 + (i % 3) * 4;
    x.beginPath();
    x.arc(bx, 252 + (i % 2) * 4, 4 + (i % 3), 0, Math.PI * 2);
    x.fillStyle = 'rgba(200,220,235,0.4)';
    x.fill();
  }
  // xếp bánh chưng trong nồi (vuông lá dong)
  function banh(cx, cy, w, h, rot = 0) {
    x.save();
    x.translate(cx, cy);
    x.rotate(rot);
    x.fillStyle = '#2d6b3a';
    x.fillRect(-w / 2, -h / 2, w, h);
    x.strokeStyle = '#1e4a28';
    x.lineWidth = 3;
    x.strokeRect(-w / 2, -h / 2, w, h);
    x.strokeStyle = '#3f8a4a';
    x.lineWidth = 1;
    for (let k = -w / 2 + 8; k < w / 2; k += 14) {
      x.beginPath();
      x.moveTo(k, -h / 2);
      x.lineTo(k + 6, h / 2);
      x.stroke();
    }
    x.fillStyle = '#c9a227';
    x.fillRect(-w / 2 + 6, -h / 2 + 6, w - 12, 4);
    x.restore();
  }
  banh(256, 360, 120, 100, 0.05);
  banh(210, 310, 95, 78, -0.12);
  banh(305, 305, 92, 76, 0.1);
  banh(170, 365, 88, 72, 0.2);
  banh(340, 360, 90, 74, -0.08);
  banh(255, 280, 100, 82, 0);
  // khói
  for (let i = 0; i < 8; i++) {
    x.beginPath();
    x.ellipse(220 + i * 14, 150 + (i % 3) * 18, 28 + i * 3, 50 + i * 5, 0.3, 0, Math.PI * 2);
    x.fillStyle = `rgba(220,220,220,${0.08 + i * 0.02})`;
    x.fill();
  }
  x.fillStyle = 'rgba(255,255,255,0.75)';
  x.font = '600 22px "Helvetica Neue", Arial, sans-serif';
  x.textAlign = 'center';
  x.fillText('Nồi bánh chưng luộc', 256, 56);
  return toTexture(c);
}

// Băng rôn dọc: mỗi chữ một dòng.
export function verticalBannerTexture(words) {
  const [c, x] = makeCanvas(160, 800);
  x.fillStyle = '#c62828';
  x.fillRect(0, 0, 160, 800);
  x.strokeStyle = '#ffd54a';
  x.lineWidth = 6;
  x.strokeRect(10, 10, 140, 780);
  x.fillStyle = '#ffd54a';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const step = 760 / words.length;
  words.forEach((wd, i) => {
    fitFont(x, wd, 120, 70);
    x.fillText(wd, 80, 20 + step * (i + 0.5));
  });
  return toTexture(c);
}

export function flagTexture() {
  const [c, x] = makeCanvas(300, 200);
  x.fillStyle = '#da251d';
  x.fillRect(0, 0, 300, 200);
  x.fillStyle = '#ffde00';
  x.beginPath();
  const R = 62, r = R * 0.382;
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    x.lineTo(150 + Math.cos(a) * rad, 100 + Math.sin(a) * rad);
  }
  x.closePath();
  x.fill();
  return toTexture(c);
}

// Phông lễ khai giảng: nền vàng, cờ đỏ sao vàng bên trái (theo ảnh năm học 2023–2024).
export function ceremonyBackdropTexture() {
  const [c, x] = makeCanvas(1600, 470);
  const g = x.createLinearGradient(0, 0, 0, 470);
  g.addColorStop(0, '#fbe7a1');
  g.addColorStop(1, '#f3c95a');
  x.fillStyle = g;
  x.fillRect(0, 0, 1600, 470);
  x.fillStyle = '#d62a1e';
  x.beginPath();
  x.moveTo(0, 0); x.lineTo(330, 0); x.quadraticCurveTo(260, 240, 330, 470); x.lineTo(0, 470);
  x.fill();
  x.fillStyle = '#ffde00';
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? 26 : 68;
    x.lineTo(150 + Math.cos(a) * rad, 150 + Math.sin(a) * rad);
  }
  x.fill();
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = '#1d3f8f';
  fitFont(x, 'SỞ GIÁO DỤC VÀ ĐÀO TẠO HẢI PHÒNG', 900, 40);
  x.fillText('SỞ GIÁO DỤC VÀ ĐÀO TẠO HẢI PHÒNG', 960, 60);
  fitFont(x, 'TRƯỜNG THPT VĨNH BẢO', 900, 46);
  x.fillText('TRƯỜNG THPT VĨNH BẢO', 960, 112);
  x.fillStyle = '#d62a1e';
  x.font = 'bold 128px Georgia, "Times New Roman", serif';
  fitFont(x, 'LỄ KHAI GIẢNG', 1050, 130);
  x.fillText('LỄ KHAI GIẢNG', 960, 235);
  x.fillStyle = '#1d3f8f';
  fitFont(x, 'NĂM HỌC MỚI', 800, 64);
  x.fillText('NĂM HỌC MỚI', 960, 335);
  fitFont(x, 'Vĩnh Bảo – Hải Phòng', 600, 34, 'italic');
  x.fillText('Vĩnh Bảo – Hải Phòng', 960, 400);
  return toTexture(c);
}

export function honorBoardTexture(title, lines) {
  const [c, x] = makeCanvas(800, 1000);
  const g = x.createLinearGradient(0, 0, 800, 1000);
  g.addColorStop(0, '#f6d365');
  g.addColorStop(0.5, '#c99a2e');
  g.addColorStop(1, '#f6d365');
  x.fillStyle = g;
  x.fillRect(0, 0, 800, 1000);
  x.fillStyle = '#7f1d1d';
  x.fillRect(36, 36, 728, 928);
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = '#ffd54a';
  fitFont(x, title, 660, 64);
  x.fillText(title, 400, 120);
  x.fillRect(150, 175, 500, 4);
  x.textAlign = 'left';
  x.fillStyle = '#fff6dc';
  lines.forEach((ln, i) => {
    fitFont(x, '★ ' + ln, 660, 38, '600');
    x.fillText('★ ' + ln, 70, 250 + i * 100);
  });
  return toTexture(c);
}

// Mặt tiền nhà phố bên kia đường (1 tầng / ô texture).
export function houseFacadeTexture() {
  const [c, x] = makeCanvas(256, 256);
  x.clearRect(0, 0, 256, 256);
  x.fillStyle = 'rgba(255,255,255,0.0)';
  x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#3c4a55';
  x.fillRect(40, 60, 176, 150);
  x.fillStyle = '#8fb3c7';
  x.fillRect(50, 70, 75, 130);
  x.fillRect(131, 70, 75, 130);
  x.fillStyle = 'rgba(255,255,255,0.85)';
  x.fillRect(28, 200, 200, 10);
  for (let i = 0; i < 11; i++) x.fillRect(32 + i * 19, 168, 4, 34);
  x.fillRect(28, 165, 200, 6);
  return toTexture(c, true);
}

export function glowTexture(color = '255,230,140') {
  const [c, x] = makeCanvas(128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(${color},0.95)`);
  g.addColorStop(0.35, `rgba(${color},0.45)`);
  g.addColorStop(1, `rgba(${color},0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return toTexture(c);
}

// Gạch terrazzo hồng lát sân, hoa văn vòng tròn (theo ảnh sân trường 2022–2026). 2×2 viên mỗi ô.
export function terrazzoTexture() {
  const [c, x] = makeCanvas(256, 256);
  const r = seeded(21);
  x.fillStyle = '#c99586';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const ox = i * 128, oy = j * 128;
    x.fillStyle = shade('#dcae9f', (r() - 0.5) * 0.06);
    x.fillRect(ox + 2, oy + 2, 124, 124);
    x.strokeStyle = 'rgba(150, 95, 80, 0.55)';
    x.lineWidth = 3;
    for (const [cx, cy] of [[0, 0], [128, 0], [0, 128], [128, 128]]) {
      x.beginPath();
      x.arc(ox + cx, oy + cy, 64, 0, Math.PI * 2);
      x.stroke();
    }
    x.beginPath();
    x.arc(ox + 64, oy + 64, 22, 0, Math.PI * 2);
    x.stroke();
    for (let k = 0; k < 60; k++) {
      x.fillStyle = `rgba(255,255,255,${r() * 0.18})`;
      x.fillRect(ox + 3 + r() * 120, oy + 3 + r() * 120, 2, 2);
    }
  }
  return toTexture(c, true);
}

// Gạch bông tròn vách sảnh cầu thang (tham khảo 12tranphu.mango.pro.vn) — lỗ tròn xuyên nhìn ra sân.
export function breezeBlockStairTexture() {
  const [c, x] = makeCanvas(256, 256);
  x.fillStyle = '#f2ece3';
  x.fillRect(0, 0, 256, 256);
  const cell = 64;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const ox = i * cell, oy = j * cell;
      x.strokeStyle = '#d9cfc4';
      x.lineWidth = 2;
      x.strokeRect(ox + 1, oy + 1, cell - 2, cell - 2);
      x.fillStyle = '#e8e0d6';
      x.beginPath();
      x.arc(ox + cell / 2, oy + cell / 2, cell * 0.26, 0, Math.PI * 2);
      x.fill();
      x.strokeStyle = 'rgba(130, 110, 95, 0.35)';
      x.lineWidth = 2;
      x.stroke();
    }
  }
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const ox = i * cell, oy = j * cell;
      x.beginPath();
      x.arc(ox + cell / 2, oy + cell / 2, cell * 0.22, 0, Math.PI * 2);
      x.fill();
    }
  }
  return toTexture(c, true);
}

export function graniteTexture() {
  const [c, x] = makeCanvas(256, 256);
  const r = seeded(33);
  x.fillStyle = '#8f9290';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    const v = Math.floor(90 + r() * 90);
    x.fillStyle = `rgb(${v},${v},${v + 3})`;
    x.fillRect(r() * 256, r() * 256, 1.5, 1.5);
  }
  x.strokeStyle = 'rgba(60,60,60,0.35)';
  x.lineWidth = 2;
  x.strokeRect(1, 1, 254, 254);
  return toTexture(c, true);
}

// Bảng LED chữ đỏ chạy (dùng offset để cuộn).
// Màn hình LED sân khấu (panel xanh lễ ngoài trời ~2026).
export function ledStagePanelTexture() {
  const [c, x] = makeCanvas(512, 640);
  x.fillStyle = '#0d4d22';
  x.fillRect(0, 0, 512, 640);
  const g = x.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.35)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  g.addColorStop(1, 'rgba(0,0,0,0.35)');
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 640);
  x.strokeStyle = 'rgba(180,255,200,0.25)';
  x.lineWidth = 2;
  for (let i = 0; i < 512; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 640); x.stroke(); }
  for (let j = 0; j < 640; j += 8) { x.beginPath(); x.moveTo(0, j); x.lineTo(512, j); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,0.92)';
  x.textAlign = 'center';
  fitFont(x, 'THPT VĨNH BẢO', 460, 52);
  x.fillText('THPT VĨNH BẢO', 256, 300);
  return toTexture(c);
}

// Rạp bạt sọc đỏ trắng che nắng sân (ảnh lễ 2026).
export function canopyStripeTexture() {
  const [c, x] = makeCanvas(256, 256);
  for (let i = 0; i < 16; i++) {
    x.fillStyle = i % 2 ? '#d32f2f' : '#ffffff';
    x.fillRect(i * 16, 0, 16, 256);
  }
  x.fillStyle = 'rgba(0,0,0,0.06)';
  for (let j = 0; j < 256; j += 4) x.fillRect(0, j, 256, 2);
  return toTexture(c, true);
}

// Mặt tiền nhà trắng (khối A).
export function modernFacadeTexture(base = '#e8eaed', win = '#8fa8bc') {
  const [c, x] = makeCanvas(256, 256);
  x.fillStyle = base;
  x.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
    x.fillStyle = win;
    x.fillRect(28 + col * 72, 22 + row * 58, 48, 38);
    x.fillStyle = 'rgba(255,255,255,0.35)';
    x.fillRect(30 + col * 72, 24 + row * 58, 20, 34);
  }
  x.strokeStyle = '#b0bec5';
  x.lineWidth = 2;
  x.strokeRect(0, 0, 256, 256);
  return toTexture(c, true);
}

export function ledTexture(text) {
  const [c, x] = makeCanvas(2048, 128);
  x.fillStyle = '#140707';
  x.fillRect(0, 0, 2048, 128);
  x.fillStyle = '#ff3b2f';
  x.textBaseline = 'middle';
  fitFont(x, text, 1900, 78);
  x.fillText(text, 40, 66);
  x.fillStyle = 'rgba(20,7,7,0.85)';
  for (let i = 0; i < 2048; i += 6) x.fillRect(i, 0, 2, 128);
  for (let j = 0; j < 128; j += 6) x.fillRect(0, j, 2048, 2);
  return toTexture(c, true);
}

// Cửa sổ tròn chấn song trên tháp cổng (theo ảnh cổng nhìn từ trong).
export function roundWindowTexture() {
  const [c, x] = makeCanvas(256, 256);
  x.clearRect(0, 0, 256, 256);
  x.fillStyle = '#5b3a2a';
  x.beginPath();
  x.arc(128, 128, 120, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#b9c7cc';
  x.beginPath();
  x.arc(128, 128, 104, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = '#5b3a2a';
  x.lineWidth = 12;
  x.strokeRect(78, 78, 100, 100);
  for (const [a, b, cc, d] of [[128, 24, 128, 78], [128, 178, 128, 232], [24, 128, 78, 128], [178, 128, 232, 128]]) {
    x.beginPath();
    x.moveTo(a, b);
    x.lineTo(cc, d);
    x.stroke();
  }
  return toTexture(c);
}

// Sân bóng cỏ nhân tạo: sọc cắt cỏ + vạch vôi (toàn sân một ảnh, 105×68 m tỉ lệ).
export function pitchTexture() {
  const [c, x] = makeCanvas(2048, 1024);
  const W = 2048, H = 1024;
  for (let i = 0; i < 16; i++) {
    x.fillStyle = i % 2 ? '#4f9a3a' : '#5aa944';
    x.fillRect((i * W) / 16, 0, W / 16 + 1, H);
  }
  const r = seeded(9);
  for (let i = 0; i < 9000; i++) {
    x.fillStyle = `rgba(20,60,10,${r() * 0.12})`;
    x.fillRect(r() * W, r() * H, 2, 2);
  }
  const m = 40, fw = W - 2 * m, fh = H - 2 * m, sx = fw / 105, sy = fh / 68;
  x.strokeStyle = 'rgba(255,255,255,0.92)';
  x.lineWidth = 6;
  x.strokeRect(m, m, fw, fh);
  x.beginPath();
  x.moveTo(W / 2, m);
  x.lineTo(W / 2, H - m);
  x.stroke();
  x.beginPath();
  x.arc(W / 2, H / 2, 9.15 * sx, 0, Math.PI * 2);
  x.stroke();
  for (const side of [0, 1]) {
    const x0 = side ? W - m - 16.5 * sx : m, x1 = side ? W - m - 5.5 * sx : m;
    x.strokeRect(x0, H / 2 - 20.15 * sy, 16.5 * sx, 40.3 * sy);
    x.strokeRect(x1, H / 2 - 9.15 * sy, 5.5 * sx, 18.3 * sy);
    x.beginPath();
    x.arc(side ? W - m - 11 * sx : m + 11 * sx, H / 2, 4, 0, Math.PI * 2);
    x.fillStyle = '#fff';
    x.fill();
  }
  return toTexture(c);
}

// Hàng rào sắt mỹ thuật màu xanh đậm, hoa văn bông tròn (vỉa hè đối diện cổng). Nền trong suốt.
export function ornamentFenceTexture() {
  const [c, x] = makeCanvas(512, 256);
  x.clearRect(0, 0, 512, 256);
  x.fillStyle = '#1f4a2e';
  x.fillRect(0, 10, 512, 14);
  x.fillRect(0, 226, 512, 14);
  x.fillRect(0, 196, 512, 8);
  for (let i = 0; i < 512; i += 21) x.fillRect(i, 10, 6, 230);
  // bông hoa văn ở giữa ô
  x.strokeStyle = '#1f4a2e';
  x.lineWidth = 9;
  const cx = 256, cy = 112;
  x.clearRect(cx - 62, cy - 62, 124, 124);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    x.beginPath();
    x.arc(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, 22, 0, Math.PI * 2);
    x.stroke();
  }
  x.beginPath();
  x.arc(cx, cy, 58, 0, Math.PI * 2);
  x.stroke();
  return toTexture(c, true);
}

// Lưới chắn bóng (ô vuông mảnh, nền trong suốt).
export function netTexture() {
  const [c, x] = makeCanvas(128, 128);
  x.clearRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(235,235,235,0.9)';
  x.lineWidth = 2;
  for (let i = 0; i <= 128; i += 16) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke();
    x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke();
  }
  return toTexture(c, true);
}

// Mặt tiền nhà ống: cửa cuốn tầng 1 + cửa sổ/ban công các tầng trên (1 ô = cả mặt nhà).
export function shopHouseTexture(floors, wall, shop) {
  const [c, x] = makeCanvas(256, 128 * floors);
  const H = 128 * floors;
  x.fillStyle = wall;
  x.fillRect(0, 0, 256, H);
  // tầng 1: cửa cuốn + biển hiệu
  x.fillStyle = '#8f9396';
  x.fillRect(24, H - 100, 208, 100);
  x.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = H - 100; y < H; y += 7) x.fillRect(24, y, 208, 2);
  if (shop) {
    x.fillStyle = shop.bg;
    x.fillRect(10, H - 126, 236, 26);
    x.fillStyle = shop.fg;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    fitFont(x, shop.text, 224, 20);
    x.fillText(shop.text, 128, H - 112);
  }
  for (let f = 1; f < floors; f++) {
    const y = H - 128 * (f + 1);
    x.fillStyle = '#3d4b55';
    x.fillRect(40, y + 24, 176, 72);
    x.fillStyle = '#8fb0c2';
    x.fillRect(48, y + 30, 76, 60);
    x.fillRect(132, y + 30, 76, 60);
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.fillRect(30, y + 96, 196, 8);
    for (let i = 0; i < 12; i++) x.fillRect(34 + i * 16, y + 76, 3, 22);
  }
  return toTexture(c);
}

// Biển tên lớp/phòng: gom tất cả vào một ảnh (atlas) để chỉ tốn một vật liệu. Trả về texture + toạ độ UV từng ô.
export function plateAtlas(names) {
  const cw = 256, ch = 80, cols = 8, rows = Math.max(1, Math.ceil(names.length / cols));
  let H = 64;
  while (H < rows * ch) H *= 2;
  const [c, x] = makeCanvas(cw * cols, H);
  const cells = new Map();
  names.forEach((name, i) => {
    const ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch;
    const code = String(name ?? '').toUpperCase().replace(/\s/g, '');
    const isClass = /^\d{1,2}[A-Z]{1,2}\d{0,2}$/.test(code);
    x.fillStyle = isClass ? '#1f4fa0' : '#2e6b3a';
    x.fillRect(ox + 2, oy + 2, cw - 4, ch - 4);
    x.strokeStyle = '#ffffff';
    x.lineWidth = 4;
    x.strokeRect(ox + 8, oy + 8, cw - 16, ch - 16);
    x.fillStyle = '#ffffff';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const label = isClass ? `LỚP ${code}` : code;
    fitFont(x, label, cw - 30, isClass ? 44 : 30);
    x.fillText(label, ox + cw / 2, oy + ch / 2 + 2);
    cells.set(name, [ox / (cw * cols), 1 - (oy + ch) / H, (ox + cw) / (cw * cols), 1 - oy / H]);
  });
  const tex = toTexture(c);
  tex.anisotropy = 8;
  return { tex, cells, aspect: cw / ch };
}

// Lớp đèn cửa sổ ban đêm cho mặt tiền (emissiveMap): nền đen, cửa sổ/ô thoáng vàng ấm; vài phòng tắt đèn cho tự nhiên.
export function facadeLightsTexture(withDoor = true, seed = 3) {
  const [c, x] = makeCanvas(512, 512);
  const r = seeded(seed);
  x.fillStyle = '#000';
  x.fillRect(0, 0, 512, 512);
  const warm = ['#ffd27a', '#ffe3a0', '#ffc462'];
  const wx = withDoor ? 220 : 120, ww = withDoor ? 250 : 280;
  // 4 ô kính × 2 hàng, mỗi ô sáng ngẫu nhiên
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    if (r() < 0.22) continue;
    x.fillStyle = warm[Math.floor(r() * warm.length)];
    const cx = wx + (ww / 4) * i + 5, cy = j ? 269 : 175, cw = ww / 4 - 10, ch = j ? 102 : 86;
    x.fillRect(cx, cy, cw, ch);
  }
  if (withDoor) {
    x.fillStyle = '#ffd27a';
    for (let i = 0; i < 6; i++) x.fillRect(46 + i * 19, 126, 8, 34);
  }
  return toTexture(c, true);
}
