/* Shared building blocks for the landmark shapes. */
import * as THREE from "three";
import { canvasTexture, font, glowTexture } from "../utils/textures.js";

/** Glowing material in one colour. */
export const glowMat = (c, e = 0.6) =>
  new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: e, metalness: 0.3, roughness: 0.35 });

/** Dark brushed-metal material. */
export const darkMat = () => new THREE.MeshStandardMaterial({ color: 0x1a2131, metalness: 0.75, roughness: 0.3 });

/** Straight line between two points. */
export function line3(a, b, col, op = 0.8) {
  const g = new THREE.BufferGeometry().setFromPoints([a, b]);
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op }));
}

/** A small server rack with LED strips. */
export function rack(h, col) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, h, 0.6), darkMat()));
  for (let y = 0; y < Math.floor(h / 0.22); y++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.01), new THREE.MeshBasicMaterial({ color: y % 3 ? col : 0xffb547 }));
    s.position.set(0, -h / 2 + 0.15 + y * 0.22, 0.305);
    g.add(s);
  }
  return g;
}

/** Small text label with a coloured underline (always faces the camera). */
export function tagSprite(text, color, w = 1.7) {
  const c = document.createElement("canvas");
  c.width = 420; c.height = 96;
  const x = c.getContext("2d");
  x.textAlign = "center"; x.textBaseline = "middle";
  let fs = 42;
  x.font = font(600, fs, true);
  while (x.measureText(text).width > 380 && fs > 20) { fs -= 2; x.font = font(600, fs, true); }
  x.shadowColor = "rgba(0,0,0,.85)"; x.shadowBlur = 10;
  x.fillStyle = "#F2F3F5"; x.fillText(text, 210, 42);
  x.shadowBlur = 0;
  const tw = Math.min(380, x.measureText(text).width);
  x.fillStyle = color; x.fillRect(210 - tw / 2, 74, tw, 5);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTexture(c), transparent: true, depthWrite: false, toneMapped: false }));
  sp.scale.set(w, (w * 96) / 420, 1);
  return sp;
}

/** Big landmark title + amber subtitle. */
export function titleSprite(title, sub) {
  const c = document.createElement("canvas");
  c.width = 900; c.height = 200;
  const x = c.getContext("2d");
  x.textAlign = "center";
  x.shadowColor = "rgba(0,0,0,.9)"; x.shadowBlur = 16;
  x.fillStyle = "#F2F3F5";
  let fs = 80;
  x.font = font(800, fs);
  while (x.measureText(title).width > 860 && fs > 40) { fs -= 4; x.font = font(800, fs); }
  x.fillText(title, 450, 104);
  x.shadowBlur = 8; x.fillStyle = "#FFB547"; x.font = font(500, 34, true);
  x.fillText(sub.toUpperCase(), 450, 160);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTexture(c, 4), transparent: true, depthWrite: false, toneMapped: false }));
  sp.scale.set(6.3, 1.4, 1);
  return sp;
}

/** Original monogram badge (not an official logo). Amber edge = framework, blue = tool. */
export function badgeSprite(tech) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const fw = tech.cat === "framework";
  const g = x.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, fw ? "#2a2110" : "#141c33"); g.addColorStop(1, "#0b0d14");
  x.fillStyle = g;
  x.beginPath();
  if (x.roundRect) x.roundRect(14, 14, 228, 228, 56); else x.rect(14, 14, 228, 228);
  x.fill();
  x.lineWidth = 10; x.strokeStyle = fw ? "#FFB547" : "#5B8CFF"; x.stroke();
  x.fillStyle = "#F2F3F5"; x.textAlign = "center"; x.textBaseline = "middle";
  const t = tech.mono || "?";
  const fs = t === "∞" ? 150 : t.length > 2 ? 86 : 110;
  x.font = font(800, fs);
  x.fillText(t, 128, 136);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTexture(c), transparent: true, depthWrite: false, toneMapped: false }));
  sp.scale.set(1.5, 1.5, 1);
  return sp;
}

/** Hexagonal base with a glowing ring and a soft light pool. */
export function pedestal(g) {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 3.0, 0.3, 6),
    new THREE.MeshStandardMaterial({ color: 0x141924, metalness: 0.7, roughness: 0.35, emissive: 0x5b8cff, emissiveIntensity: 0.12 })
  );
  base.position.y = 0.15; g.add(base);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.65, 2.85, 6), new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.31; g.add(ring);
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(143,176,255,0.4)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.04; g.add(pool);
}

/** Dark box with glowing edges (the look used by the tool landmarks). */
export function framedBox(w, h, d, edge = 0x5b8cff, mat = darkMat()) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
  g.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.02, h + 0.02, d + 0.02)),
    new THREE.LineBasicMaterial({ color: edge })
  ));
  return g;
}

/** Small gear: a ring with teeth. Spin it with gear.rotation.z. */
export function gear(r, col, teeth = 8) {
  const g = new THREE.Group(), m = glowMat(col, 0.55);
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.28, 8, 24), m));
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.BoxGeometry(r * 0.38, r * 0.38, r * 0.4), m);
    t.position.set(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3, 0); t.rotation.z = a;
    g.add(t);
  }
  return g;
}

/** Thin bar from a to b (for check marks, brackets, struts). */
export function bar(a, b, thick, mat) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.BoxGeometry(d.length(), thick, thick), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.rotation.z = Math.atan2(d.y, d.x);
  return m;
}

/**
 * Add a small part label (always faces the camera).
 * @param {THREE.Object3D} parent  where to attach it
 * @param {string} text            label text (shown in capitals)
 * @param {string} css             underline colour, e.g. "#5B8CFF"
 * @param {number} x @param {number} y @param {number} [z]  position in the parent's space
 * @param {number} [w]             width of the label
 */
export function addTag(parent, text, css, x, y, z = 0.2, w = 0.9) {
  const s = tagSprite(text.toUpperCase(), css, w);
  s.position.set(x, y, z);
  parent.add(s);
  return s;
}
