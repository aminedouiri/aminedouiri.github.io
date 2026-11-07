/*
 * Obstacles on the road. Cones and barrels get knocked away; crates, barriers,
 * FIREWALL walls and BUG cubes shatter into pieces.
 */
import * as THREE from "three";
import anime from "animejs";
import { labelTexture, stripeTexture } from "../utils/textures.js";
import { reduceMotion as reduce } from "../utils/motion.js";

const SIDE_KINDS = ["cone", "crate", "barrel", "barrier", "wall", "crate", "cone", "barrel", "wall"];

function materials() {
  const barrelTex = stripeTexture("#3E63D9", "#F2F3F5"); barrelTex.wrapS = THREE.RepeatWrapping; barrelTex.repeat.set(3, 1);
  const boardTex = stripeTexture("#FFB547", "#121318"); boardTex.wrapS = THREE.RepeatWrapping; boardTex.repeat.set(2.5, 1);
  return {
    cone: new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0x5a1f00, roughness: 0.5 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2f3f5, emissive: 0x444444 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a1b20 }),
    barrel: new THREE.MeshStandardMaterial({ color: 0xffffff, map: barrelTex, roughness: 0.45, metalness: 0.2 }),
    board: new THREE.MeshStandardMaterial({ color: 0xffffff, map: boardTex, emissive: 0x2a1a00, roughness: 0.5 }),
    leg: new THREE.MeshStandardMaterial({ color: 0x2a2e38, metalness: 0.5 }),
    crate: new THREE.MeshStandardMaterial({ color: 0x2b303c, roughness: 0.6, metalness: 0.3 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xffb547, emissive: 0x3a2400 }),
    brick: new THREE.MeshStandardMaterial({ color: 0xc2412d, emissive: 0x3a0d06, roughness: 0.8 }),
    brick2: new THREE.MeshStandardMaterial({ color: 0xa8351f, emissive: 0x2a0904, roughness: 0.8 }),
    fwLabel: new THREE.MeshBasicMaterial({ map: labelTexture("FIREWALL", "#121318", "#FF6B4A", 512, 96), toneMapped: false }),
    bug: new THREE.MeshStandardMaterial({ color: 0xff3b5c, emissive: 0xff1f45, emissiveIntensity: 0.7, roughness: 0.3, map: labelTexture("BUG", "#FF3B5C", "#1a0006") }),
  };
}

export class Obstacles {
  /** @param {import("../World.js").World} w */
  constructor(w) {
    this.w = w;
    this.list = [];
    this.frags = [];
    this.m = materials();
    this.place();
  }

