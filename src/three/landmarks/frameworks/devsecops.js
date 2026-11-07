import * as THREE from "three";
import { glowMat, darkMat, framedBox, line3, addTag } from "../helpers.js";

/**
 * DevSecOps: security built into the pipeline.
 * Code packets ride a belt through a shield gate; most pass (green), a risky one is blocked (red).
 * Six scanners ring the shield and light up in turn as a scan beam sweeps round.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function devsecops(g, anims) {
  const C = new THREE.Vector3(0, 2.75, 0);                    // centre of the shield

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
    shieldMat.emissiveIntensity = anyBlocked ? 0.25 + 0.3 * Math.max(0, Math.sin(t * 10)) : 0.25;
  });
}
