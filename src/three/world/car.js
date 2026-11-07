/* The car (original design) and the amber marker that keeps it easy to spot. */
import * as THREE from "three";
import { canvasTexture, glowTexture } from "../utils/textures.js";

export const CAR_SCALE = 0.28;
export const WHEEL_RADIUS = 0.38;

/** @returns {{ group: THREE.Group, body: THREE.Mesh, wheels: THREE.Group[] }} front wheels are wheels[0..1] */
export function buildCar() {
  const g = new THREE.Group();
  const wheels = [];

  // body: extruded side profile
  const sh = new THREE.Shape();
  sh.moveTo(-1.85, 0.32); sh.lineTo(1.78, 0.32);
  sh.quadraticCurveTo(1.95, 0.34, 1.92, 0.56);
  sh.quadraticCurveTo(1.88, 0.74, 1.6, 0.78);
  sh.lineTo(0.62, 0.86);
  sh.quadraticCurveTo(0.3, 1.18, -0.05, 1.24);
  sh.lineTo(-0.95, 1.25);
  sh.quadraticCurveTo(-1.35, 1.2, -1.62, 0.96);
  sh.lineTo(-1.86, 0.9);
  sh.quadraticCurveTo(-1.95, 0.6, -1.85, 0.32);
  const bodyGeo = new THREE.ExtrudeGeometry(sh, { depth: 1.56, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.07, bevelSegments: 4, curveSegments: 16 });
  bodyGeo.translate(0, 0, -0.78); bodyGeo.rotateY(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshPhysicalMaterial({ color: 0xe9ecf1, metalness: 0.55, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }));
  g.add(body);

  // glasshouse
  const gl = new THREE.Shape();
  gl.moveTo(0.55, 0.87); gl.quadraticCurveTo(0.26, 1.13, -0.04, 1.18); gl.lineTo(-0.92, 1.19); gl.quadraticCurveTo(-1.28, 1.14, -1.5, 0.95); gl.lineTo(0.55, 0.87);
  const glGeo = new THREE.ExtrudeGeometry(gl, { depth: 1.6, bevelEnabled: false, curveSegments: 12 });
  glGeo.translate(0, 0.005, -0.8); glGeo.rotateY(-Math.PI / 2);
  g.add(new THREE.Mesh(glGeo, new THREE.MeshPhysicalMaterial({ color: 0x0a0c12, metalness: 0.9, roughness: 0.05, clearcoat: 1 })));

  // light bars and accent strip
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(1.5, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xf2f6ff }), 0, 0.7, 1.98);
  add(new THREE.BoxGeometry(1.6, 0.06, 0.05), new THREE.MeshBasicMaterial({ color: 0xff3344 }), 0, 0.84, -1.99);
  add(new THREE.BoxGeometry(1.74, 0.04, 2.6), new THREE.MeshStandardMaterial({ color: 0x5b8cff, emissive: 0x5b8cff, emissiveIntensity: 0.6 }), 0, 0.42, 0);

  // wheels
  const tyreGeo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 32); tyreGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 24); rimGeo.rotateZ(Math.PI / 2);
  const spokeGeo = new THREE.BoxGeometry(0.33, 0.04, 0.42);
  const tyre = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.85 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xb9bec8, metalness: 0.9, roughness: 0.25 });
  [[-0.86, 1.18], [0.86, 1.18], [-0.86, -1.2], [0.86, -1.2]].forEach(([x, z]) => {
    const w = new THREE.Group();
    w.position.set(x, WHEEL_RADIUS, z);
    w.add(new THREE.Mesh(tyreGeo, tyre));
    w.add(new THREE.Mesh(rimGeo, rim));
    for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(spokeGeo, tyre); s.rotation.x = (k * Math.PI) / 3; w.add(s); }
    w.rotation.order = "YXZ";
    g.add(w); wheels.push(w);
  });

  // headlights, under-glow, soft shadow
  const beamGeo = new THREE.ConeGeometry(1.7, 8, 32, 1, true); beamGeo.rotateX(-Math.PI / 2); beamGeo.translate(0, 0, 4);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xdce6ff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  [-0.55, 0.55].forEach((x) => add(beamGeo, beamMat, x, 0.7, 2.0));
  const spot = new THREE.SpotLight(0xe6eeff, 3, 26, 0.5, 0.55, 1.4); spot.position.set(0, 0.8, 1.9);
  const tgt = new THREE.Object3D(); tgt.position.set(0, 0, 10); g.add(tgt); spot.target = tgt; g.add(spot);
  const under = new THREE.PointLight(0x5b8cff, 1.4, 6); under.position.set(0, 0.3, 0); g.add(under);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 6.4), new THREE.MeshBasicMaterial({ map: glowTexture("rgba(91,140,255,0.55)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.03; g.add(glow);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.4), new THREE.MeshBasicMaterial({ map: glowTexture("rgba(0,0,0,0.9)"), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.035; g.add(shadow);

  g.scale.setScalar(CAR_SCALE);
  return { group: g, body, wheels };
}

/** Amber arrow above the vehicle (drawn on top of everything) + ground ring; both hold still when stopped. */
export function buildMarker(scene) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  x.fillStyle = "#FFB547"; x.strokeStyle = "#07080B"; x.lineWidth = 8; x.lineJoin = "round";
  x.beginPath(); x.moveTo(24, 34); x.lineTo(104, 34); x.lineTo(64, 100); x.closePath(); x.stroke(); x.fill();
  const arrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTexture(c), depthTest: false, depthWrite: false, transparent: true, toneMapped: false }));
  arrow.scale.set(0.55, 0.55, 1); arrow.renderOrder = 999; scene.add(arrow);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.74, 40), new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; scene.add(ring);

  let calm = 0;                                     // 0 = moving (animated), 1 = stopped (still)
  return {
    /** moving: false when stopped, so the marker holds still; y: arrow height for this vehicle */
    update(pos, now, reduce, moving = true, y = 1.05) {
      calm += ((moving && !reduce ? 0 : 1) - calm) * 0.08;
      arrow.position.set(pos.x, y + Math.sin(now / 260) * 0.08 * (1 - calm), pos.z);
      ring.position.set(pos.x, 0.06, pos.z);
      const ph = (now % 1400) / 1400;
      const s = 1 + ph * 0.6 * (1 - calm);
      ring.scale.set(s, s, s);
      ring.material.opacity = 0.75 * (1 - ph) * (1 - calm) + 0.55 * calm;
    },
  };
}
