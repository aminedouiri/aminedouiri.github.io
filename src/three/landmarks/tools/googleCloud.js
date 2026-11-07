import * as THREE from "three";
import { glowMat, rack, addTag } from "../helpers.js";

/**
 * Three zones of compute under a rotating global load-balancer ring.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function googleCloud(g, anims) {      // three zones of compute under a global load-balancer ring
  const zones = [], beams = [];
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2 + Math.PI / 2, zg = new THREE.Group(); zg.position.set(Math.cos(a) * 1.6, 0.3, Math.sin(a) * 1.6);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0x5B8CFF, emissive: 0x5B8CFF, emissiveIntensity: 0.25, transparent: true, opacity: 0.5 })); zg.add(plate);
    [-0.35, 0.35].forEach(function (x, j) { const r = rack(1.1 + j * 0.35, 0x8FB0FF); r.position.set(x, 0.6 + j * 0.17, 0); zg.add(r); });
    g.add(zg); zones.push(zg);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), new THREE.MeshBasicMaterial({ color: 0xBFD0FF, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
    b.position.set(zg.position.x * 0.55, 2.9, zg.position.z * 0.55); b.lookAt(new THREE.Vector3(0, 4, 0)); b.rotateX(Math.PI / 2); g.add(b); beams.push(b);
  }
  const lb = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 10, 64), glowMat(0xFFB547, 0.7)); lb.position.y = 4; lb.rotation.x = Math.PI / 2; g.add(lb);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), glowMat(0xF2F3F5, 0.6)); core.position.y = 4; g.add(core);
  const cm = new THREE.MeshStandardMaterial({ color: 0xDCE5FF, emissive: 0x5B8CFF, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
  const cloud = new THREE.Group(); cloud.position.y = 5; g.add(cloud);
  [[0, 0, 0.55], [-0.6, -0.1, 0.42], [0.62, -0.12, 0.4], [0.2, 0.25, 0.4]].forEach((p) => { const s = new THREE.Mesh(new THREE.SphereGeometry(p[2], 18, 12), cm); s.position.set(p[0], p[1], 0); cloud.add(s); });
  // labels
  ["Zone A", "Zone B", "Zone C"].forEach((n, k) => addTag(zones[k], n, "#5B8CFF", 0, 1.75, 0.2, 0.75));
  addTag(g, "Global load balancer", "#FFB547", 0, 3.45, 1.3, 1.5);
  anims.push(function (t) { lb.rotation.z = t * 0.6; cloud.position.y = 5 + Math.sin(t * 0.7) * 0.1; beams.forEach((b, k) => { b.material.opacity = 0.2 + 0.5 * Math.max(0, Math.sin(t * 2.4 - k * 2.1)); }); });
}
