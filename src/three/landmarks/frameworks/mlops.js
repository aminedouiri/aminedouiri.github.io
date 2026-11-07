import * as THREE from "three";
import { glowMat, darkMat, rack, framedBox, addTag } from "../helpers.js";

/**
 * MLOps: the machine-learning lifecycle.
 * Data flows from a data store into a neural network (train), an accuracy meter fills (evaluate),
 * versions land in a model registry, the model is served, and a retrain arc loops back to the data.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function mlops(g, anims) {
  const plinth = framedBox(6.0, 0.22, 1.6, 0x5B8CFF); plinth.position.y = 0.42; g.add(plinth);

  // data store: stacked discs
  const discs = [0, 1, 2].map((k) => {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.26, 28), glowMat(k === 2 ? 0x8FB0FF : 0x3E63D9, 0.45));
    d.position.set(-2.3, 0.72 + k * 0.32, 0.1); g.add(d); return d;
  });

  // neural network: 3 → 4 → 2 nodes, connected
  const layers = [[-0.9, 3], [0, 4], [0.9, 2]], nodes = [], links = [];
  layers.forEach(([x, n], li) => {
    const col = [];
    for (let i = 0; i < n; i++) {
      const y = 2.75 + (i - (n - 1) / 2) * 0.48;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), glowMat(li === 2 ? 0xFFB547 : 0xBFD0FF, 0.6));
      m.position.set(x, y, 0.3); g.add(m); col.push(m); nodes.push(m);
    }
    layers[li].push(col);
  });
  for (let li = 0; li < 2; li++) {
    layers[li][2].forEach((a) => layers[li + 1][2].forEach((b) => {
      const geo = new THREE.BufferGeometry().setFromPoints([a.position, b.position]);
      const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x5B8CFF, transparent: true, opacity: 0.35 }));
      g.add(ln); links.push({ ln, d: li + Math.random() });
    }));
  }
  const nnFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, 2.2, 0.05)), new THREE.LineBasicMaterial({ color: 0x5B8CFF, transparent: true, opacity: 0.4 }));
  nnFrame.position.set(0, 2.75, 0.25); g.add(nnFrame);

  // evaluate: accuracy meter beside the network
  const tube = framedBox(0.28, 1.8, 0.28, 0x38D98A); tube.position.set(1.55, 2.75, 0.3); g.add(tube);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.7, 0.2), glowMat(0x38D98A, 0.7)); fill.geometry.translate(0, 0.85, 0); fill.position.set(1.55, 1.9, 0.31); g.add(fill);

  // model registry: versioned plates
  const plates = [0, 1, 2].map((k) => {
    const p = framedBox(0.9, 0.16, 0.7, k === 2 ? 0xFFB547 : 0x5B8CFF, glowMat(k === 2 ? 0xFFB547 : 0x2A3A66, 0.35));
    p.position.set(1.0, 0.68 + k * 0.22, 0.2); g.add(p); return p;
  });

  // serving endpoint: rack with a live status light
  const srv = rack(1.2, 0x8FB0FF); srv.position.set(2.35, 1.13, 0); g.add(srv);
  const live = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0x38D98A })); live.position.set(2.35, 1.9, 0.1); g.add(live);

  // retrain arc: from serving back to the data store
  const arcPts = [];
  for (let i = 0; i <= 60; i++) { const a = (i / 60) * Math.PI; arcPts.push(new THREE.Vector3(Math.cos(a) * 2.35, 1.3 + Math.sin(a) * 3.3, -0.7)); }
  const arcCurve = new THREE.CatmullRomCurve3(arcPts);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(arcCurve, 80, 0.05, 8, false), glowMat(0xFFB547, 0.5)));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 12), glowMat(0xFFB547, 0.6)); head.position.set(-2.35, 1.35, -0.7); head.rotation.z = Math.PI; g.add(head);
  const sig = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFE2A8 })); g.add(sig);

  // the forward pipeline: data → network → registry → serving
  const flow = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.3, 1.6, 0.3), new THREE.Vector3(-1.4, 2.6, 0.45), new THREE.Vector3(0, 2.75, 0.5),
    new THREE.Vector3(0.9, 2.2, 0.45), new THREE.Vector3(1.0, 1.4, 0.45), new THREE.Vector3(2.35, 1.9, 0.35),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(flow, 120, 0.02, 6, false), new THREE.MeshBasicMaterial({ color: 0xBFD0FF, transparent: true, opacity: 0.35 })));
  const bits = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: 0xFFFFFF })); g.add(m); return m; });

  // labels
  addTag(g, "Data", "#8FB0FF", -2.3, 1.95, 0.4, 0.6);
  addTag(g, "Train", "#BFD0FF", 0, 4.0, 0.4, 0.7);
  addTag(g, "Evaluate", "#38D98A", 1.55, 3.95, 0.4, 0.8);
  addTag(g, "Model registry", "#FFB547", 1.0, 0.25, 0.85, 1.1);
  addTag(g, "Serve", "#8FB0FF", 2.35, 2.2, 0.4, 0.6);
  addTag(g, "Retrain on drift", "#FFB547", -2.35, 3.75, -0.4, 1.2);
  const v3 = addTag(g, "v3", "#FFB547", 1.62, 1.12, 0.6, 0.35);

  anims.push(function (t) {
    links.forEach((l) => { l.ln.material.opacity = 0.15 + 0.6 * Math.max(0, Math.sin(t * 3 - l.d * 2)); });
    nodes.forEach((m, i) => m.scale.setScalar(1 + 0.25 * Math.max(0, Math.sin(t * 3 - i * 0.4))));
    discs.forEach((d, k) => { d.rotation.y = t * (0.4 + k * 0.2); });
    const acc = 0.3 + 0.65 * ((t * 0.12) % 1);                 // accuracy climbs while training, then a new version ships
    fill.scale.y = acc;
    plates[2].position.y = 0.68 + 2 * 0.22 + (acc > 0.9 ? 0 : 0.03 * Math.sin(t * 4));
    v3.visible = acc > 0.6;
    live.scale.setScalar(0.8 + 0.4 * Math.max(0, Math.sin(t * 4)));
    bits.forEach((b, k) => b.position.copy(flow.getPointAt((t * 0.18 + k / 4) % 1)));
    sig.position.copy(arcCurve.getPointAt((t * 0.15) % 1));
  });
}
