import * as THREE from "three";
import { glowMat, addTag, framedBox, line3 } from "../helpers.js";

/**
 * GitOps with GitLab and Argo CD, one release every CYCLE seconds:
 *   1. commit  — a developer pushes to the GitLab app repo,
 *   2. CI      — GitLab CI runs build → test → push image,
 *   3. bump    — CI commits the new image tag to the GitOps config repo (the single source of truth),
 *   4. pull    — Argo CD pulls the config repo, sees the environments are OutOfSync,
 *   5. sync    — it syncs dev → staging → prod (pods roll to the new version),
 *   6. heal    — someone edits prod by hand (drift); Argo CD detects it and self-heals back to Git.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const CYCLE = 13;

export function argocd(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D, ORANGE = 0xFC6D26;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const win = (ph, a, b) => (ph - a) / (b - a);
  const tube = (c, col, op = 0.28, r = 0.014) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })));
  const dot = (col, r = 0.08) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };

  // ---------- GitLab (left) ----------
  const gl = framedBox(2.5, 0.06, 2.3, ORANGE, new THREE.MeshStandardMaterial({ color: 0x1f1510, emissive: ORANGE, emissiveIntensity: 0.12, transparent: true, opacity: 0.75 }));
  gl.position.set(-2.55, 0.36, 0); g.add(gl);
  const repo = (x, z, top) => {
    const discs = [];
    for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 24), glowMat(LIGHT, 0.35)); d.position.set(x, 0.5 + k * 0.24, z); g.add(d); discs.push(d); }
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 24), glowMat(top, 0.6)); head.position.set(x, 0.5 + 4 * 0.24, z); g.add(head);
    g.add(line3(V(x, 0.42, z), V(x, 1.6, z), PALE, 0.5));
    return { discs, head };
  };
  const APP = V(-3.25, 0, 0.55), CFG = V(-1.75, 0, -0.55);
  const app = repo(APP.x, APP.z, AMBER);
  const cfg = repo(CFG.x, CFG.z, GREEN);
  // GitLab CI pipeline: build → test → push
  const stages = [-3.55, -2.85, -2.15].map((x) => { const s = framedBox(0.55, 0.32, 0.3, ORANGE, glowMat(0x2a1a10, 0.2)); s.position.set(x, 2.55, 0.25); g.add(s); return s.children[0].material; });
  for (let k = 0; k < 2; k++) g.add(line3(V(-3.27 + k * 0.7, 2.55, 0.25), V(-3.13 + k * 0.7, 2.55, 0.25), ORANGE, 0.8));
  const toCI = new THREE.CatmullRomCurve3([V(APP.x, 1.55, APP.z), V(-3.55, 2.1, 0.4), V(-3.55, 2.4, 0.25)]);
  const bump = new THREE.CatmullRomCurve3([V(-2.15, 2.4, 0.25), V(-1.75, 2.1, -0.1), V(CFG.x, 1.55, CFG.z)]);
  tube(toCI, ORANGE); tube(bump, ORANGE);

  // ---------- Argo CD (centre): pull → compare → sync ----------
  const A = V(0.3, 2.25, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 8, 48, Math.PI * 1.6), glowMat(0xF2F3F5, 0.6)); ring.position.copy(A); g.add(ring);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 12), glowMat(0xF2F3F5, 0.6)); ring.add(tip); tip.position.set(0.62, 0, 0); tip.rotation.z = Math.PI;
  const coreMat = glowMat(GREEN, 0.7);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14), coreMat); core.position.copy(A); g.add(core);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, A.y - 0.4, 8), glowMat(BLUE, 0.4)); stem.position.set(A.x, (A.y + 0.4) / 2 - 0.1, A.z); g.add(stem);
  const pull = new THREE.CatmullRomCurve3([V(CFG.x + 0.3, 1.6, CFG.z), V(-0.8, 2.7, -0.4), V(A.x - 0.3, A.y, A.z)]);
  tube(pull, GREEN, 0.35);

  // ---------- cluster environments (right): dev, staging, prod ----------
  const ENV = ["dev", "staging", "prod"], EX = 2.35, EY = [0.75, 1.75, 2.75];
  const envs = EY.map((y) => {
    const slab = framedBox(1.7, 0.08, 1.0, BLUE); slab.position.set(EX, y, 0); g.add(slab);
    const pods = [-0.5, 0, 0.5].map((dx) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), new THREE.MeshStandardMaterial({ color: LIGHT, emissive: LIGHT, emissiveIntensity: 0.5 })); p.position.set(EX + dx, y + 0.22, 0); g.add(p); return p; });
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: GREEN })); light.position.set(EX + 0.95, y + 0.15, 0.4); g.add(light);
    const path = new THREE.CatmullRomCurve3([A.clone().add(V(0.35, 0, 0)), V((A.x + EX) / 2, (A.y + y) / 2 + 0.3, 0.3), V(EX - 0.75, y + 0.25, 0)]);
    tube(path, PALE, 0.25);
    return { pods, light, path };
  });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, EY[2] - 0.3, 0.06), glowMat(BLUE, 0.3)); stand.position.set(EX + 0.9, (EY[2] + 0.4) / 2, -0.45); g.add(stand);

  const commitDot = dot(AMBER), bumpDot = dot(ORANGE), pullDot = dot(GREEN), syncDot = dot(0xFFFFFF), healDot = dot(GREEN);

  // ---------- labels ----------
  addTag(g, "GitLab", "#FC6D26", -2.55, 0.15, 1.2, 0.7);
  addTag(g, "App repo", "#FFB547", APP.x, 1.95, APP.z + 0.2, 0.85);
  addTag(g, "GitOps config repo", "#38D98A", CFG.x, 1.95, CFG.z, 1.45);
  addTag(g, "GitLab CI", "#FC6D26", -2.85, 3.05, 0.25, 0.9);
  ["build", "test", "push"].forEach((n, k) => addTag(g, n, "#FC6D26", -3.55 + k * 0.7, 2.25, 0.5, 0.45));
  addTag(g, "Argo CD", "#BFD0FF", A.x, A.y + 0.95, A.z, 0.75);
  addTag(g, "pull", "#38D98A", -0.75, 2.95, -0.4, 0.45);
  ENV.forEach((n, k) => addTag(g, n, "#5B8CFF", EX - 0.95, EY[k] + 0.4, 0.45, 0.6));
  const driftTag = addTag(g, "Drift → self-heal", "#FFB547", EX, EY[2] + 0.75, 0.3, 1.3);

  const vColors = [new THREE.Color(LIGHT), new THREE.Color(GREEN)];
  anims.push(function (t) {
    const cyc = Math.floor(t / CYCLE), ph = (t / CYCLE) % 1;
    const oldV = vColors[cyc % 2], newV = vColors[(cyc + 1) % 2];
    ring.rotation.z = -t * 1.4;

    // 1. commit (0 – 0.12)
    commitDot.visible = ph < 0.12;
    if (commitDot.visible) commitDot.position.copy(toCI.getPointAt(smooth(win(ph, 0, 0.12))));
    app.head.material.emissiveIntensity = ph < 0.12 ? 0.6 + 0.6 * Math.max(0, Math.sin(t * 12)) : 0.6;
    // 2. GitLab CI stages (0.12 – 0.38)
    stages.forEach((m, k) => {
      const a = 0.12 + k * 0.085, on = ph >= a && ph < 0.42, done = ph >= a + 0.085;
      m.color.set(!on ? 0x2a1a10 : done ? GREEN : ORANGE); m.emissive.copy(m.color); m.emissiveIntensity = on && !done ? 0.4 + 0.5 * Math.max(0, Math.sin(t * 10)) : 0.35;
    });
    // 3. tag bump to the config repo (0.38 – 0.48)
    bumpDot.visible = ph >= 0.38 && ph < 0.48;
    if (bumpDot.visible) bumpDot.position.copy(bump.getPointAt(smooth(win(ph, 0.38, 0.48))));
    cfg.head.visible = ph >= 0.47;
    // 4. Argo CD pulls (0.48 – 0.56): environments go OutOfSync
    pullDot.visible = ph >= 0.48 && ph < 0.56;
    if (pullDot.visible) pullDot.position.copy(pull.getPointAt(smooth(win(ph, 0.48, 0.56))));
    // 5. sync dev → staging → prod (0.56 – 0.8)
    let syncing = false;
    envs.forEach((e, k) => {
      const a = 0.56 + k * 0.08, b = a + 0.08;
      const synced = ph >= b, outOfSync = ph >= 0.5 && !synced;
      if (ph >= a && ph < b) { syncing = true; syncDot.position.copy(e.path.getPointAt(smooth(win(ph, a, b)))); }
      const col = ph < 0.5 ? oldV : synced ? newV : oldV;
      e.pods.forEach((p, j) => {
        const roll = ph >= a && ph < b && Math.floor(win(ph, a, b) * 3) === j;
        p.material.color.copy(col); p.material.emissive.copy(col);
        p.scale.setScalar(roll ? 0.6 + 0.4 * Math.abs(Math.sin(t * 10)) : 1);
      });
      e.light.material.color.set(outOfSync ? AMBER : GREEN);
    });
    syncDot.visible = syncing;
    coreMat.color.set(ph >= 0.5 && ph < 0.8 ? AMBER : GREEN); coreMat.emissive.copy(coreMat.color);
    // 6. drift in prod (0.84 – 0.92) → self-heal (0.92 – 1)
    const prodPod = envs[2].pods[1];
    const drifted = ph >= 0.84 && ph < 0.94;
    driftTag.visible = ph >= 0.84;
    if (drifted) { prodPod.material.color.set(RED); prodPod.material.emissive.set(RED); prodPod.rotation.y = 0.5; envs[2].light.material.color.set(AMBER); coreMat.color.set(AMBER); coreMat.emissive.set(AMBER); }
    else prodPod.rotation.y = 0;
    healDot.visible = ph >= 0.88 && ph < 0.94;
    if (healDot.visible) healDot.position.copy(envs[2].path.getPointAt(smooth(win(ph, 0.88, 0.94))));
  });
}
