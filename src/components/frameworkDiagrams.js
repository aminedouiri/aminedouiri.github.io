/*
 * SVG diagrams for the Frameworks page (returned as markup strings built only from our own data).
 * Each function draws one framework.
 */

export function loopSvg() {
  const A = 250, cx = 360, cy = 150, pts = [];
  for (let i = 0; i <= 240; i++) { const t = i / 240 * Math.PI * 2, d = 1 + Math.sin(t) * Math.sin(t); pts.push([cx + A * Math.cos(t) / d, cy + A * Math.sin(t) * Math.cos(t) / d]); }
  const dpath = "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + " Z";
  const phases = [["PLAN", 0.31], ["CODE", 0.42], ["BUILD", 0.58], ["TEST", 0.69], ["RELEASE", 0.81], ["DEPLOY", 0.92], ["OPERATE", 0.08], ["MONITOR", 0.19]];
  let nodes = "";
  phases.forEach(function (ph, k) {
    const p = pts[Math.round(ph[1] * 240) % 240], dev = k < 4, lx = dev ? cx - A * 0.62 : cx + A * 0.62;
    let ox = p[0] - lx, oy = p[1] - cy; const l = Math.hypot(ox, oy) || 1; ox /= l; oy /= l;
    let tx = p[0] + ox * 38, ty = p[1] + oy * 30 + 5, anchor = "middle";
    if (Math.abs(p[0] - cx) < A * 0.45) {   // next to the crossing: put the name beside the node, away from the centre
      anchor = p[0] < cx ? "end" : "start"; tx = p[0] + (p[0] < cx ? -16 : 16); ty = p[1] + (p[1] < cy ? -10 : 22);
    }
    nodes += '<g class="fw-node"><circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="9" fill="#F2F3F5" stroke="' + (dev ? "#5B8CFF" : "#FFB547") + '" stroke-width="4"/>' +
      '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="' + anchor + '">' + ph[0] + "</text></g>";
  });
  return '<svg viewBox="0 0 720 300" class="fw-svg" role="img" aria-label="DevOps infinity loop: plan, code, build, test on the Dev side; release, deploy, operate, monitor on the Ops side">' +
    '<defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0.3" stop-color="#5B8CFF"/><stop offset="0.7" stop-color="#FFB547"/></linearGradient></defs>' +
    '<path id="fwLoopPath" d="' + dpath + '" fill="none" stroke="url(#lg)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<text x="' + (cx - A * 0.62) + '" y="' + (cy + 8) + '" text-anchor="middle" class="fw-big b">DEV</text><text x="' + (cx + A * 0.62) + '" y="' + (cy + 8) + '" text-anchor="middle" class="fw-big a">OPS</text>' +
    nodes + '<circle id="fwPulse" r="8" fill="#fff" cx="' + pts[0][0].toFixed(1) + '" cy="' + pts[0][1].toFixed(1) + '"/></svg>';
}

export function calmsSvg() {
  const n = [["C", "Culture"], ["A", "Automation"], ["L", "Lean"], ["M", "Measurement"], ["S", "Sharing"]], H = [120, 150, 130, 160, 140];
  let g = "";
  n.forEach(function (it, k) {
    const x = 22 + k * 64, h = H[k], col = k % 2 ? "#5B8CFF" : "#FFB547";
    g += '<rect class="fw-bar" x="' + x + '" y="' + (190 - h) + '" width="44" height="' + h + '" rx="8" fill="' + col + '" fill-opacity=".18" stroke="' + col + '" stroke-width="2"/>' +
      '<text x="' + (x + 22) + '" y="' + (190 - h + 34) + '" text-anchor="middle" class="fw-big ' + (k % 2 ? "b" : "a") + '">' + it[0] + '</text>' +
      '<text x="' + (x + 22) + '" y="' + (k % 2 ? 226 : 208) + '" text-anchor="middle" class="fw-s">' + it[1] + "</text>";
  });
  return '<svg viewBox="0 0 340 236" class="fw-svg" role="img" aria-label="CALMS: culture, automation, lean, measurement, sharing">' + g + "</svg>";
}

