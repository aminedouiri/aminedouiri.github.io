import * as THREE from "three";
import { glowMat, addTag } from "../helpers.js";

/**
 * Trace waterfall: spans with signals travelling through them.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function opentelemetry(g, anims) {     // trace waterfall: spans with signals travelling through them
  const panel = new THREE.Group(); panel.position.y = 1.2; g.add(panel);
  const spans = [[0, 4.0], [0.3, 2.6], [0.6, 1.4], [1.9, 1.6], [2.6, 1.2]], sig = [];
  spans.forEach(function (s, k) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(s[1], 0.32, 0.18), glowMat(k === 0 ? 0x5B8CFF : k % 2 ? 0x8FB0FF : 0xFFB547, 0.5));
    m.position.set(-2 + s[0] + s[1] / 2, 2.6 - k * 0.5, 0); panel.add(m);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dot.position.set(-2 + s[0], 2.6 - k * 0.5, 0.15); panel.add(dot); sig.push({ m: dot, x0: -2 + s[0], len: s[1], off: k * 0.37 });
  });
  const axis = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.6, 0.04), new THREE.MeshBasicMaterial({ color: 0x9C9A94 })); axis.position.set(-2.1, 1.6, 0); panel.add(axis);
  // labels (move with the panel)
  ["Trace /checkout", "API", "Auth", "DB query", "Cache"].forEach((n, k) => addTag(panel, n, k ? "#BFD0FF" : "#5B8CFF", -2 + spans[k][0] + 0.55, 2.6 - k * 0.5 + 0.27, 0.15, k ? 0.6 : 1.1));
  addTag(panel, "Time →", "#9C9A94", 1.6, 0.2, 0.1, 0.7);
  anims.push(function (t) { panel.rotation.y = Math.sin(t * 0.4) * 0.5; sig.forEach(function (s) { s.m.position.x = s.x0 + ((t * 0.6 + s.off) % 1) * s.len; }); });
}
