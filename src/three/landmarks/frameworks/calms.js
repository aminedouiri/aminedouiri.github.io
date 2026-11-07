import * as THREE from "three";
import { glowMat, darkMat, tagSprite, framedBox, gear, line3, addTag } from "../helpers.js";

/**
 * CALMS: five pillars (Culture, Automation, Lean, Measurement, Sharing) on a stepped base.
 * Each pillar has a lettered cap and its own working object in front of it.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function calms(g, anims) {
  const names = ["CULTURE", "AUTOMATION", "LEAN", "MEASURE", "SHARING"], H = [2.4, 3.1, 2.6, 3.3, 2.8], cols = [];
  const step = framedBox(6.4, 0.22, 1.9, 0x5B8CFF); step.position.set(0, 0.42, 0); g.add(step);
  const updates = [];

  names.forEach(function (n, k) {
    const x = -2.4 + k * 1.2, z = -Math.abs(k - 2) * 0.25 - 0.3, accent = k % 2 ? 0x5B8CFF : 0xFFB547;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, H[k], 20), new THREE.MeshStandardMaterial({ color: 0x1C2333, metalness: 0.7, roughness: 0.3, emissive: 0x5B8CFF, emissiveIntensity: 0.2 }));
    col.position.set(x, 0.53 + H[k] / 2, z); g.add(col); cols.push(col);
    for (let r = 0; r < 3; r++) { // glowing bands up the pillar
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.02, 6, 24), new THREE.MeshBasicMaterial({ color: accent }));
      band.rotation.x = Math.PI / 2; band.position.set(x, 0.75 + r * (H[k] - 0.5) / 2, z); g.add(band);
    }

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.18), glowMat(accent, 0.6)); cap.position.set(x, 0.53 + H[k] + 0.45, z); g.add(cap);
    const L = document.createElement("canvas"); L.width = L.height = 128; const lx = L.getContext("2d"); lx.fillStyle = "#07080B"; lx.font = "800 96px 'Plus Jakarta Sans', Arial"; lx.textAlign = "center"; lx.textBaseline = "middle"; lx.fillText(n[0], 64, 70);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(L), transparent: true, toneMapped: false })); face.position.set(x, cap.position.y, z + 0.1); g.add(face);
    const tag = tagSprite(n, k % 2 ? "#5B8CFF" : "#FFB547", 1.25); tag.position.set(x, cap.position.y + 0.75, z); g.add(tag);

    // the pillar's own object, on a small plinth in front of it
    const plinth = framedBox(0.8, 0.12, 0.55, accent); plinth.position.set(x, 0.59, 0.55); g.add(plinth);
    const obj = PILLAR_OBJECTS[k](accent, updates);
    obj.position.set(x, 0.95, 0.55); g.add(obj);
  });

  // what each pillar's object shows
  ["Shared ownership", "Pipelines", "Small batches", "Decide with data", "Share knowledge"].forEach((n, k) => addTag(g, n, k % 2 ? "#5B8CFF" : "#FFB547", -2.4 + k * 1.2, 0.42, 1.1, 1.0));
  anims.push(function (t) {
    cols.forEach((c, k) => { c.material.emissiveIntensity = 0.15 + 0.5 * Math.max(0, Math.sin(t * 1.6 - k * 0.8)); });
    updates.forEach((u) => u(t));
  });
}

const PILLAR_OBJECTS = [
  (col, up) => {         // Culture: three people linked in a circle
    const g = new THREE.Group(), ppl = [];
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Group();
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), glowMat(0xF2F3F5, 0.4)); head.position.y = 0.12; p.add(head);
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 12), glowMat(col, 0.5)); p.add(body);
      g.add(p); ppl.push(p);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 32), new THREE.MeshBasicMaterial({ color: col })); ring.rotation.x = Math.PI / 2; ring.position.y = -0.05; g.add(ring);
    up.push((t) => ppl.forEach((p, i) => { const a = t * 0.6 + i * 2.094; p.position.set(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2); }));
    return g;
  },
  (col, up) => {         // Automation: two meshing gears
    const g = new THREE.Group(), a = gear(0.12, col), b = gear(0.09, 0xF2F3F5, 6);
    a.position.set(-0.08, 0.02, 0); b.position.set(0.15, 0.1, 0); g.add(a); g.add(b);
    up.push((t) => { a.rotation.z = t * 1.2; b.rotation.z = -t * 1.6; });
    return g;
  },
  (col, up) => {         // Lean: small batches flowing down a funnel
    const g = new THREE.Group();
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.05, 0.25, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x2A3040, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide })); funnel.position.y = 0.12; g.add(funnel);
    const bits = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), glowMat(col, 0.8)); g.add(m); return m; });
    up.push((t) => bits.forEach((m, i) => { const u = (t * 0.5 + i / 3) % 1; m.position.set(0, 0.35 - u * 0.55, 0); m.scale.setScalar(u < 0.1 ? u * 10 : u > 0.9 ? (1 - u) * 10 : 1); }));
    return g;
  },
  (col, up) => {         // Measurement: bar chart that keeps changing
    const g = new THREE.Group(), bars = [];
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), glowMat(i === 3 ? 0x38D98A : col, 0.6)); b.geometry.translate(0, 0.15, 0); b.position.set(-0.15 + i * 0.1, -0.1, 0); g.add(b); bars.push(b); }
    up.push((t) => bars.forEach((b, i) => { b.scale.y = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 1.1)); }));
    return g;
  },
  (col, up) => {         // Sharing: two nodes passing a packet back and forth
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), darkMat()), b = a.clone();
    a.position.x = -0.2; b.position.x = 0.2; g.add(a); g.add(b);
    g.add(line3(a.position, b.position, col, 0.6));
    const pk = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFFFFF })); g.add(pk);
    up.push((t) => { const u = 0.5 + 0.5 * Math.sin(t * 1.8); pk.position.set(-0.2 + u * 0.4, Math.sin(u * Math.PI) * 0.08, 0); });
    return g;
  },
];