export function doraSvg() {
  const n = [["Deploy frequency", 0.78], ["Lead time", 0.66], ["Change failure", 0.82], ["Time to restore", 0.7]];
  let g = "";
  n.forEach(function (it, k) {
    const cx = 85 + (k % 2) * 170, cy = 78 + Math.floor(k / 2) * 108, r = 48;
    g += '<path d="M' + (cx - r) + " " + cy + " A" + r + " " + r + " 0 0 1 " + (cx + r) + " " + cy + '" fill="none" stroke="#2A3040" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M' + (cx + r * Math.cos(Math.PI * 0.35)) + " " + (cy - r * Math.sin(Math.PI * 0.35)) + " A" + r + " " + r + " 0 0 1 " + (cx + r) + " " + cy + '" fill="none" stroke="#38D98A" stroke-width="10" stroke-linecap="round"/>' +
      '<line class="fw-needle" data-v="' + it[1] + '" x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - r + 10) + '" stroke="#FFB547" stroke-width="4" stroke-linecap="round" style="transform-origin:' + cx + "px " + cy + 'px;transform:rotate(' + (-90 + 180 * it[1]) + 'deg)"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#F2F3F5"/>' +
      '<text x="' + cx + '" y="' + (cy + 24) + '" text-anchor="middle" class="fw-s">' + it[0] + "</text>";
  });
  return '<svg viewBox="0 0 340 222" class="fw-svg" role="img" aria-label="DORA metrics: deploy frequency, lead time, change failure rate, time to restore">' + g + "</svg>";
}

export function sreSvg() {
  const n = ["Product", "Capacity planning", "Testing & release", "Postmortems", "Incident response", "Monitoring"];
  let g = "";
  n.forEach(function (it, k) {
    const top = 14 + k * 33, wT = 70 + k * 46, wB = 70 + (k + 1) * 46, cx = 170;
    const t = k / 5, col = "rgb(" + Math.round(255 - t * (255 - 91)) + "," + Math.round(181 - t * (181 - 140)) + "," + Math.round(71 + t * (255 - 71)) + ")";
    g += '<polygon class="fw-layer" points="' + (cx - wT / 2) + "," + top + " " + (cx + wT / 2) + "," + top + " " + (cx + wB / 2) + "," + (top + 30) + " " + (cx - wB / 2) + "," + (top + 30) + '" fill="' + col + '" fill-opacity=".2" stroke="' + col + '" stroke-width="2"/>' +
      '<text x="' + cx + '" y="' + (top + 20) + '" text-anchor="middle" class="fw-s w">' + it + "</text>";
  });
  return '<svg viewBox="0 0 340 222" class="fw-svg" role="img" aria-label="SRE reliability pyramid from monitoring at the base to product at the top">' + g + "</svg>";
}

export function waysSvg() {
  return '<svg viewBox="0 0 340 222" class="fw-svg" role="img" aria-label="The Three Ways: flow, feedback, continual learning">' +
    '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5B8CFF"/></marker><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#FFB547"/></marker><marker id="ah3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#BFD0FF"/></marker></defs>' +
    '<text x="40" y="150" class="fw-s">DEV</text><text x="300" y="150" text-anchor="end" class="fw-s">OPS</text>' +
    '<path class="fw-draw" d="M40 125 L300 125" stroke="#5B8CFF" stroke-width="5" fill="none" marker-end="url(#ah)"/>' +
    '<text x="170" y="112" text-anchor="middle" class="fw-m b">1 · FLOW</text>' +
    '<path class="fw-draw" d="M300 108 C 280 30, 60 30, 40 108" stroke="#FFB547" stroke-width="5" fill="none" marker-end="url(#ah2)"/>' +
    '<text x="170" y="34" text-anchor="middle" class="fw-m a">2 · FEEDBACK</text>' +
    '<path class="fw-draw" d="M188 196 A18 18 0 1 1 170 178" stroke="#BFD0FF" stroke-width="4" fill="none" marker-end="url(#ah3)"/>' +
    '<text x="170" y="164" text-anchor="middle" class="fw-m">3 · LEARNING</text></svg>';
}

