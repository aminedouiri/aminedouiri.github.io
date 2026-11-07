import * as THREE from "three";
import { glowMat, darkMat, line3, addTag, framedBox } from "../helpers.js";
import { serverHardware, storageArray, storageCabling } from "../hardware.js";

/**
 * VMware vSphere in a company, one story every CYCLE seconds:
 *   clone  — a VM is deployed from the content-library template onto host 1,
 *   DRS    — vCenter's DRS rebalances it to host 2 with vMotion,
 *   HA     — host 3 fails; vSphere HA restarts its VMs on host 1,
 *   heal   — host 3 comes back.
 * Hardware (the company's real setup): 3 servers with CPU, RAM and two boot disks in RAID 1, and 2 storage arrays
 * with many disks presented to the hosts as shared datastores.
 * Always running: I/O between the hosts and the storage arrays, the NSX distributed switch between the VMs (its
 * distributed firewall blocks a bad packet), backups to the backup repository and vSphere Replication to a DR site.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const CYCLE = 16;

export function vmware(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D, VIOLET = 0xB58CFF;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const win = (ph, a, b) => smooth((ph - a) / (b - a));
  const tube = (c, col, op = 0.28, r = 0.014) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })));
  const dot = (col, r = 0.06) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };


  // ---------- three ESXi hosts ----------
  const HX = [-1.85, 0, 1.85], HZ = 0.2, VY = 1.12;
  const esxi = HX.map((x) => {
    const hw = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 1.05), darkMat()); hw.position.set(x, 0.54, HZ); g.add(hw);
    const hv = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.05), glowMat(BLUE, 0.7)); hv.position.set(x, 0.8, HZ); g.add(hv);
    return hv.material;
  });
  const slot = (h, j) => V(HX[h] - 0.5 + j * 0.34, VY, HZ);
  // hardware: CPU, RAM, two boot disks (RAID 1) on the front of every host
  const hwUpd = HX.map((x) => serverHardware(g, x, 0.5, HZ + 0.54, 1.3));
  // shared storage: 2 storage arrays with many disks, presented as datastores to all hosts
  const arrays = [-0.95, 0.95].map((x) => storageArray(g, x, 2.4, -1.55, 1.7, 0.85));
  const cabling = storageCabling(g, HX.map((x) => V(x, 0.6, HZ - 0.53)), arrays.map((a) => a.front.clone().add(V(0, 0.2, 0))));
  const vm = (col = LIGHT) => {
    const grp = new THREE.Group();
    [col, BLUE, 0xF2F3F5].forEach((c, j) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.12, 0.6), glowMat(c, 0.35)); l.position.y = -0.14 + j * 0.14; grp.add(l); });
    g.add(grp); return grp;
  };
  const base = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]].map(([h, j]) => { const m = vm(); m.position.copy(slot(h, j)); return { m, h }; });
  const clone = vm(AMBER), restart = [vm(GREEN), vm(GREEN)];

  // ---------- NSX: distributed switch + distributed firewall across the VMs ----------
  const NY = 1.62;
  const nsxMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.7 });
  const nsx = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.04, 0.04), nsxMat); nsx.position.set(0, NY, HZ + 0.35); g.add(nsx);
  HX.forEach((x) => [-0.5, -0.16, 0.18, 0.52].forEach((dx) => g.add(line3(V(x + dx, NY, HZ + 0.35), V(x + dx, VY + 0.2, HZ + 0.25), GREEN, 0.25))));
  const dfw = [-0.92, 0.92].map((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), glowMat(RED, 0.6)); p.position.set(x, NY, HZ + 0.35); g.add(p); return p; });
  const nsxOk = [dot(0xFFFFFF, 0.05), dot(0xFFFFFF, 0.05)], nsxBad = dot(RED, 0.06);

  // ---------- vCenter with DRS and HA ----------
  const VC = V(0, 3.35, -0.35);
  const vc = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), glowMat(AMBER, 0.7)); vc.position.copy(VC); g.add(vc);
  HX.forEach((x) => g.add(line3(VC.clone().add(V(0, -0.35, 0)), V(x, 0.85, HZ - 0.4), AMBER, 0.35)));
  const orbit = ["DRS", "HA"].map((n, k) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), glowMat(k ? GREEN : LIGHT, 0.8)); g.add(s); return s; });

  // ---------- content library: VM templates ----------
  const TL = V(-3.55, 0.55, 0.35);
  const lib = framedBox(0.95, 0.06, 0.8, AMBER); lib.position.set(TL.x, 0.36, TL.z); g.add(lib);
  [0, 1, 2].forEach((k) => { const tpl = framedBox(0.7, 0.12, 0.55, AMBER, glowMat(k === 2 ? AMBER : 0x3a2c12, 0.4)); tpl.position.set(TL.x, TL.y + k * 0.18, TL.z); g.add(tpl); });
  const clonePath = new THREE.CatmullRomCurve3([V(TL.x, TL.y + 0.5, TL.z), V(-2.9, 1.9, 0.3), slot(0, 2)]);
  tube(clonePath, AMBER);
  const vmotion = (from, to) => new THREE.CatmullRomCurve3([from, from.clone().lerp(to, 0.5).add(V(0, 0.9, 0.2)), to]);
  const drsPath = vmotion(slot(0, 2), slot(1, 2));

  // ---------- backup repository and DR site ----------
  const BK = V(-3.4, 0.75, -1.35);
  const bk = framedBox(1.0, 0.75, 0.6, LIGHT, darkMat()); bk.position.copy(BK); g.add(bk);
  const bkDisks = [0, 1, 2].map((k) => { const d = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.02), new THREE.MeshBasicMaterial({ color: LIGHT })); d.position.set(BK.x - 0.3 + k * 0.3, BK.y + 0.1, BK.z + 0.31); g.add(d); return d; });
  const DR = V(2.9, 0.75, -1.65);
  const drHost = framedBox(1.1, 0.5, 0.75, VIOLET, darkMat()); drHost.position.copy(DR); g.add(drHost);
  const drVms = [0, 1, 2].map((k) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.45), glowMat(VIOLET, 0.35)); m.position.set(DR.x - 0.3 + k * 0.3, DR.y + 0.42, DR.z); g.add(m); return m; });
  const toBackup = new THREE.CatmullRomCurve3([V(-2.4, 0.45, -0.35), V(-3.0, 1.0, -0.9), V(BK.x + 0.2, BK.y + 0.4, BK.z)]);
  const toDR = new THREE.CatmullRomCurve3([V(2.4, 0.45, -0.35), V(2.9, 1.4, -1.0), V(DR.x, DR.y + 0.3, DR.z)]);
  tube(toBackup, LIGHT); tube(toDR, VIOLET);
  const bkBits = [dot(LIGHT, 0.05), dot(LIGHT, 0.05)], drBits = [dot(VIOLET, 0.05), dot(VIOLET, 0.05)];

  // ---------- labels ----------
  HX.forEach((x, i) => addTag(g, "ESXi host " + (i + 1), "#5B8CFF", x, 0.95, HZ + 0.6, 0.95));
  addTag(g, "vCenter", "#FFB547", VC.x, VC.y + 0.65, VC.z, 0.7);
  addTag(g, "2 boot disks · RAID 1", "#38D98A", HX[0] + 0.4, 0.15, HZ + 0.75, 1.3);
  addTag(g, "CPU · RAM", "#FFB547", HX[1] - 0.25, 0.15, HZ + 0.75, 0.75);
  addTag(g, "Storage array 1 · datastore", "#FFB547", -1.0, 1.75, -1.2, 1.6);
  addTag(g, "Storage array 2 · datastore", "#FFB547", 1.0, 1.75, -1.2, 1.6);
  addTag(g, "NSX switch + firewall", "#38D98A", 0, NY + 0.3, HZ + 0.4, 1.5);
  addTag(g, "Content library", "#FFB547", TL.x, 1.25, TL.z, 1.1);
  addTag(g, "Backup", "#8FB0FF", BK.x, BK.y + 0.6, BK.z, 0.6);
  addTag(g, "DR site (replication)", "#B58CFF", DR.x, DR.y + 0.85, DR.z, 1.45);
  const tagDRS = addTag(g, "DRS · vMotion", "#8FB0FF", 0.9, 2.55, 0.4, 1.05);
  const tagHA = addTag(g, "Host failure → HA restart", "#FF6B5D", 1.85, 2.2, 0.6, 1.7);

  anims.push(function (t) {
    const ph = (t / CYCLE) % 1;
    vc.rotation.y = t;
    orbit.forEach((s, k) => { const a = t * 1.2 + k * Math.PI; s.position.set(VC.x + Math.cos(a) * 0.75, VC.y + 0.1 * Math.sin(t * 2 + k), VC.z + Math.sin(a) * 0.75); });

    // clone from template (0.05 – 0.2) → DRS vMotion to host 2 (0.26 – 0.42) → stays → fades at the end
    clone.visible = ph > 0.05 && ph < 0.96;
    if (ph < 0.2) clone.position.copy(clonePath.getPointAt(win(ph, 0.05, 0.2)));
    else if (ph < 0.42) clone.position.copy(ph < 0.26 ? slot(0, 2) : drsPath.getPointAt(win(ph, 0.26, 0.42)));
    else clone.position.copy(slot(1, 2));
    clone.scale.setScalar(ph > 0.9 ? Math.max(0.01, 1 - (ph - 0.9) / 0.06) : 1);
    tagDRS.visible = ph > 0.22 && ph < 0.46;

    // HA: host 3 fails (0.5), its VMs go dark, HA restarts them on host 1 (0.56 – 0.66); host 3 heals (0.78 – 0.9)
    const down = ph > 0.5 && ph < 0.8;
    esxi[2].color.set(down ? RED : ph > 0.8 && ph < 0.9 ? AMBER : BLUE); esxi[2].emissive.copy(esxi[2].color);
    tagHA.visible = ph > 0.5 && ph < 0.8;
    base.forEach(({ m, h }) => { if (h === 2) { const s = ph > 0.5 && ph < 0.92 ? Math.max(0.01, 1 - (ph - 0.5) / 0.04) : ph >= 0.92 ? Math.min(1, (ph - 0.92) / 0.05 + 0.01) : 1; m.scale.setScalar(s); m.visible = s > 0.02; } });
    restart.forEach((m, k) => {
      const s = ph > 0.56 && ph < 0.92 ? Math.min(1, (ph - 0.56 - k * 0.04) / 0.06) : ph >= 0.92 ? Math.max(0, 1 - (ph - 0.92) / 0.04) : 0;
      m.position.copy(slot(0, 2 + k)); m.scale.setScalar(Math.max(0.01, s)); m.visible = s > 0.02;
    });

    // NSX: east-west traffic between VMs; one packet is stopped by the distributed firewall
    nsxOk.forEach((d, k) => { const u = (t * 0.35 + k * 0.5) % 1; d.position.set(-2.4 + u * 4.8, NY, HZ + 0.35); });
    const b = (t * 0.4) % 1;
    nsxBad.position.set(b < 0.5 ? -2.4 + b * 2 * 1.45 : -0.95 - (b - 0.5) * 2 * 1.45, NY, HZ + 0.35);
    dfw.forEach((p) => { p.material.emissiveIntensity = Math.abs(b - 0.5) < 0.05 ? 1.4 : 0.6; });

    // storage, backup, replication
    hwUpd.forEach((u, h) => u(t, down && h === 2));
    arrays.forEach((a) => a.update(t));
    cabling(t, down ? 2 : -1);
    bkBits.forEach((d, k) => d.position.copy(toBackup.getPointAt((t * 0.25 + k * 0.5) % 1)));
    drBits.forEach((d, k) => d.position.copy(toDR.getPointAt((t * 0.3 + k * 0.5) % 1)));
    bkDisks.forEach((d, k) => { d.material.color.set(Math.sin(t * 3 + k) > 0.5 ? GREEN : LIGHT); });
    drVms.forEach((m, k) => { m.material.emissiveIntensity = 0.3 + 0.3 * Math.max(0, Math.sin(t * 2 + k)); });
  });
}
