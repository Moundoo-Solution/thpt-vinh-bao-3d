// Đèn pin ban đêm: bấm L bật/tắt — nhân vật cầm đèn, soi theo hướng camera.
import * as THREE from 'three';

const NIGHT_MIN = 0.32;

export function createFlashlight({ scene, camera, toast }) {
  const spot = new THREE.SpotLight(0xfff0d0, 0, 36, Math.PI / 6.2, 0.42, 1.3);
  spot.castShadow = false;

  const fill = new THREE.PointLight(0xffe4b8, 0, 5, 2);
  scene.add(spot);
  scene.add(spot.target);
  scene.add(fill);

  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  let on = false;
  let hudEl = null;
  let charRef = null;

  function bindCharacter(char) {
    charRef = char;
  }

  function ensureHud() {
    if (hudEl) return hudEl;
    const t = document.getElementById('clock');
    if (!t?.parentElement) return null;
    hudEl = document.createElement('span');
    hudEl.id = 'flashHud';
    hudEl.hidden = true;
    hudEl.textContent = '🔦';
    hudEl.title = 'Đèn pin đang bật (L)';
    hudEl.style.cssText = 'margin-left:0.35rem;opacity:0.95';
    t.parentElement.insertBefore(hudEl, t.nextSibling);
    return hudEl;
  }

  function setOn(v, night, { silent = false } = {}) {
    if (v && night < NIGHT_MIN) {
      toast?.('Đèn pin chỉ dùng được khi trời tối.', 2400);
      return;
    }
    const was = on;
    on = v;
    const h = ensureHud();
    if (h) h.hidden = !on;
    if (!on && charRef?.setFlashlight) charRef.setFlashlight(false);
    if (!silent && was !== on) {
      if (on) toast?.('🔦 Đèn pin: bật', 1600);
      else toast?.('Đèn pin: tắt', 1200);
    }
  }

  function toggle(night) {
    setOn(!on, night);
  }

  function tick(nightInfo, player, view) {
    const night = nightInfo?.night ?? 0;
    if (!on) {
      spot.intensity = 0;
      fill.intensity = 0;
      charRef?.setFlashlight?.(false);
      return;
    }
    if (night < NIGHT_MIN) {
      setOn(false, night, { silent: true });
      return;
    }

    const pitch = view?.pitch ?? 0.3;
    const yaw = view?.yaw ?? player?.facing ?? 0;
    const facing = player?.facing ?? 0;
    // Hướng “ra trước” người chơi (ngược camera third-person đang nhìn vào lưng).
    dir.set(
      -Math.sin(yaw) * Math.cos(pitch),
      -Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    ).normalize();
    charRef?.setFlashlight?.(true, dir, facing, pitch);

    const str = 0.9 + night * 1.55;
    spot.intensity = str;
    fill.intensity = str * 0.08;

    const muzzle = charRef?.torchMuzzle;
    if (muzzle) {
      muzzle.getWorldPosition(origin);
      spot.position.copy(origin);
      fill.position.copy(origin);
      spot.target.position.copy(origin).addScaledVector(dir, 14);
    } else {
      origin.set(player.pos.x, player.feetY + 1.15, player.pos.z);
      spot.position.copy(origin);
      fill.position.copy(origin);
      spot.target.position.copy(origin).addScaledVector(dir, 12);
    }
  }

  return { toggle, tick, bindCharacter, get on() { return on; }, setOn };
}