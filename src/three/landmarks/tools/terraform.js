import * as THREE from "three";
import { glowMat, addTag, framedBox, line3, rack } from "../helpers.js";

/**
 * Terraform, one run every CYCLE seconds:
 *   1. plan   — custom modules (network / compute / database) from the module library describe the
 *               resources (wireframes); a plan file is written,
 *   2. store  — the plan file flies to the state bucket (Cloud Storage), where every plan is kept,
 *   3. apply  — the state is locked, the apply sweep turns wireframes into real resources,
 *   4. backup — the new state is unlocked and copied to a versioned backup bucket.
 *   The front row shows the providers one run talks to — Google Cloud, AWS, VMware vSphere, Kubernetes, Helm:
 *   as the apply sweep reaches each one its beam lights up and a resource appears there (multi-cloud, one workflow).
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const CYCLE = 11;

export function terraform(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, VIOLET = 0xB58CFF;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

  // ---------- platform + resources (grouped in three modules) ----------
  const base = new THREE.Mesh(new THREE.BoxGeometry(4, 0.08, 2.6), new THREE.MeshStandardMaterial({ color: BLUE, emissive: BLUE, emissiveIntensity: 0.2, transparent: true, opacity: 0.4 }));
  base.position.y = 0.9; g.add(base);
  const MODS = [
    { name: "network", col: GREEN, css: "#38D98A", cols: [0] },
    { name: "compute", col: LIGHT, css: "#8FB0FF", cols: [1, 2] },
    { name: "database", col: AMBER, css: "#FFB547", cols: [3] },
  ];
  const colX = (i) => -1.4 + i * 0.93;
  const items = [], wires = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const mod = MODS.find((m) => m.cols.includes(i));
    const h = 0.6 + ((i * 3 + j * 5) % 4) * 0.35, x = colX(i), z = -0.55 + j * 1.1;
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.62, h, 0.62)), new THREE.LineDashedMaterial({ color: PALE, dashSize: 0.08, gapSize: 0.06, transparent: true }));
    wire.computeLineDistances(); wire.position.set(x, 0.94 + h / 2, z); g.add(wire); wires.push(wire);
    const solid = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6), glowMat(mod.col, 0.45));
    solid.geometry.translate(0, h / 2, 0); solid.position.set(x, 0.94, z); solid.scale.set(1, 0.01, 1); g.add(solid);
    items.push({ s: solid, x });
  }
  // module trays: a dashed outline around each module's resources
  MODS.forEach((m) => {
    const x0 = colX(m.cols[0]) - 0.42, x1 = colX(m.cols[m.cols.length - 1]) + 0.42;
    const tray = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(x1 - x0, 0.14, 2.35)), new THREE.LineBasicMaterial({ color: m.col }));
    tray.position.set((x0 + x1) / 2, 1.0, 0); g.add(tray);
    m.trayX = (x0 + x1) / 2;
  });

  // ---------- module library (left): reusable custom modules ----------
  const LX = -3.05;
  const shelf = framedBox(0.95, 0.06, 0.8, BLUE); shelf.position.set(LX, 0.36, 0); g.add(shelf);
  const bricks = MODS.map((m, k) => {
    const b = new THREE.Group(); b.position.set(LX, 0.62 + k * 0.5, 0); g.add(b);
    b.add(framedBox(0.8, 0.4, 0.6, m.col, glowMat(m.col, 0.35)));
    [-0.2, 0.2].forEach((dx) => { const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 14), glowMat(m.col, 0.6)); stud.position.set(dx, 0.24, 0); b.add(stud); });
    g.add(line3(V(LX + 0.4, b.position.y, 0), V(m.trayX, 1.0, 0), m.col, 0.35));        // module → its resources
    return b;
  });

  // ---------- plan file ----------
  const planOrigin = V(LX, 2.55, 0.1);
  const plan = new THREE.Group(); g.add(plan);
  plan.add(new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.7), new THREE.MeshBasicMaterial({ color: 0xE9EEF9, side: THREE.DoubleSide })));
  [[GREEN, 0.3], [GREEN, 0.22], [AMBER, 0.28], [GREEN, 0.18], [0xFF6B5D, 0.12]].forEach(([c, w], k) => {
    const row = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.05), new THREE.MeshBasicMaterial({ color: c })); row.position.set(-0.19 + w / 2, 0.24 - k * 0.12, 0.005); plan.add(row);
  });

  // ---------- state bucket (Cloud Storage) + versioned backup bucket ----------
  const bucket = (x, z, r, col) => {
    const grp = new THREE.Group(); grp.position.set(x, 0.35, z); g.add(grp);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.78, r * 1.6, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a2131, emissive: col, emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide }));
    body.position.y = r * 0.8; grp.add(body);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 8, 32), glowMat(col, 0.7)); rim.rotation.x = Math.PI / 2; rim.position.y = r * 1.6; grp.add(rim);
    return grp;
  };
  const SX = 2.85, SZ = 0.35, BX = 3.75, BZ = -1.6;
  bucket(SX, SZ, 0.55, LIGHT);
  bucket(BX, BZ, 0.42, VIOLET);
  // stored plans stacking up inside the state bucket
  const stored = [0, 1, 2, 3, 4].map((k) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.32), new THREE.MeshBasicMaterial({ color: k === 4 ? 0xFFFFFF : 0xC9D4EE }));
    p.position.set(SX, 0.42 + k * 0.07, SZ); g.add(p); return p;
  });
  // the state file (tfstate) sitting on top
  const stateMat = glowMat(AMBER, 0.6);
  const state = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), stateMat); state.position.set(SX, 1.45, SZ); g.add(state);
  // state lock
  const lockMat = glowMat(GREEN, 0.6);
  const lock = new THREE.Group(); lock.position.set(SX + 0.42, 1.55, SZ + 0.2); g.add(lock);
  lock.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.08), lockMat));
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 16, Math.PI), lockMat); shackle.position.y = 0.09; lock.add(shackle);
  // versioned backups (v1, v2, v3 …)
  const backups = [0, 1, 2].map((k) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), glowMat(VIOLET, 0.4)); b.position.set(BX - 0.15 + k * 0.15, 0.55 + k * 0.08, BZ); g.add(b); return b; });
  // flight paths
  const toBucket = new THREE.CatmullRomCurve3([planOrigin.clone(), V(-1.0, 3.9, 0.3), V(1.5, 3.6, 0.3), V(SX, 1.6, SZ)]);
  const toBackup = new THREE.CatmullRomCurve3([V(SX, 1.45, SZ), V((SX + BX) / 2, 2.0, (SZ + BZ) / 2), V(BX, 1.0, BZ)]);
  [toBucket, toBackup].forEach((c, k) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 50, 0.012, 6, false), new THREE.MeshBasicMaterial({ color: k ? VIOLET : PALE, transparent: true, opacity: 0.25 }))));
  const copy = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), glowMat(VIOLET, 0.8)); g.add(copy);

  // ---------- providers (front row): one Terraform run, many clouds and platforms ----------
  const PROV = [
    { name: "Google Cloud", css: "#5B8CFF", col: BLUE },
    { name: "AWS", css: "#FFB547", col: AMBER },
    { name: "VMware vSphere", css: "#8FB0FF", col: LIGHT },
    { name: "Kubernetes", css: "#5B8CFF", col: BLUE },
    { name: "Helm", css: "#BFD0FF", col: PALE },
  ];
  const PZ = 2.05, PY = 0.42, hub = V(0, 0.98, 1.3);
  const cloudIcon = (col) => { const grp = new THREE.Group(); const m = glowMat(col, 0.5); [[0, 0, 0.17], [-0.17, -0.04, 0.12], [0.17, -0.05, 0.12], [0.06, 0.09, 0.12]].forEach(([x, y, r]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); b.position.set(x, y, 0); grp.add(b); }); return grp; };
  const wheel = (col, spokes, knobs) => { const grp = new THREE.Group(); const m = glowMat(col, 0.6); grp.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 24), m)); for (let k = 0; k < spokes; k++) { const a = (k / spokes) * Math.PI * 2; const sp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), m); sp.rotation.z = a; grp.add(sp); if (knobs) { const kb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), m); kb.position.set(Math.cos(a) * 0.21, Math.sin(a) * 0.21, 0); grp.add(kb); } } return grp; };
  const provs = PROV.map((pv, k) => {
    const x = -2.0 + k * 1.0;
    const padP = framedBox(0.7, 0.06, 0.55, pv.col); padP.position.set(x, PY, PZ); g.add(padP);
    let icon;
    if (k <= 1) icon = cloudIcon(pv.col);
    else if (k === 2) { icon = rack(0.45, pv.col); icon.scale.setScalar(0.8); }
    else icon = wheel(pv.col, k === 3 ? 7 : 6, k === 4);
    icon.position.set(x, PY + 0.32, PZ); g.add(icon);
    const res = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), glowMat(pv.col, 0.7)); res.position.set(x + 0.25, PY + 0.14, PZ + 0.12); res.scale.setScalar(0.001); g.add(res);
    const beamMat = new THREE.MeshBasicMaterial({ color: pv.col, transparent: true, opacity: 0.12 });
    const curve = new THREE.CatmullRomCurve3([hub.clone(), V(x * 0.6, 0.95, (hub.z + PZ) / 2), V(x, PY + 0.55, PZ)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.02, 6, false), beamMat));
    addTag(g, pv.name, pv.css, x, PY - 0.12, PZ + 0.35, pv.name.length > 8 ? 1.05 : 0.7);
    return { x, icon, res, beamMat, k };
  });
  addTag(g, "Providers", "#FFB547", -2.75, PY + 0.45, PZ, 0.8);

  // ---------- apply sweep ----------
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 3), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  scan.rotation.y = Math.PI / 2; scan.position.y = 2.2; g.add(scan);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.12, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  sheet.rotation.y = Math.PI / 2; sheet.position.y = 2.2; g.add(sheet);

  // ---------- labels ----------
  addTag(g, "Custom modules", "#8FB0FF", LX, 2.05, 0.35, 1.25);
  MODS.forEach((m) => addTag(g, m.name, m.css, m.trayX, 0.72, 1.3, 0.75));
  addTag(g, "Plan", "#BFD0FF", LX, 3.15, 0.1, 0.5);
  addTag(scan, "Apply", "#FFB547", 0, 1.75, 0, 0.7);
  addTag(g, "State + plans bucket", "#8FB0FF", SX, 2.05, SZ + 0.1, 1.55);
  addTag(g, "Backup (versioned)", "#B58CFF", BX, 1.45, BZ, 1.4);
  addTag(g, "State lock", "#38D98A", SX + 0.55, 1.15, SZ + 0.5, 0.85);

  anims.push(function (t) {
    const ph = (t / CYCLE) % 1;
    // 1. plan (0 – 0.22): resources reset, wireframes flicker, plan file is written
    const planning = ph < 0.22;
    wires.forEach((w, k) => { w.material.opacity = planning ? 0.4 + 0.6 * Math.max(0, Math.sin(t * 8 - k)) : 0.9; });
    bricks.forEach((b, k) => { b.position.x = LX + (planning ? 0.05 * Math.sin(t * 6 + k) : 0); });
    // 2. store (0.22 – 0.38): plan file flies to the bucket
    if (ph < 0.22) { plan.visible = true; plan.position.copy(planOrigin); plan.scale.setScalar(Math.max(0.01, smooth(ph / 0.15))); plan.rotation.set(0, 0, 0); }
    else if (ph < 0.38) { const u = smooth((ph - 0.22) / 0.16); plan.position.copy(toBucket.getPointAt(u)); plan.scale.setScalar(1 - 0.6 * u); plan.rotation.y = u * Math.PI * 2; }
    else plan.visible = false;
    stored[4].visible = ph >= 0.38;                                      // newest plan joins the archive
    // 3. apply (0.4 – 0.82): state locked, sweep makes resources real
    const applying = ph >= 0.4 && ph < 0.82;
    const sx = -2.2 + smooth((ph - 0.4) / 0.42) * 4.4;
    scan.visible = sheet.visible = applying;
    scan.position.x = sheet.position.x = sx;
    items.forEach((it) => {
      const on = ph >= 0.4 && (ph >= 0.82 || it.x < sx);
      const target = on ? 1 : 0.01;
      it.s.scale.y += (target - it.s.scale.y) * (ph < 0.06 ? 0.3 : 0.15);
    });
    // providers: each lights up and gets its resource when the sweep reaches it
    provs.forEach((pv) => {
      const reached = ph >= 0.4 && (ph >= 0.82 || sx > pv.x - 0.2);
      pv.beamMat.opacity = applying && Math.abs(sx - pv.x) < 0.6 ? 0.85 : reached ? 0.35 : 0.12;
      const target = reached ? 1 : 0.001;
      pv.res.scale.setScalar(pv.res.scale.x + (target - pv.res.scale.x) * (ph < 0.06 ? 0.3 : 0.12));
      pv.res.visible = pv.res.scale.x > 0.02;
      if (pv.k >= 3) pv.icon.rotation.z = t * (pv.k === 3 ? 0.8 : -0.6);
      else pv.icon.position.y = PY + 0.32 + 0.03 * Math.sin(t * 2 + pv.k);
    });
    lockMat.color.set(applying ? AMBER : GREEN); lockMat.emissive.copy(lockMat.color);
    lock.position.y = 1.55 + (applying ? 0 : 0.06);
    stateMat.emissiveIntensity = applying ? 0.3 + 0.5 * Math.max(0, Math.sin(t * 10)) : 0.6;
    // 4. backup (0.84 – 1): new state copied to the versioned backup bucket
    const b = (ph - 0.84) / 0.16;
    copy.visible = b >= 0 && b <= 1;
    if (copy.visible) copy.position.copy(toBackup.getPointAt(smooth(b)));
    backups.forEach((bk, k) => { bk.material.emissiveIntensity = k === 2 && b > 0.95 ? 1.2 : 0.4; });
  });
}