  make(type) {
    const m = this.m, g = new THREE.Group();
    const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); g.add(o); return o; };
    switch (type) {
      case "cone":
        add(new THREE.BoxGeometry(0.44, 0.04, 0.44), m.dark, 0, 0.02, 0);
        add(new THREE.ConeGeometry(0.17, 0.56, 20), m.cone, 0, 0.32, 0);
        add(new THREE.CylinderGeometry(0.085, 0.115, 0.09, 20), m.white, 0, 0.33, 0);
        return { g, r: 0.26, breaks: false };
      case "barrel":
        add(new THREE.CylinderGeometry(0.27, 0.27, 0.72, 24), m.barrel, 0, 0.36, 0);
        return { g, r: 0.32, breaks: false };
      case "barrier":
        add(new THREE.BoxGeometry(1.5, 0.2, 0.06), m.board, 0, 0.62, 0);
        add(new THREE.BoxGeometry(1.5, 0.2, 0.06), m.board, 0, 0.32, 0);
        [-0.65, 0.65].forEach((x) => add(new THREE.BoxGeometry(0.06, 0.75, 0.36), m.leg, x, 0.37, 0));
        return { g, r: 0.75, wide: true, breaks: true, pieces: { geo: new THREE.BoxGeometry(0.5, 0.18, 0.06), mats: [m.board, m.leg], n: 9 } };
      case "wall":
        for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
          if (row % 2 && col === 3) continue;
          add(new THREE.BoxGeometry(0.38, 0.2, 0.24), (row + col) % 2 ? m.brick : m.brick2, -0.6 + col * 0.4 + (row % 2 ? 0.2 : 0), 0.11 + row * 0.215, 0);
        }
        add(new THREE.PlaneGeometry(1.4, 0.26), m.fwLabel, 0, 0.92, 0.001);
        add(new THREE.BoxGeometry(0.03, 0.5, 0.03), m.leg, -0.6, 0.68, -0.04);
        add(new THREE.BoxGeometry(0.03, 0.5, 0.03), m.leg, 0.6, 0.68, -0.04);
        return { g, r: 0.85, wide: true, breaks: true, pieces: { geo: new THREE.BoxGeometry(0.36, 0.19, 0.22), mats: [m.brick, m.brick2], n: 14 } };
      case "bug": {
        const cube = add(new THREE.BoxGeometry(0.6, 0.6, 0.6), m.bug, 0, 0.55, 0);
        g.userData.spinner = cube;
        return { g, r: 0.42, breaks: true, pieces: { geo: new THREE.TetrahedronGeometry(0.16), mats: [m.bug], n: 22 } };
      }
      default: // crate
        add(new THREE.BoxGeometry(0.7, 0.7, 0.7), m.crate, 0, 0.35, 0);
        add(new THREE.BoxGeometry(0.72, 0.06, 0.72), m.amber, 0, 0.5, 0);
        return { g, r: 0.45, breaks: true, pieces: { geo: new THREE.BoxGeometry(0.22, 0.22, 0.22), mats: [m.crate, m.amber], n: 12 } };
    }
  }

  /** Six obstacles between each pair of stops + BUG cubes in the middle lane (auto-drive smashes those). */
  place() {
    const { stopT } = this.w;
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < stopT.length - 1; i++) {
      const a = stopT[i], gap = stopT[i + 1] - a;
      [0.2, 0.32, 0.44, 0.56, 0.68, 0.8].forEach((f, k) => {
        const side = (k + i) % 2 ? 1 : -1;
        const o = this.make(SIDE_KINDS[Math.floor(rnd() * SIDE_KINDS.length)]);
        this.put(o, a + gap * f, side * (o.wide ? 1.7 : 1.25 + rnd() * 1.3), o.wide ? 0 : rnd() * 6.28);
      });
      this.put(this.make("bug"), a + gap * 0.5, 0, 0);
      if (i % 2 === 0) this.put(this.make("bug"), a + gap * 0.26, 0, 0.7);
    }
  }

  put(o, t, lat, rot) {
    const { curve, scene } = this.w;
    const p = curve.getPointAt(t), tg = curve.getTangentAt(t), right = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
    const pos = p.clone().addScaledVector(right, lat);
    o.g.position.copy(pos); o.g.lookAt(pos.clone().add(tg)); o.g.rotateY(rot);
    scene.add(o.g);
    this.w.clutter.push(o.g);
    this.list.push(Object.assign(o, { tg: tg.clone(), right, gone: false, center: Math.abs(lat) < 0.5 }));
  }

  /**
   * Check the car against obstacles. In auto mode only middle-lane ones can be hit.
   * @returns {null | { wide: boolean, breaks: boolean }} what was hit this frame
   */
  collide(carPos, fwd, speed, manual) {
    let result = null;
    for (const o of this.list) {
      if (o.gone || (!manual && !o.center)) continue;
      const dx = carPos.x - o.g.position.x, dz = carPos.z - o.g.position.z;
      const hit = o.wide
        ? Math.abs(dx * o.tg.x + dz * o.tg.z) < 0.4 && Math.abs(dx * o.right.x + dz * o.right.z) < 0.9
        : Math.hypot(dx, dz) < o.r + 0.3;
      if (!hit) continue;
      o.gone = true;
      if (o.breaks) this.shatter(o, carPos, fwd, speed); else this.knock(o, carPos, fwd);
      result = { wide: !!o.wide, breaks: o.breaks };
    }
    return result;
  }

  shatter(o, carPos, fwd, speed) {
    const { scene } = this.w, pc = o.pieces, origin = o.g.position.clone();
    scene.remove(o.g);
    for (let k = 0; k < pc.n; k++) {
      const mat = pc.mats[k % pc.mats.length].clone(); mat.transparent = true;
      const m = new THREE.Mesh(pc.geo, mat);
      m.position.copy(origin).add(new THREE.Vector3((Math.random() - 0.5) * 0.9, 0.2 + Math.random() * 0.7, (Math.random() - 0.5) * 0.9));
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      const out = new THREE.Vector3(m.position.x - carPos.x, 0, m.position.z - carPos.z).normalize();
      const v = out.multiplyScalar(1.5 + Math.random() * 2.5).addScaledVector(fwd, 2 + speed * 0.6 + Math.random() * 2);
      v.y = 2.5 + Math.random() * 3.5;
      scene.add(m);
      const spin = () => (Math.random() - 0.5) * 12;
      this.frags.push({ m, v, av: new THREE.Vector3(spin(), spin(), spin()), life: 2.4 + Math.random() * 0.8, h: 0.1 });
    }
  }

  knock(o, carPos, fwd) {
    const away = new THREE.Vector3(o.g.position.x - carPos.x, 0, o.g.position.z - carPos.z).normalize().addScaledVector(fwd, 0.8).normalize();
    const to = o.g.position.clone().addScaledVector(away, 2.6 + Math.random());
    if (reduce) { o.g.position.copy(to); o.g.rotation.x = Math.PI / 2; return; }
    anime({ targets: o.g.position, x: to.x, z: to.z, duration: 900, easing: "easeOutCubic" });
    anime({ targets: o.g.position, y: [{ value: 0.9, duration: 350, easing: "easeOutQuad" }, { value: 0, duration: 450, easing: "easeInQuad" }] });
    anime({ targets: o.g.rotation, x: o.g.rotation.x + Math.PI / 2, z: o.g.rotation.z + Math.random() * 2, duration: 800, easing: "easeOutQuad" });
  }

  update(dt, now) {
    for (let k = this.frags.length - 1; k >= 0; k--) {
      const f = this.frags[k];
      f.v.y -= 12 * dt;
      f.m.position.addScaledVector(f.v, dt);
      if (f.m.position.y < f.h) { f.m.position.y = f.h; f.v.y *= -0.35; f.v.x *= 0.7; f.v.z *= 0.7; f.av.multiplyScalar(0.7); }
      f.m.rotation.x += f.av.x * dt; f.m.rotation.y += f.av.y * dt; f.m.rotation.z += f.av.z * dt;
      f.life -= dt;
      if (f.life < 0.8) f.m.material.opacity = Math.max(0, f.life / 0.8);
      if (f.life <= 0) { this.w.scene.remove(f.m); f.m.material.dispose(); this.frags.splice(k, 1); }
    }
    if (reduce) return;
    for (const o of this.list) {
      const s = o.g.userData.spinner;
      if (!o.gone && s) { s.rotation.y += dt * 1.5; s.position.y = 0.55 + Math.sin(now / 300 + o.g.position.x) * 0.06; }
    }
  }
}
