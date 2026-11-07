import * as THREE from "three";
import { glowMat, darkMat, addTag, framedBox, line3 } from "../helpers.js";

/**
 * The company datacenter (hardware view).
 *   Rack 1: three servers — CPUs, RAM, and two boot disks mirrored in RAID 1 (every write lands on both).
 *   Rack 2: two storage arrays with many disks, cabled to every server; I/O blinks across the disks.
 *   Every CYCLE seconds one boot disk of server 2 fails: the mirror runs degraded on the other disk,
 *   the disk is replaced and RAID 1 rebuilds it, then the server is healthy again.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const CYCLE = 18;

export function datacenter(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const dot = (col, r = 0.05) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };

  // ---------- racks ----------
  const rackFrame = (x, w, h) => {
    const posts = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 1.5)), new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.55 }));
    posts.position.set(x, 0.36 + h / 2, -0.05); g.add(posts);
    const top = framedBox(w, 0.08, 1.5, BLUE, darkMat()); top.position.set(x, 0.36 + h, -0.05); g.add(top);
    const foot = framedBox(w, 0.08, 1.5, BLUE, darkMat()); foot.position.set(x, 0.38, -0.05); g.add(foot);
  };
  const AX = -1.35, BX = 1.5;
  rackFrame(AX, 2.35, 3.0);
  rackFrame(BX, 2.25, 3.0);

  // ---------- three servers with CPU, RAM and two boot disks (RAID 1) ----------
  const SY = [0.75, 1.65, 2.55];
  const servers = SY.map((y) => {
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 1.3), new THREE.MeshStandardMaterial({ color: 0x1A2131, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.45 }));
    chassis.position.set(AX, y, -0.05); g.add(chassis);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.1, 0.42, 1.3)), new THREE.LineBasicMaterial({ color: LIGHT }));
    edge.position.copy(chassis.position); g.add(edge);
    // two CPUs with heatsink fins
    const cpus = [-0.15, 0.45].map((dx) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.34), glowMat(AMBER, 0.4)); c.position.set(AX + dx, y - 0.12, -0.25); g.add(c);
      for (let f = 0; f < 5; f++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.3), darkMat()); fin.position.set(AX + dx - 0.12 + f * 0.06, y - 0.01, -0.25); g.add(fin); }
      return c.material;
    });
    // RAM sticks
    const ram = [];
    for (let k = 0; k < 8; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.5), glowMat(GREEN, 0.3)); r.position.set(AX - 0.62 + k * 0.06 + (k >= 4 ? 0.85 : 0), y - 0.05, -0.25); g.add(r); ram.push(r.material); }
    // two boot disks in the front bays
    const disks = [-0.85, -0.45].map((dx) => {
      const d = framedBox(0.32, 0.12, 0.42, LIGHT, glowMat(0x22304d, 0.3)); d.position.set(AX + dx, y - 0.05, 0.36); g.add(d);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.01), new THREE.MeshBasicMaterial({ color: GREEN })); led.position.set(AX + dx + 0.11, y - 0.05, 0.585); g.add(led);
      return { d, led };
    });
    // RAID 1 bracket joining the two disks
    const bracketMat = new THREE.MeshBasicMaterial({ color: GREEN });
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.025, 0.025), bracketMat); br.position.set(AX - 0.65, y + 0.06, 0.6); g.add(br);
    [-0.85, -0.45].forEach((dx) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.025), bracketMat); s.position.set(AX + dx, y + 0.02, 0.6); g.add(s); });
    // rebuild progress bar (shown only while rebuilding)
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.035, 0.02), new THREE.MeshBasicMaterial({ color: AMBER }));
    bar.geometry.translate(0.28, 0, 0); bar.position.set(AX - 0.93, y - 0.17, 0.6); bar.visible = false; g.add(bar);
    // power / status LED
    const status = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: GREEN })); status.position.set(AX + 0.95, y + 0.1, 0.6); g.add(status);
    return { y, cpus, ram, disks, bracketMat, bar, status, writes: [dot(0xFFFFFF, 0.035), dot(0xFFFFFF, 0.035)] };
  });

  // ---------- two storage arrays with many disks ----------
  const AY = [0.85, 2.3];
  const arrays = AY.map((y) => {
    const enc = framedBox(2.05, 0.95, 1.3, AMBER, new THREE.MeshStandardMaterial({ color: 0x17140f, metalness: 0.6, roughness: 0.35 })); enc.position.set(BX, y, -0.05); g.add(enc);
    const bays = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.02), new THREE.MeshStandardMaterial({ color: 0x2a3550, emissive: LIGHT, emissiveIntensity: 0.15 }));
      d.position.set(BX - 0.84 + c * 0.24, y - 0.28 + r * 0.28, 0.61); g.add(d);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.01), new THREE.MeshBasicMaterial({ color: GREEN })); led.position.set(BX - 0.77 + c * 0.24, y - 0.37 + r * 0.28, 0.625); g.add(led);
      bays.push(led.material);
    }
    return { y, bays };
  });

  // ---------- cabling: every server to both arrays ----------
  const cables = [];
  servers.forEach((s) => arrays.forEach((a, k) => {
    const c = new THREE.CatmullRomCurve3([V(AX + 1.05, s.y, -0.45 + k * 0.15), V(0.07, (s.y + a.y) / 2 + 0.15, -0.55 + k * 0.15), V(BX - 1.03, a.y, -0.45 + k * 0.15)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.018, 6, false), new THREE.MeshBasicMaterial({ color: k ? AMBER : LIGHT, transparent: true, opacity: 0.45 })));
    cables.push({ c, bit: dot(k ? AMBER : PALE, 0.045), off: Math.random() });
  }));

  // ---------- labels ----------
  addTag(g, "Compute rack · 3 servers", "#8FB0FF", AX, 3.65, 0.3, 1.75);
  addTag(g, "Storage rack · 2 arrays", "#FFB547", BX, 3.65, 0.3, 1.7);
  SY.forEach((y, i) => addTag(g, "Server " + (i + 1), "#8FB0FF", AX + 0.55, y + 0.33, 0.7, 0.75));
  addTag(g, "CPU", "#FFB547", AX + 0.15, SY[2] + 0.62, -0.25, 0.4);
  addTag(g, "RAM", "#38D98A", AX - 0.45, SY[2] + 0.62, -0.25, 0.4);
  addTag(g, "2 boot disks · RAID 1", "#38D98A", AX - 0.65, 0.25, 0.85, 1.45);
  AY.forEach((y, i) => addTag(g, "Storage array " + (i + 1), "#FFB547", BX, y + 0.68, 0.7, 1.2));
  addTag(g, "multi-disk", "#BFD0FF", BX + 0.75, 0.25, 0.85, 0.75);
  addTag(g, "Storage network", "#8FB0FF", 0.07, 3.05, -0.55, 1.25);
  const tagFail = addTag(g, "Disk failed → RAID 1 degraded", "#FF6B5D", AX - 0.6, SY[1] + 0.45, 0.95, 1.9);
  const tagRebuild = addTag(g, "Rebuilding mirror", "#FFB547", AX - 0.6, SY[1] + 0.45, 0.95, 1.3);

  anims.push(function (t) {
    const ph = (t / CYCLE) % 1;
    // server 2 boot disk B: healthy → failed (0.45) → replaced + rebuilding (0.6 – 0.85) → healthy
    const failed = ph > 0.45 && ph < 0.6, rebuilding = ph >= 0.6 && ph < 0.85;
    tagFail.visible = failed; tagRebuild.visible = rebuilding;

    servers.forEach((s, i) => {
      s.cpus.forEach((m, k) => { m.emissiveIntensity = 0.35 + 0.5 * Math.max(0, Math.sin(t * 2.2 + i + k * 1.4)); });
      s.ram.forEach((m, k) => { m.emissiveIntensity = 0.2 + 0.6 * Math.max(0, Math.sin(t * 5 - k * 0.6 + i)); });
      const hit = i === 1;
      const bDead = hit && failed, bRebuild = hit && rebuilding;
      // RAID 1 mirrored writes: one write → both disks at the same time
      const u = (t * 0.9 + i * 0.33) % 1;
      s.writes.forEach((w, k) => {
        const tgt = s.disks[k].d.position, from = V(AX - 0.65, s.y + 0.3, 0.45);
        w.visible = !(k === 1 && bDead);
        w.position.copy(from).lerp(tgt.clone().add(V(0, 0.08, 0)), u);
      });
      s.disks.forEach((d, k) => {
        const dead = k === 1 && bDead, reb = k === 1 && bRebuild;
        d.led.material.color.set(dead ? RED : reb ? AMBER : u > 0.85 ? 0xFFFFFF : GREEN);
        d.d.children[1].material.color.set(dead ? RED : reb ? AMBER : LIGHT);
        d.d.position.z = 0.36 + (hit && k === 1 && ph > 0.56 && ph < 0.6 ? 0.25 * Math.sin((ph - 0.56) / 0.04 * Math.PI) : 0);   // disk pulled and swapped
      });
      s.bracketMat.color.set(hit && failed ? RED : hit && rebuilding ? AMBER : GREEN);
      s.bar.visible = hit && rebuilding;
      if (s.bar.visible) s.bar.scale.x = Math.max(0.01, (ph - 0.6) / 0.25);
      s.status.material.color.set(hit && (failed || rebuilding) ? AMBER : GREEN);
    });

    // storage arrays: disk activity
    arrays.forEach((a, i) => a.bays.forEach((m, k) => { m.color.set(Math.sin(t * 7 + k * 2.7 + i * 5) > 0.55 ? 0xFFFFFF : GREEN); }));
    // traffic on the storage network
    cables.forEach((c) => { const u = (t * 0.35 + c.off) % 1; c.bit.position.copy(c.c.getPointAt(u < 0.5 ? u * 2 : 2 - u * 2)); });
  });
}
