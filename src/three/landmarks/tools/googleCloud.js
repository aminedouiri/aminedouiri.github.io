import * as THREE from "three";
import { glowMat, rack, addTag, framedBox, line3, gear } from "../helpers.js";

/**
 * Google Cloud: a small production architecture.
 *   Requests come from the road through Cloud CDN (cache hits bounce straight back), the global load balancer
 *   spreads them to Cloud Run and GKE, they pass the VPC firewall (one gap = allow rule; a bad packet bounces off)
 *   and IAM (lock flashes green). Cloud Run scales its instances with load; GKE reschedules pods between nodes;
 *   both use Cloud SQL and Cloud Storage. Compute Engine VMs sit in the same VPC, one of them running a
 *   WireGuard VPN tunnel to a remote site.
 *   Above: Cloud Monitoring (metrics), Cloud Logging (log lines), Cloud Trace (spans) and a budget gauge
 *   whose alerts fire at 50 %, 90 % and 100 % of the monthly budget; Cloud Security sweeps the VPC.
 *   Left tower, the delivery pipeline: Cloud Build → Artifact Registry → Artifact Analysis (scan) →
 *   Binary Authorization (only clean, signed images pass; every other image is vulnerable and blocked) →
 *   Cloud Deploy rolls the image out to GKE.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function googleCloud(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D;

  // ---------- VPC: the network boundary everything lives in ----------
  const vpc = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.6, 2.3, 2.9)), new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.55 }));
  vpc.position.set(0, 1.45, -0.15); g.add(vpc);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.06, 2.9), new THREE.MeshStandardMaterial({ color: 0x141c33, emissive: BLUE, emissiveIntensity: 0.15, transparent: true, opacity: 0.75 }));
  floor.position.set(0, 0.33, -0.15); g.add(floor);

  // ---------- Firewall: a wall of posts along the front, with one allowed gap ----------
  const postMat = glowMat(RED, 0.35);
  for (let x = -2.7; x <= 2.71; x += 0.3) {
    if (Math.abs(x) < 0.4) continue;                       // the allow rule
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.38, 0.07), postMat);
    p.position.set(x, 0.55, 1.25); g.add(p);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.05, 0.05), postMat); rail.position.set(0, 0.74, 1.25); g.add(rail);
  const shield = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 0.4), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }));
  shield.position.set(0, 0.55, 1.25); g.add(shield);

  // ---------- IAM: a lock over the gate that checks every request ----------
  const lockMat = glowMat(AMBER, 0.6);
  const lock = new THREE.Group(); lock.position.set(0, 1.0, 1.25); g.add(lock);
  lock.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.14), lockMat));
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 8, 20, Math.PI), lockMat); shackle.position.y = 0.17; lock.add(shackle);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), new THREE.MeshBasicMaterial({ color: 0x0b0d14 })); hole.position.z = 0.075; lock.add(hole);

  // ---------- Cloud Run: serverless instances that scale with traffic ----------
  const runBase = framedBox(1.2, 0.1, 1.0, LIGHT); runBase.position.set(-1.95, 0.42, 0.25); g.add(runBase);
  const insts = [];
  for (let k = 0; k < 4; k++) {
    const c = framedBox(0.42, 0.42, 0.42, LIGHT, glowMat(BLUE, 0.35));
    c.position.set(-1.95 + (k % 2 ? 0.26 : -0.26), 0.7 + Math.floor(k / 2) * 0.48, 0.25); g.add(c); insts.push(c);
  }

  // ---------- Compute Engine: VMs ----------
  const vms = [rack(1.0, LIGHT), rack(1.3, LIGHT), rack(1.15, LIGHT)];
  vms.forEach((r, k) => { r.position.set(1.0 + k * 0.75, 0.36 + r.children[0].geometry.parameters.height / 2, 0.25); g.add(r); });

  // ---------- Cloud SQL: managed database ----------
  const sql = [0, 1, 2].map((k) => {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.24, 28), glowMat(k === 2 ? LIGHT : 0x3E63D9, 0.45));
    d.position.set(-1.1, 0.5 + k * 0.29, -1.0); g.add(d); return d;
  });

  // ---------- Cloud Storage: a bucket of objects ----------
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.75, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a2131, emissive: BLUE, emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide }));
  bucket.position.set(0.55, 0.74, -1.0); g.add(bucket);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 32), glowMat(LIGHT, 0.7)); rim.rotation.x = Math.PI / 2; rim.position.set(0.55, 1.12, -1.0); g.add(rim);
  const objs = [0, 1, 2, 3, 4].map((k) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), glowMat(k % 2 ? AMBER : LIGHT, 0.5));
    o.position.set(0.55 + Math.cos(k * 1.3) * 0.2, 0.55 + k * 0.08, -1.0 + Math.sin(k * 1.3) * 0.2); g.add(o); return o;
  });

  // ---------- Operations suite: three screens above the VPC ----------
  const screen = (x) => { const s = framedBox(1.65, 1.05, 0.06, BLUE, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); s.position.set(x, 3.55, -1.55); g.add(s); return s; };
  const SY = 3.55, SZ = -1.5;
  screen(-1.85); screen(0); screen(1.85);

  // Cloud Monitoring: live bar chart
  const barsM = [];
  for (let k = 0; k < 7; k++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1, 0.02), new THREE.MeshBasicMaterial({ color: k === 6 ? AMBER : LIGHT }));
    b.geometry.translate(0, 0.5, 0); b.position.set(-1.85 - 0.6 + k * 0.2, SY - 0.42, SZ); g.add(b); barsM.push(b);
  }
  // Cloud Logging: log lines scrolling up
  const logs = [];
  for (let k = 0; k < 6; k++) {
    const w = 0.5 + ((k * 37) % 7) / 10;
    const l = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.06), new THREE.MeshBasicMaterial({ color: k === 3 ? RED : k % 2 ? LIGHT : 0xDCE5FF, transparent: true }));
    l.geometry.translate(w / 2, 0, 0); g.add(l); logs.push(l);
  }
  // Cloud Trace: request spans (a waterfall)
  const spans = [[0, 1.2, LIGHT], [0.1, 0.55, BLUE], [0.7, 0.45, GREEN], [0.75, 0.25, AMBER]].map(([s, w, c], k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.11), new THREE.MeshBasicMaterial({ color: c }));
    m.geometry.translate(0.5, 0, 0); m.position.set(1.85 - 0.65 + s, SY + 0.3 - k * 0.2, SZ); g.add(m);
    return { m, w };
  });

  // telemetry links: services → ops suite
  [[-1.95, 1.7, 0.25, -1.85], [1.75, 1.5, 0.25, 1.85], [0, 1.25, 1.25, 0]].forEach(([x, y, z, sx]) => g.add(line3(new THREE.Vector3(x, y, z), new THREE.Vector3(sx, SY - 0.55, SZ), LIGHT, 0.25)));

  // cloud on top
  const cm = new THREE.MeshStandardMaterial({ color: 0xDCE5FF, emissive: BLUE, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
  const cloud = new THREE.Group(); cloud.position.set(0, 4.75, -1.55); g.add(cloud);
  [[0, 0, 0.4], [-0.45, -0.08, 0.3], [0.46, -0.1, 0.3], [0.15, 0.2, 0.3]].forEach((p) => { const s = new THREE.Mesh(new THREE.SphereGeometry(p[2], 18, 12), cm); s.position.set(p[0], p[1], 0); cloud.add(s); });

  // ---------- GKE: a cluster of nodes running pods ----------
  const gke = new THREE.Group(); gke.position.set(-0.35, 0.36, 0.15); g.add(gke);
  gke.add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 6), new THREE.MeshStandardMaterial({ color: BLUE, emissive: BLUE, emissiveIntensity: 0.3, transparent: true, opacity: 0.55 })));
  const nodePos = [0, 1, 2].map((k) => { const a = k / 3 * Math.PI * 2 + Math.PI / 2; return new THREE.Vector3(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32); });
  nodePos.forEach((p) => { const n = framedBox(0.26, 0.3, 0.26, LIGHT); n.position.set(p.x, 0.2, p.z); gke.add(n); });
  const pods = [0, 1, 2, 3, 4].map((k) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), glowMat(k === 4 ? AMBER : GREEN, 0.7));
    gke.add(m); return m;
  });

  // ---------- Cloud CDN: edge cache in front of everything ----------
  const cdnMat = glowMat(LIGHT, 0.55);
  const cdn = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 10, 32, Math.PI), cdnMat); cdn.position.set(0, 0.38, 2.4); g.add(cdn);
  const cache = [-0.18, 0, 0.18].map((x, k) => { const c = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), glowMat(k === 1 ? AMBER : LIGHT, 0.6)); c.position.set(x, 0.92, 2.4); g.add(c); return c; });

  // ---------- Cloud Load Balancing: spreads traffic to Cloud Run and GKE ----------
  const lb = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 10, 40), glowMat(AMBER, 0.7)); lb.rotation.x = Math.PI / 2; lb.position.set(0, 0.5, 1.8); g.add(lb);
  const lbCore = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), glowMat(0xF2F3F5, 0.6)); lbCore.position.set(0, 0.5, 1.8); g.add(lbCore);

  // ---------- WireGuard VPN: encrypted tunnel from a VM to a remote site ----------
  const remote = rack(0.8, GREEN); remote.position.set(3.55, 0.36 + 0.4, -1.45); g.add(remote);
  const remotePad = framedBox(0.9, 0.06, 0.8, GREEN); remotePad.position.set(3.55, 0.33, -1.45); g.add(remotePad);
  const tunnel = new THREE.CatmullRomCurve3([new THREE.Vector3(2.5, 1.15, 0.25), new THREE.Vector3(3.2, 1.5, -0.6), new THREE.Vector3(3.55, 1.25, -1.45)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(tunnel, 40, 0.07, 12, false), new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.22, depthWrite: false })));
  const rings = [0.2, 0.5, 0.8].map((u) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 20), glowMat(GREEN, 0.7));
    r.position.copy(tunnel.getPointAt(u)); r.lookAt(r.position.clone().add(tunnel.getTangentAt(u))); g.add(r); return r;
  });

  // ---------- Budget alerts: spend gauge with thresholds at 50 / 90 / 100 % ----------
  const BX = 2.05, BY = 4.7, BZ = -1.55;
  [[Math.PI / 2, Math.PI / 2, GREEN], [0.1 * Math.PI, 0.4 * Math.PI, AMBER], [0, 0.1 * Math.PI, RED]].forEach(([rot, arc, c]) => {
    const seg = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 24, arc), glowMat(c, 0.5)); seg.rotation.z = rot; seg.position.set(BX, BY, BZ); g.add(seg);
  });
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 }));
  needle.geometry.translate(0.21, 0, 0); needle.position.set(BX, BY, BZ + 0.05); g.add(needle);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })); hub.position.set(BX, BY, BZ + 0.05); g.add(hub);
  const bellMat = new THREE.MeshBasicMaterial({ color: GREEN });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), bellMat); bell.position.set(BX + 0.62, BY + 0.05, BZ); g.add(bell);

  // ---------- Delivery pipeline (left tower): build → registry → scan → attest → deploy ----------
  const PX = -3.85, PZ = 0.15;
  const stageY = [3.75, 3.0, 2.25, 1.5, 0.75];
  const stageCol = [LIGHT, LIGHT, GREEN, AMBER, LIGHT];
  stageY.forEach((y, k) => { const st = framedBox(0.95, 0.42, 0.55, stageCol[k], new THREE.MeshBasicMaterial({ color: 0x0b0f1a, transparent: true, opacity: 0.85 })); st.position.set(PX, y, PZ - 0.1); g.add(st); });
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.04, stageY[0] - stageY[4], 0.04), new THREE.MeshBasicMaterial({ color: LIGHT, transparent: true, opacity: 0.35 }));
  spine.position.set(PX, (stageY[0] + stageY[4]) / 2, PZ + 0.25); g.add(spine);
  const pad = framedBox(1.1, 0.06, 0.8, LIGHT); pad.position.set(PX, 0.33, PZ); g.add(pad);
  // Cloud Build: spinning gear
  const buildGear = gear(0.13, LIGHT, 8); buildGear.position.set(PX - 0.25, stageY[0], PZ + 0.2); g.add(buildGear);
  // Artifact Registry: shelf of stored images
  const shelf = [0, 1, 2].map((k) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), glowMat(LIGHT, 0.4)); b.position.set(PX - 0.3 + k * 0.2, stageY[1] - 0.08, PZ + 0.2); g.add(b); return b; });
  // Artifact Analysis: scanner bar
  const scanBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.36, 0.06), new THREE.MeshBasicMaterial({ color: GREEN })); scanBar.position.set(PX, stageY[2], PZ + 0.22); g.add(scanBar);
  // Binary Authorization: a gate with a status light
  const gateMat = glowMat(AMBER, 0.6);
  [-0.22, 0.22].forEach((dx) => { const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.05), gateMat); post.position.set(PX + dx, stageY[3], PZ + 0.22); g.add(post); });
  const gateBar = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.05), gateMat); gateBar.position.set(PX, stageY[3] + 0.18, PZ + 0.22); g.add(gateBar);
  const verdictMat = new THREE.MeshBasicMaterial({ color: AMBER });
  const verdict = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), verdictMat); verdict.position.set(PX + 0.36, stageY[3] + 0.12, PZ + 0.22); g.add(verdict);
  // Cloud Deploy: rollout arrow
  const deployArrow = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 12), glowMat(LIGHT, 0.7)); deployArrow.rotation.z = -Math.PI / 2; deployArrow.position.set(PX + 0.3, stageY[4], PZ + 0.22); g.add(deployArrow);
  // the image travelling through the pipeline, then out to GKE
  const imgMat = new THREE.MeshStandardMaterial({ color: LIGHT, emissive: LIGHT, emissiveIntensity: 0.6, transparent: true });
  const img = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.17), imgMat); g.add(img);
  const rollout = new THREE.CatmullRomCurve3([new THREE.Vector3(PX + 0.45, stageY[4], PZ + 0.22), new THREE.Vector3(-2.9, 1.25, 0.6), new THREE.Vector3(-1.4, 1.3, 0.75), new THREE.Vector3(-0.35, 0.95, 0.15)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(rollout, 40, 0.015, 6, false), new THREE.MeshBasicMaterial({ color: LIGHT, transparent: true, opacity: 0.3 })));

  // ---------- Cloud Security: a shield that sweeps the VPC for findings ----------
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 0.42); shieldShape.lineTo(0.34, 0.3); shieldShape.lineTo(0.3, -0.05); shieldShape.quadraticCurveTo(0.2, -0.32, 0, -0.45); shieldShape.quadraticCurveTo(-0.2, -0.32, -0.3, -0.05); shieldShape.lineTo(-0.34, 0.3); shieldShape.closePath();
  const secMat = glowMat(GREEN, 0.5);
  const sec = new THREE.Mesh(new THREE.ExtrudeGeometry(shieldShape, { depth: 0.08, bevelEnabled: false }), secMat); sec.position.set(-2.05, 4.7, -1.6); g.add(sec);
  const sweep = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.16, 48), new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
  sweep.rotation.x = -Math.PI / 2; sweep.position.set(0, 0.38, -0.15); g.add(sweep);
  const findings = [[-2.3, -0.9], [1.3, -0.6], [2.2, 0.9]].map(([x, z]) => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: RED })); f.position.set(x, 0.45, z); g.add(f); return f; });

  // ---------- Cloud Ops banner over the observability screens ----------
  g.add(line3(new THREE.Vector3(-2.65, SY - 0.66, SZ), new THREE.Vector3(2.65, SY - 0.66, SZ), BLUE, 0.6));

  // ---------- requests ----------
  const inPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.6, 3.0), new THREE.Vector3(0, 0.6, 2.4), new THREE.Vector3(0, 0.6, 1.8), new THREE.Vector3(0, 0.6, 1.25),
    new THREE.Vector3(-1.0, 0.85, 0.8), new THREE.Vector3(-1.95, 1.0, 0.25), new THREE.Vector3(-1.5, 0.85, -0.5), new THREE.Vector3(-1.1, 0.9, -1.0),
  ]);
  const gkePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.6, 1.8), new THREE.Vector3(0, 0.6, 1.25), new THREE.Vector3(-0.35, 0.95, 0.15), new THREE.Vector3(0.1, 1.1, -0.5), new THREE.Vector3(0.55, 1.1, -1.0),
  ]);
  const toBucket = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.95, 1.0, 0.25), new THREE.Vector3(-0.5, 1.2, -0.4), new THREE.Vector3(0.55, 1.1, -1.0)]);
  const vmToBucket = new THREE.CatmullRomCurve3([new THREE.Vector3(1.75, 1.2, 0.25), new THREE.Vector3(1.2, 1.3, -0.4), new THREE.Vector3(0.55, 1.1, -1.0)]);
  [inPath, gkePath, toBucket, vmToBucket].forEach((c) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 60, 0.015, 6, false), new THREE.MeshBasicMaterial({ color: 0xBFD0FF, transparent: true, opacity: 0.3 }))));
  const pk = (c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: c })); g.add(m); return m; };
  const reqs = [0, 1, 2, 3].map(() => pk(0xFFFFFF));
  const writes = [pk(AMBER), pk(AMBER)];
  const bad = pk(RED);
  const gkeReqs = [pk(0xFFFFFF), pk(0xFFFFFF)];
  const hit = pk(AMBER);                                         // served from the CDN cache
  const vpnBits = [pk(GREEN), pk(GREEN), pk(GREEN)];

  // ---------- labels ----------
  addTag(g, "VPC", "#5B8CFF", -2.45, 2.85, 1.25, 0.5);
  addTag(g, "Firewall", "#FF6B5D", 2.1, 0.98, 1.35, 0.8);
  addTag(g, "IAM", "#FFB547", 0, 1.45, 1.3, 0.45);
  addTag(g, "Cloud Run", "#8FB0FF", -1.95, 1.95, 0.35, 0.95);
  addTag(g, "Compute Engine", "#8FB0FF", 1.75, 2.05, 0.35, 1.25);
  addTag(g, "Cloud SQL", "#8FB0FF", -1.1, 1.6, -1.0, 0.9);
  addTag(g, "Cloud Storage", "#8FB0FF", 0.55, 1.55, -1.0, 1.1);
  addTag(g, "Monitoring", "#8FB0FF", -1.85, SY + 0.72, SZ, 0.95);
  addTag(g, "Logging", "#8FB0FF", 0, SY + 0.72, SZ, 0.8);
  addTag(g, "Cloud Trace", "#38D98A", 1.85, SY + 0.72, SZ, 1.0);
  addTag(g, "GKE", "#8FB0FF", -0.35, 1.4, 0.2, 0.45);
  addTag(g, "Cloud CDN", "#8FB0FF", -0.85, 0.95, 2.4, 0.9);
  addTag(g, "Load balancer", "#FFB547", 0.95, 0.75, 1.8, 1.1);
  addTag(g, "WireGuard VPN", "#38D98A", 3.2, 1.9, -0.6, 1.15);
  addTag(g, "Remote site", "#38D98A", 3.55, 1.45, -1.2, 0.95);
  addTag(g, "Budget alerts", "#FFB547", BX, BY + 0.62, BZ, 1.1);
  addTag(g, "Cloud Security", "#38D98A", -2.05, 5.3, -1.55, 1.15);
  addTag(g, "Cloud Ops", "#5B8CFF", 0, SY - 0.8, SZ, 0.9);
  ["Cloud Build", "Artifact Registry", "Artifact Analysis", "Binary Authorization", "Cloud Deploy"].forEach((n, k) =>
    addTag(g, n, ["#8FB0FF", "#8FB0FF", "#38D98A", "#FFB547", "#8FB0FF"][k], PX, stageY[k] + 0.36, PZ + 0.3, 1.3));

  const lockGreen = new THREE.Color(GREEN), lockAmber = new THREE.Color(AMBER);
  const smoothPh = (x) => { const y = Math.min(1, Math.max(0, (x - 0.35) / 0.65)); return y * y * (3 - 2 * y); };   // pause at each stage, then move
  anims.push(function (t) {
    // requests flow in; the lock flashes green as each one passes IAM
    let check = 0;
    reqs.forEach((r, k) => {
      r.position.copy(inPath.getPointAt((t * 0.13 + k / 4) % 1));
      if (Math.abs(r.position.z - 1.25) < 0.12 && Math.abs(r.position.x) < 0.3) check = 1;
    });
    gkeReqs.forEach((r, k) => {
      r.position.copy(gkePath.getPointAt((t * 0.2 + k / 2 + 0.25) % 1));
      if (Math.abs(r.position.z - 1.25) < 0.12 && Math.abs(r.position.x) < 0.3) check = 1;
    });
    lockMat.color.copy(check ? lockGreen : lockAmber); lockMat.emissive.copy(lockMat.color);
    writes.forEach((w, k) => w.position.copy((k ? vmToBucket : toBucket).getPointAt((t * 0.22 + k * 0.5) % 1)));

    // a request that is not allowed hits the firewall and bounces back
    const b = (t * 0.3) % 1;
    const z = b < 0.5 ? 2.7 - 2.8 * b : 1.3 + 2.8 * (b - 0.5);
    bad.position.set(1.2, 0.55, z);
    bad.material.opacity = 1;
    shield.material.opacity = Math.abs(b - 0.5) < 0.06 ? 0.3 : 0.06;

    // Cloud Run autoscaling: 1 → 4 instances as load rises and falls
    const load = 0.5 + 0.5 * Math.sin(t * 0.5);
    insts.forEach((c, k) => { const on = k < 1 + Math.round(load * 3); const s = c.scale.x + ((on ? 1 : 0.001) - c.scale.x) * 0.08; c.scale.setScalar(s); c.visible = s > 0.01; });

    sql.forEach((d, k) => { d.rotation.y = t * (0.4 + k * 0.2); });
    objs.forEach((o, k) => { o.rotation.y = t * 0.8 + k; o.position.y = 0.55 + k * 0.08 + 0.03 * Math.sin(t * 2 + k); });

    // ops suite
    barsM.forEach((bm, k) => { bm.scale.y = 0.15 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.6 + k * 0.9)) * (k === 6 ? load : 1); });
    logs.forEach((l, k) => {
      const u = (t * 0.25 + k / logs.length) % 1;
      l.position.set(-0.7, SY - 0.42 + u * 0.84, SZ);
      l.material.opacity = Math.min(1, Math.min(u, 1 - u) * 8);
    });
    const tr = (t * 0.3) % 1;
    spans.forEach((s, k) => { s.m.scale.x = Math.max(0.001, s.w * Math.min(1, Math.max(0, tr * 1.6 - k * 0.15))); });

    cloud.position.y = 4.75 + Math.sin(t * 0.7) * 0.08;

    // CDN: a cache hit turns around at the edge and goes straight back
    const hv = (t * 0.35) % 1;
    hit.position.set(0.12, 0.62, hv < 0.5 ? 3.0 - 1.2 * hv : 2.4 + 1.2 * (hv - 0.5));
    cdnMat.emissiveIntensity = Math.abs(hv - 0.5) < 0.08 ? 1.2 : 0.55;
    cache.forEach((c, k) => { c.position.y = 0.92 + 0.04 * Math.sin(t * 3 + k * 2); });

    // load balancer spins; GKE pods drift between nodes (rescheduling)
    lb.rotation.z = t * 1.5;
    pods.forEach((p, k) => {
      const from = nodePos[k % 3], to = nodePos[(k + 1) % 3];
      const cyc = (t * 0.12 + k * 0.21) % 1, move = k === 4 ? Math.min(1, Math.max(0, (cyc - 0.7) / 0.3)) : 0;
      const off = (k < 3 ? 0 : 0.11) * (k % 2 ? 1 : -1);
      p.position.set(from.x + (to.x - from.x) * move + off, 0.45 + 0.03 * Math.sin(t * 4 + k) + Math.sin(move * Math.PI) * 0.25, from.z + (to.z - from.z) * move);
    });

    // WireGuard: encrypted packets both ways, rings pulse
    vpnBits.forEach((b, k) => { const u = (t * 0.3 + k / 3) % 1; b.position.copy(tunnel.getPointAt(k === 1 ? 1 - u : u)); });
    rings.forEach((r, k) => { r.scale.setScalar(1 + 0.25 * Math.max(0, Math.sin(t * 4 - k * 1.2))); });

    // budget: spend climbs through the month; alerts at 50 %, 90 %, 100 %
    const spend = Math.min(1.05, ((t / 16) % 1) * 1.15);
    needle.rotation.z = Math.PI * (1 - Math.min(1, spend));
    bellMat.color.set(spend >= 1 ? RED : spend >= 0.9 ? RED : spend >= 0.5 ? AMBER : GREEN);
    // delivery pipeline: every second image is vulnerable and gets blocked at Binary Authorization
    buildGear.rotation.z = t * 2;
    const run = t / 9, ph = run % 1, vulnerable = Math.floor(run) % 2 === 1;
    const seg = ph * 5;                                           // 0–4 down the tower, 4–5 rollout to GKE
    let ix = PX, iy = stageY[0], iz = PZ + 0.22;
    if (seg < 4) { const k = Math.floor(seg), f = smoothPh(seg - k); iy = stageY[k] + (stageY[k + 1] - stageY[k]) * f; }
    const blocked = vulnerable && seg >= 3;
    if (blocked) iy = stageY[3];
    else if (seg >= 4) { const pt = rollout.getPointAt(Math.min(1, seg - 4)); ix = pt.x; iy = pt.y; iz = pt.z; }
    img.position.set(ix, iy, iz);
    const scanned = seg > 2.4;
    imgMat.color.set(scanned && vulnerable ? RED : scanned ? GREEN : LIGHT); imgMat.emissive.copy(imgMat.color);
    imgMat.opacity = blocked ? Math.max(0, 1 - (seg - 3) * 1.2) : 1;
    scanBar.position.x = PX + 0.32 * Math.sin(t * 5);
    scanBar.visible = seg > 1.6 && seg < 2.6;
    verdictMat.color.set(seg < 2.8 ? AMBER : vulnerable ? RED : GREEN);
    gateBar.position.y = stageY[3] + 0.18 + (!vulnerable && seg > 2.9 && seg < 3.6 ? 0.18 : 0);
    shelf.forEach((b, k) => { b.material.emissiveIntensity = 0.3 + 0.5 * Math.max(0, Math.sin(t * 2 - k)); });
    deployArrow.position.x = PX + 0.3 + (seg > 4 ? 0.06 * Math.sin(t * 10) : 0);

    // Cloud Security: ring sweeps the VPC; findings appear red, then get fixed (green)
    const sw = (t * 0.25) % 1;
    sweep.scale.setScalar(1 + sw * 17); sweep.material.opacity = 0.5 * (1 - sw);
    findings.forEach((f, k) => { const c = (t * 0.08 + k * 0.33) % 1; f.visible = c < 0.8; f.material.color.set(c < 0.45 ? RED : GREEN); });
    secMat.emissiveIntensity = 0.4 + 0.4 * Math.max(0, Math.sin(t * 2));

    bell.scale.setScalar(spend >= 0.5 ? 1 + 0.4 * Math.max(0, Math.sin(t * (spend >= 0.9 ? 12 : 6))) : 1);
  });
}
