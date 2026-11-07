import * as THREE from "three";
import { glowMat, tagSprite, addTag } from "../helpers.js";

/**
 * Image layers stack into an image, then containers start from it.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function docker(g, anims) {   // image layers stack into an image, then containers start from it
  const layers = [];
  for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 1.1), glowMat([0x3E63D9, 0x5B8CFF, 0x8FB0FF, 0xFFB547][k], 0.4)); l.position.set(-1.5, 1.0 + k * 0.26, 0); g.add(l); layers.push(l); }
  const tagI = tagSprite("IMAGE", "#5B8CFF", 0.9); tagI.position.set(-1.5, 2.45, 0); g.add(tagI);
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x0E1220, metalness: 0.5, roughness: 0.5 });
  const ctrs = [];
  for (let k = 0; k < 3; k++) {
    const c = new THREE.Group(); c.position.set(0.6 + k * 0.85, 1.0 + (k === 1 ? 0.7 : 0), k === 1 ? -0.3 : 0.2);
    c.add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.55), glowMat(0x5B8CFF, 0.25)));
    for (let r = -2; r <= 2; r++) { const rib = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.46, 0.57), ribMat); rib.position.x = r * 0.13; c.add(rib); }
    g.add(c); ctrs.push(c);
  }
  const tagC = tagSprite("CONTAINERS", "#FFB547", 1.2); tagC.position.set(1.45, 2.55, 0); g.add(tagC);
  // labels
  ["Base OS", "Runtime", "Deps", "App code"].forEach((n, k) => addTag(g, n, ["#3E63D9", "#5B8CFF", "#8FB0FF", "#FFB547"][k], -2.65, 1.0 + k * 0.26, 0.4, 0.75));
  addTag(g, "docker run", "#FFB547", 0.2, 0.55, 0.7, 0.9);
  anims.push(function (t) {
    const ph = (t * 0.22) % 1;
    layers.forEach((l, k) => { const s = Math.max(0.01, Math.min(1, (ph * 4 - k * 0.5))); l.scale.set(1, s, 1); });
    ctrs.forEach((c, k) => { const s = Math.max(0.01, Math.min(1, (ph - 0.45 - k * 0.1) * 6)); c.scale.setScalar(s); });
  });
}
