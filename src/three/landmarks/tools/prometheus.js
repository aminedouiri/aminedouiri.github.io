import * as THREE from "three";
import { glowMat, addTag } from "../helpers.js";

/**
 * Live metric bars rising and falling over an alert threshold.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function prometheus(g, anims) { // live metrics: bars rising and falling over a threshold line
  const plate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 1.4), new THREE.MeshStandardMaterial({ color: 0x1B2130, metalness: 0.6, roughness: 0.3 })); plate.position.y = 0.9; g.add(plate);
  const bars = [];
  for (let k = 0; k < 9; k++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1, 0.32), glowMat(k % 4 === 3 ? 0xFF6B4A : 0xFFB547, 0.5));
    m.position.set(-1.8 + k * 0.45, 0.96, 0); g.add(m); bars.push(m);
  }
  const thr = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xFF6B4A })); thr.position.set(0, 3.4, 0.25); g.add(thr);
  // labels
  addTag(g, "Alert threshold", "#FF6B4A", 2.2, 3.7, 0.3, 1.2);
  addTag(g, "Scraped metrics", "#FFB547", 0, 0.55, 0.85, 1.2);
  addTag(g, "Red = critical", "#FF6B4A", -1.5, 3.7, 0.3, 1.1);
  anims.push(function (t) { bars.forEach(function (b, k) { const h = 0.6 + 1.6 * (0.5 + 0.5 * Math.sin(t * 1.4 + k * 0.7)) + 0.6 * Math.sin(t * 3.1 + k * 1.9) * 0.5; b.scale.y = Math.max(0.2, h); b.position.y = 0.96 + b.scale.y / 2; }); });
}
