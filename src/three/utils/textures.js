import * as THREE from "three";

/** Fonts used when drawing text into canvases (they must match index.html). */
export const FONT_SANS = "'Plus Jakarta Sans', Arial, sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";
export const font = (weight, size, mono = false) => `${weight} ${size}px ${mono ? FONT_MONO : FONT_SANS}`;

/** Turn a canvas into a texture with the right colour space. */
export function canvasTexture(canvas, anisotropy = 1) {
  const t = new THREE.CanvasTexture(canvas);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = anisotropy;
  return t;
}

/** Soft round glow (used for light pools on the ground and soft shadows). */
export function glowTexture(color) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** Diagonal two-colour stripes (barriers, barrels). */
export function stripeTexture(a, b) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 32;
  const x = c.getContext("2d");
  x.fillStyle = a; x.fillRect(0, 0, 128, 32); x.fillStyle = b;
  for (let i = -32; i < 160; i += 32) {
    x.beginPath(); x.moveTo(i, 32); x.lineTo(i + 16, 32); x.lineTo(i + 32, 0); x.lineTo(i + 16, 0); x.closePath(); x.fill();
  }
  return canvasTexture(c);
}

/** Centered bold text on a solid background (e.g. the BUG cube, FIREWALL sign). */
export function labelTexture(text, bg, fg, w = 256, h = 256) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
  x.font = font(800, Math.round(h * 0.36), true);
  x.fillText(text, w / 2, h / 2 + 4);
  return canvasTexture(c);
}
