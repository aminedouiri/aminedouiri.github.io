import * as THREE from "three";
import { glowMat, darkMat, tagSprite, addTag } from "../helpers.js";

/**
 * CI/CD pipeline: commits ride through build, test, scan, package and deploy gates into a cluster.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function cicd(g, anims) {     // commits ride through build → test → scan → package → deploy, into a cluster
  const names = ["BUILD", "TEST", "SCAN", "PACKAGE", "DEPLOY"], gates = [];
  const belt = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.7), darkMat()); belt.position.y = 1.0; g.add(belt);
  names.forEach(function (n, k) {
    const x = -2.2 + k * 1.1, gate = new THREE.Group(); gate.position.set(x, 1.0, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2A3040, emissive: 0x2A3040, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.4 });
    [-0.42, 0.42].forEach((z) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), mat); p.position.set(0, 0.5, z); gate.add(p); });
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.96), mat); top.position.y = 1.02; gate.add(top);
    const tag = tagSprite(n, k === 4 ? "#FFB547" : "#5B8CFF", 1.05); tag.position.set(0, 1.45, 0); gate.add(tag);
    g.add(gate); gates.push({ mat: mat, x: x });
  });
  const clus = new THREE.Group(); clus.position.set(3.1, 1.0, 0); g.add(clus);
  for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), glowMat(0x5B8CFF, 0.5)); c.position.set(0, 0.3 + k * 0.48, 0); clus.add(c); }
  const pk = []; for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), glowMat(0xF2F3F5, 0.4)); g.add(b); pk.push(b); }
  const ok = new THREE.Color(0x38D98A), idle = new THREE.Color(0x2A3040);
  // labels
  addTag(g, "Commit", "#BFD0FF", -2.95, 1.75, 0.2, 0.75);
  addTag(g, "Cluster", "#5B8CFF", 3.1, 2.95, 0.2, 0.8);
  addTag(g, "Green = passed", "#38D98A", 0, 0.55, 0.75, 1.1);
  anims.push(function (t) {
    let lead = -9;
    pk.forEach(function (b, k) { const u = ((t * 0.16 + k / 3) % 1), x = -2.9 + u * 6.0; b.position.set(Math.min(x, 3.1), 1.25 + (x > 2.8 ? (x - 2.8) * 2 : 0), 0); b.material.emissive.copy(x > 2.2 ? ok : new THREE.Color(0xF2F3F5)); b.visible = x < 3.4; if (k === 0) lead = x; });
    gates.forEach((gt) => { const c = lead > gt.x ? ok : idle; gt.mat.color.copy(c); gt.mat.emissive.copy(c); });
  });
}
