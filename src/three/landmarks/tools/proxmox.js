import * as THREE from "three";
import { glowMat, line3, addTag } from "../helpers.js";

/**
 * Three-node virtualization cluster; a VM live-migrates around the ring.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function proxmox(g, anims) {  // 3-node virtualization cluster; a VM live-migrates around the ring
  const hosts = [];
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2 - Math.PI / 2, h = new THREE.Group(); h.position.set(Math.cos(a) * 1.7, 0.3, Math.sin(a) * 1.7 + 0.2);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.8), new THREE.MeshStandardMaterial({ color: 0x1A2131, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.55 })); body.position.y = 0.75; h.add(body);
    h.add(Object.assign(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 1.5, 0.8)), new THREE.LineBasicMaterial({ color: 0xFFB547 })), {}));
    h.children[1].position.y = 0.75;
    [[-0.25, 0.45], [0.25, 0.45], [-0.25, 1.0]].forEach((p) => { const vm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.5), glowMat(0x8FB0FF, 0.45)); vm.position.set(p[0], p[1], 0); h.add(vm); });
    const lxc = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.3), glowMat(0x38D98A, 0.5)); lxc.position.set(0.28, 1.0, 0); h.add(lxc);
    g.add(h); hosts.push(h);
  }
  for (let k = 0; k < 3; k++) g.add(line3(hosts[k].position.clone().setY(1.8), hosts[(k + 1) % 3].position.clone().setY(1.8), 0xFFB547, 0.6));
  const mig = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.5), glowMat(0xFFB547, 0.8)); g.add(mig);
  // labels
  hosts.forEach((h, k) => addTag(h, "Node " + (k + 1), "#FFB547", 0, -0.08, 0.55, 0.7));
  addTag(g, "VM", "#8FB0FF", -2.75, 1.25, 0.6, 0.45);
  addTag(g, "LXC", "#38D98A", -2.75, 0.95, 0.6, 0.5);
  addTag(mig, "Live migration", "#FFB547", 0, 0.45, 0, 1.1);
  anims.push(function (t) { const u = (t * 0.15) % 1, k = Math.floor(u * 3), f = (u * 3) % 1, a = hosts[k].position, b = hosts[(k + 1) % 3].position; const e = f * f * (3 - 2 * f); mig.position.set(a.x + (b.x - a.x) * e, 2.1 + Math.sin(e * Math.PI) * 0.5, a.z + (b.z - a.z) * e); mig.rotation.y = t; });
}
