import * as THREE from "three";
import { glowMat, darkMat, line3, addTag, framedBox } from "../helpers.js";
import { serverHardware, storageArray, storageCabling } from "../hardware.js";

/**
 * Proxmox VE in a company, one story every CYCLE seconds:
 *   clone    — a VM is created from a template with cloud-init on node 1,
 *   migrate  — it live-migrates to node 2,
 *   HA       — node 3 fails, Corosync loses its heartbeat, the HA manager restarts its guests on node 1,
 *   heal     — node 3 rejoins the quorum.
 * Hardware (the company's real setup): 3 servers with CPU, RAM and two boot disks in RAID 1, and 2 storage
 * arrays with many disks shared by all nodes.
 * Always running: I/O between the nodes and the storage arrays, VLAN traffic on the Linux bridge
 * (vmbr0) passes the Proxmox firewall, backups go to Proxmox Backup Server (deduplicated chunks),
 * and the Web UI / API (used by Terraform) manages the cluster.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const CYCLE = 16;

export function proxmox(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D, ORANGE = 0xE57000;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const win = (ph, a, b) => smooth((ph - a) / (b - a));
  const tube = (c, col, op = 0.28, r = 0.014) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })));
  const dot = (col, r = 0.06) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };

  // ---------- three nodes ----------
  const NX = [-1.85, 0, 1.85], NZ = 0.1, NH = 1.45;
  const nodes = NX.map((x) => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, NH, 0.9), new THREE.MeshStandardMaterial({ color: 0x1A2131, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.55 }));
    body.position.set(x, 0.42 + NH / 2, NZ); g.add(body);
    const edgeMat = new THREE.LineBasicMaterial({ color: AMBER });
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.3, NH, 0.9)), edgeMat); edge.position.copy(body.position); g.add(edge);
    return { edgeMat };
  });
  const slot = (n, j) => V(NX[n] - 0.38 + (j % 3) * 0.38, 1.15 + Math.floor(j / 3) * 0.48, NZ + 0.15);
  const vmBox = (col, s = 0.32) => { const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, 0.45), glowMat(col, 0.45)); g.add(m); return m; };
  // VMs (blue, KVM) and LXC containers (green, smaller)
  const guests = [];
  [[0, 0, 0], [0, 1, 1], [1, 0, 0], [1, 1, 1], [2, 0, 0], [2, 1, 1], [2, 3, 0]].forEach(([n, j, lxc]) => {
    const m = vmBox(lxc ? GREEN : LIGHT, lxc ? 0.24 : 0.32); m.position.copy(slot(n, j)); guests.push({ m, n });
  });
  const cloned = vmBox(AMBER), restarted = [vmBox(GREEN, 0.24), vmBox(LIGHT)];

  // ---------- hardware: CPU, RAM, two boot disks (RAID 1) in every node ----------
  const hw = NX.map((x) => serverHardware(g, x, 0.68, NZ + 0.47, 1.2));

  // ---------- shared storage: 2 storage arrays with many disks, cabled to every node ----------
  const arrays = [-1.0, 1.0].map((x) => storageArray(g, x, 2.3, -1.5, 1.75, 0.85));
  const cabling = storageCabling(g, NX.map((x) => V(x, 0.95, NZ - 0.46)), arrays.map((a) => a.front.clone().add(V(0, 0.2, 0))));

  // ---------- Corosync heartbeat between nodes (quorum) ----------
  const CY = 0.42 + NH + 0.12;
  const links = [[0, 1], [1, 2], [0, 2]].map(([a, b]) => {
    const mat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.6 });
    const c = new THREE.CatmullRomCurve3([V(NX[a], CY, NZ), V((NX[a] + NX[b]) / 2, CY + (b - a === 2 ? 0.55 : 0.2), NZ - 0.2), V(NX[b], CY, NZ)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.02, 6, false), mat));
    return { a, b, c, mat, beat: dot(GREEN, 0.045) };
  });

  // ---------- Linux bridge vmbr0 with VLANs + Proxmox firewall ----------
  const BY = 0.88, BZ = NZ + 0.75;
  const vlans = [[-2.6, -0.1, BLUE], [-0.1, 2.6, VIOLETISH()]];
  function VIOLETISH() { return 0xB58CFF; }
  vlans.forEach(([x0, x1, c]) => { const seg = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75 })); seg.position.set((x0 + x1) / 2, BY, BZ); g.add(seg); });
  const fw = [-2.75, 2.75].map((x) => { const p = framedBox(0.12, 0.4, 0.12, RED, glowMat(RED, 0.5)); p.position.set(x, BY, BZ); g.add(p); return p.children[0].material; });
  const vlanBits = [dot(0xFFFFFF, 0.045), dot(0xFFFFFF, 0.045)], blocked = dot(RED, 0.055);

  // ---------- template + cloud-init ----------
  const TP = V(-3.6, 0.6, 0.45);
  const tpad = framedBox(0.95, 0.06, 0.8, AMBER); tpad.position.set(TP.x, 0.36, TP.z); g.add(tpad);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.32, 24), glowMat(AMBER, 0.4)); disk.position.set(TP.x - 0.15, TP.y, TP.z); g.add(disk);
  const ci = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ color: 0xE9EEF9, side: THREE.DoubleSide })); ci.position.set(TP.x + 0.22, TP.y + 0.2, TP.z + 0.1); ci.rotation.y = -0.3; g.add(ci);
  [0, 1, 2].forEach((k) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.28 - k * 0.05, 0.035), new THREE.MeshBasicMaterial({ color: k ? BLUE : GREEN })); r.position.set(TP.x + 0.2, TP.y + 0.33 - k * 0.1, TP.z + 0.115); r.rotation.y = -0.3; g.add(r); });
  const clonePath = new THREE.CatmullRomCurve3([V(TP.x, TP.y + 0.45, TP.z), V(-3.0, 2.1, 0.4), slot(0, 2)]);
  tube(clonePath, AMBER);
  const migPath = new THREE.CatmullRomCurve3([slot(0, 2), slot(0, 2).lerp(slot(1, 2), 0.5).add(V(0, 1.1, 0.35)), slot(1, 2)]);

  // ---------- Proxmox Backup Server ----------
  const PB = V(-3.4, 0.8, -1.4);
  const pbs = framedBox(1.05, 0.85, 0.65, LIGHT, darkMat()); pbs.position.copy(PB); g.add(pbs);
  const chunks = [];
  for (let k = 0; k < 9; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.04), glowMat(k % 4 ? LIGHT : GREEN, 0.4)); c.position.set(PB.x - 0.3 + (k % 3) * 0.3, PB.y + 0.22 - Math.floor(k / 3) * 0.2, PB.z + 0.34); g.add(c); chunks.push(c); }
  const toPBS = NX.map((x) => new THREE.CatmullRomCurve3([V(x, 1.0, NZ - 0.45), V((x + PB.x) / 2, 1.9, -1.1), V(PB.x + 0.3, PB.y + 0.45, PB.z)]));
  toPBS.forEach((c) => tube(c, LIGHT, 0.18));
  const bkBits = toPBS.map(() => dot(LIGHT, 0.05));

  // ---------- Web UI / API (Terraform, automation) ----------
  const UI = V(0, 3.95, -0.6);
  const ui = framedBox(1.9, 0.95, 0.05, AMBER, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); ui.position.copy(UI); g.add(ui);
  const uiRows = [0, 1, 2, 3].map((k) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.08), new THREE.MeshBasicMaterial({ color: k === 0 ? AMBER : PALE })); r.geometry.translate(0.5, 0, 0); r.position.set(UI.x - 0.75, UI.y + 0.3 - k * 0.18, UI.z + 0.03); g.add(r); return r; });
  NX.forEach((x) => g.add(line3(V(UI.x, UI.y - 0.48, UI.z), V(x, CY + 0.05, NZ - 0.3), AMBER, 0.3)));

  // ---------- labels ----------
  NX.forEach((x, i) => addTag(g, "Node " + (i + 1), "#FFB547", x, 0.2, NZ + 1.0, 0.65));
  addTag(g, "2 boot disks · RAID 1", "#38D98A", NX[0] + 0.3, 0.42, NZ + 0.75, 1.3);
  addTag(g, "CPU · RAM", "#FFB547", NX[1] - 0.2, 0.42, NZ + 0.75, 0.75);
  addTag(g, "Storage array 1", "#FFB547", -1.0, 2.95, -1.5, 1.1);
  addTag(g, "Storage array 2", "#FFB547", 1.0, 2.95, -1.5, 1.1);
  addTag(g, "Corosync quorum", "#38D98A", 0.95, CY + 0.6, NZ - 0.2, 1.2);
  addTag(g, "vmbr0 · VLAN 10 / 20", "#5B8CFF", 0.6, BY + 0.22, BZ + 0.15, 1.4);
  addTag(g, "Firewall", "#FF6B5D", -2.75, BY + 0.38, BZ, 0.65);
  addTag(g, "Template + cloud-init", "#FFB547", TP.x, 1.35, TP.z, 1.45);
  addTag(g, "Proxmox Backup Server", "#8FB0FF", PB.x, PB.y + 0.7, PB.z, 1.55);
  addTag(g, "Web UI · API · Terraform", "#FFB547", UI.x, UI.y + 0.68, UI.z, 1.7);
  addTag(g, "VM", "#8FB0FF", NX[2] + 0.95, 1.55, NZ + 0.3, 0.35);
  addTag(g, "LXC", "#38D98A", NX[2] + 0.95, 1.3, NZ + 0.3, 0.4);
  const tagMig = addTag(g, "Live migration", "#FFB547", -0.9, 2.55, 0.5, 1.05);
  const tagHA = addTag(g, "Node down → HA restart", "#FF6B5D", NX[2], 2.75, 0.4, 1.6);

  anims.push(function (t) {
    const ph = (t / CYCLE) % 1;

    // clone from template (0.05 – 0.2) → live migration to node 2 (0.26 – 0.42)
    cloned.visible = ph > 0.05 && ph < 0.96;
    if (ph < 0.2) cloned.position.copy(clonePath.getPointAt(win(ph, 0.05, 0.2)));
    else if (ph < 0.42) cloned.position.copy(ph < 0.26 ? slot(0, 2) : migPath.getPointAt(win(ph, 0.26, 0.42)));
    else cloned.position.copy(slot(1, 2));
    cloned.scale.setScalar(ph > 0.9 ? Math.max(0.01, 1 - (ph - 0.9) / 0.06) : 1);
    cloned.rotation.y = ph > 0.26 && ph < 0.42 ? t * 3 : 0;
    tagMig.visible = ph > 0.22 && ph < 0.46;

    // HA: node 3 down (0.5 – 0.8), heartbeat lost, guests restarted on node 1
    const down = ph > 0.5 && ph < 0.8;
    nodes[2].edgeMat.color.set(down ? RED : ph >= 0.8 && ph < 0.9 ? AMBER : AMBER);
    tagHA.visible = down;
    guests.forEach(({ m, n }) => { if (n === 2) { const s = ph > 0.5 && ph < 0.92 ? Math.max(0.01, 1 - (ph - 0.5) / 0.04) : ph >= 0.92 ? Math.min(1, (ph - 0.92) / 0.05 + 0.01) : 1; m.scale.setScalar(s); m.visible = s > 0.02; } });
    restarted.forEach((m, k) => {
      const s = ph > 0.56 && ph < 0.92 ? Math.min(1, (ph - 0.56 - k * 0.04) / 0.06) : ph >= 0.92 ? Math.max(0, 1 - (ph - 0.92) / 0.04) : 0;
      m.position.copy(slot(0, 3 + k)); m.scale.setScalar(Math.max(0.01, s)); m.visible = s > 0.02;
    });
    links.forEach((l) => {
      const broken = down && (l.a === 2 || l.b === 2);
      l.mat.color.set(broken ? RED : GREEN); l.mat.opacity = broken ? 0.25 + 0.3 * Math.max(0, Math.sin(t * 10)) : 0.6;
      l.beat.visible = !broken; if (!broken) { const u = (t * 0.6 + l.a * 0.3) % 1; l.beat.position.copy(l.c.getPointAt(u < 0.5 ? u * 2 : 2 - u * 2)); }
    });
    hw.forEach((u, n) => u(t, down && n === 2));
    arrays.forEach((a) => a.update(t));
    cabling(t, down ? 2 : -1);


    // VLAN traffic and a packet dropped by the firewall
    vlanBits.forEach((d, k) => { const u = (t * 0.35 + k * 0.5) % 1; d.position.set(-2.55 + u * 5.1, BY, BZ); });
    const b = (t * 0.33) % 1;
    blocked.position.set(-3.6 + (b < 0.5 ? b * 2 : 2 - b * 2) * 0.82, BY, BZ);
    fw.forEach((m, k) => { m.emissiveIntensity = k === 0 && b > 0.4 && b < 0.6 ? 1.4 : 0.5; });

    // backups to PBS (only the bits that changed are new chunks; the rest are deduplicated)
    bkBits.forEach((d, k) => { d.visible = !(down && k === 2); d.position.copy(toPBS[k].getPointAt((t * 0.22 + k / 3) % 1)); });
    chunks.forEach((c, k) => { c.material.emissiveIntensity = Math.sin(t * 2 + k * 1.3) > 0.8 ? 1.0 : 0.35; });

    // Web UI / API activity
    uiRows.forEach((r, k) => { r.scale.x = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.2 + k * 1.7)); r.material.color.set(down && k === 0 ? RED : k === 0 ? AMBER : PALE); });
  });
}
