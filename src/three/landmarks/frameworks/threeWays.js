import * as THREE from "three";
import { glowMat, darkMat, tagSprite, framedBox, addTag } from "../helpers.js";

/**
 * The Three Ways:
 *   1 · Flow     work items travel from a DEV block through pipeline stages to an OPS block
 *   2 · Feedback signals return over the arc from OPS back to DEV
 *   3 · Learning a rising spiral from an experiment lab, with ideas orbiting it
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function threeWays(g, anims) {
  const flowMat = glowMat(0x5B8CFF, 0.6), fbMat = glowMat(0xFFB547, 0.6), Y = 1.4;

  // Dev and Ops end blocks
  [[-2.5, "DEV", 0x5B8CFF, "#5B8CFF"], [2.5, "OPS", 0xFFB547, "#FFB547"]].forEach(([x, name, c, css]) => {
    const b = framedBox(0.7, 1.1, 0.7, c); b.position.set(x, 0.85, 0); g.add(b);
    for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.01), new THREE.MeshBasicMaterial({ color: c })); s.position.set(x, 0.55 + i * 0.25, 0.36); g.add(s); }
    const tg = tagSprite(name, css, 0.9); tg.position.set(x, 0.1, 0.5); g.add(tg);
  });

  // 1 · Flow: arrow with pipeline stage rings
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 12), flowMat); shaft.rotation.z = Math.PI / 2; shaft.position.y = Y; g.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 16), flowMat); head.rotation.z = -Math.PI / 2; head.position.set(2.0, Y, 0); g.add(head);
  const stages = [-1.2, -0.4, 0.4, 1.2].map((x) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 24), new THREE.MeshBasicMaterial({ color: 0xBFD0FF })); r.rotation.y = Math.PI / 2; r.position.set(x, Y, 0); g.add(r); return r; });
  const items = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshStandardMaterial({ color: 0xF2F3F5, emissive: 0x5B8CFF, emissiveIntensity: 0.5 })); g.add(m); return m; });

  // 2 · Feedback: arc back to Dev
  const arc = new THREE.Mesh(new THREE.TorusGeometry(2, 0.08, 8, 60, Math.PI), fbMat); arc.position.y = Y; g.add(arc);
  const head2 = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 16), fbMat); head2.position.set(-2, 1.2 + 0.25, 0); head2.rotation.z = Math.PI; g.add(head2);
  const signals = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: 0xFFE2A8 })); g.add(m); return m; });

  // 3 · Learning: lab base, rising spiral and orbiting ideas
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.35, 16), darkMat()); lab.position.set(0, 2.05, 0); g.add(lab);
  const labRim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 24), new THREE.MeshBasicMaterial({ color: 0xBFD0FF })); labRim.rotation.x = Math.PI / 2; labRim.position.set(0, 2.23, 0); g.add(labRim);
  const hp = []; for (let i = 0; i <= 120; i++) { const u = i / 120, a = u * Math.PI * 6; hp.push(new THREE.Vector3(Math.cos(a) * (0.2 + u * 0.5), 2.25 + u * 1.4, Math.sin(a) * (0.2 + u * 0.5))); }
  const spiral = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp), 200, 0.05, 8, false), new THREE.MeshBasicMaterial({ color: 0xBFD0FF })); g.add(spiral);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), glowMat(0xFFE2A8, 0.9)); bulb.position.set(0, 3.85, 0); g.add(bulb);
  const ideas = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), glowMat(i % 2 ? 0x5B8CFF : 0xFFB547, 0.8)); g.add(m); return m; });

  [["1 · FLOW", "#5B8CFF", 0, 0.75], ["2 · FEEDBACK", "#FFB547", -1.75, 3.6], ["3 · LEARNING", "#BFD0FF", 1.6, 3.2]].forEach(function (d) { const tg = tagSprite(d[0], d[1], 1.5); tg.position.set(d[2], d[3], 0.1); g.add(tg); });

  // labels
  addTag(g, "Pipeline stages", "#BFD0FF", 0.8, 1.85, 0.3, 1.1);
  addTag(g, "Experiment lab", "#BFD0FF", -1.05, 2.1, 0.3, 1.1);
  addTag(g, "New ideas", "#FFB547", 0.85, 4.3, 0.2, 0.8);
  anims.push(function (t) {
    spiral.rotation.y = t * 0.8;
    items.forEach((m, k) => { const u = (t * 0.25 + k / 3) % 1; m.position.set(-2 + u * 4, Y, 0.02); m.rotation.x = u * 6; });
    stages.forEach((r, k) => { const near = items.some((m) => Math.abs(m.position.x - r.position.x) < 0.2); r.scale.setScalar(near ? 1.25 : 1); });
    signals.forEach((m, k) => { const u = (t * 0.25 + k / 3) % 1, a = u * Math.PI; m.position.set(Math.cos(a) * 2, Y + Math.sin(a) * 2, 0.1); });
    ideas.forEach((m, k) => { const a = t * 1.1 + k * 1.57; m.position.set(Math.cos(a) * 0.45, 3.85 + Math.sin(a * 2) * 0.12, Math.sin(a) * 0.45); m.rotation.y = t * 2; });
    bulb.scale.setScalar(1 + 0.12 * Math.sin(t * 2.5));
  });
}
