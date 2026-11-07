/*
 * Checkpoints at every stop: an arch over the road (flashes when you arrive) and a voxel tower
 * on the left that assembles block by block the first time you reach the stop.
 */
import * as THREE from "three";
import anime from "animejs";
import { ROAD_W } from "./road.js";
import { reduceMotion as reduce } from "../utils/motion.js";

const TOWER_HEIGHTS = [6, 11, 9, 8, 7, 10, 12, 8, 9];

export class Checkpoints {
  /** @param {import("../World.js").World} w */
  constructor(w) {
    this.w = w;
    this.gates = [];
    this.towers = [];
    w.stopT.forEach((t, i) => {
      const p = w.curve.getPointAt(t), tg = w.curve.getTangentAt(t);
      this.gates.push(this.buildGate(i, p, tg));
      this.towers.push(this.buildTower(i, p, tg));
    });
  }

  buildGate(i, p, tg) {
    const g = new THREE.Group();
    g.position.copy(p); g.lookAt(p.clone().add(tg));
    const mat = new THREE.MeshStandardMaterial({ color: 0x1b1f2a, emissive: 0x5b8cff, emissiveIntensity: 0.25, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 1 });
    g.add(new THREE.Mesh(new THREE.TorusGeometry(ROAD_W + 0.9, 0.055, 10, 80, Math.PI), mat));
    const scan = new THREE.Mesh(new THREE.CircleGeometry(ROAD_W + 0.85, 64, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(scan);
    g.traverse((o) => { o.userData.stop = i; });
    this.w.scene.add(g);
    return { g, mat, scan };
  }

  buildTower(i, p, tg) {
    const left = new THREE.Vector3(tg.z, 0, -tg.x).normalize();
    const base = p.clone().addScaledVector(left, ROAD_W + 6.4).addScaledVector(tg, -4.5);
    const H = TOWER_HEIGHTS[i % TOWER_HEIGHTS.length], F = 4, V = 0.56, gap = 0.62;
    const cells = [];
    for (let x = 0; x < F; x++) for (let z = 0; z < F; z++) {
      const edge = x === 0 || z === 0 || x === F - 1 || z === F - 1;
      const colH = Math.max(2, Math.round(H * (edge ? 0.55 + Math.random() * 0.35 : 0.85 + Math.random() * 0.15)));
      for (let y = 0; y < colH; y++) cells.push({ x: (x - (F - 1) / 2) * gap, y: y * gap + V / 2, z: (z - (F - 1) / 2) * gap, d: y * 0.07 + Math.random() * 0.35 });
    }
    const mat = new THREE.MeshStandardMaterial({ color: 0x9db8ff, emissive: 0x2f5be0, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.92 });
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(V, V, V), mat, cells.length);
    const col = new THREE.Color(), m4 = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
    cells.forEach((c, k) => {
      col.set(Math.random() < 0.12 ? 0xffb547 : Math.random() < 0.5 ? 0x9db8ff : 0x6e93ff);
      mesh.setColorAt(k, col);
      mesh.setMatrixAt(k, m4);
    });
    const g = new THREE.Group();
    g.position.copy(base); g.lookAt(base.clone().add(tg)); g.add(mesh);
    const pad = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.95, 48), new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    pad.rotation.x = -Math.PI / 2; pad.position.y = 0.04; g.add(pad);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 40, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 20; g.add(beam);
    this.w.scene.add(g);
    this.w.solids.push({ x: base.x, z: base.z, r: 1.9 });
    return { g, mesh, cells, beam, pad, start: -1, done: false, maxD: Math.max(...cells.map((c) => c.d)) };
  }

  /** Arch colours: amber = current stop, blue = passed. */
  setActive(i) {
    this.gates.forEach((g, k) => {
      g.mat.emissive.setHex(k === i ? 0xffb547 : 0x5b8cff);
      g.mat.emissiveIntensity = k === i ? 0.6 : k < i ? 0.4 : 0.2;
    });
  }

  /** Scanner flash + start building the tower (first visit only). */
  arrive(i) {
    const g = this.gates[i], tw = this.towers[i];
    if (!g || !tw) return;
    if (!reduce) {
      anime.remove(g.scan.material);
      anime({ targets: g.scan.material, opacity: [0, 0.5, 0], duration: 1300, easing: "easeOutQuad" });
      anime({ targets: g.mat, emissiveIntensity: [1.4, 0.6], duration: 1400, easing: "easeOutExpo" });
    }
    if (tw.start < 0) {
      tw.start = performance.now();
      if (!reduce) anime({ targets: tw.beam.material, opacity: [0, 0.35, 0], duration: 2200, easing: "easeInOutSine" });
    }
  }

  update(now, dt, activeIndex, camera) {
    // assemble towers
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    this.towers.forEach((tw, i) => {
      tw.pad.material.opacity = i === activeIndex ? 0.6 + Math.sin(now / 280) * 0.3 : tw.start >= 0 ? 0.45 : 0.15;
      if (tw.start < 0 || tw.done) return;
      const el = reduce ? 99 : (now - tw.start) / 1000;
      tw.cells.forEach((c, k) => {
        const e = Math.max(0, Math.min(1, (el - c.d) / 0.7));
        const o = 1 - (1 - e) ** 3;
        const sc = e <= 0 ? 0.0001 : 0.25 + 0.75 * o;
        p.set(c.x, c.y + (1 - o) * 9, c.z); s.set(sc, sc, sc);
        m4.compose(p, q, s); tw.mesh.setMatrixAt(k, m4);
      });
      tw.mesh.instanceMatrix.needsUpdate = true;
      if (el > tw.maxD + 0.8) tw.done = true;
    });
    // fade arches near the camera so they never block the view
    this.gates.forEach((g) => {
      const d = Math.hypot(camera.position.x - g.g.position.x, camera.position.z - g.g.position.z);
      const o = d < 4 ? 0.05 : d < 11 ? 0.05 + ((d - 4) / 7) * 0.95 : 1;
      g.mat.opacity += (o - g.mat.opacity) * Math.min(1, dt * 6);
      g.mat.depthWrite = g.mat.opacity > 0.95;
    });
  }
}
