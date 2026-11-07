import * as THREE from "three";
import { tagSprite, glowMat, darkMat, framedBox, gear, bar, addTag } from "../helpers.js";

/**
 * The DevOps lifecycle: an infinity loop, Dev (blue) to Ops (amber), standing on a metal frame.
 * Each of the eight phases has its own small 3D object, which lights up when the pulse passes.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function devopsLoop(g, anims) {
  const A = 3.4, Y = 3.3, pts = [];
  for (let i = 0; i <= 240; i++) { const t = i / 240 * Math.PI * 2, d = 1 + Math.sin(t) * Math.sin(t); pts.push(new THREE.Vector3(A * Math.cos(t) / d, Y + A * Math.sin(t) * Math.cos(t) / d, 0)); }
  const path = new THREE.CatmullRomCurve3(pts, true);
  const geo = new THREE.TubeGeometry(path, 360, 0.1, 12, true);
  const blue = new THREE.Color(0x5B8CFF), amber = new THREE.Color(0xFFB547), cols = [], pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const f = Math.max(0, Math.min(1, (pos.getX(i) / A + 0.6) / 1.2)); const c = blue.clone().lerp(amber, f * f * (3 - 2 * f)); cols.push(c.r, c.g, c.b); }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));

  // metal stand: a plinth and two struts holding each lobe
  const plinth = framedBox(6.2, 0.3, 1.1, 0x5B8CFF); plinth.position.y = 0.45; g.add(plinth);
  [-1, 1].forEach((s) => {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 1.75, 10), darkMat());
    strut.position.set(s * A * 0.62, 1.45, -0.15); g.add(strut);
    const led = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: s < 0 ? 0x5B8CFF : 0xFFB547 }));
    led.position.set(s * 1.6, 0.45, 0.57); g.add(led);
  });

  // eight phases: node + ring on the loop, a 3D icon inside the lobe, a name outside
  const phases = [["PLAN", 0.31], ["CODE", 0.42], ["BUILD", 0.58], ["TEST", 0.69], ["RELEASE", 0.81], ["DEPLOY", 0.92], ["OPERATE", 0.08], ["MONITOR", 0.19]];
  const nodeGeo = new THREE.SphereGeometry(0.17, 18, 12), ringGeo = new THREE.RingGeometry(0.24, 0.29, 32);
  const marks = [];
  phases.forEach(function (ph, k) {
    const p = path.getPointAt(ph[1]), dev = k < 4, col = dev ? 0x5B8CFF : 0xFFB547;
    const node = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: 0xF2F3F5, toneMapped: false })); node.position.copy(p); g.add(node);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, toneMapped: false })); ring.position.copy(p); g.add(ring);
    const lobe = new THREE.Vector3(dev ? -A * 0.62 : A * 0.62, Y, 0);
    const out = p.clone().sub(lobe).setZ(0).normalize();
    const tag = tagSprite(ph[0], dev ? "#5B8CFF" : "#FFB547", 1.35); tag.position.copy(p).addScaledVector(out, 0.85); tag.position.z = 0.05;
    if (Math.abs(p.x) < A * 0.45) { tag.position.set(p.x + (p.x < 0 ? -1.0 : 1.0), p.y + (p.y > Y ? 0.45 : -0.45), 0.05); }
    g.add(tag);
    const icon = PHASE_ICONS[ph[0]](col);
    icon.position.copy(p).lerp(lobe, 0.48); icon.position.z = 0.3;
    g.add(icon);
    marks.push({ u: ph[1], ring, icon, spin: icon.userData.spin });
  });
  const dev = tagSprite("DEV", "#5B8CFF", 0.85), ops = tagSprite("OPS", "#FFB547", 0.85);
  dev.position.set(-A * 0.62, Y, -0.2); ops.position.set(A * 0.62, Y, -0.2); dev.material.opacity = ops.material.opacity = 0.55; g.add(dev); g.add(ops);

  // a single pulse with a short fading trail
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); g.add(pulse);
  const trail = [0.012, 0.024, 0.036].map(function (off, k) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.13 - k * 0.025, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 - k * 0.14, depthWrite: false })); g.add(m); return { m: m, off: off }; });

  // labels on the stand
  addTag(g, "Development", "#5B8CFF", -1.6, 0.42, 0.75, 1.0);
  addTag(g, "Operations", "#FFB547", 1.6, 0.42, 0.75, 1.0);
  anims.push(function (t) {
    const u = (t * 0.06) % 1;
    pulse.position.copy(path.getPointAt(u));
    trail.forEach((tr) => tr.m.position.copy(path.getPointAt(((u - tr.off) % 1 + 1) % 1)));
    marks.forEach((m) => {
      let d = Math.abs(u - m.u); d = Math.min(d, 1 - d);
      const hot = Math.max(0, 1 - d / 0.05);                 // 1 when the pulse is on this phase
      m.ring.scale.setScalar(1 + hot * 0.5);
      m.icon.scale.setScalar(1 + hot * 0.35);
      m.icon.rotation.y = Math.sin(t * 0.8 + m.u * 9) * 0.35;
      if (m.spin) m.spin.rotation.z = t * 1.5;
    });
  });
}

/* ---------- small 3D icon for each phase (about 0.4 units wide) ---------- */
const white = () => new THREE.MeshBasicMaterial({ color: 0xF2F3F5 });
const PHASE_ICONS = {
  PLAN(col) {          // calendar board
    const g = framedBox(0.46, 0.4, 0.05, col);
    for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.02), i === 4 ? glowMat(0xFFB547, 0.8) : white()); c.position.set(-0.12 + (i % 3) * 0.12, 0.05 - Math.floor(i / 3) * 0.13, 0.035); g.add(c); }
    return g;
  },
  CODE(col) {          // </> brackets
    const g = new THREE.Group(), m = glowMat(col, 0.8), s = 0.05;
    g.add(bar(new THREE.Vector3(-0.1, 0.13, 0), new THREE.Vector3(-0.24, 0, 0), s, m));
    g.add(bar(new THREE.Vector3(-0.24, 0, 0), new THREE.Vector3(-0.1, -0.13, 0), s, m));
    g.add(bar(new THREE.Vector3(0.1, 0.13, 0), new THREE.Vector3(0.24, 0, 0), s, m));
    g.add(bar(new THREE.Vector3(0.24, 0, 0), new THREE.Vector3(0.1, -0.13, 0), s, m));
    g.add(bar(new THREE.Vector3(0.05, 0.16, 0), new THREE.Vector3(-0.05, -0.16, 0), s, white()));
    return g;
  },
  BUILD(col) {         // stacked blocks
    const g = new THREE.Group();
    [[-0.11, -0.1], [0.11, -0.1], [0, 0.11]].forEach(([x, y], i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), glowMat(i === 2 ? 0xF2F3F5 : col, 0.5)); b.position.set(x, y, 0); g.add(b); });
    return g;
  },
  TEST(col) {          // check mark in a ring
    const g = new THREE.Group(), m = glowMat(0x38D98A, 0.9);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 28), glowMat(col, 0.6)));
    g.add(bar(new THREE.Vector3(-0.11, 0, 0), new THREE.Vector3(-0.03, -0.09, 0), 0.055, m));
    g.add(bar(new THREE.Vector3(-0.03, -0.09, 0), new THREE.Vector3(0.13, 0.1, 0), 0.055, m));
    return g;
  },
  RELEASE(col) {       // wrapped package
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.28), darkMat()));
    const r = glowMat(col, 0.8);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.3), r));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.3), r));
    return g;
  },
  DEPLOY(col) {        // rocket
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12), white()); g.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 12), glowMat(col, 0.8)); nose.position.y = 0.22; g.add(nose);
    [-1, 1].forEach((s) => { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.03), glowMat(col, 0.6)); fin.position.set(s * 0.1, -0.12, 0); g.add(fin); });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 10), new THREE.MeshBasicMaterial({ color: 0xFFB547 })); flame.rotation.x = Math.PI; flame.position.y = -0.22; g.add(flame);
    g.rotation.z = -0.5;
    return g;
  },
  OPERATE(col) {       // spinning gear
    const g = new THREE.Group(), gr = gear(0.14, col); g.add(gr); g.userData.spin = gr;
    return g;
  },
  MONITOR(col) {       // screen with a chart
    const g = framedBox(0.5, 0.34, 0.05, col);
    [0.08, 0.16, 0.11, 0.22].forEach((h, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, h, 0.02), i === 3 ? glowMat(0x38D98A, 0.9) : white()); b.position.set(-0.15 + i * 0.1, -0.12 + h / 2, 0.035); g.add(b); });
    return g;
  },
};
