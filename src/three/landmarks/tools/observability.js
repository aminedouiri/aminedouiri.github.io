import * as THREE from "three";
import { glowMat, addTag, framedBox, gear, line3 } from "../helpers.js";
import { canvasTexture, font } from "../../utils/textures.js";

/**
 * Observability stack.
 *   Services instrumented with the OpenTelemetry SDK emit metrics (blue), traces (green) and logs (amber) →
 *   the OpenTelemetry Collector receives, processes and exports them →
 *   Prometheus stores the metrics, Jaeger stores the traces, Loki stores the logs →
 *   Grafana shows all three on one dashboard. When latency spikes over the threshold the alert rings,
 *   the slow request shows up as a long red span in Jaeger and an ERROR line appears in the logs
 *   (metrics, traces and logs tell the same story). The Prometheus alert rule fires → Alertmanager →
 *   an alert event on a Kafka topic → consumers notify by email, chat and on-call.
 *   A PromQL card shows the query behind both the Grafana latency panel and the alert rule.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const SPIKE_EVERY = 9;                                   // seconds between latency spikes

export function observability(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D, VIOLET = 0xB58CFF;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const tube = (c, col, op = 0.25, r = 0.014) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })));
  const dot = (col, r = 0.055) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };

  // ---------- services with the OTel SDK (left) ----------
  const SX = -3.1, svcZ = [-0.8, 0, 0.8];
  const pad = framedBox(1.0, 0.06, 2.4, BLUE); pad.position.set(SX, 0.36, 0); g.add(pad);
  const svcs = svcZ.map((z) => {
    const s = framedBox(0.6, 0.5, 0.5, LIGHT, glowMat(BLUE, 0.3)); s.position.set(SX, 0.65, z); g.add(s);
    const sdk = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), glowMat(VIOLET, 0.8)); sdk.position.set(SX + 0.32, 0.85, z); g.add(sdk);
    return s;
  });

  // ---------- OpenTelemetry Collector: receive → process → export ----------
  const C = V(-1.05, 1.2, 0);
  const col = framedBox(1.6, 0.7, 0.9, VIOLET, new THREE.MeshStandardMaterial({ color: 0x17132a, emissive: VIOLET, emissiveIntensity: 0.15, transparent: true, opacity: 0.85 }));
  col.position.copy(C); g.add(col);
  const funnel = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 16, 1, true), glowMat(VIOLET, 0.6)); funnel.rotation.z = Math.PI / 2; funnel.position.set(C.x - 0.5, C.y, C.z + 0.47); g.add(funnel);
  const proc = gear(0.13, VIOLET, 8); proc.position.set(C.x, C.y, C.z + 0.47); g.add(proc);
  const fan = [-0.15, 0, 0.15].map((dy) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.04), glowMat(VIOLET, 0.7)); f.position.set(C.x + 0.5, C.y + dy, C.z + 0.47); f.rotation.z = dy * 2; g.add(f); return f; });
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, C.y - 0.75, 8), glowMat(VIOLET, 0.3)); stand.position.set(C.x, (C.y + 0.4) / 2 - 0.15, C.z); g.add(stand);

  // ---------- Prometheus (metrics) ----------
  const P = V(1.35, 0.4, -0.9);
  const prom = [0, 1, 2].map((k) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.16, 28), glowMat(k === 2 ? LIGHT : 0x3E63D9, 0.45)); d.position.set(P.x, P.y + 0.1 + k * 0.2, P.z); g.add(d); return d; });
  const promBars = [];
  for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1, 0.09), glowMat(LIGHT, 0.6)); b.geometry.translate(0, 0.5, 0); b.position.set(P.x - 0.36 + k * 0.12, P.y + 0.6, P.z); g.add(b); promBars.push(b); }

  // ---------- Jaeger (traces): a waterfall of spans ----------
  const J = V(1.35, 1.05, 0.85);
  const jScreen = framedBox(1.3, 0.85, 0.05, GREEN, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); jScreen.position.copy(J); g.add(jScreen);
  const jStand = new THREE.Mesh(new THREE.BoxGeometry(0.05, J.y - 0.45, 0.05), glowMat(GREEN, 0.3)); jStand.position.set(J.x, (J.y + 0.4) / 2 - 0.2, J.z - 0.05); g.add(jStand);
  const spanDefs = [[0, 1.0], [0.08, 0.45], [0.5, 0.42], [0.55, 0.2], [0.78, 0.18]];
  const spans = spanDefs.map(([s, w], k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.1), new THREE.MeshBasicMaterial({ color: k ? GREEN : PALE }));
    m.geometry.translate(0.5, 0, 0); m.position.set(J.x - 0.55 + s, J.y + 0.3 - k * 0.15, J.z + 0.03); g.add(m);
    return { m, w };
  });

  // ---------- Loki (logs): a log store with lines streaming in ----------
  const LK = V(2.85, 0.95, 0.0);
  const loki = framedBox(0.8, 1.1, 0.7, AMBER, new THREE.MeshStandardMaterial({ color: 0x1a2131, metalness: 0.6, roughness: 0.35 })); loki.position.copy(LK); g.add(loki);
  const lokiLines = [0, 1, 2, 3, 4, 5].map((k) => {
    const w = 0.35 + ((k * 3) % 4) * 0.08;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.05), new THREE.MeshBasicMaterial({ color: k % 2 ? AMBER : PALE, transparent: true }));
    m.geometry.translate(w / 2, 0, 0); g.add(m); return m;
  });

  // ---------- alerting: Prometheus rule → Alertmanager → Kafka → notifications ----------
  const ruleMat = new THREE.MeshBasicMaterial({ color: GREEN });
  const rule = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), ruleMat); rule.position.set(P.x + 0.55, P.y + 0.25, P.z + 0.3); g.add(rule);
  const AM = V(2.75, 0.75, -1.5);
  const am = framedBox(0.75, 0.6, 0.55, RED, new THREE.MeshStandardMaterial({ color: 0x1a1416, metalness: 0.6, roughness: 0.35 })); am.position.copy(AM); g.add(am);
  const amBellMat = glowMat(AMBER, 0.6);
  const amBell = new THREE.Group(); amBell.position.set(AM.x, AM.y + 0.5, AM.z); g.add(amBell);
  amBell.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.17, 0.2, 16, 1, true), amBellMat));
  const clap = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), amBellMat); clap.position.y = -0.12; amBell.add(clap);
  // Kafka topic "alerts": three partitions (append-only logs) with messages flowing along them
  const KX0 = 3.35, KX1 = 4.55, KZ = -0.95, KY = [0.55, 0.8, 1.05];
  const kafkaFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(KX1 - KX0 + 0.3, 0.85, 0.45)), new THREE.LineBasicMaterial({ color: LIGHT }));
  kafkaFrame.position.set((KX0 + KX1) / 2, 0.8, KZ); g.add(kafkaFrame);
  KY.forEach((y) => { const lane = new THREE.Mesh(new THREE.BoxGeometry(KX1 - KX0, 0.16, 0.25), new THREE.MeshStandardMaterial({ color: 0x141c33, emissive: BLUE, emissiveIntensity: 0.2 })); lane.position.set((KX0 + KX1) / 2, y, KZ); g.add(lane); });
  const kMsgs = [];
  KY.forEach((y, p) => { for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.22), glowMat(PALE, 0.4)); m.position.set(KX0 + 0.15 + k * 0.3, y, KZ); g.add(m); kMsgs.push({ m, p, k }); } });
  const alertMsg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.24), glowMat(RED, 0.9)); g.add(alertMsg);
  // consumers: email, chat, on-call
  const NX = 5.0;
  const notifyMats = [];
  const mail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.04), glowMat(LIGHT, 0.4)); mail.position.set(NX, 1.25, KZ); g.add(mail); notifyMats.push(mail.material);
  const chat = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), glowMat(GREEN, 0.4)); chat.scale.set(1.2, 0.9, 0.5); chat.position.set(NX, 0.8, KZ); g.add(chat); notifyMats.push(chat.material);
  const pager = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.08), glowMat(AMBER, 0.4)); pager.position.set(NX, 0.38, KZ); g.add(pager); notifyMats.push(pager.material);
  const consumerPaths = [1.25, 0.8, 0.38].map((y, k) => new THREE.CatmullRomCurve3([V(KX1 + 0.1, KY[1], KZ), V(KX1 + 0.3, (KY[1] + y) / 2, KZ + 0.05 * k), V(NX - 0.2, y, KZ)]));
  const fireP = new THREE.CatmullRomCurve3([rule.position.clone(), V(2.2, 1.3, -1.3), V(AM.x - 0.4, AM.y + 0.1, AM.z)]);
  const toKafka = new THREE.CatmullRomCurve3([V(AM.x + 0.38, AM.y, AM.z), V(3.1, 0.95, -1.2), V(KX0, KY[1], KZ)]);
  [fireP, toKafka, ...consumerPaths].forEach((c, k) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.013, 6, false), new THREE.MeshBasicMaterial({ color: k < 2 ? RED : PALE, transparent: true, opacity: 0.3 }))));
  const fireDot = dot(RED, 0.07), notifyDots = consumerPaths.map(() => dot(RED, 0.05));

  // ---------- PromQL: the query behind the latency panel and the alert rule ----------
  const promqlCard = (firing) => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 300;
    const x = c.getContext("2d");
    x.fillStyle = "rgba(11,15,26,0.94)"; x.fillRect(0, 0, 1024, 300);
    x.strokeStyle = firing ? "#FF6B5D" : "#5B8CFF"; x.lineWidth = 6; x.strokeRect(3, 3, 1018, 294);
    x.font = font(600, 30, true); x.fillStyle = "#FFB547"; x.fillText("PromQL", 28, 50);
    x.fillStyle = "#8B93A7"; x.fillText("# p95 latency, last 5 minutes", 170, 50);
    x.font = font(500, 34, true);
    const lines = [
      [["#8FB0FF", "histogram_quantile"], ["#F2F3F5", "(0.95,"]],
      [["#F2F3F5", "  "], ["#8FB0FF", "sum by"], ["#F2F3F5", " (le) ("], ["#8FB0FF", "rate"], ["#F2F3F5", "("]],
      [["#F2F3F5", "    "], ["#38D98A", "http_request_duration_seconds_bucket"], ["#FFB547", "[5m]"], ["#F2F3F5", ")))"]],
      [["#FF6B5D", "> 0.5"], ["#8B93A7", firing ? "   ● FIRING" : "   alert rule"]],
    ];
    lines.forEach((parts, i) => { let px = 28; parts.forEach(([col, txt]) => { x.fillStyle = col; x.fillText(txt, px, 108 + i * 52); px += x.measureText(txt).width; }); });
    return canvasTexture(c, 4);
  };
  const qTex = [promqlCard(false), promqlCard(true)];
  const qMat = new THREE.MeshBasicMaterial({ map: qTex[0], transparent: true, side: THREE.DoubleSide });
  const qCard = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 0.72), qMat);
  qCard.position.set(1.45, 2.3, -0.35); g.add(qCard);

  // ---------- Grafana dashboard (top) ----------
  const G = V(0.1, 3.55, -1.55), GW = 3.9, GH = 2.3;
  const dash = framedBox(GW, GH, 0.06, AMBER, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); dash.position.copy(G); g.add(dash);
  const dashBorder = dash.children[1].material;
  // panel 1: latency time series (from Prometheus)
  const N = 48, PW = 2.1, PH = 0.95, px0 = G.x - GW / 2 + 0.15, py0 = G.y + 0.3;
  const panel1 = framedBox(PW + 0.1, PH + 0.1, 0.02, BLUE, new THREE.MeshBasicMaterial({ color: 0x101626 })); panel1.position.set(px0 + PW / 2, py0, G.z + 0.04); g.add(panel1);
  const lineGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: N }, (_, i) => V(px0 + (i / (N - 1)) * PW, py0, G.z + 0.07)));
  const lineMat = new THREE.LineBasicMaterial({ color: LIGHT });
  g.add(new THREE.Line(lineGeo, lineMat));
  const THR = 0.62;                                                  // alert threshold (fraction of panel height)
  g.add(line3(V(px0, py0 - PH / 2 + THR * PH, G.z + 0.07), V(px0 + PW, py0 - PH / 2 + THR * PH, G.z + 0.07), RED, 0.6));
  // panel 2: request rate gauge
  const gx = G.x + GW / 2 - 0.75, gy = G.y + 0.35;
  [[Math.PI / 2, Math.PI / 2, GREEN], [0.15 * Math.PI, 0.35 * Math.PI, AMBER], [0, 0.15 * Math.PI, RED]].forEach(([rot, arc, c]) => { const s = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 8, 24, arc), glowMat(c, 0.5)); s.rotation.z = rot; s.position.set(gx, gy - 0.15, G.z + 0.06); g.add(s); });
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })); needle.geometry.translate(0.17, 0, 0); needle.position.set(gx, gy - 0.15, G.z + 0.09); g.add(needle);
  // panel 3: trace list (from Jaeger)
  const tl = [0, 1, 2].map((k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.08), new THREE.MeshBasicMaterial({ color: GREEN })); m.geometry.translate(0.5, 0, 0); m.position.set(gx - 0.55, gy - 0.6 - k * 0.14, G.z + 0.06); g.add(m); return m; });
  // panel 4: logs (from Loki), full width along the bottom
  const LPY = G.y - GH / 2 + 0.38;
  const logPanel = framedBox(GW - 0.25, 0.6, 0.02, AMBER, new THREE.MeshBasicMaterial({ color: 0x101626 })); logPanel.position.set(G.x, LPY, G.z + 0.04); g.add(logPanel);
  const logRows = [0, 1, 2, 3].map((k) => {
    const w = 1.6 + ((k * 7) % 5) * 0.35;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.06), new THREE.MeshBasicMaterial({ color: PALE, transparent: true }));
    m.geometry.translate(w / 2, 0, 0); g.add(m); return m;
  });
  // alert bell
  const bellMat = new THREE.MeshBasicMaterial({ color: GREEN });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), bellMat); bell.position.set(G.x + GW / 2 - 0.15, G.y + GH / 2 - 0.15, G.z + 0.06); g.add(bell);

  // ---------- signal flows ----------
  const inFlows = svcZ.map((z) => new THREE.CatmullRomCurve3([V(SX + 0.35, 0.8, z), V(-2.1, 1.1, z * 0.6), V(C.x - 0.75, C.y, C.z + 0.2)]));
  inFlows.forEach((c) => tube(c, VIOLET, 0.22));
  const toProm = new THREE.CatmullRomCurve3([V(C.x + 0.8, C.y, C.z - 0.2), V(0.4, 1.3, -0.6), V(P.x - 0.4, P.y + 0.6, P.z)]);
  const toJaeger = new THREE.CatmullRomCurve3([V(C.x + 0.8, C.y, C.z + 0.2), V(0.4, 1.2, 0.7), V(J.x - 0.65, J.y, J.z)]);
  const promToG = new THREE.CatmullRomCurve3([V(P.x, P.y + 1.6, P.z), V(P.x - 0.2, 2.2, -1.2), V(px0 + PW / 2, py0 - PH / 2 - 0.05, G.z + 0.05)]);
  const jToG = new THREE.CatmullRomCurve3([V(J.x, J.y + 0.45, J.z), V(1.9, 2.2, -0.4), V(gx, gy - 0.75, G.z + 0.05)]);
  const toLoki = new THREE.CatmullRomCurve3([V(C.x + 0.8, C.y - 0.1, C.z), V(1.0, 1.0, 0.05), V(LK.x - 0.42, LK.y, LK.z)]);
  const lToG = new THREE.CatmullRomCurve3([V(LK.x, LK.y + 0.55, LK.z), V(2.6, 2.3, -0.9), V(G.x + 1.2, LPY - 0.3, G.z + 0.05)]);
  tube(toProm, BLUE, 0.35); tube(toJaeger, GREEN, 0.35); tube(toLoki, AMBER, 0.35); tube(promToG, BLUE, 0.3); tube(jToG, GREEN, 0.3); tube(lToG, AMBER, 0.3);
  const inMetrics = svcZ.map(() => dot(BLUE)), inTraces = svcZ.map(() => dot(GREEN)), inLogs = svcZ.map(() => dot(AMBER));
  const outL = [dot(AMBER), dot(AMBER)], upL = dot(AMBER, 0.045);
  const queryDot = dot(0xFFFFFF, 0.045);                                       // Grafana asks Prometheus with PromQL
  const outM = [dot(BLUE), dot(BLUE)], outT = [dot(GREEN), dot(GREEN)], upM = dot(BLUE, 0.045), upT = dot(GREEN, 0.045);

  // ---------- labels ----------
  addTag(g, "Services (OTel SDK)", "#B58CFF", SX, 1.25, 0.9, 1.4);
  addTag(g, "OpenTelemetry Collector", "#B58CFF", C.x, C.y + 0.6, C.z + 0.3, 1.75);
  addTag(g, "receive · process · export", "#B58CFF", C.x, C.y - 0.5, C.z + 0.55, 1.6);
  addTag(g, "Prometheus", "#5B8CFF", P.x, P.y + 1.8, P.z, 1.0);
  addTag(g, "metrics", "#5B8CFF", 0.15, 1.55, -0.55, 0.55);
  addTag(g, "Jaeger", "#38D98A", J.x, J.y + 0.62, J.z, 0.65);
  addTag(g, "traces", "#38D98A", 0.2, 0.95, 0.85, 0.5);
  addTag(g, "Grafana", "#FFB547", G.x, G.y + GH / 2 + 0.25, G.z, 0.8);
  addTag(g, "Loki", "#FFB547", LK.x, LK.y + 0.8, LK.z, 0.5);
  addTag(g, "Alertmanager", "#FF6B5D", AM.x, AM.y + 0.85, AM.z, 1.05);
  addTag(g, "alert rule", "#FF6B5D", P.x + 0.55, P.y + 0.5, P.z + 0.35, 0.75);
  addTag(g, "Kafka · alerts topic", "#8FB0FF", (KX0 + KX1) / 2, 1.42, KZ, 1.4);
  addTag(g, "email", "#8FB0FF", NX + 0.45, 1.25, KZ, 0.45);
  addTag(g, "chat", "#38D98A", NX + 0.42, 0.8, KZ, 0.4);
  addTag(g, "on-call", "#FFB547", NX + 0.5, 0.38, KZ, 0.55);
  addTag(g, "logs", "#FFB547", 1.05, 1.25, 0.15, 0.45);
  addTag(g, "logs", "#FFB547", G.x - GW / 2 + 0.35, LPY + 0.4, G.z + 0.08, 0.45);
  addTag(g, "latency p95", "#8FB0FF", px0 + 0.45, py0 + PH / 2 + 0.12, G.z + 0.08, 0.85);
  addTag(g, "alert", "#FF6B5D", G.x + GW / 2 - 0.15, G.y + GH / 2 + 0.12, G.z + 0.08, 0.45);

  const pos = lineGeo.attributes.position;
  anims.push(function (t) {
    // latency series: calm noise with a spike every SPIKE_EVERY seconds
    const sp = (t % SPIKE_EVERY) / SPIKE_EVERY;
    const spike = (x) => Math.exp(-(((x - 0.75) / 0.06) ** 2));                       // spike near the right edge as it happens
    const live = Math.max(0, 1 - Math.abs(sp - 0.5) * 4);                              // 0 → 1 → 0 around mid-cycle
    let last = 0;
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      const v = 0.3 + 0.08 * Math.sin(t * 2 + i * 0.7) + 0.05 * Math.sin(t * 5.3 + i * 1.9) + 0.55 * live * spike(x);
      pos.setY(i, py0 - PH / 2 + Math.min(0.97, v) * PH); last = Math.max(last, v);
    }
    pos.needsUpdate = true;
    const alarm = last > THR;
    lineMat.color.set(alarm ? RED : LIGHT);
    bellMat.color.set(alarm ? RED : GREEN);
    bell.scale.setScalar(alarm ? 1 + 0.5 * Math.max(0, Math.sin(t * 14)) : 1);
    dashBorder.color.set(alarm ? RED : AMBER);
    needle.rotation.z = Math.PI * (0.75 - 0.35 * Math.sin(t * 0.7) - 0.3 * live);

    // Jaeger: spans draw in; during the spike one span is long and red
    const tr = (t * 0.35) % 1;
    spans.forEach((s, k) => {
      const slow = alarm && k === 3;
      s.m.scale.x = Math.max(0.001, (slow ? 0.5 : s.w) * Math.min(1, Math.max(0, tr * 1.8 - k * 0.12)));
      s.m.material.color.set(slow ? RED : k ? GREEN : PALE);
    });
    tl.forEach((m, k) => { m.scale.x = 0.4 + 0.6 * ((Math.sin(t * 0.9 + k * 2) + 1) / 2); m.material.color.set(alarm && k === 0 ? RED : GREEN); });

    // Prometheus: series bars and TSDB discs
    promBars.forEach((b, k) => { b.scale.y = 0.2 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.4 + k * 0.8)) + (alarm && k === 6 ? 0.5 : 0); b.material.color.set(alarm && k === 6 ? RED : LIGHT); b.material.emissive.copy(b.material.color); });
    prom.forEach((d, k) => { d.rotation.y = t * (0.4 + k * 0.2); });

    // alerting: rule fires → Alertmanager → Kafka → consumers notify
    const firing = sp > 0.4 && sp < 0.95;
    ruleMat.color.set(firing ? RED : GREEN);
    rule.scale.setScalar(firing ? 1 + 0.4 * Math.max(0, Math.sin(t * 12)) : 1);
    const f1 = (sp - 0.42) / 0.1, f2 = (sp - 0.52) / 0.08, f3 = (sp - 0.6) / 0.16, f4 = (sp - 0.76) / 0.08;
    fireDot.visible = f1 >= 0 && f1 <= 1; if (fireDot.visible) fireDot.position.copy(fireP.getPointAt(f1));
    const ringing = sp > 0.5 && sp < 0.95;
    amBell.rotation.z = ringing ? 0.35 * Math.sin(t * 18) : 0;
    amBellMat.color.set(ringing ? RED : AMBER); amBellMat.emissive.copy(amBellMat.color);
    alertMsg.visible = f2 >= 0 && f3 <= 1;
    if (f2 >= 0 && f2 < 1) alertMsg.position.copy(toKafka.getPointAt(f2));
    else if (f3 >= 0 && f3 <= 1) alertMsg.position.set(KX0 + f3 * (KX1 - KX0), KY[1], KZ);
    kMsgs.forEach(({ m, p, k }) => { m.position.x = KX0 + 0.15 + ((k * 0.3 + t * (0.18 + p * 0.05)) % (KX1 - KX0 - 0.3)); });
    notifyDots.forEach((d, k) => { d.visible = f4 >= 0 && f4 <= 1; if (d.visible) d.position.copy(consumerPaths[k].getPointAt(f4)); });
    notifyMats.forEach((m, k) => { const on = sp > 0.84 && sp < 0.97; m.emissiveIntensity = on ? 0.6 + 0.8 * Math.max(0, Math.sin(t * 14 + k)) : 0.4; });

    // collector + signal packets
    proc.rotation.z = t * 2;
    fan.forEach((f, k) => { f.material.emissiveIntensity = 0.4 + 0.6 * Math.max(0, Math.sin(t * 6 - k)); });
    funnel.rotation.x = t;
    svcs.forEach((s, k) => { s.children[0].material.emissiveIntensity = 0.25 + 0.3 * Math.max(0, Math.sin(t * 3 + k * 2)); });
    inMetrics.forEach((d, k) => d.position.copy(inFlows[k].getPointAt((t * 0.4 + k / 3) % 1)));
    inTraces.forEach((d, k) => d.position.copy(inFlows[k].getPointAt((t * 0.4 + k / 3 + 0.5) % 1)));
    inLogs.forEach((d, k) => d.position.copy(inFlows[k].getPointAt((t * 0.4 + k / 3 + 0.25) % 1)));
    outL.forEach((d, k) => d.position.copy(toLoki.getPointAt((t * 0.45 + k * 0.5 + 0.1) % 1)));
    upL.position.copy(lToG.getPointAt((t * 0.3 + 0.25) % 1));

    // logs: lines scroll up in Loki and in the Grafana logs panel; during the spike the newest one is an ERROR
    lokiLines.forEach((m, k) => {
      const u = (t * 0.3 + k / lokiLines.length) % 1;
      m.position.set(LK.x - 0.3, LK.y - 0.45 + u * 0.9, LK.z + 0.36);
      m.material.opacity = Math.min(1, Math.min(u, 1 - u) * 8);
      m.material.color.set(alarm && u < 0.35 && k % 3 === 0 ? RED : k % 2 ? AMBER : PALE);
    });
    logRows.forEach((m, k) => {
      const u = (t * 0.22 + k / logRows.length) % 1;
      m.position.set(G.x - GW / 2 + 0.3, LPY - 0.24 + u * 0.48, G.z + 0.07);
      m.material.opacity = Math.min(1, Math.min(u, 1 - u) * 8);
      m.material.color.set(alarm && u < 0.4 ? RED : k % 2 ? AMBER : PALE);
    });
    outM.forEach((d, k) => d.position.copy(toProm.getPointAt((t * 0.45 + k * 0.5) % 1)));
    outT.forEach((d, k) => d.position.copy(toJaeger.getPointAt((t * 0.45 + k * 0.5 + 0.25) % 1)));
    upM.position.copy(promToG.getPointAt((t * 0.3) % 1));
    queryDot.position.copy(promToG.getPointAt(1 - ((t * 0.3 + 0.5) % 1)));
    qMat.map = qTex[alarm || (sp > 0.4 && sp < 0.95) ? 1 : 0];
    qCard.position.y = 2.3 + 0.04 * Math.sin(t * 1.2);
    upT.position.copy(jToG.getPointAt((t * 0.3 + 0.5) % 1));
  });
}
