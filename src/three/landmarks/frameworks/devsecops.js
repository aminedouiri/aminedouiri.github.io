import * as THREE from "three";
import { glowMat, darkMat, framedBox, line3, addTag, rack } from "../helpers.js";

/**
 * DevSecOps: security built into the pipeline.
 * Code packets ride a belt through a shield gate; most pass (green), a risky one is blocked (red).
 * Six scanners ring the shield and light up in turn as a scan beam sweeps round.
 * Right, production + SOC (one incident every SOC_CYCLE seconds): servers with Wazuh agents behind a WAF and a
 * Suricata IDS stream events to the Wazuh manager (SIEM) → indexer → dashboard. An attack gets past the WAF,
 * a Wazuh rule fires (alert + MITRE ATT&CK technique), and incident response runs:
 * Detect → Triage → Contain (host isolated) → Eradicate → Recover → Lessons learned (a new rule flows back
 * into the pipeline's security gate).
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const SOC_CYCLE = 16;

export function devsecops(g, anims) {
  const C = new THREE.Vector3(0, 2.75, 0);                    // centre of the shield
  const soc = buildSoc(g, C);

  // pipeline belt
  const belt = framedBox(5.8, 0.14, 0.7, 0x5B8CFF); belt.position.y = 0.75; g.add(belt);
  [-2.2, 2.2].forEach((x) => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 8), darkMat()); leg.position.set(x, 0.5, 0); g.add(leg); });

  // shield (extruded outline) with a padlock
  const sh = new THREE.Shape();
  sh.moveTo(0, 1.05); sh.quadraticCurveTo(0.55, 0.95, 0.85, 0.75); sh.lineTo(0.85, 0.05);
  sh.quadraticCurveTo(0.8, -0.65, 0, -1.05); sh.quadraticCurveTo(-0.8, -0.65, -0.85, 0.05); sh.lineTo(-0.85, 0.75); sh.quadraticCurveTo(-0.55, 0.95, 0, 1.05);
  const shieldGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
  shieldGeo.translate(0, 0, -0.11);
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0x14301F, emissive: 0x38D98A, emissiveIntensity: 0.25, metalness: 0.6, roughness: 0.3 });
  const shield = new THREE.Mesh(shieldGeo, shieldMat); shield.position.copy(C); g.add(shield);
  const rim = new THREE.LineSegments(new THREE.EdgesGeometry(shieldGeo, 30), new THREE.LineBasicMaterial({ color: 0x38D98A })); rim.position.copy(C); g.add(rim);
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.12), glowMat(0xF2F3F5, 0.4)); lockBody.position.set(0, C.y - 0.15, 0.2); g.add(lockBody);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 8, 20, Math.PI), glowMat(0xF2F3F5, 0.4)); shackle.position.set(0, C.y + 0.05, 0.2); g.add(shackle);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10), new THREE.MeshBasicMaterial({ color: 0x07080B })); hole.rotation.x = Math.PI / 2; hole.position.set(0, C.y - 0.15, 0.27); g.add(hole);

  // gate posts: the belt passes under the shield
  [-0.55, 0.55].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.15, 0.1), darkMat()); p.position.set(x, 1.3, 0); g.add(p); });
  const gateBar = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.5), glowMat(0x38D98A, 0.6)); gateBar.position.set(0, 1.25, 0); g.add(gateBar);

  // six scanners around the shield
  const names = ["SAST", "Deps / SCA", "Secrets", "DAST", "IaC scan", "Runtime"], scanners = [];
  names.forEach((n, k) => {
    const a = Math.PI / 3 - (k / names.length) * Math.PI * 2, R = 1.75;   // no scanner straight below (the gate is there)
    const p = new THREE.Vector3(C.x + Math.cos(a) * R, C.y + Math.sin(a) * R * 0.9, 0);
    const node = framedBox(0.36, 0.36, 0.2, 0x38D98A, new THREE.MeshStandardMaterial({ color: 0x1A2131, emissive: 0x38D98A, emissiveIntensity: 0.15, metalness: 0.6, roughness: 0.3 }));
    node.position.copy(p); g.add(node);
    g.add(line3(p, C, 0x38D98A, 0.25));
    const out = p.clone().sub(C).normalize();
    addTag(g, n, "#38D98A", p.x + out.x * 0.75, p.y + out.y * 0.4 + 0.02, 0.2, 0.8);
    scanners.push({ node, a });
  });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.05), new THREE.MeshBasicMaterial({ color: 0x38D98A, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  beam.geometry.translate(0.875, 0, 0); beam.position.set(C.x, C.y, 0.05); g.add(beam);

  // code packets on the belt
  const green = new THREE.Color(0x38D98A), red = new THREE.Color(0xFF5A5A), white = new THREE.Color(0xF2F3F5);
  const packets = [0, 1, 2, 3].map((k) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), new THREE.MeshStandardMaterial({ color: 0xF2F3F5, emissive: 0xF2F3F5, emissiveIntensity: 0.3 })); g.add(m); return { m, bad: k === 2 }; });
  const blocked = addTag(g, "Blocked", "#FF5A5A", -1.6, 1.1, 0.5, 0.75);

  // labels
  addTag(g, "Shift left ←", "#5B8CFF", -2.25, 0.35, 0.6, 1.0);
  addTag(g, "Secure release", "#38D98A", 2.2, 0.35, 0.6, 1.1);
  addTag(g, "Policy gate", "#38D98A", 0, 0.35, 0.6, 0.9);

  anims.push(function (t) {
    const ang = -t * 1.2;
    beam.rotation.z = ang;
    scanners.forEach((s) => {
      let d = Math.abs(((ang - s.a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      s.node.children[0].material.emissiveIntensity = 0.15 + 0.85 * Math.max(0, 1 - d / 0.6);
    });
    let anyBlocked = false;
    packets.forEach((p, k) => {
      const u = (t * 0.14 + k / 4) % 1, x = -2.7 + u * 5.4;
      if (p.bad && x > -0.1) {                                   // the risky change stops at the gate and sinks
        const f = Math.min(1, (x + 0.1) / 1.2);
        p.m.position.set(-0.1, 0.95 - f * 0.5, 0); p.m.scale.setScalar(Math.max(0.01, 1 - f));
        p.m.material.color.copy(red); p.m.material.emissive.copy(red); anyBlocked = true;
      } else {
        p.m.position.set(x, 0.95, 0); p.m.scale.setScalar(1);
        const c = x > 0.6 ? green : x < -0.6 ? white : p.bad ? red : green;
        p.m.material.color.copy(c); p.m.material.emissive.copy(c);
      }
    });
    blocked.visible = anyBlocked;
    soc(t);
    shieldMat.emissiveIntensity = anyBlocked ? 0.25 + 0.3 * Math.max(0, Math.sin(t * 10)) : 0.25;
  });
}

/* ---------- production + SOC: Wazuh SIEM and incident response ---------- */
function buildSoc(g, shieldCentre) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF5A5A, VIOLET = 0xB58CFF;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const win = (ph, a, b) => smooth((ph - a) / (b - a));
  const dot = (col, r = 0.05) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };
  const tube = (c, col, op = 0.3, r = 0.013) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, r, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })));

  const plat = framedBox(3.6, 0.1, 2.6, VIOLET, new THREE.MeshStandardMaterial({ color: 0x17132a, emissive: VIOLET, emissiveIntensity: 0.12 })); plat.position.set(4.9, 0.36, -0.05); g.add(plat);

  // production servers with Wazuh agents
  const SX = [3.75, 4.4, 5.05], SZ = 0.55;
  const servers = SX.map((x) => {
    const r = rack(0.85, LIGHT); r.position.set(x, 0.85, SZ); g.add(r);
    const agent = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: GREEN })); agent.position.set(x, 1.36, SZ + 0.2); g.add(agent);
    return { r, agent, home: V(x, 0.85, SZ) };
  });
  const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.85, 1.15, 0.85)), new THREE.LineBasicMaterial({ color: RED })); g.add(cage);

  // WAF in front, Suricata IDS on the edge
  const waf = framedBox(2.0, 0.55, 0.08, AMBER, glowMat(0x3a2a10, 0.4)); waf.position.set(4.4, 0.7, 1.35); g.add(waf);
  const ids = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), glowMat(LIGHT, 0.6)); ids.position.set(5.75, 1.0, 1.25); g.add(ids);
  const idsPupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0x07080b })); idsPupil.position.set(5.75, 1.0, 1.4); g.add(idsPupil);
  const attackBlocked = dot(RED, 0.07), attackIn = dot(RED, 0.07);

  // Wazuh manager (SIEM), indexer and dashboard
  const WM = V(5.95, 1.0, -0.6);
  const mgr = framedBox(0.85, 0.75, 0.6, VIOLET, glowMat(0x241a3d, 0.4)); mgr.position.copy(WM); g.add(mgr);
  const IX = V(6.5, 0.75, 0.3);
  const indexer = [0, 1, 2].map((k) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 22), glowMat(k === 2 ? PALE : 0x3E63D9, 0.45)); d.position.set(IX.x, IX.y - 0.2 + k * 0.18, IX.z); g.add(d); return d; });
  const D = V(5.0, 2.55, -1.15);
  const dash = framedBox(1.9, 1.05, 0.05, VIOLET, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); dash.position.copy(D); g.add(dash);
  const bars = [0, 1, 2, 3, 4, 5].map((k) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.02), new THREE.MeshBasicMaterial({ color: LIGHT })); b.geometry.translate(0, 0.5, 0); b.position.set(D.x - 0.8 + k * 0.14, D.y - 0.4, D.z + 0.04); g.add(b); return b; });
  const alertRow = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.1), new THREE.MeshBasicMaterial({ color: RED })); alertRow.position.set(D.x + 0.35, D.y + 0.3, D.z + 0.04); g.add(alertRow);
  const attack = [];                                                    // MITRE ATT&CK matrix (tactics × techniques)
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.1), new THREE.MeshBasicMaterial({ color: 0x2a3550 })); m.position.set(D.x + 0.02 + c * 0.16, D.y - 0.05 - r * 0.13, D.z + 0.04); g.add(m); attack.push(m.material); }
  const evPaths = servers.map((s) => new THREE.CatmullRomCurve3([s.agent.position.clone(), V((s.home.x + WM.x) / 2, 1.6, (SZ + WM.z) / 2), WM.clone().add(V(-0.3, 0.3, 0))]));
  evPaths.forEach((c) => tube(c, VIOLET, 0.22));
  const evBits = evPaths.map(() => dot(VIOLET, 0.045));
  const toIndex = new THREE.CatmullRomCurve3([WM.clone().add(V(0.4, 0, 0.1)), V(6.4, 1.2, -0.1), IX.clone().add(V(0, 0.15, 0))]);
  const toDash = new THREE.CatmullRomCurve3([IX.clone().add(V(0, 0.2, 0)), V(6.0, 2.1, -0.5), D.clone().add(V(0.95, -0.3, 0))]);
  tube(toIndex, VIOLET, 0.3); tube(toDash, VIOLET, 0.3);
  const ixBit = dot(VIOLET, 0.045), dashBit = dot(VIOLET, 0.045);

  // incident response lifecycle ring
  const IR = V(3.65, 2.75, -0.3), IRR = 0.8;
  const STEPS = ["Detect", "Triage", "Contain", "Eradicate", "Recover", "Lessons learned"];
  const irRing = new THREE.Mesh(new THREE.TorusGeometry(IRR, 0.03, 8, 60), glowMat(AMBER, 0.4)); irRing.position.copy(IR); g.add(irRing);
  const stepNodes = STEPS.map((n, k) => {
    const a = Math.PI / 2 - (k / STEPS.length) * Math.PI * 2;
    const p = V(IR.x + Math.cos(a) * IRR, IR.y + Math.sin(a) * IRR, IR.z);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: 0x3a4152 })); m.position.copy(p); g.add(m);
    const out = V(Math.cos(a), Math.sin(a), 0);
    addTag(g, n, "#FFB547", p.x + out.x * 0.55, p.y + out.y * 0.28, p.z + 0.1, n.length > 9 ? 1.05 : 0.7);
    return { m, a };
  });
  const irMarker = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), glowMat(AMBER, 0.9)); g.add(irMarker);
  const lesson = new THREE.CatmullRomCurve3([IR.clone().add(V(-IRR, 0, 0)), V(2.0, 3.9, 0.1), shieldCentre.clone().add(V(0.4, 0.5, 0.2))]);
  tube(lesson, GREEN, 0.25);
  const ruleBit = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), glowMat(GREEN, 0.9)); g.add(ruleBit);

  // labels
  addTag(g, "Production · Wazuh agents", "#8FB0FF", 4.4, 1.65, SZ + 0.1, 1.75);
  addTag(g, "WAF", "#FFB547", 3.2, 0.7, 1.4, 0.4);
  addTag(g, "Suricata IDS", "#8FB0FF", 5.75, 1.45, 1.25, 0.95);
  addTag(g, "Wazuh manager (SIEM)", "#B58CFF", WM.x, WM.y + 0.6, WM.z, 1.55);
  addTag(g, "Indexer", "#B58CFF", IX.x, IX.y + 0.4, IX.z, 0.6);
  addTag(g, "Wazuh dashboard · MITRE ATT&CK", "#B58CFF", D.x, D.y + 0.72, D.z, 2.1);
  addTag(g, "Incident response", "#FFB547", IR.x, IR.y + 1.3, IR.z, 1.3);
  addTag(g, "new rule ← lessons learned", "#38D98A", 2.0, 4.15, 0.1, 1.7);
  const tagAttack = addTag(g, "Attack detected", "#FF5A5A", SX[1], 2.0, SZ + 0.2, 1.1);

  return function update(t) {
    const ph = (t / SOC_CYCLE) % 1;
    // normal telemetry
    evBits.forEach((b, k) => b.position.copy(evPaths[k].getPointAt((t * 0.5 + k / 3) % 1)));
    ixBit.position.copy(toIndex.getPointAt((t * 0.6) % 1)); dashBit.position.copy(toDash.getPointAt((t * 0.6 + 0.5) % 1));
    indexer.forEach((d, k) => { d.rotation.y = t * (0.4 + k * 0.2); });
    ids.rotation.y = Math.sin(t * 0.8) * 0.6; idsPupil.position.x = 5.75 + Math.sin(t * 0.8) * 0.08;

    // attack (0.28 – 0.36): one request blocked by the WAF, one reaches server 2
    const a = win(ph, 0.28, 0.36);
    attackBlocked.visible = attackIn.visible = a > 0 && a < 1;
    attackBlocked.position.set(3.85, 0.75, 2.4 - Math.min(a * 2, 1) * 1.0 + Math.max(0, a * 2 - 1) * 0.9);
    attackIn.position.copy(V(5.4, 0.9, 2.6)).lerp(servers[1].home.clone().add(V(0, 0.2, 0.3)), a);
    waf.children[0].material.emissiveIntensity = a > 0.4 && a < 0.6 ? 1.2 : 0.4;
    const compromised = ph > 0.35 && ph < 0.72, isolated = ph > 0.56 && ph < 0.8, eradicating = ph > 0.66 && ph < 0.76;
    servers[1].agent.material.color.set(compromised ? RED : eradicating ? AMBER : GREEN);
    tagAttack.visible = ph > 0.36 && ph < 0.5;
    // detection: Wazuh rule fires, alert + ATT&CK technique on the dashboard
    const alerting = ph > 0.38 && ph < 0.75;
    mgr.children[0].material.emissiveIntensity = alerting ? 0.4 + 0.6 * Math.max(0, Math.sin(t * 10)) : 0.4;
    mgr.children[0].material.color.set(alerting ? 0x4a1a1a : 0x241a3d);
    alertRow.visible = alerting;
    attack.forEach((m, k) => m.color.set(alerting && (k === 6 || k === 12) ? RED : k % 4 === 0 ? 0x3a4a70 : 0x2a3550));
    bars.forEach((b, k) => { b.scale.y = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.5 + k)) + (alerting && k === 5 ? 0.3 : 0); b.material.color.set(alerting && k === 5 ? RED : LIGHT); });
    // containment: server 2 is isolated (pulled back, red cage), then recovered
    const iso = isolated ? win(ph, 0.56, 0.62) * (1 - win(ph, 0.76, 0.8)) : 0;
    servers[1].r.position.copy(servers[1].home).add(V(0, 0, -0.65 * iso));
    servers[1].agent.position.set(servers[1].home.x, 1.36, SZ + 0.2 - 0.65 * iso);
    cage.visible = iso > 0.05; cage.position.copy(servers[1].r.position).add(V(0, 0.05, 0));
    // incident response ring
    const irOn = ph > 0.4;
    const steps = [0.4, 0.48, 0.56, 0.66, 0.76, 0.86];
    let cur = -1; steps.forEach((s, k) => { if (ph >= s) cur = k; });
    stepNodes.forEach((n, k) => n.m.material.color.set(!irOn ? 0x3a4152 : k < cur ? GREEN : k === cur ? AMBER : 0x3a4152));
    irMarker.visible = irOn;
    if (irOn) { const node = stepNodes[Math.max(0, cur)]; irMarker.position.copy(node.m.position); irMarker.scale.setScalar(1 + 0.3 * Math.max(0, Math.sin(t * 8))); }
    irRing.material.emissiveIntensity = irOn ? 0.7 : 0.3;
    // lessons learned: a new detection rule flows back to the pipeline gate (shift left)
    const l = win(ph, 0.88, 0.98);
    ruleBit.visible = l > 0 && l < 1;
    if (ruleBit.visible) { ruleBit.position.copy(lesson.getPointAt(l)); ruleBit.rotation.y = t * 3; }
  };
}
