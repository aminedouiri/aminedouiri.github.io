/* Small 2D-canvas drawing helpers used to paint text onto 3D surfaces. */
import { font } from "./textures.js";

/** Rounded-rectangle path. */
export function roundRect(x, cx, cy, w, h, r) {
  x.beginPath();
  x.moveTo(cx + r, cy);
  x.arcTo(cx + w, cy, cx + w, cy + h, r);
  x.arcTo(cx + w, cy + h, cx, cy + h, r);
  x.arcTo(cx, cy + h, cx, cy, r);
  x.arcTo(cx, cy, cx + w, cy, r);
  x.closePath();
}

/** Draw word-wrapped text; returns the y below the last line. Adds "…" when cut. */
export function wrapText(x, text, px, py, maxW, lineH, maxLines = 99) {
  const words = String(text).split(" ");
  let line = "", n = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    if (x.measureText(test).width > maxW && line) {
      n++;
      if (n === maxLines) { x.fillText(line.replace(/\s*\S*$/, "") + "…", px, py); return py + lineH; }
      x.fillText(line, px, py); py += lineH; line = words[i];
    } else line = test;
  }
  if (line) { x.fillText(line, px, py); py += lineH; }
  return py;
}

/** Pill-shaped label; returns the x where it ends. */
export function chip(x, text, px, py, bg, fg, size = 36) {
  x.font = font(500, size, true);
  const w = x.measureText(text).width + 34;
  x.fillStyle = bg; roundRect(x, px, py, w, size + 20, 9); x.fill();
  x.fillStyle = fg; x.fillText(text, px + 17, py + size + 4);
  return px + w;
}

/**
 * Big title lines that shrink to fit. Each line is { text, accent } – accent lines are blue.
 * Returns the y below the last line.
 */
export function fitTitle(x, lines, px, py, maxW, size) {
  let sz = size;
  x.font = font(800, sz);
  while (sz > 44 && lines.some((l) => x.measureText(l.text).width > maxW)) { sz -= 4; x.font = font(800, sz); }
  lines.forEach((l) => {
    x.fillStyle = l.accent ? "#5B8CFF" : "#F2F3F5";
    x.fillText(l.text, px, py);
    py += sz * 1.04;
  });
  return py;
}

/** Subtle card background. */
export function card(x, bx, by, bw, bh) {
  x.fillStyle = "rgba(255,255,255,.05)"; roundRect(x, bx, by, bw, bh, 18); x.fill();
  x.strokeStyle = "rgba(242,243,245,.16)"; x.lineWidth = 2; x.stroke();
}
