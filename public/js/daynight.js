// Ngày / đêm theo giờ thật Việt Nam (UTC+7): bầu trời, mặt trời / trăng, sao, đèn cửa sổ, đèn đường, đồng hồ HUD.
// Thử nhanh: ?gio=22 (hoặc 6:30) để xem giờ bất kỳ; ?tocdo=600 cho thời gian chạy nhanh 600×.
import * as THREE from 'three';

const SUNRISE = 5.9, SUNSET = 17.6; // giờ mặt trời mọc / lặn (Hải Phòng, trung bình năm)
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Giờ Việt Nam dạng số thập phân (0–24).
export function vnHours(now = Date.now()) {
  const d = new Date(now + 7 * 3600_000);
  return d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
}

export function createDayNight({ scene, sky, sun, hemi, fog, renderer, clouds, cloudMat, world }) {
  const params = new URLSearchParams(location.search);
  const forced = params.get('gio');
  const speed = +params.get('tocdo') || 0;
  let simHours = null;
  if (forced) {
    const [h, m] = forced.split(/[:h]/).map(Number);
    simHours = ((h || 0) + (m || 0) / 60) % 24;
  } else if (speed) simHours = vnHours();

  // ---- sao đêm: điểm ngẫu nhiên trên vòm trời, đi theo camera cùng với bầu trời ----
  const N = 1600, pos = new Float32Array(N * 3), sz = new Float32Array(N);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) {
    const u = rnd(), v = rnd();
    const theta = u * Math.PI * 2, phi = Math.acos(1 - v * 0.95); // thiên đỉnh → gần chân trời
    const r = 560;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi) + 20;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sz[i] = 0.6 + rnd() * 1.6;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'attribute float aSize; varying float vS; uniform float uTime;\nvoid main(){ vS = aSize; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * (1.6 + 0.6 * sin(uTime * 2.0 + position.x)); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uOpacity; varying float vS;\nvoid main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(1.0, 1.0, 0.95, uOpacity * (1.0 - d * 1.6)); }',
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.renderOrder = -1;
  sky.add(stars);

  // ---- mặt trăng ----
  const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 20, 14), new THREE.MeshBasicMaterial({ color: 0xf4f1dc, fog: false }));
  sky.add(moon);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('244,241,220'), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  moonGlow.scale.set(90, 90, 1);
  moon.add(moonGlow);

  // ---- đèn đường: quầng sáng bật về đêm ----
  const lampGroup = new THREE.Group();
  const lampMat = new THREE.SpriteMaterial({ map: glowTex('255,214,130'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  for (const [x, y, z, s] of world.lampPoints || []) {
    const sp = new THREE.Sprite(lampMat);
    sp.scale.set(s, s, 1);
    sp.position.set(x, y, z);
    lampGroup.add(sp);
  }
  scene.add(lampGroup);

  // ---- HUD ----
  const clockEl = document.getElementById('clock');

  const C = {
    dayTop: new THREE.Color(0x3b8be0), dayBot: new THREE.Color(0xe4eef5),
    duskTop: new THREE.Color(0x2b2f6e), duskBot: new THREE.Color(0xf08a4b),
    nightTop: new THREE.Color(0x0b1230), nightBot: new THREE.Color(0x24315e),
    sunDay: new THREE.Color(0xfff0d8), sunLow: new THREE.Color(0xffa860), moon: new THREE.Color(0x8fa8ff),
    hemiDay: new THREE.Color(0xdfefff), hemiNight: new THREE.Color(0x5a6ea8), hemiGroundDay: new THREE.Color(0x7a6a4a), hemiGroundNight: new THREE.Color(0x1e2236),
  };
  const sunOffset = new THREE.Vector3(38, 70, 30);
  const tmpA = new THREE.Color(), tmpB = new THREE.Color();
  let hudAt = 0, lastInfo = null;

  function compute(h) {
    // vị trí mặt trời: 0 lúc mọc → 1 lúc lặn; độ cao sin(π·t)
    const t = (h - SUNRISE) / (SUNSET - SUNRISE);
    const alt = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * (t >= 0 && t <= 1 ? 1 : 0);
    // ánh sáng ban ngày: 0 khi mặt trời dưới chân trời 25 phút, 1 khi cao
    const hourToRise = h - SUNRISE, hourToSet = SUNSET - h;
    const twilight = Math.min(hourToRise, hourToSet); // âm = đêm
    const day = smooth(-0.45, 0.6, twilight);         // 0 đêm … 1 ngày
    const dusk = Math.max(0, 1 - Math.abs(twilight) / 0.9) * (1 - 0.4 * day); // đỉnh lúc hoàng hôn/bình minh
    return { t, alt, day, dusk, night: 1 - day };
  }

  function apply(h, dt) {
    const { t, alt, day, dusk, night } = compute(h);
    // bầu trời: trộn ngày → hoàng hôn → đêm
    tmpA.copy(C.nightTop).lerp(C.dayTop, day).lerp(C.duskTop, dusk * 0.7);
    tmpB.copy(C.nightBot).lerp(C.dayBot, day).lerp(C.duskBot, dusk);
    sky.material.uniforms.top.value.copy(tmpA);
    sky.material.uniforms.bottom.value.copy(tmpB);
    fog.color.copy(tmpB);
    fog.near = lerp(60, 90, day);
    fog.far = lerp(260, 320, day);
    // mặt trời / trăng (nguồn sáng định hướng dùng chung)
    const az = Math.PI * (1 - Math.min(1, Math.max(0, t))); // đông → tây
    if (alt > 0.02) {
      sunOffset.set(Math.cos(az) * 80, 8 + alt * 72, 30);
      sun.color.copy(C.sunLow).lerp(C.sunDay, smooth(0.05, 0.45, alt));
      sun.intensity = lerp(0.35, 2.7, smooth(0, 0.35, alt)) * day + 0.05;
    } else {
      sunOffset.set(-Math.cos(az) * 60, 55, 25); // trăng chếch bên kia
      sun.color.copy(C.moon);
      sun.intensity = 0.9 * night + 0.1 * day;
    }
    hemi.color.copy(C.hemiNight).lerp(C.hemiDay, day);
    hemi.groundColor.copy(C.hemiGroundNight).lerp(C.hemiGroundDay, day);
    hemi.intensity = lerp(0.85, 1.15, day);
    renderer.toneMappingExposure = lerp(1.0, 1.0, day);
    // sao, trăng, mây
    starMat.uniforms.uOpacity.value = night * 0.85;
    starMat.uniforms.uTime.value += dt;
    stars.visible = night > 0.02;
    moon.visible = night > 0.02;
    const ma = Math.PI * Math.min(1, Math.max(0, ((h + 24 - SUNSET) % 24) / (24 - (SUNSET - SUNRISE))));
    moon.position.set(Math.cos(ma) * 420, 60 + Math.sin(ma) * 300, -160);
    moonGlow.material.opacity = night * 0.9;
    cloudMat.emissiveIntensity = lerp(0.03, 0.55, day);
    cloudMat.color.setScalar(lerp(0.35, 1, day));
    // đèn cửa sổ các dãy nhà + đèn đường: bật khi trời tối (khuya sau 23h bớt dần)
    const late = smooth(23.2, 24.6, h < 4 ? h + 24 : h);
    const lamps = Math.max(night, dusk * 0.6) * (1 - late * 0.75);
    for (const m of world.nightMats || []) m.emissiveIntensity = lamps * 1.1;
    lampMat.opacity = lamps * 0.85;
    for (const m of world.lampEmissive || []) {
      if (m.userData?.adBillboard) m.emissiveIntensity = lerp(0.06, 0.48, lamps);
      else m.emissiveIntensity = lerp(0.25, 1.6, lamps);
    }
    return { h, day, night, alt };
  }

  function tick(dt) {
    let h;
    if (simHours !== null) {
      if (speed) simHours = (simHours + (dt * speed) / 3600) % 24;
      h = simHours;
    } else h = vnHours();
    lastInfo = apply(h, dt);
    hudAt += dt;
    if (clockEl && hudAt > 0.5) {
      hudAt = 0;
      const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
      const icon = lastInfo.night > 0.5 ? '🌙' : lastInfo.alt < 0.2 ? '🌅' : '☀️';
      clockEl.textContent = `${icon} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      clockEl.title = simHours !== null && !speed ? `Giờ giả lập (?gio=${forced})` : 'Giờ Việt Nam — trời sáng/tối theo thời gian thực';
    }
    return lastInfo;
  }

  return { tick, sunOffset, get info() { return lastInfo; } };
}

function glowTex(rgb) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(${rgb},0.9)`);
  g.addColorStop(0.3, `rgba(${rgb},0.35)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
