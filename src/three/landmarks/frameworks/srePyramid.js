import * as THREE from "three";
import { tagSprite, glowMat, darkMat, framedBox, addTag } from "../helpers.js";

/**
 * SRE reliability pyramid: six layers, monitoring at the base.
 * Each layer has glowing edges and a small object on its front (eye, beacon, report,
 * check, gauge, star). An error-budget meter stands beside it.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function srePyramid(g, anims) {
  const names = ["MONITORING", "INCIDENT RESPONSE", "POSTMORTEMS", "TESTING & RELEASE", "CAPACITY PLANNING", "PRODUCT"], layers = [], updates = [];
  const c0 = new THREE.Color(0x3E63D9), c1 = new THREE.Color(0xFFB547);
  names.forEach(function (n, k) {
    const w = 3.8 - k * 0.55, d = w * 0.55, col = c0.clone().lerp(c1, k / 5), hex = col.getHex();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.35 }));
    m.position.y = 0.6 + k * 0.56; g.add(m); layers.push(m);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.02, 0.52, d + 0.02)), new THREE.LineBasicMaterial({ color: 0xF2F3F5, transparent: true, opacity: 0.5 }));
    edge.position.copy(m.position); g.add(edge);
    const icon = LAYER_ICONS[k](hex, updates);
    icon.position.set(-w / 2 + 0.35, m.position.y, d / 2 + 0.06); g.add(icon);
    const tag = tagSprite(n, "#" + col.getHexString(), 1.7); tag.position.set(w / 2 + 1.1, m.position.y, 0); g.add(tag);
  });

  // error budget meter on the left
  const tube = framedBox(0.3, 2.6, 0.3, 0x5B8CFF); tube.position.set(-2.6, 1.65, 0); g.add(tube);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.5, 0.22), glowMat(0x38D98A, 0.7)); fill.geometry.translate(0, 1.25, 0); fill.position.set(-2.6, 0.4, 0.01); g.add(fill);
  const lbl = tagSprite("ERROR BUDGET", "#38D98A", 1.3); lbl.position.set(-2.6, 3.25, 0.1); g.add(lbl);

  // labels
  addTag(g, "Spent", "#FF6B4A", -2.6, 0.15, 0.35, 0.5);
  addTag(g, "Foundation", "#3E63D9", 0, 0.12, 1.3, 0.9);
  anims.push(function (t) {
    const ph = (t * 0.5) % (layers.length + 2);
    layers.forEach((m, k) => { m.material.emissiveIntensity = Math.abs(ph - k) < 0.6 ? 0.9 : 0.22; });
    const b = 0.55 + 0.4 * Math.sin(t * 0.4);
    fill.scale.y = b;
    fill.material.color.setHex(b < 0.3 ? 0xFF5A5A : 0x38D98A); fill.material.emissive.copy(fill.material.color);
    updates.forEach((u) => u(t));
  });
}

const LAYER_ICONS = [
  (col, up) => {       // Monitoring: eye with a scanning pupil
    const g = new THREE.Group();
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })); eye.scale.set(1.4, 0.8, 0.3); g.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: 0x07080B })); pupil.position.z = 0.05; g.add(pupil);
    up.push((t) => { pupil.position.x = Math.sin(t * 1.2) * 0.08; });
    return g;
  },
  (col, up) => {       // Incident response: rotating beacon
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.06, 12), darkMat()); base.position.y = -0.12; g.add(base);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xFF5A5A })); lamp.position.y = -0.09; g.add(lamp);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xFF8A8A, transparent: true, opacity: 0.6 })); beam.position.y = -0.04; g.add(beam);
    up.push((t) => { beam.rotation.y = t * 3; lamp.material.color.setHex(Math.sin(t * 6) > 0 ? 0xFF5A5A : 0xAA2A2A); });
    return g;
  },
  (col) => {           // Postmortems: report sheet
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.02), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })));
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(i === 0 ? 0.16 : 0.2, 0.025, 0.01), new THREE.MeshBasicMaterial({ color: i === 0 ? col : 0x5A6378 })); l.position.set(i === 0 ? -0.02 : 0, 0.11 - i * 0.07, 0.015); g.add(l); }
    return g;
  },
  () => {              // Testing & release: check mark
    const g = new THREE.Group(), m = glowMat(0x38D98A, 0.9);
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.04), m); a.position.set(-0.06, -0.03, 0); a.rotation.z = -0.8; g.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.04), m); b.position.set(0.05, 0.03, 0); b.rotation.z = 0.9; g.add(b);
    return g;
  },
  (col, up) => {       // Capacity planning: filling gauge
    const g = new THREE.Group(), bars = [];
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.03), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })); b.position.set(-0.1 + i * 0.05, 0, 0); g.add(b); bars.push(b); }
    up.push((t) => { const n = Math.floor(((t * 0.6) % 1) * 6); bars.forEach((b, i) => b.material.color.setHex(i < n ? (i > 3 ? 0xFFB547 : 0x38D98A) : 0x3A4255)); });
    return g;
  },
  (col, up) => {       // Product: spinning star gem
    const g = new THREE.Group(), gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), glowMat(0xFFE2A8, 0.8)); g.add(gem);
    up.push((t) => { gem.rotation.y = t * 1.5; });
    return g;
  },
];
