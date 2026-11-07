import * as THREE from "three";
import { glowMat, rack, framedBox, addTag, line3, gear } from "../helpers.js";

/**
 * MLOps: the machine-learning lifecycle, told as one repeating story (CYCLE seconds):
 *   data is validated (scanner ring) → features are built (feature store grid) → the network trains
 *   while the accuracy meter climbs (evaluate) → a new version lands in the model registry → it is served
 *   → the drift monitor sees live data move away from the training data → alert → the retrain signal
 *   travels the arc back to the data store and the loop starts again.
 *   Left: Kafka streams events into the (DVC-versioned) data store; MLflow tracks the training runs.
 *   Right, LLMOps: a GPU node runs vLLM (high-throughput serving) and Ollama (local models); the registry deploys
 *   weights to vLLM after LLM evals pass; an MCP server gives the model tools (DB, API, files) and a vector DB
 *   for RAG — a prompt goes in, the model calls a tool through MCP, retrieves context, and answers.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const CYCLE = 12;                                 // seconds for one full train → serve → drift → retrain loop
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

export function mlops(g, anims) {
  const plinth = framedBox(6.0, 0.22, 1.6, 0x5B8CFF); plinth.position.y = 0.42; g.add(plinth);

  // data store: stacked discs
  const discs = [0, 1, 2].map((k) => {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.26, 28), glowMat(k === 2 ? 0x8FB0FF : 0x3E63D9, 0.45));
    d.position.set(-2.3, 0.72 + k * 0.32, 0.1); g.add(d); return d;
  });

  // neural network: 3 → 4 → 2 nodes, connected
  const layers = [[-0.9, 3], [0, 4], [0.9, 2]], nodes = [], links = [];
  layers.forEach(([x, n], li) => {
    const col = [];
    for (let i = 0; i < n; i++) {
      const y = 2.75 + (i - (n - 1) / 2) * 0.48;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), glowMat(li === 2 ? 0xFFB547 : 0xBFD0FF, 0.6));
      m.position.set(x, y, 0.3); g.add(m); col.push(m); nodes.push(m);
    }
    layers[li].push(col);
  });
  for (let li = 0; li < 2; li++) {
    layers[li][2].forEach((a) => layers[li + 1][2].forEach((b) => {
      const geo = new THREE.BufferGeometry().setFromPoints([a.position, b.position]);
      const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x5B8CFF, transparent: true, opacity: 0.35 }));
      g.add(ln); links.push({ ln, d: li + Math.random() });
    }));
  }
  const nnFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, 2.2, 0.05)), new THREE.LineBasicMaterial({ color: 0x5B8CFF, transparent: true, opacity: 0.4 }));
  nnFrame.position.set(0, 2.75, 0.25); g.add(nnFrame);

  // evaluate: accuracy meter beside the network
  const tube = framedBox(0.28, 1.8, 0.28, 0x38D98A); tube.position.set(1.55, 2.75, 0.3); g.add(tube);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.7, 0.2), glowMat(0x38D98A, 0.7)); fill.geometry.translate(0, 0.85, 0); fill.position.set(1.55, 1.9, 0.31); g.add(fill);

  // model registry: versioned plates
  const plates = [0, 1, 2].map((k) => {
    const p = framedBox(0.9, 0.16, 0.7, k === 2 ? 0xFFB547 : 0x5B8CFF, glowMat(k === 2 ? 0xFFB547 : 0x2A3A66, 0.35));
    p.position.set(1.0, 0.68 + k * 0.22, 0.2); g.add(p); return p;
  });

  // serving endpoint: rack with a live status light
  const srv = rack(1.2, 0x8FB0FF); srv.position.set(2.35, 1.13, 0); g.add(srv);
  const live = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0x38D98A })); live.position.set(2.35, 1.9, 0.1); g.add(live);

  // retrain arc: from serving back to the data store
  const arcPts = [];
  for (let i = 0; i <= 60; i++) { const a = (i / 60) * Math.PI; arcPts.push(new THREE.Vector3(Math.cos(a) * 2.35, 1.3 + Math.sin(a) * 3.3, -0.7)); }
  const arcCurve = new THREE.CatmullRomCurve3(arcPts);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(arcCurve, 80, 0.05, 8, false), glowMat(0xFFB547, 0.5)));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 12), glowMat(0xFFB547, 0.6)); head.position.set(-2.35, 1.35, -0.7); head.rotation.z = Math.PI; g.add(head);
  const sig = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFE2A8 })); g.add(sig);

  // validate: a scanner ring checks each dataset before training
  const scan = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 40), new THREE.MeshBasicMaterial({ color: 0x38D98A, transparent: true, opacity: 0.9 }));
  scan.rotation.x = Math.PI / 2; scan.position.set(-2.3, 0.7, 0.1); g.add(scan);

  // feature store: a grid of feature cells, reused by training and serving
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), glowMat(0x5B8CFF, 0.4));
    m.position.set(-1.5 + c * 0.22, 0.74 + r * 0.22, 0.45); g.add(m); cells.push(m);
  }
  const store = framedBox(0.78, 0.78, 0.3, 0x8FB0FF, new THREE.MeshBasicMaterial({ color: 0x0b0f1a, transparent: true, opacity: 0.6 }));
  store.position.set(-1.28, 0.96, 0.32); g.add(store);

  // drift monitor: training distribution (blue) vs live distribution (amber) on a small screen
  const MX = 2.6, MY = 3.1, MZ = 0.35, MW = 1.1, MH = 0.72;
  const screen = framedBox(MW, MH, 0.06, 0xFFB547, new THREE.MeshBasicMaterial({ color: 0x0b0f1a }));
  screen.position.set(MX, MY, MZ - 0.05); g.add(screen);
  const N = 40;
  const bell = (mu, sd, h) => Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1), x = (u - 0.5) * (MW - 0.16);
    return new THREE.Vector3(MX + x, MY - MH / 2 + 0.08 + h * Math.exp(-((u - mu) ** 2) / (2 * sd * sd)), MZ);
  });
  const trainCurve = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bell(0.35, 0.12, 0.48)), new THREE.LineBasicMaterial({ color: 0x8FB0FF }));
  const liveGeo = new THREE.BufferGeometry().setFromPoints(bell(0.35, 0.12, 0.48));
  const liveCurve = new THREE.Line(liveGeo, new THREE.LineBasicMaterial({ color: 0xFFB547 }));
  g.add(trainCurve, liveCurve);
  const limit = line3(new THREE.Vector3(MX + 0.12, MY - MH / 2 + 0.05, MZ), new THREE.Vector3(MX + 0.12, MY + MH / 2 - 0.05, MZ), 0xFF5D5D, 0.5);
  g.add(limit);                                                  // drift threshold
  const alertMat = new THREE.MeshBasicMaterial({ color: 0x38D98A });
  const alert = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), alertMat);
  alert.position.set(MX + MW / 2 - 0.1, MY + MH / 2 - 0.1, MZ + 0.02); g.add(alert);
  g.add(line3(new THREE.Vector3(2.35, 1.95, 0.1), new THREE.Vector3(MX - 0.2, MY - MH / 2, MZ - 0.05), 0x8FB0FF, 0.5)); // serving → monitor

  // the forward pipeline: data → features → network → registry → serving
  const flow = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.3, 1.6, 0.3), new THREE.Vector3(-1.3, 1.5, 0.6), new THREE.Vector3(-0.9, 2.4, 0.5), new THREE.Vector3(0, 2.75, 0.5),
    new THREE.Vector3(0.9, 2.2, 0.45), new THREE.Vector3(1.0, 1.4, 0.45), new THREE.Vector3(2.35, 1.9, 0.35),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(flow, 120, 0.02, 6, false), new THREE.MeshBasicMaterial({ color: 0xBFD0FF, transparent: true, opacity: 0.35 })));
  const bits = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: 0xFFFFFF })); g.add(m); return m; });

  // ======================= extra MLOps / LLMOps components =======================
  const extra = buildExtras(g);

  // labels
  addTag(g, "Data", "#8FB0FF", -2.3, 1.95, 0.4, 0.6);
  addTag(g, "Train", "#BFD0FF", 0, 4.0, 0.4, 0.7);
  addTag(g, "Evaluate", "#38D98A", 1.55, 3.95, 0.4, 0.8);
  addTag(g, "Model registry", "#FFB547", 1.0, 0.25, 0.85, 1.1);
  addTag(g, "Serve", "#8FB0FF", 2.35, 2.2, 0.4, 0.6);
  addTag(g, "Validate", "#38D98A", -2.95, 0.95, 0.6, 0.7);
  addTag(g, "Feature store", "#8FB0FF", -1.28, 1.6, 0.75, 1.0);
  addTag(g, "Drift monitor", "#FFB547", MX, MY + MH / 2 + 0.22, MZ, 1.0);
  addTag(g, "Retrain on drift", "#FFB547", -2.35, 3.75, -0.4, 1.2);
  const v3 = addTag(g, "v3", "#FFB547", 1.62, 1.12, 0.6, 0.35);

  const livePos = liveGeo.attributes.position;
  anims.push(function (t) {
    const ph = (t / CYCLE) % 1;                                  // where we are in the story (0 … 1)
    extra(t, ph);
    const train = smooth(ph / 0.4);                               // 0 – 0.4  training
    const drift = smooth((ph - 0.45) / 0.3);                      // 0.45 – 0.75  live data drifts
    const retrain = ph > 0.75 ? (ph - 0.75) / 0.25 : -1;          // 0.75 – 1  retrain signal travels back

    // validate + features: scanner sweeps the data, feature cells light up one after another
    scan.position.y = 0.62 + 0.72 * (0.5 + 0.5 * Math.sin(t * 2.2));
    cells.forEach((m, i) => { m.material.emissiveIntensity = 0.25 + 0.75 * Math.max(0, Math.sin(t * 3 - i * 0.6)); });

    // train + evaluate: network pulses while training, the accuracy meter climbs
    const busy = ph < 0.42 ? 1 : 0.25;
    links.forEach((l) => { l.ln.material.opacity = 0.12 + 0.6 * busy * Math.max(0, Math.sin(t * 3 - l.d * 2)); });
    nodes.forEach((m, i) => m.scale.setScalar(1 + 0.25 * busy * Math.max(0, Math.sin(t * 3 - i * 0.4))));
    discs.forEach((d, k) => { d.rotation.y = t * (0.4 + k * 0.2); });
    fill.scale.y = 0.3 + 0.65 * train;

    // register: the new version drops onto the registry stack once training is done
    plates[2].position.y = 0.68 + 2 * 0.22 + (ph < 0.4 ? 0.35 * (1 - train) + 0.03 * Math.sin(t * 4) : 0);
    v3.visible = ph >= 0.4;

    // serve + monitor: live distribution slides away from training data until it crosses the limit
    const mu = 0.35 + 0.42 * drift, h = 0.48 - 0.12 * drift;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      livePos.setY(i, MY - MH / 2 + 0.08 + h * Math.exp(-((u - mu) ** 2) / (2 * 0.12 * 0.12)) + 0.012 * Math.sin(t * 6 + i));
    }
    livePos.needsUpdate = true;
    const alarm = drift > 0.6;
    alertMat.color.set(alarm ? 0xFF5D5D : 0x38D98A);
    alert.scale.setScalar(alarm ? 1 + 0.5 * Math.max(0, Math.sin(t * 10)) : 1);
    live.scale.setScalar(0.8 + 0.4 * Math.max(0, Math.sin(t * 4)));
    bits.forEach((b, k) => b.position.copy(flow.getPointAt((t * 0.18 + k / 4) % 1)));

    // retrain: the signal only travels the arc after the drift alarm
    sig.visible = retrain >= 0;
    if (retrain >= 0) sig.position.copy(arcCurve.getPointAt(Math.min(0.999, retrain)));
    head.scale.setScalar(retrain > 0.9 ? 1.4 : 1);
  });
}

/* ---------- Kafka, MLflow, DVC (left) and the LLMOps zone (right) ---------- */
function buildExtras(g) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, VIOLET = 0xB58CFF;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const tube = (c, col, op = 0.3, r = 0.014) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })));
  const dot = (col, r = 0.06) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };

  // ----- Kafka: event stream into the data store -----
  const kPlinth = framedBox(1.7, 0.22, 1.3, LIGHT); kPlinth.position.set(-3.85, 0.42, 0.1); g.add(kPlinth);
  const KX0 = -4.55, KX1 = -3.1, KY = [0.68, 0.9, 1.12], KZ = 0.1;
  KY.forEach((y) => { const lane = new THREE.Mesh(new THREE.BoxGeometry(KX1 - KX0, 0.14, 0.32), new THREE.MeshStandardMaterial({ color: 0x141c33, emissive: BLUE, emissiveIntensity: 0.2 })); lane.position.set((KX0 + KX1) / 2, y, KZ); g.add(lane); });
  const events = [];
  KY.forEach((y, p) => { for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.26), glowMat(p === 1 ? AMBER : PALE, 0.45)); m.position.set(KX0, y, KZ); g.add(m); events.push({ m, p, k }); } });
  const intoData = new THREE.CatmullRomCurve3([V(KX1, 0.9, KZ), V(-2.9, 1.0, 0.15), V(-2.55, 1.1, 0.1)]);
  tube(intoData, LIGHT, 0.35);
  const ingest = dot(AMBER, 0.06);

  // ----- MLflow: experiment runs tracked during training -----
  const MF = V(-3.75, 2.55, -0.15);
  const mf = framedBox(1.2, 0.8, 0.05, LIGHT, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); mf.position.copy(MF); g.add(mf);
  const runs = [0, 1, 2, 3, 4].map((k) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.08), new THREE.MeshBasicMaterial({ color: k === 3 ? AMBER : LIGHT })); b.geometry.translate(0.5, 0, 0); b.position.set(MF.x - 0.5, MF.y + 0.26 - k * 0.13, MF.z + 0.03); g.add(b); return b; });
  const runW = [0.55, 0.7, 0.62, 0.92, 0.48];
  g.add(line3(V(MF.x + 0.6, MF.y, MF.z), V(-1.2, 2.75, 0.25), LIGHT, 0.3));          // network → experiment tracking
  const mfStand = new THREE.Mesh(new THREE.BoxGeometry(0.05, MF.y - 0.9, 0.05), glowMat(LIGHT, 0.3)); mfStand.position.set(MF.x, (MF.y + 0.5) / 2 - 0.15, MF.z - 0.04); g.add(mfStand);

  // ----- LLMOps zone (right) -----
  const lPlinth = framedBox(3.2, 0.22, 1.9, VIOLET); lPlinth.position.set(5.05, 0.42, 0); g.add(lPlinth);
  // GPU node
  const gpu = rack(1.3, AMBER); gpu.position.set(3.85, 1.2, -0.45); g.add(gpu);
  const fans = [0, 1].map((k) => { const f = gear(0.1, AMBER, 6); f.position.set(3.85, 1.0 + k * 0.45, -0.13); g.add(f); return f; });
  // vLLM: batched token lanes
  const vllm = framedBox(1.0, 0.65, 0.6, BLUE, glowMat(0x1d2b55, 0.3)); vllm.position.set(4.95, 0.9, -0.35); g.add(vllm);
  const tokens = [];
  for (let l = 0; l < 4; l++) for (let k = 0; k < 3; k++) { const tk = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshBasicMaterial({ color: l % 2 ? PALE : GREEN })); g.add(tk); tokens.push({ tk, l, k }); }
  // Ollama: local model box
  const oll = framedBox(0.75, 0.55, 0.55, VIOLET, glowMat(0x241a3d, 0.3)); oll.position.set(6.0, 0.85, -0.35); g.add(oll);
  const ollCore = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), glowMat(VIOLET, 0.7)); ollCore.position.set(6.0, 0.85, -0.04); g.add(ollCore);
  [4.95, 6.0].forEach((x) => g.add(line3(V(4.15, 1.3, -0.45), V(x - 0.3, 1.0, -0.35), AMBER, 0.35)));   // both run on the GPU node
  // MCP server and its tools
  const H = V(5.05, 2.2, 0.15);
  const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), glowMat(GREEN, 0.6)); hub.position.copy(H); g.add(hub);
  const hubRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.025, 8, 36), glowMat(GREEN, 0.6)); hubRing.position.copy(H); g.add(hubRing);
  const toolPos = [V(4.35, 3.0, 0.15), V(5.05, 3.15, 0.15), V(5.75, 3.0, 0.15)];
  const tools = toolPos.map((p, k) => { const b = framedBox(0.32, 0.26, 0.26, GREEN, glowMat([LIGHT, AMBER, PALE][k], 0.35)); b.position.copy(p); g.add(b); g.add(line3(H, p, GREEN, 0.4)); return b; });
  // vector DB (RAG): a cloud of embeddings
  const VDB = V(6.3, 1.95, -0.25);
  const vecs = [];
  for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: i % 5 ? PALE : AMBER })); m.position.set(VDB.x + (Math.sin(i * 12.9) * 0.5) * 0.6, VDB.y + (Math.sin(i * 7.3) * 0.5) * 0.6, VDB.z + (Math.sin(i * 3.7) * 0.5) * 0.6); g.add(m); vecs.push(m); }
  const vdbBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.75, 0.75, 0.75)), new THREE.LineBasicMaterial({ color: PALE, transparent: true, opacity: 0.5 })); vdbBox.position.copy(VDB); g.add(vdbBox);
  g.add(line3(H, VDB, PALE, 0.35));
  // LLM evals: checklist that must pass before a model is promoted
  const EV = V(3.85, 2.6, 0.35);
  const evPanel = framedBox(0.8, 0.6, 0.04, GREEN, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); evPanel.position.copy(EV); g.add(evPanel);
  const checks = [0, 1, 2].map((k) => { const c = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), new THREE.MeshBasicMaterial({ color: 0x3a4152 })); c.position.set(EV.x - 0.25, EV.y + 0.17 - k * 0.17, EV.z + 0.03); g.add(c); const r = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.05), new THREE.MeshBasicMaterial({ color: PALE })); r.position.set(EV.x + 0.05, EV.y + 0.17 - k * 0.17, EV.z + 0.03); g.add(r); return c.material; });
  // flows: registry → evals → vLLM (deploy weights); prompt → MCP → tool → model → answer
  const deploy = new THREE.CatmullRomCurve3([V(1.4, 1.2, 0.3), V(2.8, 2.4, 0.4), V(EV.x - 0.4, EV.y, EV.z), V(EV.x + 0.4, EV.y - 0.2, EV.z), V(4.6, 1.4, -0.2), V(4.95, 1.25, -0.35)]);
  tube(deploy, AMBER, 0.3);
  const prompt = new THREE.CatmullRomCurve3([V(5.05, 0.75, 1.5), V(5.05, 1.4, 0.9), H.clone()]);
  const toModel = new THREE.CatmullRomCurve3([H.clone(), V(4.95, 1.6, -0.1), V(4.95, 1.25, -0.35)]);
  const answer = new THREE.CatmullRomCurve3([V(5.25, 1.25, -0.35), V(5.6, 1.4, 0.6), V(5.4, 0.75, 1.5)]);
  [prompt, toModel, answer].forEach((c) => tube(c, GREEN, 0.25));
  const weights = dot(AMBER, 0.08), req = dot(0xFFFFFF, 0.07), call = dot(GREEN, 0.06), rag = dot(AMBER, 0.05), ans = dot(GREEN, 0.07);

  // ----- labels -----
  addTag(g, "Kafka · events", "#8FB0FF", (KX0 + KX1) / 2, 1.5, KZ, 1.1);
  addTag(g, "DVC versioned", "#8FB0FF", -2.3, 0.25, 0.75, 1.0);
  addTag(g, "MLflow experiments", "#8FB0FF", MF.x, MF.y + 0.62, MF.z, 1.35);
  addTag(g, "GPU node", "#FFB547", 3.85, 2.05, -0.3, 0.75);
  addTag(g, "vLLM", "#5B8CFF", 4.95, 1.45, -0.2, 0.45);
  addTag(g, "Ollama (local)", "#B58CFF", 6.0, 1.35, -0.2, 1.0);
  addTag(g, "MCP server", "#38D98A", H.x - 0.75, H.y, H.z + 0.2, 0.85);
  ["DB", "API", "files"].forEach((n, k) => addTag(g, n, "#38D98A", toolPos[k].x, toolPos[k].y + 0.3, toolPos[k].z, 0.4));
  addTag(g, "MCP tools", "#38D98A", 5.05, 3.65, 0.15, 0.8);
  addTag(g, "Vector DB (RAG)", "#BFD0FF", VDB.x, VDB.y + 0.6, VDB.z, 1.15);
  addTag(g, "LLM evals", "#38D98A", EV.x, EV.y + 0.48, EV.z, 0.75);
  addTag(g, "prompt", "#38D98A", 4.65, 0.95, 1.4, 0.55);
  addTag(g, "answer", "#38D98A", 5.75, 0.95, 1.4, 0.55);
  addTag(g, "LLMOps", "#B58CFF", 5.05, 0.15, 1.05, 0.7);

  return function (t, ph) {
    // Kafka events flow along the partitions and into the data store
    events.forEach(({ m, p, k }) => { m.position.x = KX0 + 0.08 + ((k * 0.36 + t * (0.25 + p * 0.07)) % (KX1 - KX0 - 0.16)); });
    ingest.position.copy(intoData.getPointAt((t * 0.6) % 1));
    // MLflow: run bars grow while the network trains; the best run is amber
    const train = smooth(ph / 0.4);
    runs.forEach((b, k) => { b.scale.x = Math.max(0.01, runW[k] * Math.min(1, train * 1.6 - k * 0.12)); });
    // GPU fans and token streams
    fans.forEach((f, k) => { f.rotation.z = t * (6 + k); });
    tokens.forEach(({ tk, l, k }) => { const u = (t * 0.7 + k / 3 + l * 0.17) % 1; tk.position.set(4.55 + u * 0.8, 0.72 + l * 0.12, -0.04); });
    ollCore.scale.setScalar(1 + 0.2 * Math.max(0, Math.sin(t * 3)));
    // evals pass one by one after training, then the weights deploy to vLLM
    checks.forEach((c, k) => c.color.set(ph > 0.4 + k * 0.04 || ph < 0.02 ? GREEN : 0x3a4152));
    weights.visible = ph > 0.38 && ph < 0.56;
    if (weights.visible) weights.position.copy(deploy.getPointAt(smooth((ph - 0.38) / 0.18)));
    // agent request: prompt → MCP → tool call (+ RAG lookup) → model → answer (every 6 s)
    const r = (t / 6) % 1;
    hub.rotation.y = t; hubRing.rotation.x = t * 0.7;
    req.visible = r < 0.22; if (req.visible) req.position.copy(prompt.getPointAt(r / 0.22));
    const tk = Math.floor(t / 6) % 3, cu = (r - 0.22) / 0.2;
    call.visible = cu >= 0 && cu <= 1;
    if (call.visible) call.position.copy(H).lerp(toolPos[tk], cu < 0.5 ? cu * 2 : 2 - cu * 2);
    tools.forEach((b, k) => { b.children[0].material.emissiveIntensity = call.visible && k === tk ? 0.9 : 0.35; });
    rag.visible = cu >= 0 && cu <= 1;
    if (rag.visible) rag.position.copy(H).lerp(VDB, cu < 0.5 ? cu * 2 : 2 - cu * 2);
    vecs.forEach((v, i) => { v.scale.setScalar(rag.visible && i % 7 === tk ? 1.8 : 1); });
    const mu = (r - 0.42) / 0.2; if (mu >= 0 && mu <= 1) { call.visible = true; call.position.copy(toModel.getPointAt(mu)); }
    ans.visible = r > 0.66 && r < 0.92; if (ans.visible) ans.position.copy(answer.getPointAt((r - 0.66) / 0.26));
  };
}
