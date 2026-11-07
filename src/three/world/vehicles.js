/*
 * Vehicles you can drive: car, motorcycle, airplane and person (original designs).
 * Every builder returns the same shape so World.js can swap them freely:
 *   { group, markerY, animate({ travel, turn, spd, dir, now, reduce }) }
 *   - travel: distance moved this frame (world units)
 *   - turn:   steering, -1 … 1
 *   - spd:    current speed (world units / s)
 * To add one: write a builder below and add it to VEHICLES.
 */
import * as THREE from "three";
import { glowTexture } from "../utils/textures.js";
import { buildCar, CAR_SCALE, WHEEL_RADIUS } from "./car.js";

export const SCALE = CAR_SCALE;

/** Order and names shown in the picker. */
export const VEHICLES = [
  { id: "car", label: "Car" },
  { id: "moto", label: "Motorcycle" },
  { id: "plane", label: "Airplane" },
  { id: "person", label: "Person" },
];

export function buildVehicle(id) {
  const make = { car, moto, plane, person }[id] || car;
  return make();
}

/* ---------- shared bits ---------- */
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.35, ...o });
const glow = (color, i = 0.8) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i });
const basic = (color) => new THREE.MeshBasicMaterial({ color });
function box(parent, w, h, d, m, x = 0, y = 0, z = 0) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; }
function groundShadow(g, w, l) {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshBasicMaterial({ map: glowTexture("rgba(0,0,0,0.9)"), transparent: true, depthWrite: false }));
  s.rotation.x = -Math.PI / 2; s.position.y = 0.035; g.add(s); return s;
}
function underGlow(g, w, l) {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshBasicMaterial({ map: glowTexture("rgba(91,140,255,0.5)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.rotation.x = -Math.PI / 2; s.position.y = 0.03; g.add(s);
  const p = new THREE.PointLight(0x5b8cff, 1.2, 6); p.position.y = 0.3; g.add(p);
}
function wheel(r, w) {
  const g = new THREE.Group();
  const tyre = new THREE.CylinderGeometry(r, r, w, 28); tyre.rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.02, 20); rim.rotateZ(Math.PI / 2);
  g.add(new THREE.Mesh(tyre, mat(0x0c0d10, { metalness: 0.1, roughness: 0.85 })));
  g.add(new THREE.Mesh(rim, mat(0xb9bec8, { metalness: 0.9, roughness: 0.25 })));
  for (let k = 0; k < 3; k++) { const s = box(g, w + 0.03, 0.04, r * 1.1, mat(0x0c0d10)); s.rotation.x = (k * Math.PI) / 3; }
  g.rotation.order = "YXZ";
  return g;
}

/* ---------- car ---------- */
function car() {
  const { group, body, wheels } = buildCar();
  return {
    group, markerY: 1.05,
    animate({ travel, turn, spd, dir, now, reduce }) {
      body.position.y = spd > 0.5 && !reduce ? Math.sin(now / 60) * 0.015 : 0;
      body.rotation.x = -Math.min(0.03, spd * 0.002) * dir;
      body.rotation.z = -turn * Math.min(0.04, spd * 0.004);
      wheels.forEach((w, i) => {
        w.rotation.x += (travel / (WHEEL_RADIUS * CAR_SCALE)) * dir;
        if (i < 2) w.rotation.y = turn * 0.45;
      });
    },
  };
}

/* ---------- motorcycle (with rider) ---------- */
function moto() {
  const g = new THREE.Group(), lean = new THREE.Group(); g.add(lean);
  const R = 0.46, paint = new THREE.MeshPhysicalMaterial({ color: 0xe9ecf1, metalness: 0.55, roughness: 0.22, clearcoat: 1 });
  const front = wheel(R, 0.2), rear = wheel(R, 0.26);
  front.position.set(0, R, 1.15); rear.position.set(0, R, -1.05); lean.add(front); lean.add(rear);
  const frame = mat(0x1a2131, { metalness: 0.8 });
  box(lean, 0.5, 0.38, 1.0, paint, 0, 1.0, 0.25);                     // tank
  box(lean, 0.42, 0.14, 0.9, mat(0x0a0c12), 0, 0.98, -0.45);            // seat
  box(lean, 0.36, 0.42, 0.7, frame, 0, 0.62, 0);                         // engine block
  box(lean, 0.44, 0.06, 0.95, glow(0x5b8cff, 0.6), 0, 0.42, 0);          // accent strip
  const fork = box(lean, 0.08, 0.95, 0.08, frame, 0, 0.95, 1.05); fork.rotation.x = -0.35;
  box(lean, 0.9, 0.06, 0.06, frame, 0, 1.38, 0.88);                      // handlebar
  box(lean, 0.3, 0.16, 0.08, basic(0xf2f6ff), 0, 1.12, 1.3);             // headlight
  box(lean, 0.3, 0.08, 0.06, basic(0xff3344), 0, 1.0, -0.95);            // tail light
  // rider
  const suit = mat(0x22283a, { metalness: 0.2 }), helmet = new THREE.MeshPhysicalMaterial({ color: 0xffb547, metalness: 0.3, roughness: 0.2, clearcoat: 1 });
  const torso = box(lean, 0.5, 0.7, 0.32, suit, 0, 1.45, -0.25); torso.rotation.x = 0.45;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), helmet); head.position.set(0, 1.92, 0.08); lean.add(head);
  box(lean, 0.3, 0.07, 0.05, basic(0x0a0c12), 0, 1.93, 0.27);            // visor
  [-1, 1].forEach((s) => { const arm = box(lean, 0.1, 0.1, 0.65, suit, s * 0.3, 1.5, 0.45); arm.rotation.x = 0.35; const leg = box(lean, 0.13, 0.13, 0.6, suit, s * 0.26, 0.85, -0.1); leg.rotation.x = -0.6; });
  const beam = new THREE.SpotLight(0xe6eeff, 2.5, 22, 0.45, 0.55, 1.4); beam.position.set(0, 1.1, 1.35);
  const tgt = new THREE.Object3D(); tgt.position.set(0, 0, 10); lean.add(tgt); beam.target = tgt; lean.add(beam);
  underGlow(g, 2.4, 4.4); groundShadow(g, 1.4, 3.6);
  g.scale.setScalar(SCALE);
  return {
    group: g, markerY: 1.1,
    animate({ travel, turn, spd, dir }) {
      [front, rear].forEach((w) => { w.rotation.x += (travel / (R * SCALE)) * dir; });
      front.rotation.y = turn * 0.3;
      lean.rotation.z += (turn * Math.min(0.4, spd * 0.06) - lean.rotation.z) * 0.15;   // lean into turns
    },
  };
}

