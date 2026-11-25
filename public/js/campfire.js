// Lửa trại giữa sân trong: chỉ hiện khi trời tối. Củi, đá kê, lửa + tàn lửa + khói, ánh sáng nhấp nháy,
// tiếng lách tách, ghế gỗ quây quanh; người chơi bấm E để ngồi (không kéo NPC).
import * as THREE from 'three';
import { unlockAudio, fireworkWhistle, fireworkBoom } from './sound.js';
import * as T from './textures.js';

const FIRE = { x: 0, z: -7 };
const SEAT_R = 3.1, SEATS = 10;

function flameTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 192;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 130, 6, 64, 110, 95);
  g.addColorStop(0, 'rgba(255,250,200,1)');
  g.addColorStop(0.25, 'rgba(255,190,60,0.95)');
  g.addColorStop(0.55, 'rgba(255,90,20,0.6)');
  g.addColorStop(1, 'rgba(255,40,0,0)');
  x.fillStyle = g;
  // hình giọt lửa: rộng dưới, nhọn trên
  x.beginPath();
  x.moveTo(64, 4);
  x.bezierCurveTo(120, 70, 118, 150, 64, 188);
  x.bezierCurveTo(10, 150, 8, 70, 64, 4);
  x.closePath();
  x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function softTexture(rgb) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `rgba(${rgb},1)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createCampfire({ scene, world, npcs, toast }) {
  const g = new THREE.Group();
  g.position.set(FIRE.x, 0, FIRE.z);
  g.visible = false;
  scene.add(g);
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });

  // vòng đá kê + nền tro
  const stone = std(0x6f6b66);
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 + (i % 3) * 0.05, 1), stone);
    s.position.set(Math.cos(a) * 1.05, 0.14, Math.sin(a) * 1.05);
    s.scale.y = 0.7;
    s.castShadow = true;
    g.add(s);
  }
  const ash = new THREE.Mesh(new THREE.CircleGeometry(0.95, 20), std(0x2a2522));
  ash.rotation.x = -Math.PI / 2;
  ash.position.y = 0.03;
  g.add(ash);
  // củi xếp chụm
  const wood = std(0x5a3a22), woodEnd = std(0x8a6a4a);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.25, 8), wood);
    log.position.set(Math.cos(a) * 0.3, 0.42, Math.sin(a) * 0.3);
    log.rotation.set(0, -a, 1.0);
    log.castShadow = true;
    g.add(log);
  }
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 8), i ? wood : woodEnd);
    log.position.set(0, 0.1 + i * 0.05, 0);
    log.rotation.set(0, (i * Math.PI) / 3, Math.PI / 2);
    g.add(log);
  }
  // lửa: nhiều lưỡi lửa sprite xếp chồng, nhấp nháy khác pha
  const flameTex = flameTexture();
  const flames = [];
  for (let i = 0; i < 7; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
    sp.position.set((Math.random() - 0.5) * 0.5, 0.75, (Math.random() - 0.5) * 0.5);
    sp.userData = { phase: Math.random() * 7, base: 0.9 + Math.random() * 0.9 };
    g.add(sp);
    flames.push(sp);
  }
  // quầng sáng dưới đất
  const halo = new THREE.Mesh(new THREE.CircleGeometry(4.5, 32), new THREE.MeshBasicMaterial({ map: softTexture('255,150,60'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 }));
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.05;
  g.add(halo);
  // ánh lửa
  const light = new THREE.PointLight(0xff8a3c, 0, 40, 1.6);
  light.position.set(0, 1.4, 0);
  g.add(light);
  // tàn lửa + khói
  const emberTex = softTexture('255,170,70'), smokeTex = softTexture('140,140,140');
  const NE = 70, NS = 24;
  const mkPoints = (n, tex, size, color, opacity) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: tex, size, color, transparent: true, depthWrite: false, opacity, blending: tex === smokeTex ? THREE.NormalBlending : THREE.AdditiveBlending }));
    pts.userData.life = new Float32Array(n).map(() => Math.random());
    pts.userData.vel = new Float32Array(n * 3);
    g.add(pts);
    return pts;
  };
  const embers = mkPoints(NE, emberTex, 0.14, 0xffb060, 0.9);
  const smoke = mkPoints(NS, smokeTex, 1.6, 0x9a9a9a, 0.22);
  const resetP = (pts, i, ember) => {
    const p = pts.geometry.attributes.position.array, v = pts.userData.vel;
    p[i * 3] = (Math.random() - 0.5) * (ember ? 0.5 : 0.3);
    p[i * 3 + 1] = ember ? 0.6 + Math.random() * 0.5 : 1.3;
    p[i * 3 + 2] = (Math.random() - 0.5) * (ember ? 0.5 : 0.3);
    v[i * 3] = (Math.random() - 0.5) * (ember ? 0.9 : 0.3);
    v[i * 3 + 1] = ember ? 1.4 + Math.random() * 1.6 : 0.9 + Math.random() * 0.5;
    v[i * 3 + 2] = (Math.random() - 0.5) * (ember ? 0.9 : 0.3);
    pts.userData.life[i] = 0;
  };
  for (let i = 0; i < NE; i++) resetP(embers, i, true);
  for (let i = 0; i < NS; i++) resetP(smoke, i, false);

  // --- đống củi + bệ pháo hoa (bên phải lửa chính) ---
  const fwRoot = new THREE.Group();
  fwRoot.position.set(2.75, 0, 1.15);
  g.add(fwRoot);
  const brick = std(0x9a6b55), metal = std(0x6d6d6d, { metalness: 0.55, roughness: 0.45 });
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * Math.PI * 2;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09 + (k % 2) * 0.02, 0.1, 0.9 + (k % 3) * 0.2, 8), wood);
    log.position.set(Math.cos(ang) * 0.55, 0.2 + (k % 3) * 0.12, Math.sin(ang) * 0.55);
    log.rotation.set(0.2, ang, 0.95 + k * 0.08);
    log.castShadow = true;
    fwRoot.add(log);
  }
  const fwPad = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.85), brick);
  fwPad.position.set(0, 0.52, 0);
  fwPad.castShadow = true;
  fwRoot.add(fwPad);
  const fwTube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.42, 10), metal);
  fwTube.position.set(0, 0.8, 0);
  fwRoot.add(fwTube);
  const fwMuzzle = new THREE.Object3D();
  fwMuzzle.position.set(0, 1.02, 0);
  fwRoot.add(fwMuzzle);
  const woodCol = { minX: FIRE.x + 2.1, maxX: FIRE.x + 3.4, minZ: FIRE.z + 0.45, maxZ: FIRE.z + 1.85, top: 0, bottom: 0, noCam: true };
  world.colliders.push(woodCol);

  // --- bếp Tết: nồi bánh chưng 3D, vỉ nướng ngô & khoai ---
  const cook = new THREE.Group();
  cook.position.set(-3.15, 0, 0.55);
  g.add(cook);
  const leafGreen = std(0x3d6b3a, { roughness: 0.95 });
  const leafDark = std(0x2a5530, { roughness: 0.95 });
  const banhGreen = std(0x3f8a48, { roughness: 0.92 });
  const strawTie = std(0xb8955a, { roughness: 0.85 });
  const potIron = std(0x3a3a3e, { metalness: 0.72, roughness: 0.55 });
  const potIronDark = std(0x252528, { metalness: 0.65, roughness: 0.6 });

  const pot = new THREE.Group();
  pot.position.set(0, 0, -0.06);
  cook.add(pot);

  const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.68, 0.58, 22), potIron);
  potBody.position.y = 0.3;
  potBody.castShadow = potBody.receiveShadow = true;
  pot.add(potBody);
  const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.055, 10, 24), potIron);
  potRim.rotation.x = Math.PI / 2;
  potRim.position.y = 0.59;
  pot.add(potRim);
  const potLip = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.8, 0.05, 22), potIronDark);
  potLip.position.y = 0.56;
  pot.add(potLip);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 22),
    new THREE.MeshStandardMaterial({ color: 0x5a7a88, transparent: true, opacity: 0.42, roughness: 0.15, metalness: 0.05 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.36;
  pot.add(water);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.032, 8, 14), potIron);
    ear.rotation.y = Math.PI / 2;
    ear.position.set(side * 0.86, 0.4, 0);
    pot.add(ear);
  }

  function banhChung(x, y, z, w, h, d, ry = 0) {
    const wrap = new THREE.Group();
    wrap.position.set(x, y, z);
    wrap.rotation.y = ry;
    const core = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), banhGreen);
    core.position.y = h / 2;
    core.castShadow = core.receiveShadow = true;
    wrap.add(core);
    const midBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, h * 0.14, d + 0.02), leafDark);
    midBand.position.y = h * 0.52;
    wrap.add(midBand);
    const topLeaf = new THREE.Mesh(new THREE.BoxGeometry(w * 1.06, 0.035, d * 1.06), leafGreen);
    topLeaf.position.y = h + 0.02;
    wrap.add(topLeaf);
    for (const [tx, tz, sx] of [[-1, 0, 1], [1, 0, 1], [0, -1, 0.9], [0, 1, 0.9]]) {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.16 * sx, h * 0.82, 0.022), leafDark);
      flap.position.set(tx * (w * 0.44), h * 0.46, tz * (d * 0.44));
      wrap.add(flap);
    }
    for (const oz of [1, -1]) {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(w * 1.12, 0.022, 0.038), strawTie);
      tie.position.set(0, h * 0.5, (d / 2 + 0.012) * oz);
      wrap.add(tie);
    }
    pot.add(wrap);
  }

  const bw = 0.27, bh = 0.21, bd = 0.27;
  for (const [px, pz, ry] of [
    [-0.15, -0.15, 0.1], [0.15, -0.15, -0.15], [-0.15, 0.15, 0.35], [0.15, 0.15, 0],
  ]) banhChung(px, 0.13, pz, bw, bh, bd, ry);
  for (const [px, pz, ry] of [[0, -0.17, 0.5], [-0.17, 0.07, 0.8], [0.17, 0.07, -0.4]]) {
    banhChung(px, 0.35, pz, bw * 0.98, bh, bd * 0.98, ry);
  }
  for (const [px, pz, ry] of [[-0.11, -0.07, 0.2], [0.12, -0.06, 0.6], [0.01, 0.15, -0.2]]) {
    banhChung(px, 0.56, pz, bw * 0.95, bh * 0.96, bd * 0.95, ry);
  }
  banhChung(-0.07, 0.77, 0.02, bw * 0.93, bh, bd * 0.93, 0.15);
  banhChung(0.11, 0.94, -0.05, bw * 0.9, bh * 0.94, bd * 0.9, -0.3);
  banhChung(-0.12, 1.08, 0.1, bw * 0.86, bh * 0.9, bd * 0.86, 0.45);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.55, 8), wood);
    log.position.set(Math.cos(a) * 0.46, 0.08, Math.sin(a) * 0.4 - 0.12);
    log.rotation.z = 0.9 + i * 0.1;
    log.rotation.y = a;
    cook.add(log);
  }
  const cookStones = stone;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), cookStones);
    s.position.set(Math.cos(a) * 0.72, 0.08, Math.sin(a) * 0.72 - 0.1);
    cook.add(s);
  }
  const cookFire = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 16),
    new THREE.MeshBasicMaterial({ map: softTexture('255,140,50'), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  cookFire.rotation.x = -Math.PI / 2;
  cookFire.position.set(0, 0.06, -0.05);
  cook.add(cookFire);
  const grate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.55), metal);
  grate.position.set(1.35, 0.14, 0.15);
  cook.add(grate);
  const emberGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.35), new THREE.MeshBasicMaterial({ color: 0xff6b2b, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  emberGlow.rotation.x = -Math.PI / 2;
  emberGlow.position.set(1.35, 0.18, 0.15);
  cook.add(emberGlow);
  const corn = std(0xf4d03f);
  for (const [cx, cz, ry] of [[1.1, 0.05, 0.3], [1.55, 0.22, -0.25]]) {
    const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.38, 10), corn);
    cob.position.set(cx, 0.26, cz);
    cob.rotation.z = Math.PI / 2;
    cob.rotation.y = ry;
    cook.add(cob);
    const husk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.22), leafGreen);
    husk.position.set(cx, 0.28, cz);
    cook.add(husk);
  }
  const khoai = std(0x6d4c2e);
  for (const [kx, kz] of [[1.28, -0.12], [1.48, 0.08], [1.62, 0.28]]) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), khoai);
    t.scale.set(1.2, 0.75, 1);
    t.position.set(kx, 0.24, kz);
    t.rotation.y = kx * 2;
    cook.add(t);
  }
  const cookSmoke = mkPoints(12, smokeTex, 0.9, 0xaaaaaa, 0.18);
  cookSmoke.position.set(0, 1.05, -0.06);
  cook.add(cookSmoke);
  for (let i = 0; i < 12; i++) resetP(cookSmoke, i, false);
  const cookCol = { minX: FIRE.x - 4.1, maxX: FIRE.x - 2.0, minZ: FIRE.z - 0.4, maxZ: FIRE.z + 1.6, top: 0, bottom: 0, noCam: true };
  world.colliders.push(cookCol);
  world.interact.push({
    x: FIRE.x - 3.15, z: FIRE.z + 0.55, r: 2.8,
    label: 'Nồi bánh chưng',
    title: 'Nồi bánh chưng Tết',
    text: 'Nồi gang to, bánh chưng lá dong xếp chật như canh nồi đêm Giao thừa — luộc trên lửa củi.',
  });
  world.interact.push({
    x: FIRE.x - 1.55, z: FIRE.z + 0.7, r: 2.5,
    label: 'Nướng ngô & khoai',
    title: 'Vỉ nướng bên lửa',
    text: 'Ngô vàng và khoai lang úa trên vỉ than hồng — mùi thơm quanh sân trường đêm Giao thừa.',
  });
  world.interact.push({
    x: FIRE.x + 2.75, z: FIRE.z + 1.15, r: 2.8,
    label: 'Bệ pháo hoa',
    title: 'Pháo hoa đêm lửa trại',
    text: 'Một ống pháo — 5 giây một quả, luân phiên nổ bông và nổ tia, suốt đêm.',
  });

  // pháo hoa — 1 ống, 5 giây/quả, luân phiên bông / tia, lặp không ngừng
  const FW_INTERVAL = 5;
  const fwPalette = [0xff2266, 0xffee33, 0x33ffbb, 0x55aaff, 0xff7722, 0xee55ff, 0xaaff44];
  const fwSparkTex = T.fireworkSparkTexture();
  const fwPool = [];
  for (let i = 0; i < 160; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: fwSparkTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
    }));
    sp.visible = false;
    sp.renderOrder = 200;
    scene.add(sp);
    fwPool.push({ sp, dead: true, life: 0, vx: 0, vy: 0, vz: 0, drag: 0.96 });
  }
  let fwShotTimer = 0.6;
  let fwBurstToggle = 0; // 0 = bông, 1 = tia
  let fwRockets = [];
  const fwFlashes = [];
  for (let i = 0; i < 6; i++) {
    const pl = new THREE.PointLight(0xffffff, 0, 28, 1.4);
    scene.add(pl);
    fwFlashes.push({ light: pl, t: 0 });
  }
  let fwFlashIdx = 0;

  function fwFlashAt(x, y, z, color, scale = 1) {
    const flash = fwFlashes[fwFlashIdx++ % fwFlashes.length];
    flash.light.position.set(x, y, z);
    flash.light.color.setHex(color);
    flash.light.intensity = 48 * scale;
    flash.t = 0.5;
  }

  // Nổ bông: quả cầu sáng, tia đều mọi hướng
  function spawnBurstBall(x, y, z, color) {
    fwFlashAt(x, y, z, color, 1.1);
    const n = 44 + ((Math.random() * 12) | 0);
    for (let k = 0; k < n; k++) {
      const p = fwPool.find(pt => pt.dead);
      if (!p) break;
      const u = Math.random();
      const v = Math.random();
      const elev = Math.acos(2 * v - 1);
      const ang = 2 * Math.PI * u;
      const sp = 4.5 + Math.random() * 5.5;
      p.dead = false;
      p.life = 1.6 + Math.random() * 0.9;
      p.vx = Math.cos(ang) * Math.sin(elev) * sp;
      p.vy = Math.cos(elev) * sp;
      p.vz = Math.sin(ang) * Math.sin(elev) * sp;
      p.drag = 0.968;
      p.sp.visible = true;
      p.sp.position.set(x, y, z);
      p.sp.material.color.setHex(Math.random() < 0.18 ? 0xffffff : color);
      p.sp.material.opacity = 1;
      p.sp.scale.setScalar(2.2);
    }
  }

  // Nổ tia: bông mai / chùm tia phẳng + vài tia xiên
  function spawnBurstRay(x, y, z, color) {
    fwFlashAt(x, y, z, color, 0.95);
    const spokes = 16;
    const planeTilt = Math.random() * Math.PI;
    for (let i = 0; i < spokes; i++) {
      const p = fwPool.find(pt => pt.dead);
      if (!p) break;
      const ang = (i / spokes) * Math.PI * 2;
      const sp = 7 + Math.random() * 3;
      const dirX = Math.cos(ang);
      const dirZ = Math.sin(ang);
      const ry = Math.cos(planeTilt) * dirX - Math.sin(planeTilt) * dirZ;
      const rz = Math.sin(planeTilt) * dirX + Math.cos(planeTilt) * dirZ;
      p.dead = false;
      p.life = 1.35 + Math.random() * 0.45;
      p.vx = ry * sp;
      p.vy = (Math.random() - 0.5) * 1.2;
      p.vz = rz * sp;
      p.drag = 0.972;
      p.sp.visible = true;
      p.sp.position.set(x, y, z);
      p.sp.material.color.setHex(color);
      p.sp.material.opacity = 1;
      p.sp.scale.setScalar(2.6);
      const tail = fwPool.find(pt => pt.dead);
      if (!tail) continue;
      tail.dead = false;
      tail.life = p.life * 0.55;
      tail.vx = p.vx * 0.45;
      tail.vy = p.vy * 0.45;
      tail.vz = p.vz * 0.45;
      tail.drag = 0.95;
      tail.sp.visible = true;
      tail.sp.position.set(x, y, z);
      tail.sp.material.color.setHex(0xfff6cc);
      tail.sp.material.opacity = 0.85;
      tail.sp.scale.setScalar(1.4);
    }
    for (let j = 0; j < 6; j++) {
      const p = fwPool.find(pt => pt.dead);
      if (!p) break;
      const ang = (j / 6) * Math.PI * 2 + 0.4;
      const elev = 0.55 + Math.random() * 0.35;
      const sp = 5.5 + Math.random() * 2;
      p.dead = false;
      p.life = 1.1;
      p.vx = Math.cos(ang) * sp * 0.7;
      p.vy = Math.sin(elev) * sp;
      p.vz = Math.sin(ang) * sp * 0.7;
      p.drag = 0.96;
      p.sp.visible = true;
      p.sp.position.set(x, y, z);
      p.sp.material.color.setHex(0xffffff);
      p.sp.material.opacity = 1;
      p.sp.scale.setScalar(1.8);
    }
  }

  function launchRocket(origin, color, kind) {
    fwRockets.push({
      x: origin.x, y: origin.y, z: origin.z,
      vy: 15 + Math.random() * 4,
      peak: origin.y + 7 + Math.random() * 4,
      color,
      kind,
      trailT: 0,
    });
  }

  // ghế gỗ quây quanh (khúc gỗ) + chỗ ngồi
  const seats = [];
  const bench = std(0x7a4f2e);
  for (let i = 0; i < SEATS; i++) {
    const a = (i / SEATS) * Math.PI * 2 + 0.2;
    const x = Math.cos(a) * SEAT_R, z = Math.sin(a) * SEAT_R;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.1, 10), bench);
    m.position.set(x, 0.2, z);
    m.rotation.set(0, -a, Math.PI / 2);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    seats.push({ x: FIRE.x + x, z: FIRE.z + z, face: Math.atan2(-x, -z), taken: null });
  }
  // va chạm: đống lửa (chắn) và ghế (bước lên được); ban ngày tắt bằng cách hạ top về 0
  const fireCol = { minX: FIRE.x - 1.0, maxX: FIRE.x + 1.0, minZ: FIRE.z - 1.0, maxZ: FIRE.z + 1.0, top: 0, bottom: 0, noCam: true };
  world.colliders.push(fireCol);
  const seatCols = seats.map(s => { const c = { minX: s.x - 0.55, maxX: s.x + 0.55, minZ: s.z - 0.3, maxZ: s.z + 0.3, top: 0, bottom: 0, noCam: true }; world.colliders.push(c); return c; });
  const interact = { x: FIRE.x, z: FIRE.z, r: 0, label: 'Ngồi bên lửa trại', action: 'campfire' };
  world.interact.push(interact);
  // tiếng lửa lách tách (brown noise lọc thấp + tiếng nổ nhỏ ngẫu nhiên), to nhỏ theo khoảng cách
  let audio = null, popAt = 0;
  function ensureAudio() {
    if (audio) return audio;
    const a = unlockAudio();
    const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    const src = a.createBufferSource();
    src.buffer = buf; src.loop = true;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6;
    const gain = a.createGain(); gain.gain.value = 0;
    src.connect(f).connect(gain).connect(a.destination);
    src.start();
    audio = { a, gain };
    return audio;
  }
  function pop(a, vol) {
    const o = a.createOscillator(), gn = a.createGain(), t = a.currentTime;
    o.type = 'square'; o.frequency.value = 1800 + Math.random() * 2500;
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(gn).connect(a.destination); o.start(t); o.stop(t + 0.04);
  }

  function fwVol(player) {
    if (!player) return 0.35;
    const d = Math.hypot(player.pos.x - FIRE.x, player.pos.z - FIRE.z);
    return Math.max(0.06, Math.min(1, (1 - d / 38) ** 1.7));
  }

  let active = false, gathered = false, sitters = [];
  function gather() {
    gathered = true;
    sitters = [];
  }
  function disperse() {
    gathered = false;
    for (const n of sitters) { n.mode = 'wander'; n.target = null; n.pose = null; n.faceTo = null; n.route = null; n.detour = null; }
    for (const s of seats) s.taken = null;
    sitters = [];
  }

  function tick(dt, t, nightInfo, player) {
    const night = nightInfo?.night ?? 0;
    const on = night > 0.5;
    if (on !== active) {
      active = on;
      g.visible = on;
      fireCol.top = on ? 0.7 : 0;
      woodCol.top = on ? 1.0 : 0;
      cookCol.top = on ? 1.15 : 0;
      for (const c of seatCols) c.top = on ? 0.42 : 0;
      interact.r = on ? 3.6 : 0;
      if (on) {
        gather();
        fwShotTimer = 0.4;
        fwBurstToggle = 0;
        toast('🔥 Trời tối rồi — lửa trại, bếp Tết & pháo hoa giữa sân!', 4800);
      } else {
        disperse();
        if (audio) audio.gain.gain.value = 0;
        for (const p of fwPool) { p.dead = true; p.life = 0; p.sp.visible = false; }
        fwRockets = [];
        fwShotTimer = FW_INTERVAL;
        for (const f of fwFlashes) { f.t = 0; f.light.intensity = 0; }
      }
    }
    if (!active) return;
    // lửa nhấp nháy
    const flick = 0.8 + 0.25 * Math.sin(t * 9.3) * Math.sin(t * 5.1) + 0.12 * Math.sin(t * 23);
    light.intensity = 34 * flick;
    halo.material.opacity = 0.28 + 0.1 * flick;
    for (const f of flames) {
      const k = f.userData.base * (0.75 + 0.3 * Math.sin(t * 7 + f.userData.phase) * Math.cos(t * 3.3 + f.userData.phase * 2));
      f.scale.set(0.8 * k, 1.5 * k, 1);
      f.position.y = 0.55 + 0.45 * k;
      f.material.rotation = Math.sin(t * 2 + f.userData.phase) * 0.12;
    }
    // tàn lửa / khói
    for (const [pts, n, ember, maxLife] of [[embers, NE, true, 1.6], [smoke, NS, false, 4]]) {
      const p = pts.geometry.attributes.position.array, v = pts.userData.vel, life = pts.userData.life;
      for (let i = 0; i < n; i++) {
        life[i] += dt;
        if (life[i] > maxLife * (0.6 + (i % 5) * 0.1)) resetP(pts, i, ember);
        p[i * 3] += (v[i * 3] + Math.sin(t * 3 + i) * 0.3) * dt;
        p[i * 3 + 1] += v[i * 3 + 1] * dt;
        p[i * 3 + 2] += (v[i * 3 + 2] + Math.cos(t * 2.3 + i) * 0.3) * dt;
      }
      pts.geometry.attributes.position.needsUpdate = true;
    }
  // khói nồi bánh chưng
    {
      const p = cookSmoke.geometry.attributes.position.array, v = cookSmoke.userData.vel, life = cookSmoke.userData.life;
      for (let i = 0; i < 12; i++) {
        life[i] += dt;
        if (life[i] > 2.8) resetP(cookSmoke, i, false);
        p[i * 3] += v[i * 3] * dt;
        p[i * 3 + 1] += v[i * 3 + 1] * dt;
        p[i * 3 + 2] += v[i * 3 + 2] * dt;
      }
      cookSmoke.geometry.attributes.position.needsUpdate = true;
      emberGlow.material.opacity = 0.25 + 0.12 * Math.sin(t * 4.2);
      cookFire.material.opacity = 0.45 + 0.18 * Math.sin(t * 5.5);
    }
    // 1 ống: cứ 5 giây một quả — bông, tia, bông, tia…
    fwShotTimer -= dt;
    if (fwShotTimer <= 0) {
      fwShotTimer = FW_INTERVAL;
      const fwOrigin = new THREE.Vector3();
      fwMuzzle.getWorldPosition(fwOrigin);
      const kind = (fwBurstToggle++ & 1) === 0 ? 'ball' : 'ray';
      const color = fwPalette[(fwBurstToggle % fwPalette.length)];
      launchRocket(fwOrigin, color, kind);
      try { fireworkWhistle(fwVol(player) * 0.95); } catch { /* âm thanh chưa unlock */ }
    }
    for (let r = fwRockets.length - 1; r >= 0; r--) {
      const ro = fwRockets[r];
      ro.y += ro.vy * dt;
      ro.vy -= 3.8 * dt;
      ro.trailT -= dt;
      if (ro.trailT <= 0) {
        ro.trailT = 0.03;
        const trail = fwPool.find(p => p.dead);
        if (trail) {
          trail.dead = false;
          trail.life = 0.42;
          trail.vx = (Math.random() - 0.5) * 0.6;
          trail.vy = -0.4;
          trail.vz = (Math.random() - 0.5) * 0.6;
          trail.drag = 0.9;
          trail.sp.visible = true;
          trail.sp.position.set(ro.x, ro.y, ro.z);
          trail.sp.material.color.setHex(0xfff8cc);
          trail.sp.material.opacity = 1;
          trail.sp.scale.setScalar(1.1);
        }
      }
      if (ro.y >= ro.peak) {
        if (ro.kind === 'ray') spawnBurstRay(ro.x, ro.y, ro.z, ro.color);
        else spawnBurstBall(ro.x, ro.y, ro.z, ro.color);
        try { fireworkBoom(fwVol(player), ro.kind); } catch { /* âm thanh chưa unlock */ }
        fwRockets.splice(r, 1);
      }
    }
    for (const f of fwFlashes) {
      if (f.t > 0) {
        f.t -= dt;
        f.light.intensity = Math.max(0, f.t * 90);
      }
    }
    for (const p of fwPool) {
      if (p.dead) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.dead = true;
        p.sp.visible = false;
        continue;
      }
      p.sp.position.x += p.vx * dt;
      p.sp.position.y += p.vy * dt;
      p.sp.position.z += p.vz * dt;
      p.vy -= 4.2 * dt;
      p.vx *= p.drag;
      p.vz *= p.drag;
      const fade = Math.min(1, p.life * 1.2);
      p.sp.material.opacity = fade;
      p.sp.scale.setScalar((1.2 + p.life * 0.9) * fade);
    }
    // NPC tới ghế thì ngồi xuống, quay mặt vào lửa
    for (const n of sitters) {
      if (n.mode !== 'campfire' || !n.target) continue;
      const d = Math.hypot(n.pos.x - n.target.x, n.pos.z - n.target.z);
      if (d < 0.6 && !n.pose) { n.pose = 'sit'; n.pos.set(n.target.x, 0, n.target.z); }
    }
    // âm thanh theo khoảng cách
    if (player) {
      const d = Math.hypot(player.pos.x - FIRE.x, player.pos.z - FIRE.z);
      const vol = Math.max(0, 1 - d / 22) ** 2;
      try {
        const au = ensureAudio();
        au.gain.gain.setTargetAtTime(vol * 0.35, au.a.currentTime, 0.2);
        if (vol > 0.05 && t > popAt) { popAt = t + 0.15 + Math.random() * 0.9; pop(au.a, vol * 0.08); }
      } catch { /* chưa có tương tác người dùng để bật âm thanh */ }
    }
  }

  // chỗ ngồi trống gần người chơi nhất
  function seatFor(player) {
    let best = null, bd = Infinity;
    for (const s of seats) {
      if (s.taken) continue;
      const d = Math.hypot(s.x - player.pos.x, s.z - player.pos.z);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }

  return { tick, seatFor, get active() { return active; }, pos: FIRE };
}