export function mlopsSvg() {
  const steps = [["DATA", "b"], ["TRAIN", "b"], ["EVALUATE", "g"], ["REGISTRY", "a"], ["SERVE", "a"], ["MONITOR", "a"]];
  const cx = 170, cy = 104, R = 74;
  let g = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#2A3040" stroke-width="6"/>' +
    '<circle class="fw-draw" cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#5B8CFF" stroke-width="6" stroke-dasharray="6 10" stroke-linecap="round"/>' +
    '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" class="fw-big b" style="font-size:22px">ML</text>' +
    '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" class="fw-s">retrain on drift</text>';
  steps.forEach(function (st, k) {
    const a = -Math.PI / 2 + (k / steps.length) * Math.PI * 2, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    const col = st[1] === "b" ? "#5B8CFF" : st[1] === "g" ? "#38D98A" : "#FFB547";
    const tx = cx + Math.cos(a) * (R + 26), ty = cy + Math.sin(a) * (R + 20) + 4;
    const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
    g += '<g class="fw-node"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" fill="#F2F3F5" stroke="' + col + '" stroke-width="4"/>' +
      '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="' + anchor + '" class="fw-s w">' + st[0] + "</text></g>";
  });
  return '<svg viewBox="0 0 340 214" class="fw-svg" role="img" aria-label="MLOps lifecycle: data, train, evaluate, registry, serve, monitor, then retrain">' + g + "</svg>";
}

export function devsecopsSvg() {
  const stages = ["PLAN", "CODE", "BUILD", "TEST", "RELEASE", "DEPLOY", "OPERATE"];
  const checks = ["Threat model", "SAST · secrets", "Deps / SCA", "DAST", "Signed artefact", "Policy gate", "Runtime watch"];
  const x0 = 50, x1 = 670, y = 118;
  let g = '<path class="fw-draw" d="M' + x0 + " " + y + " L" + x1 + " " + y + '" stroke="#5B8CFF" stroke-width="6" stroke-linecap="round" fill="none"/>' +
    '<path d="M' + x1 + " " + (y + 40) + " C " + (x1 - 40) + " 230, " + (x0 + 40) + " 230, " + x0 + " " + (y + 40) + '" stroke="#FFB547" stroke-width="3" stroke-dasharray="6 8" fill="none"/>' +
    '<text x="360" y="232" text-anchor="middle" class="fw-s">findings feed back to the team · shift left</text>';
  stages.forEach(function (st, k) {
    const x = x0 + (k / (stages.length - 1)) * (x1 - x0);
    g += '<g class="fw-node"><circle cx="' + x + '" cy="' + y + '" r="10" fill="#F2F3F5" stroke="#5B8CFF" stroke-width="4"/>' +
      '<text x="' + x + '" y="' + (y - 22) + '" text-anchor="middle">' + st + "</text>" +
      '<path d="M' + (x - 11) + " " + (y + 26) + " L" + x + " " + (y + 21) + " L" + (x + 11) + " " + (y + 26) + " L" + (x + 11) + " " + (y + 36) + " Q" + x + " " + (y + 46) + " " + (x - 11) + " " + (y + 36) + ' Z" fill="rgba(56,217,138,.18)" stroke="#38D98A" stroke-width="2"/>' +
      '<text x="' + x + '" y="' + (y + 64) + '" text-anchor="middle" class="fw-s" style="fill:#7FE3B0">' + checks[k] + "</text></g>";
  });
  return '<svg viewBox="0 0 720 244" class="fw-svg" role="img" aria-label="DevSecOps: a security check at every pipeline stage, from threat modelling to runtime monitoring">' + g + "</svg>";
}
