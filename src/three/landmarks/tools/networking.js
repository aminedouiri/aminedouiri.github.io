import * as THREE from "three";
import { glowMat, line3, rack, tagSprite, addTag } from "../helpers.js";

/**
 * Core router, switches and servers; packets flow, one link passes a firewall.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function networking(g, anims) {      // core router, two switches, four servers; packets flow, one link passes a firewall
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), glowMat(0xFFB547, 0.7)); core.position.set(0, 3.6, 0); g.add(core);
  const sw = [new THREE.Vector3(-1.4, 2.2, 0), new THREE.Vector3(1.4, 2.2, 0)];
  const srv = [new THREE.Vector3(-2.1, 0.9, 0.3), new THREE.Vector3(-0.7, 0.9, -0.3), new THREE.Vector3(0.7, 0.9, -0.3), new THREE.Vector3(2.1, 0.9, 0.3)];
  sw.forEach((p) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.5), glowMat(0x5B8CFF, 0.55)); m.position.copy(p); g.add(m); });
  srv.forEach((p) => { const r = rack(0.9, 0x8FB0FF); r.position.copy(p); r.scale.setScalar(0.85); g.add(r); });
  const links = [[core.position, sw[0]], [core.position, sw[1]], [sw[0], srv[0]], [sw[0], srv[1]], [sw[1], srv[2]], [sw[1], srv[3]], [sw[0], sw[1]]];
  const curves = links.map(function (l, k) { g.add(line3(l[0], l[1], k === 6 ? 0xFFB547 : 0x8FB0FF, 0.7)); return l; });
  const fw = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xC2412D, emissive: 0x7a1a0c, emissiveIntensity: 0.6 })); fw.position.copy(core.position.clone().lerp(sw[1], 0.5)); g.add(fw);
  const tagF = tagSprite("FIREWALL", "#FF6B4A", 1.0); tagF.position.copy(fw.position).add(new THREE.Vector3(0.9, 0.2, 0)); g.add(tagF);
  const pk = curves.map((c, k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: k === 6 ? 0xFFB547 : 0xffffff })); g.add(m); return { m: m, a: c[0], b: c[1], off: k * 0.17 }; });
  // labels
  addTag(g, "Core router", "#FFB547", 0, 4.35, 0.2, 1.0);
  sw.forEach((p, i) => addTag(g, "Switch " + (i + 1), "#5B8CFF", p.x, p.y + 0.42, 0.2, 0.8));
  addTag(g, "Servers", "#8FB0FF", 0, 0.45, 0.8, 0.8);
  anims.push(function (t) { core.rotation.y = t * 0.8; pk.forEach((p) => { const u = (t * 0.45 + p.off) % 1; p.m.position.copy(p.a).lerp(p.b, u); }); });
}
