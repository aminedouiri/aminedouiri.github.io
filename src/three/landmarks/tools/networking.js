import * as THREE from "three";
import { glowMat, darkMat, rack, addTag, framedBox, line3 } from "../helpers.js";

/**
 * An enterprise network, one story every CYCLE seconds:
 *   DHCP  — a new PC gets its address: Discover → Offer → Request → Ack (DORA),
 *   DNS   — a PC resolves a name: query → answer,
 *   SMTP  — mail arrives from the Internet through the edge router and firewall to the mail server,
 *   IMAP / POP3 — a PC fetches that mail.
 * Always running: routers exchange routes — OSPF (R1 ↔ R2), EIGRP (R2 ↔ R3), eBGP (R3 ↔ ISP);
 * 802.1Q trunks carry VLAN-tagged frames (VLAN 10 / 20 / 30) from the core switch to the access switches;
 * hosts on the LAN are coloured by VLAN.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const CYCLE = 14;

export function networking(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D, VIOLET = 0xB58CFF;
  const VLAN = { 10: BLUE, 20: GREEN, 30: VIOLET };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const win = (ph, a, b) => (ph - a) / (b - a);
  const dot = (col, r = 0.07) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };
  const path = (...pts) => { const cp = new THREE.CurvePath(); for (let i = 0; i < pts.length - 1; i++) cp.add(new THREE.LineCurve3(pts[i].clone(), pts[i + 1].clone())); return cp; };

  // ---------- devices ----------
  const router = (p, col) => {
    const grp = new THREE.Group(); grp.position.copy(p); g.add(grp);
    grp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 28), glowMat(col, 0.55)));
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })); c.position.set(Math.cos(a) * 0.17, 0.14, Math.sin(a) * 0.17); c.rotation.z = (k % 2 ? 1 : -1) * Math.PI / 2; c.rotation.y = -a; grp.add(c); }
    return grp;
  };
  const sw = (p, w, col) => {
    const s = framedBox(w, 0.18, 0.45, col, darkMat()); s.position.copy(p); g.add(s);
    const leds = [];
    for (let k = 0; k < Math.floor(w / 0.12); k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.01), new THREE.MeshBasicMaterial({ color: GREEN })); l.position.set(p.x - w / 2 + 0.08 + k * 0.12, p.y, p.z + 0.23); g.add(l); leds.push(l); }
    return leds;
  };
  const pc = (p, col) => {
    const grp = new THREE.Group(); grp.position.copy(p); g.add(grp);
    const scr = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.03), glowMat(col, 0.5)); scr.position.y = 0.2; grp.add(scr);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), darkMat()); st.position.y = 0.04; grp.add(st);
    return scr.material;
  };

  // routers + Internet
  const R1 = V(-1.7, 3.45, -0.3), R2 = V(0.3, 3.95, -0.6), R3 = V(2.2, 3.45, -0.3), ISP = V(3.75, 4.25, -0.8);
  [router(R1, BLUE), router(R2, BLUE), router(R3, AMBER)];
  const cm = new THREE.MeshStandardMaterial({ color: 0xDCE5FF, emissive: BLUE, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
  [[0, 0, 0.42], [-0.45, -0.08, 0.3], [0.46, -0.1, 0.3], [0.15, 0.22, 0.3]].forEach(([x, y, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), cm); s.position.set(ISP.x + x, ISP.y + y, ISP.z); g.add(s); });
  const routing = [
    { a: R1, b: R2, col: GREEN, speed: 0.6 },     // OSPF hellos / LSAs
    { a: R2, b: R3, col: BLUE, speed: 0.5 },      // EIGRP hellos / updates
    { a: R3, b: ISP, col: AMBER, speed: 0.3 },    // BGP UPDATE / KEEPALIVE
  ].map((l) => { g.add(line3(l.a, l.b, l.col, 0.85)); l.bits = [dot(l.col, 0.06), dot(l.col, 0.06)]; return l; });

  // firewall, core L3 switch, access switches
  const FW = V(-1.0, 2.7, 0.0);
  const fw = framedBox(0.6, 0.38, 0.4, RED, glowMat(0x5a1a14, 0.5)); fw.position.copy(FW); g.add(fw);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.01), new THREE.MeshBasicMaterial({ color: RED })); b.position.set(FW.x - 0.19 + c * 0.19 + (r % 2) * 0.09, FW.y - 0.11 + r * 0.11, FW.z + 0.205); g.add(b); }
  const CORE = V(0.0, 2.15, 0.15);
  const coreLeds = sw(CORE, 1.4, AMBER);
  g.add(line3(R1, FW, PALE, 0.7)); g.add(line3(FW, CORE, PALE, 0.7));
  const A1 = V(-1.9, 1.25, 0.45), A2 = V(1.6, 1.25, 0.45);
  const acc = [sw(A1, 1.2, BLUE), sw(A2, 1.2, BLUE)];
  // 802.1Q trunks: thick striped links carrying tagged frames
  const trunks = [A1, A2].map((a) => {
    const c = new THREE.LineCurve3(CORE.clone().add(V(a.x < 0 ? -0.5 : 0.5, -0.05, 0)), a.clone().add(V(0, 0.1, 0)));
    [BLUE, GREEN, VIOLET].forEach((col, k) => { const off = V(0, 0, (k - 1) * 0.06); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(c.v1.clone().add(off), c.v2.clone().add(off)), 4, 0.022, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 }))); });
    return { c, frames: [10, 20, 30, 10].map((v) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.12), new THREE.MeshBasicMaterial({ color: VLAN[v] })); g.add(f); return f; }) };
  });

  // LAN hosts by VLAN
  const hostPos = (a, k) => V(a.x - 0.45 + k * 0.45, 0.42, a.z + 0.55);
  const hosts1 = [10, 20, 30].map((v, k) => ({ p: hostPos(A1, k), mat: pc(hostPos(A1, k), VLAN[v]), v }));
  const hosts2 = [10, 20, 10].map((v, k) => ({ p: hostPos(A2, k), mat: pc(hostPos(A2, k), VLAN[v]), v }));
  [...hosts1.map((h) => [A1, h.p]), ...hosts2.map((h) => [A2, h.p])].forEach(([a, p]) => g.add(line3(a, p.clone().add(V(0, 0.2, 0)), PALE, 0.35)));
  const newPc = hosts2[2];                                         // gets its IP from DHCP every cycle

  // services (server VLAN 30): DHCP, DNS, Mail
  const SV = [V(-3.55, 0.85, -0.5), V(-3.55, 0.85, 0.15), V(-3.55, 0.85, 0.8)];
  const svcCols = [GREEN, LIGHT, AMBER];
  SV.forEach((p, k) => { const r = rack(0.9, svcCols[k]); r.position.copy(p); r.scale.setScalar(0.85); g.add(r); g.add(line3(p.clone().add(V(0.3, 0.2, 0)), A1.clone().add(V(-0.6, 0, 0)), VIOLET, 0.45)); });
  const svcGlow = SV.map((p, k) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: svcCols[k] })); s.position.set(p.x, p.y + 0.55, p.z); g.add(s); return s; });

  // ---------- service flows ----------
  const up = (p) => p.clone().add(V(0, 0.25, 0));
  const dhcpPath = path(up(newPc.p), A2, CORE, A1, SV[0].clone().add(V(0.3, 0.2, 0)));
  const dnsPath = path(up(hosts1[0].p), A1, SV[1].clone().add(V(0.3, 0.2, 0)));
  const smtpPath = path(ISP, R3, R2, R1, FW, CORE, A1, SV[2].clone().add(V(0.3, 0.2, 0)));
  const imapPath = path(SV[2].clone().add(V(0.3, 0.2, 0)), A1, CORE, A2, up(hosts2[0].p));
  const dora = [GREEN, AMBER, GREEN, AMBER].map((c) => dot(c, 0.075));       // Discover, Offer, Request, Ack
  const dns = dot(LIGHT, 0.07);
  const mail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.04), glowMat(AMBER, 0.8)); g.add(mail);

  // ---------- labels ----------
  addTag(g, "R1", "#5B8CFF", R1.x, R1.y + 0.4, R1.z, 0.3);
  addTag(g, "R2", "#5B8CFF", R2.x, R2.y + 0.4, R2.z, 0.3);
  addTag(g, "Edge router", "#FFB547", R3.x, R3.y + 0.45, R3.z, 0.9);
  addTag(g, "ISP · Internet", "#BFD0FF", ISP.x, ISP.y + 0.65, ISP.z, 1.0);
  addTag(g, "OSPF", "#38D98A", (R1.x + R2.x) / 2, (R1.y + R2.y) / 2 + 0.25, -0.3, 0.5);
  addTag(g, "EIGRP", "#5B8CFF", (R2.x + R3.x) / 2, (R2.y + R3.y) / 2 + 0.25, -0.3, 0.55);
  addTag(g, "eBGP", "#FFB547", (R3.x + ISP.x) / 2 + 0.1, (R3.y + ISP.y) / 2 + 0.28, -0.4, 0.5);
  addTag(g, "Firewall", "#FF6B5D", FW.x - 0.75, FW.y + 0.05, FW.z + 0.2, 0.7);
  addTag(g, "Core L3 switch", "#FFB547", CORE.x + 0.5, CORE.y + 0.32, CORE.z + 0.2, 1.1);
  addTag(g, "802.1Q trunk", "#BFD0FF", -1.25, 1.85, 0.6, 1.0);
  addTag(g, "trunk", "#BFD0FF", 1.05, 1.85, 0.6, 0.45);
  addTag(g, "Access switch", "#5B8CFF", A1.x, A1.y + 0.28, A1.z + 0.2, 1.0);
  addTag(g, "Access switch", "#5B8CFF", A2.x, A2.y + 0.28, A2.z + 0.2, 1.0);
  addTag(g, "LAN · VLAN 10 / 20 / 30", "#5B8CFF", 0, 0.2, 1.3, 1.6);
  ["DHCP", "DNS", "Mail (SMTP · IMAP · POP3)"].forEach((n, k) => addTag(g, n, ["#38D98A", "#8FB0FF", "#FFB547"][k], SV[k].x - (k === 2 ? 0.9 : 0.55), SV[k].y + 0.25, SV[k].z + 0.2, k === 2 ? 1.6 : 0.5));
  const tagDora = addTag(g, "DHCP · DORA", "#38D98A", 0.25, 1.65, 0.6, 0.95);
  const tagDns = addTag(g, "DNS query", "#8FB0FF", -2.6, 1.55, 0.6, 0.8);
  const tagSmtp = addTag(g, "SMTP in", "#FFB547", 1.35, 3.05, -0.1, 0.65);
  const tagImap = addTag(g, "IMAP / POP3", "#FFB547", 0.6, 1.65, 0.6, 0.9);

  anims.push(function (t) {
    const ph = (t / CYCLE) % 1;
    // routing protocols always talking
    routing.forEach((l) => l.bits.forEach((b, k) => { const u = (t * l.speed + k * 0.5) % 1; b.position.copy(l.a).lerp(l.b, k ? 1 - u : u); }));
    // trunks carry tagged frames
    trunks.forEach((tr, i) => tr.frames.forEach((f, k) => { const u = (t * 0.4 + k / 4 + i * 0.1) % 1; f.position.copy(tr.c.getPoint(i ? u : 1 - u)); }));
    [...coreLeds, ...acc[0], ...acc[1]].forEach((l, k) => { l.material.color.set(Math.sin(t * 9 + k * 2.3) > 0.2 ? GREEN : 0x24402f); });

    // DHCP DORA (0 – 0.26): four messages back and forth, the PC lights up on Ack
    tagDora.visible = ph < 0.3;
    dora.forEach((d, k) => {
      const a = 0.02 + k * 0.06, u = win(ph, a, a + 0.06);
      d.visible = u >= 0 && u <= 1;
      if (d.visible) d.position.copy(dhcpPath.getPointAt(k % 2 ? 1 - smooth(u) : smooth(u)));
    });
    const leased = ph >= 0.26;
    newPc.mat.color.set(leased ? VLAN[10] : 0x3a4152); newPc.mat.emissive.copy(newPc.mat.color);
    svcGlow[0].scale.setScalar(ph > 0.08 && ph < 0.26 ? 1.6 : 1);

    // DNS (0.3 – 0.42)
    const q = win(ph, 0.3, 0.42);
    dns.visible = q >= 0 && q <= 1; tagDns.visible = dns.visible;
    if (dns.visible) dns.position.copy(dnsPath.getPointAt(q < 0.5 ? smooth(q * 2) : 1 - smooth(q * 2 - 1)));
    svcGlow[1].scale.setScalar(Math.abs(q - 0.5) < 0.1 ? 1.6 : 1);

    // SMTP inbound (0.46 – 0.66), then IMAP / POP3 fetch (0.7 – 0.86)
    const s = win(ph, 0.46, 0.66), i = win(ph, 0.7, 0.86);
    tagSmtp.visible = s >= 0 && s <= 1; tagImap.visible = i >= 0 && i <= 1;
    mail.visible = tagSmtp.visible || tagImap.visible;
    if (tagSmtp.visible) mail.position.copy(smtpPath.getPointAt(smooth(s)));
    else if (tagImap.visible) mail.position.copy(imapPath.getPointAt(smooth(i)));
    mail.rotation.y = t * 2;
    svcGlow[2].scale.setScalar(ph > 0.64 && ph < 0.72 ? 1.6 : 1);
  });
}
