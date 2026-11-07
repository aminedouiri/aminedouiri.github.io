import * as THREE from "three";
import { glowMat, darkMat, line3, tagSprite, addTag } from "../helpers.js";

/**
 * Layer model (hardware, ESXi, VMs) managed by vCenter; a VM moves between hosts.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function vmware(g, anims) {   // layer model: hardware → ESXi → VMs, managed by vCenter; vMotion between two hosts
  const hostX = [-1.2, 1.2], vms = [];
  hostX.forEach(function (x) {
    const hw = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 1.2), darkMat()); hw.position.set(x, 0.55, 0); g.add(hw);
    const hv = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 1.2), glowMat(0x5B8CFF, 0.7)); hv.position.set(x, 0.8, 0); g.add(hv);
    for (let k = 0; k < 2; k++) { const vm = new THREE.Group(); vm.position.set(x - 0.42 + k * 0.84, 1.25, 0);
      [0x8FB0FF, 0x5B8CFF, 0xF2F3F5].forEach((c, j) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.7), glowMat(c, 0.35)); l.position.y = -0.18 + j * 0.2; vm.add(l); });
      g.add(vm); vms.push(vm); }
  });
  [["HARDWARE", 0.55], ["ESXI", 0.8], ["VMS", 1.3]].forEach(function (d) { const tg = tagSprite(d[0], "#5B8CFF", 0.95); tg.position.set(-2.7, d[1], 0.4); g.add(tg); });
  const vc = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), glowMat(0xFFB547, 0.7)); vc.position.set(0, 3.2, 0); g.add(vc);
  const tagV = tagSprite("VCENTER", "#FFB547", 1.0); tagV.position.set(0, 3.85, 0); g.add(tagV);
  hostX.forEach((x) => g.add(line3(new THREE.Vector3(0, 3.0, 0), new THREE.Vector3(x, 0.9, 0), 0xFFB547, 0.5)));
  const mover = vms[1], home = mover.position.clone();
  // labels
  hostX.forEach((x, i) => addTag(g, "Host " + (i + 1), "#5B8CFF", x, 0.25, 0.75, 0.7));
  addTag(mover, "vMotion", "#FFB547", 0, 0.5, 0, 0.75);
  anims.push(function (t) { vc.rotation.y = t; const ph = (t * 0.18) % 1, f = ph < 0.4 ? 0 : ph < 0.55 ? (ph - 0.4) / 0.15 : ph < 0.85 ? 1 : 1 - (ph - 0.85) / 0.15; const e = f * f * (3 - 2 * f); mover.position.set(home.x + e * 1.56, home.y + Math.sin(e * Math.PI) * 0.6, home.z); });
}
