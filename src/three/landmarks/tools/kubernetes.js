import * as THREE from "three";
import { glowMat, darkMat, line3, addTag } from "../helpers.js";

/**
 * Control plane managing three worker nodes; pods get scheduled in and out.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function kubernetes(g, anims) {      // control plane managing three worker nodes; pods get scheduled in and out
  const cp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.0), glowMat(0x5B8CFF, 0.5)); cp.position.y = 4.1; g.add(cp);
  const cpE = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.42, 0.52, 1.02)), new THREE.LineBasicMaterial({ color: 0xBFD0FF })); cpE.position.copy(cp.position); g.add(cpE);
  const pods = [];
  [-1.6, 0, 1.6].forEach(function (x, n) {
    const node = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 1.1), darkMat()); node.position.set(x, 1.1, n === 1 ? 0.5 : 0); g.add(node);
    const rim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.32, 0.17, 1.12)), new THREE.LineBasicMaterial({ color: 0x5B8CFF })); rim.position.copy(node.position); g.add(rim);
    g.add(line3(new THREE.Vector3(x, 1.2, node.position.z), new THREE.Vector3(0, 3.85, 0), 0x5B8CFF, 0.5));
    for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), glowMat(k === 3 ? 0xFFB547 : 0x8FB0FF, 0.55)); p.position.set(x - 0.3 + (k % 2) * 0.6, 1.38, node.position.z - 0.25 + Math.floor(k / 2) * 0.5); g.add(p); pods.push({ m: p, d: n * 0.9 + k * 0.4 }); }
  });
  // labels
  addTag(g, "Control plane", "#FFB547", 0, 4.75, 0.2, 1.3);
  ["Node 1", "Node 2", "Node 3"].forEach((n, i) => addTag(g, n, "#5B8CFF", [-1.6, 0, 1.6][i], 0.72, i === 1 ? 1.15 : 0.65, 0.75));
  addTag(g, "Pods", "#BFD0FF", -1.6, 2.05, 0.2, 0.6);
  addTag(g, "API", "#5B8CFF", -0.95, 2.75, 0.2, 0.5);
  anims.push(function (t) { pods.forEach(function (p) { const ph = ((t * 0.22 - p.d * 0.1) % 1 + 1) % 1, s = ph < 0.08 ? ph / 0.08 : ph > 0.92 ? (1 - ph) / 0.08 : 1; p.m.scale.setScalar(Math.max(0.01, s)); p.m.position.y = 1.38 + (1 - s) * 1.2; }); cp.rotation.y = Math.sin(t * 0.5) * 0.15; cpE.rotation.y = cp.rotation.y; });
}
