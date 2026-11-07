import * as THREE from "three";
import { glowMat, addTag } from "../helpers.js";

/**
 * Planned resources (wireframe) become real (solid) as an apply scan sweeps across.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function terraform(g, anims) { // plan (wireframe) becomes real (solid) as the apply scan sweeps across
  const items = [];
  const base = new THREE.Mesh(new THREE.BoxGeometry(4, 0.08, 2.6), new THREE.MeshStandardMaterial({ color: 0x5B8CFF, emissive: 0x5B8CFF, emissiveIntensity: 0.2, transparent: true, opacity: 0.4 })); base.position.y = 0.9; g.add(base);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const h = 0.6 + ((i * 3 + j * 5) % 4) * 0.35, x = -1.4 + i * 0.93, z = -0.55 + j * 1.1;
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.62, h, 0.62)), new THREE.LineDashedMaterial({ color: 0xBFD0FF, dashSize: 0.08, gapSize: 0.06 })); wire.computeLineDistances(); wire.position.set(x, 0.94 + h / 2, z); g.add(wire);
    const solid = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6), glowMat((i + j) % 3 ? 0x8FB0FF : 0xFFB547, 0.45)); solid.position.copy(wire.position); g.add(solid);
    items.push({ s: solid, x: x });
  }
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 3), new THREE.MeshBasicMaterial({ color: 0xFFB547, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); scan.rotation.y = Math.PI / 2; scan.scale.set(1, 1, 1); scan.position.y = 2.2; g.add(scan);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3), new THREE.MeshBasicMaterial({ color: 0xFFB547, transparent: true, opacity: 0.12, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); sheet.rotation.y = Math.PI / 2; sheet.position.y = 2.2; g.add(sheet);
  // labels
  addTag(g, "Plan (wireframe)", "#BFD0FF", -1.3, 3.55, 0.2, 1.3);
  addTag(g, "Resources", "#FFB547", 1.4, 3.55, 0.2, 1.0);
  addTag(scan, "Apply", "#FFB547", 0, 1.75, 0, 0.7);
  addTag(g, "State", "#5B8CFF", 2.35, 0.95, 1.0, 0.6);
  anims.push(function (t) { const ph = (t * 0.25) % 1.25, x = -2.2 + Math.min(ph, 1) * 4.4; scan.position.x = sheet.position.x = x; sheet.material.opacity = ph > 1 ? 0 : 0.12; items.forEach((it) => { const on = ph <= 1 ? it.x < x : true; const sc = it.s.scale.y + ((on ? 1 : 0.01) - it.s.scale.y) * 0.15; it.s.scale.set(1, Math.max(0.01, sc), 1); }); });
}
