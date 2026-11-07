import * as THREE from "three";
import { addTag } from "../helpers.js";

/**
 * Dashboard: three panels with live line graphs and a gauge.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function grafana(g, anims) {  // dashboard: three panels with live line graphs and a gauge
  const arc = new THREE.Group(); arc.position.y = 2.4; g.add(arc);
  const lines = [];
  [-1, 0, 1].forEach(function (k) {
    const p = new THREE.Group(); p.position.set(Math.sin(k * 0.55) * 3.2, 0, -Math.cos(k * 0.55) * 3.2 + 3.2); p.rotation.y = -k * 0.55; arc.add(p);
    p.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1.4, 0.08), new THREE.MeshStandardMaterial({ color: 0x121724, metalness: 0.5, roughness: 0.4, emissive: 0x0b1020 })));
    const fr = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.02, 1.42, 0.09)), new THREE.LineBasicMaterial({ color: 0x5B8CFF })); p.add(fr);
    if (k === 0) {
      const gauge = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.07, 8, 40, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color: 0xFFB547 })); gauge.position.set(0, -0.05, 0.06); gauge.rotation.z = -0.2 * Math.PI; p.add(gauge);
      const bg = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 40, Math.PI * 2), new THREE.MeshBasicMaterial({ color: 0x2A3040 })); bg.position.set(0, -0.05, 0.05); p.add(bg);
      lines.push({ gauge: gauge });
    } else {
      const N = 32, pos = new Float32Array(N * 3), geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: k < 0 ? 0xFFB547 : 0x8FB0FF })); ln.position.z = 0.06; p.add(ln);
      lines.push({ pos: pos, geo: geo, N: N, seed: k * 3 });
    }
  });
  // labels (panel titles)
  ["Errors", "CPU", "Latency"].forEach((n, i) => addTag(arc.children[i], n, i === 2 ? "#8FB0FF" : "#FFB547", -0.55, 0.52, 0.08, 0.7));
  addTag(g, "Dashboard", "#5B8CFF", 0, 1.35, 1.2, 0.9);
  anims.push(function (t) {
    lines.forEach(function (l) {
      if (l.gauge) { l.gauge.rotation.z = -0.2 * Math.PI - 0.55 * (0.5 + 0.5 * Math.sin(t * 0.9)); return; }
      for (let i = 0; i < l.N; i++) { const x = -0.85 + i / (l.N - 1) * 1.7, y = Math.sin(i * 0.45 + t * 2 + l.seed) * 0.25 + Math.sin(i * 1.3 + t * 3.3 + l.seed) * 0.12; l.pos[i * 3] = x; l.pos[i * 3 + 1] = y - 0.05; l.pos[i * 3 + 2] = 0; }
      l.geo.attributes.position.needsUpdate = true;
    });
    arc.position.y = 2.4 + Math.sin(t * 0.8) * 0.08;
  });
}
