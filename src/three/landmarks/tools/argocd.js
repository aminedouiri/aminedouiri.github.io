import * as THREE from "three";
import { glowMat, line3, addTag } from "../helpers.js";

/**
 * GitOps: Git history and a cluster; drift is detected and synced back.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function argocd(g, anims) {     // GitOps: Git history on the left, cluster on the right; drift is detected and synced back
  const commits = [];
  for (let k = 0; k < 5; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.14, 24), glowMat(k === 4 ? 0xFFB547 : 0x8FB0FF, 0.4)); d.position.set(-1.7, 1.1 + k * 0.34, 0); g.add(d); commits.push(d); }
  g.add(line3(new THREE.Vector3(-1.7, 1.0, 0), new THREE.Vector3(-1.7, 2.7, 0), 0xBFD0FF, 0.6));
  const nodes = [];
  for (let k = 0; k < 3; k++) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x5B8CFF, emissive: 0x5B8CFF, emissiveIntensity: 0.5 })); n.position.set(1.7, 1.2 + k * 0.72, 0); g.add(n); nodes.push(n); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 48, Math.PI * 1.6), glowMat(0xF2F3F5, 0.6)); ring.position.set(0, 2.0, 0); g.add(ring);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 12), glowMat(0xF2F3F5, 0.6)); ring.add(tip); tip.position.set(0.75, 0, 0); tip.rotation.z = Math.PI;
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); g.add(pulse);
  const blue = new THREE.Color(0x5B8CFF), amber = new THREE.Color(0xFFB547);
  // labels
  addTag(g, "Git repo", "#8FB0FF", -1.7, 3.25, 0.2, 0.9);
  addTag(g, "Cluster", "#5B8CFF", 1.7, 3.55, 0.2, 0.85);
  addTag(g, "Auto-sync", "#BFD0FF", 0, 3.05, 0.2, 0.9);
  addTag(g, "Desired state", "#8FB0FF", -1.7, 0.7, 0.7, 1.0);
  const driftTag = addTag(g, "Drift!", "#FFB547", 2.65, 1.92, 0.3, 0.6);
  anims.push(function (t) {
    ring.rotation.z = -t * 1.4;
    const ph = (t * 0.2) % 1, drift = ph > 0.2 && ph < 0.6;
    nodes[1].material.color.copy(drift ? amber : blue); nodes[1].material.emissive.copy(drift ? amber : blue); nodes[1].rotation.y = drift ? 0.35 : 0; driftTag.visible = drift;
    const u = ph > 0.45 && ph < 0.6 ? (ph - 0.45) / 0.15 : -1;
    pulse.visible = u >= 0; if (u >= 0) pulse.position.set(-1.7 + u * 3.4, 2.4 - Math.sin(u * Math.PI) * -0.6, 0);
  });
}
