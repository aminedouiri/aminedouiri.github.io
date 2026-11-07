/*
 * The company's real hardware, shared by the Proxmox and VMware landmarks:
 *   - each of the 3 servers: CPUs, RAM and two boot disks mirrored in RAID 1,
 *   - 2 storage arrays with many disks, cabled to every server (shared storage).
 */
import * as THREE from "three";
import { glowMat, darkMat, framedBox } from "./helpers.js";

const LIGHT = 0x8FB0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D, PALE = 0xBFD0FF;

/**
 * CPU + RAM + two boot disks (RAID 1) drawn on the front of a server, centred at (x, y, z).
 * Returns update(t, down): CPU/RAM activity and mirrored writes (both disks blink together).
 */
export function serverHardware(g, x, y, z, w = 1.2) {
  const s = w / 1.2;
  // CPU with heatsink fins
  const cpu = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.05, 0.22), glowMat(AMBER, 0.45)); cpu.position.set(x - 0.32 * s, y + 0.1, z); g.add(cpu);
  for (let f = 0; f < 4; f++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.2), darkMat()); fin.position.set(x - 0.41 * s + f * 0.06 * s, y + 0.18, z); g.add(fin); }
  // RAM sticks
  const ram = [];
  for (let k = 0; k < 6; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.2), glowMat(GREEN, 0.35)); r.position.set(x - 0.06 * s + k * 0.05 * s, y + 0.13, z); g.add(r); ram.push(r.material); }
  // two boot disks + RAID 1 bracket
  const disks = [x + 0.32 * s - 0.13, x + 0.32 * s + 0.13].map((dx) => {
    const d = framedBox(0.22, 0.08, 0.06, LIGHT, glowMat(0x22304d, 0.3)); d.position.set(dx, y - 0.08, z + 0.02); g.add(d);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.01), new THREE.MeshBasicMaterial({ color: GREEN })); led.position.set(dx + 0.07, y - 0.08, z + 0.056); g.add(led);
    return led.material;
  });
  const brMat = new THREE.MeshBasicMaterial({ color: GREEN });
  const br = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.018, 0.018), brMat); br.position.set(x + 0.32 * s, y - 0.15, z + 0.06); g.add(br);
  return function update(t, down = false) {
    cpu.material.emissiveIntensity = down ? 0.05 : 0.35 + 0.5 * Math.max(0, Math.sin(t * 2.2 + x));
    ram.forEach((m, k) => { m.emissiveIntensity = down ? 0.05 : 0.2 + 0.6 * Math.max(0, Math.sin(t * 5 - k * 0.6 + x)); });
    const write = Math.sin(t * 6 + x * 3) > 0.4;                       // one write → both mirrors light together
    disks.forEach((m) => m.color.set(down ? RED : write ? 0xFFFFFF : GREEN));
    brMat.color.set(down ? RED : GREEN);
  };
}

/**
 * A storage array: an enclosure with a grid of disk bays facing +z.
 * Returns { update(t), front } — update blinks the disks with I/O.
 */
export function storageArray(g, x, y, z, w = 1.7, h = 0.8, cols = 7, rows = 3) {
  const enc = framedBox(w, h, 0.65, AMBER, new THREE.MeshStandardMaterial({ color: 0x17140f, metalness: 0.6, roughness: 0.35 })); enc.position.set(x, y, z); g.add(enc);
  if (y - h / 2 > 0.6) [-1, 1].forEach((sd) => {                      // raised on a stand so it shows above the servers
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, y - h / 2 - 0.36, 0.06), darkMat()); leg.position.set(x + sd * (w / 2 - 0.08), (y - h / 2 + 0.36) / 2, z); g.add(leg);
  });
  const leds = [];
  const bw = (w - 0.2) / cols, bh = (h - 0.16) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.85, bh * 0.8, 0.02), new THREE.MeshStandardMaterial({ color: 0x2a3550, emissive: LIGHT, emissiveIntensity: 0.15 }));
    const px = x - w / 2 + 0.1 + (c + 0.5) * bw, py = y - h / 2 + 0.08 + (r + 0.5) * bh;
    d.position.set(px, py, z + 0.335); g.add(d);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.01), new THREE.MeshBasicMaterial({ color: GREEN })); led.position.set(px + bw * 0.28, py - bh * 0.28, z + 0.35); g.add(led);
    leds.push(led.material);
  }
  return {
    front: new THREE.Vector3(x, y, z + 0.33),
    update(t) { leds.forEach((m, k) => m.color.set(Math.sin(t * 7 + k * 2.7 + x * 5) > 0.55 ? 0xFFFFFF : GREEN)); },
  };
}

/** Cables from every server to every array, with I/O dots running along them. Returns update(t, downIndex). */
export function storageCabling(g, servers, arrays) {
  const runs = [];
  servers.forEach((s, i) => arrays.forEach((a, k) => {
    const c = new THREE.CatmullRomCurve3([s.clone(), s.clone().lerp(a, 0.5).add(new THREE.Vector3(0, 0.35, 0)), a.clone()]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.016, 6, false), new THREE.MeshBasicMaterial({ color: k ? AMBER : PALE, transparent: true, opacity: 0.4 })));
    const bit = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: k ? AMBER : 0xFFFFFF })); g.add(bit);
    runs.push({ c, bit, i, off: (i * 0.37 + k * 0.5) % 1 });
  }));
  return function update(t, down = -1) {
    runs.forEach((r) => { r.bit.visible = r.i !== down; const u = (t * 0.35 + r.off) % 1; r.bit.position.copy(r.c.getPointAt(u < 0.5 ? u * 2 : 2 - u * 2)); });
  };
}
