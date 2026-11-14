// Va chạm đơn giản: người chơi là hình tròn trên mặt phẳng XZ, vật cản là hộp
// chữ nhật cao từ `bottom` (mặc định 0) tới `top`. Hộp thấp hơn STEP thì bước lên được
// (bậc thềm, sân khấu, bậc cầu thang); hộp có `bottom` cao hơn đầu thì đi bên dưới được (sàn tầng trên).
export const HEAD = 1.7;
export const STEP = 0.45;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Collision {
  constructor(boxes, bounds) {
    this.boxes = boxes;
    this.bounds = bounds;
  }

  groundAt(x, z, feetY) {
    let g = 0;
    for (const b of this.boxes) {
      if (b.top > g && b.top <= feetY + STEP && x > b.minX - 0.05 && x < b.maxX + 0.05 && z > b.minZ - 0.05 && z < b.maxZ + 0.05) g = b.top;
    }
    return g;
  }

  resolve(p, feetY, r) {
    for (let it = 0; it < 3; it++) {
      let moved = false;
      for (const b of this.boxes) {
        if (b.top <= feetY + STEP || (b.bottom || 0) >= feetY + HEAD) continue;
        const cx = clamp(p.x, b.minX, b.maxX), cz = clamp(p.z, b.minZ, b.maxZ);
        const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2), k = (r - d) / d;
          p.x += dx * k;
          p.z += dz * k;
        } else {
          const l = p.x - b.minX, rr = b.maxX - p.x, t = p.z - b.minZ, bt = b.maxZ - p.z;
          const m = Math.min(l, rr, t, bt);
          if (m === l) p.x = b.minX - r;
          else if (m === rr) p.x = b.maxX + r;
          else if (m === t) p.z = b.minZ - r;
          else p.z = b.maxZ + r;
        }
        moved = true;
      }
      if (!moved) break;
    }
    const B = this.bounds;
    p.x = clamp(p.x, B.minX, B.maxX);
    p.z = clamp(p.z, B.minZ, B.maxZ);
  }

  // Khoảng cách tia (origin → dir, dir đã chuẩn hoá) chạm hộp cao đầu tiên — dùng để kéo camera vào khi bị tường che.
  rayDist(o, d, maxDist) {
    let best = maxDist;
    for (const b of this.boxes) {
      if (b.top < 2.5 || b.noCam) continue;
      let t0 = 0, t1 = best;
      const axes = [[o.x, d.x, b.minX, b.maxX], [o.y, d.y, b.bottom || 0, b.top], [o.z, d.z, b.minZ, b.maxZ]];
      let hit = true;
      for (const [oo, dd, lo, hi] of axes) {
        if (Math.abs(dd) < 1e-9) {
          if (oo < lo || oo > hi) { hit = false; break; }
          continue;
        }
        let a = (lo - oo) / dd, c = (hi - oo) / dd;
        if (a > c) [a, c] = [c, a];
        t0 = Math.max(t0, a);
        t1 = Math.min(t1, c);
        if (t0 > t1) { hit = false; break; }
      }
      if (hit && t0 < best) best = t0;
    }
    return best;
  }
}
