/* The winding road: curve, asphalt, kerbs, shoulders, reflectors, street lamps, travelled-path line. */
import * as THREE from "three";
import { canvasTexture, glowTexture } from "../utils/textures.js";

export const ROAD_W = 3.4;          // half width
const SAMPLES = 1000;

/** Curve through gently alternating bends, about 15 units per stop. */
export function makeCurve(stopCount) {
  const pts = [];
  for (let k = 0; k <= stopCount + 1; k++) pts.push(new THREE.Vector3(Math.sin(k * 0.95) * 6.5 + Math.sin(k * 0.37) * 2.5, 0, -k * 15));
  return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
}

/** Lookup table to find the closest point on the route (used when driving freely). */
export function makeRoute(curve) {
  const route = [], bounds = { minX: 1e9, maxX: -1e9, minZ: 1e9, maxZ: -1e9 };
  for (let i = 0; i <= 400; i++) {
    const t = i / 400, q = curve.getPointAt(t);
    route.push({ t, x: q.x, z: q.z });
    bounds.minX = Math.min(bounds.minX, q.x); bounds.maxX = Math.max(bounds.maxX, q.x);
    bounds.minZ = Math.min(bounds.minZ, q.z); bounds.maxZ = Math.max(bounds.maxZ, q.z);
  }
  bounds.minX -= 45; bounds.maxX += 45; bounds.minZ -= 30; bounds.maxZ += 30;
  const nearestT = (x, z) => {
    let best = 1e9, bt = 0;
    for (const r of route) { const d = (r.x - x) ** 2 + (r.z - z) ** 2; if (d < best) { best = d; bt = r.t; } }
    return bt;
  };
  return { bounds, nearestT };
}

/**
 * Builds the road meshes. Lamps are registered as clutter (hidden in focus mode).
 * @returns {{ doneLine: THREE.Line, doneCount: number }}
 */