/* ---------- airplane (flies low over the road) ---------- */
function plane() {
  const g = new THREE.Group(), air = new THREE.Group(); g.add(air);
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xe9ecf1, metalness: 0.55, roughness: 0.22, clearcoat: 1 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 3.2, 20), paint); body.rotation.x = Math.PI / 2; air.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), paint); nose.rotation.x = Math.PI / 2; nose.position.z = 1.6; air.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 16), paint); tail.rotation.x = -Math.PI / 2; tail.position.z = -1.9; air.add(tail);
  box(air, 4.4, 0.07, 0.75, paint, 0, -0.05, 0.25);                        // wings
  box(air, 4.42, 0.03, 0.08, glow(0x5b8cff), 0, -0.02, 0.62);              // wing light strip
  box(air, 1.6, 0.05, 0.45, paint, 0, 0.05, -1.75);                        // tailplane
  const fin = box(air, 0.06, 0.7, 0.55, paint, 0, 0.4, -1.75); fin.rotation.x = -0.25;
  box(air, 0.5, 0.2, 0.7, new THREE.MeshPhysicalMaterial({ color: 0x0a0c12, metalness: 0.9, roughness: 0.05, clearcoat: 1 }), 0, 0.3, 0.75); // canopy
  [-1, 1].forEach((s) => box(air, 0.12, 0.08, 0.12, basic(s < 0 ? 0xff3344 : 0x38d98a), s * 2.2, -0.05, 0.25)); // nav lights
  const prop = new THREE.Group(); prop.position.z = 1.95; air.add(prop);
  box(prop, 1.3, 0.12, 0.04, mat(0x0c0d10), 0, 0, 0);
  box(prop, 0.12, 1.3, 0.04, mat(0x0c0d10), 0, 0, 0);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), glow(0xffb547)); prop.add(hub);
  const shadow = groundShadow(g, 4.2, 3.4);
  g.scale.setScalar(SCALE);
  let spin = 0;
  return {
    group: g, markerY: 1.35,
    animate({ travel, turn, spd, now, reduce }) {
      spin += 0.25 + travel * 30;                                            // idles, spins faster with speed
      prop.rotation.z = spin;
      air.position.y = 2.2 + (reduce ? 0 : Math.sin(now / 700) * 0.08) + Math.min(0.6, spd * 0.06);
      air.rotation.z += (-turn * Math.min(0.5, spd * 0.06) - air.rotation.z) * 0.12;  // bank into turns
      air.rotation.x = -Math.min(0.08, spd * 0.008);
      shadow.scale.setScalar(1 - (air.position.y - 2.2) * 0.3);
    },
  };
}

