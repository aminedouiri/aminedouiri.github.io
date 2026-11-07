import * as THREE from "three";
import { tagSprite, darkMat, framedBox, addTag } from "../helpers.js";

/**
 * DORA metrics: a control board on legs with four gauges (tick marks, green "elite" zone,
 * moving needle, live sparkline) and a deploy conveyor along the bottom.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function dora(g, anims) {
  const names = ["DEPLOY FREQ", "LEAD TIME", "CHANGE FAIL %", "TIME TO RESTORE"], needles = [], sparks = [], leds = [];
  const board = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.6, 0.12), new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.5, roughness: 0.4 })); board.position.y = 2.9; g.add(board);
  const bEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.42, 3.62, 0.13)), new THREE.LineBasicMaterial({ color: 0x5B8CFF })); bEdge.position.y = 2.9; g.add(bEdge);
  [-1.9, 1.9].forEach((x) => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.9, 10), darkMat()); leg.position.set(x, 0.75, -0.05); g.add(leg); });
  const header = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0xFFB547 })); header.position.set(0, 4.55, 0.07); g.add(header);

  names.forEach(function (n, k) {
    const cx = k % 2 ? 1.05 : -1.05, cy = k < 2 ? 3.75 : 2.15, gy = cy - 0.15;
    const bg = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 8, 48, Math.PI), new THREE.MeshBasicMaterial({ color: 0x2A3040 })); bg.position.set(cx, gy, 0.08); g.add(bg);
    const good = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.065, 8, 48, Math.PI * 0.35), new THREE.MeshBasicMaterial({ color: 0x38D98A })); good.position.set(cx, gy, 0.09); g.add(good);
    for (let i = 0; i <= 8; i++) { // tick marks
      const a = (i / 8) * Math.PI, tk = new THREE.Mesh(new THREE.BoxGeometry(0.02, i % 4 ? 0.07 : 0.12, 0.02), new THREE.MeshBasicMaterial({ color: 0x8FA0C0 }));
      tk.position.set(cx + Math.cos(a) * 0.7, gy + Math.sin(a) * 0.7, 0.09); tk.rotation.z = a - Math.PI / 2; g.add(tk);
    }
    const nd = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.04), new THREE.MeshBasicMaterial({ color: 0xFFB547 })); nd.geometry.translate(0, 0.25, 0); nd.position.set(cx, gy, 0.12); g.add(nd); needles.push(nd);
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })); hub.position.set(cx, gy, 0.13); g.add(hub);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0x38D98A })); led.position.set(cx + 0.72, cy + 0.42, 0.1); g.add(led); leds.push(led);
    // small live sparkline under the gauge
    const row = [];
    for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0x5B8CFF })); b.geometry.translate(0, 0.1, 0); b.position.set(cx - 0.33 + i * 0.11, gy - 0.6, 0.08); g.add(b); row.push(b); }
    sparks.push(row);
    const tag = tagSprite(n, "#5B8CFF", 1.5); tag.position.set(cx, gy - 0.25, 0.2); g.add(tag);
  });

  // deploy conveyor: releases slide across the bottom
  const belt = framedBox(4.4, 0.1, 0.5, 0x5B8CFF); belt.position.set(0, 0.65, 0.45); g.add(belt);
  const boxes = [0, 1, 2, 3].map((i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x5B8CFF : 0xFFB547, emissive: i % 2 ? 0x5B8CFF : 0xFFB547, emissiveIntensity: 0.5 })); g.add(b); return b; });

  // labels
  addTag(g, "Green = elite", "#38D98A", 0, 4.38, 0.15, 1.0);
  addTag(g, "Deploys", "#FFB547", -2.75, 0.95, 0.45, 0.7);
  addTag(g, "Trend", "#5B8CFF", 0, 1.3, 0.15, 0.55);
  anims.push(function (t) {
    needles.forEach((nd, k) => { nd.rotation.z = -0.9 + 0.5 * Math.sin(t * 0.7 + k * 1.3) - 0.4; });
    sparks.forEach((row, k) => row.forEach((b, i) => { b.scale.y = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.1 + i * 0.8 + k)); }));
    leds.forEach((l, k) => { l.scale.setScalar(0.8 + 0.4 * Math.max(0, Math.sin(t * 3 + k))); });
    boxes.forEach((b, i) => { const u = (t * 0.15 + i / 4) % 1; b.position.set(-2.1 + u * 4.2, 0.82, 0.45); b.rotation.y = u * 3; });
  });
}