export function buildRoad(w) {
  const { scene, curve, renderer, stopT } = w;
  const length = curve.getLength();
  const aniso = renderer.capabilities.getMaxAnisotropy();

  const frames = [], center = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES, p = curve.getPointAt(t), tg = curve.getTangentAt(t);
    frames.push({ p, n: new THREE.Vector3(-tg.z, 0, tg.x).normalize(), d: t * length });
    center.push(new THREE.Vector3(p.x, 0.065, p.z));
  }
  const strip = (a, b, y, mat, vScale) => {
    const pos = [], uv = [], idx = [];
    frames.forEach((fr, i) => {
      pos.push(fr.p.x + fr.n.x * a, y, fr.p.z + fr.n.z * a, fr.p.x + fr.n.x * b, y, fr.p.z + fr.n.z * b);
      uv.push(0, fr.d / vScale, 1, fr.d / vScale);
      if (i < SAMPLES) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    scene.add(new THREE.Mesh(g, mat));
  };
  const wall = (a, y0, y1, mat) => {
    const pos = [], idx = [];
    frames.forEach((fr, i) => {
      const x = fr.p.x + fr.n.x * a, z = fr.p.z + fr.n.z * a;
      pos.push(x, y0, z, x, y1, z);
      if (i < SAMPLES) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    scene.add(new THREE.Mesh(g, mat));
  };

  // asphalt with lane markings (u = across, v = along)
  const ac = document.createElement("canvas"); ac.width = 512; ac.height = 1024;
  const ax = ac.getContext("2d");
  ax.fillStyle = "#1A1C22"; ax.fillRect(0, 0, 512, 1024);
  const img = ax.getImageData(0, 0, 512, 1024);
  for (let i = 0; i < img.data.length; i += 4) { const v = (Math.random() - 0.5) * 22; img.data[i] += v; img.data[i + 1] += v; img.data[i + 2] += v + 2; }
  ax.putImageData(img, 0, 0);
  ax.fillStyle = "rgba(0,0,0,.18)"; ax.fillRect(110, 0, 70, 1024); ax.fillRect(332, 0, 70, 1024);   // tyre wear
  ax.fillStyle = "#E8EBF0"; ax.fillRect(18, 0, 12, 1024); ax.fillRect(482, 0, 12, 1024);            // edge lines
  ax.fillStyle = "#F2C14E"; ax.fillRect(248, 0, 7, 520); ax.fillRect(258, 0, 7, 520);                // centre dash
  const asphalt = canvasTexture(ac, aniso); asphalt.wrapT = THREE.RepeatWrapping;
  strip(-ROAD_W, ROAD_W, 0.02, new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.75, metalness: 0.1 }), 7);

  // red / white kerbs and dark shoulders
  const cc = document.createElement("canvas"); cc.width = 64; cc.height = 128;
  const cx = cc.getContext("2d"); cx.fillStyle = "#D94A3A"; cx.fillRect(0, 0, 64, 64); cx.fillStyle = "#ECEFF4"; cx.fillRect(0, 64, 64, 64);
  const kerbTex = canvasTexture(cc, aniso); kerbTex.wrapT = THREE.RepeatWrapping;
  const kerbTop = new THREE.MeshStandardMaterial({ map: kerbTex, roughness: 0.6 });
  const kerbSide = new THREE.MeshStandardMaterial({ color: 0x9a9fa8, roughness: 0.7 });
  strip(ROAD_W, ROAD_W + 0.42, 0.12, kerbTop, 2); strip(-ROAD_W - 0.42, -ROAD_W, 0.12, kerbTop, 2);
  wall(ROAD_W, 0.02, 0.12, kerbSide); wall(-ROAD_W, 0.02, 0.12, kerbSide);
  const shoulder = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.9 });
  strip(ROAD_W + 0.42, ROAD_W + 2.2, 0.03, shoulder, 4); strip(-ROAD_W - 2.2, -ROAD_W - 0.42, 0.03, shoulder, 4);

  // travelled path glow (draw range grows as you drive)
  const doneLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(center.map((v) => new THREE.Vector3(v.x, 0.07, v.z))), new THREE.LineBasicMaterial({ color: 0x5b8cff }));
  doneLine.geometry.setDrawRange(0, 0);
  scene.add(doneLine);

  // reflector studs
  const studs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.05, 0.12), new THREE.MeshBasicMaterial({ color: 0x5b8cff }), 300);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 150; i++) {
    const t = i / 150, p = curve.getPointAt(t), tg = curve.getTangentAt(t), nx = -tg.z, nz = tg.x, o = ROAD_W + 0.21;
    m4.makeTranslation(p.x + nx * o, 0.16, p.z + nz * o); studs.setMatrixAt(i * 2, m4);
    m4.makeTranslation(p.x - nx * o, 0.16, p.z - nz * o); studs.setMatrixAt(i * 2 + 1, m4);
  }
  scene.add(studs);

  // street lamps with warm light pools (kept clear of the info cubes on the left)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4b, metalness: 0.8, roughness: 0.35 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffe3b3 });
  const poolMat = new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,200,130,0.55)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.09, 4.2, 10), armGeo = new THREE.BoxGeometry(1.5, 0.08, 0.1), headGeo = new THREE.BoxGeometry(0.55, 0.1, 0.24), poolGeo = new THREE.PlaneGeometry(5.5, 5.5);
  const lamps = Math.round(length / 9);
  for (let i = 0; i < lamps; i++) {
    const t = (i + 0.5) / lamps, p = curve.getPointAt(t), tg = curve.getTangentAt(t);
    const side = i % 2 ? 1 : -1, n = new THREE.Vector3(-tg.z, 0, tg.x).multiplyScalar(side);
    if (side < 0 && stopT.some((st) => Math.abs(t - st - 6 / length) < 9 / length)) continue;
    const lamp = new THREE.Group();
    lamp.position.copy(p).addScaledVector(n, ROAD_W + 1.2);
    lamp.lookAt(lamp.position.clone().sub(n));
    const pole = new THREE.Mesh(poleGeo, poleMat); pole.position.y = 2.1; lamp.add(pole);
    const arm = new THREE.Mesh(armGeo, poleMat); arm.rotation.y = Math.PI / 2; arm.position.set(0, 4.15, 0.7); lamp.add(arm);
    const head = new THREE.Mesh(headGeo, headMat); head.rotation.y = Math.PI / 2; head.position.set(0, 4.08, 1.35); lamp.add(head);
    const pool = new THREE.Mesh(poolGeo, poolMat); pool.rotation.x = -Math.PI / 2;
    pool.position.copy(p).addScaledVector(n, ROAD_W - 0.4); pool.position.y = 0.04;
    scene.add(lamp, pool);
    w.clutter.push(lamp, pool);
  }

  return { doneLine, doneCount: center.length };
}