/* ---------- person (walks; stands still when stopped) ---------- */
function person() {
  const g = new THREE.Group(), fig = new THREE.Group(); g.add(fig);
  const jacket = mat(0x5b8cff, { metalness: 0.2, emissive: 0x1a2b66, emissiveIntensity: 0.4 }), pants = mat(0x22283a, { metalness: 0.2 }), skin = mat(0xe7c7a8, { metalness: 0 });
  box(fig, 0.7, 0.85, 0.38, jacket, 0, 1.9, 0);                            // torso
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12), skin); head.position.y = 2.6; fig.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x1a1410, { metalness: 0 })); hair.position.y = 2.63; fig.add(hair);
  box(fig, 0.5, 0.08, 0.3, glow(0xffb547, 0.6), 0, 1.5, 0.05);            // belt light
  const limb = (x, y, h, m, w = 0.2) => { const pivot = new THREE.Group(); pivot.position.set(x, y, 0); box(pivot, w, h, w, m, 0, -h / 2, 0); fig.add(pivot); return pivot; };
  const legs = [limb(-0.18, 1.42, 1.3, pants, 0.24), limb(0.18, 1.42, 1.3, pants, 0.24)];
  const arms = [limb(-0.45, 2.25, 0.85, jacket, 0.17), limb(0.45, 2.25, 0.85, jacket, 0.17)];
  legs.forEach((l) => box(l, 0.26, 0.12, 0.4, mat(0x0c0d10), 0, -1.3, 0.08)); // shoes
  underGlow(g, 2.0, 2.0); groundShadow(g, 1.4, 1.4);
  g.scale.setScalar(SCALE * 1.05);
  let phase = 0, amt = 0;
  return {
    group: g, markerY: 1.25,
    animate({ travel, spd, dir, reduce }) {
      phase += (travel / (0.55 * SCALE)) * dir;
      amt += ((spd > 0.15 && !reduce ? Math.min(1, spd / 3) : 0) - amt) * 0.15;   // eases to a still pose
      const s = Math.sin(phase) * 0.7 * amt;
      legs[0].rotation.x = s; legs[1].rotation.x = -s;
      arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = s * 0.8;
      fig.position.y = Math.abs(Math.cos(phase)) * 0.06 * amt;
    },
  };
}
