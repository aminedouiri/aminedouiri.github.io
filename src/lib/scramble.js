const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=";

/** "Decode" an element's text from random characters, left to right. */
export function scramble(el, duration = 800) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const final = el.textContent, len = final.length, t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    let out = "";
    for (let i = 0; i < len; i++) {
      const c = final[i];
      out += c === " " || i / len < p * 1.2 - 0.2 ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = p >= 1 ? final : out;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
