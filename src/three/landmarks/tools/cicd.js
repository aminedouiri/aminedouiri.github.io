import * as THREE from "three";
import { glowMat, darkMat, tagSprite, addTag, framedBox, line3 } from "../helpers.js";
import { canvasTexture, font } from "../../utils/textures.js";

/**
 * Multi-language CI/CD: every RUN seconds the next app goes through the same pipeline
 * (build → test → scan → package → deploy) with its own commands, shown on the board above,
 * then rolls out to its slot on the Kubernetes (microservices) cluster and runs its database migration
 * on PostgreSQL, MySQL or SQL Server.
 * Some runs fail, to show what the pipeline does then:
 *   - tests fail  → the TEST gate turns red, the pipeline stops, nothing is deployed (the running version stays),
 *   - health check fails after deploy → the new version turns red and is automatically rolled back
 *     (helm rollback) to the previous one; the migration is skipped.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const RUN = 6;
const DBS = [["PostgreSQL", 0x5B8CFF, "#5B8CFF"], ["MySQL", 0xFFB547, "#FFB547"], ["SQL Server", 0xFF6B5D, "#FF6B5D"]];
const APPS = [
  { n: "Next.js", c: 0xF2F3F5, css: "#F2F3F5", cmds: ["npm ci && next build", "vitest run", "npm audit · trivy", "docker build → push", "helm upgrade web"], db: -1 },
  { n: "NestJS", c: 0xFF6B8A, css: "#FF6B8A", cmds: ["npm ci && nest build", "jest --ci", "trivy fs .", "docker build ×3", "helm upgrade orders users payments"], db: 0, mig: "prisma migrate deploy" },
  { n: "ASP.NET", c: 0xB58CFF, css: "#B58CFF", cmds: ["dotnet restore && build", "dotnet test", "dotnet list package --vulnerable", "dotnet publish → image", "helm upgrade api"], db: 2, mig: "dotnet ef database update" },
  { n: "Django", c: 0x38D98A, css: "#38D98A", cmds: ["pip install -r requirements.txt", "pytest", "bandit · pip-audit", "docker build → push", "helm upgrade backend"], db: 0, mig: "python manage.py migrate" },
  { n: "Laravel", c: 0xFF7A59, css: "#FF7A59", cmds: ["composer install && npm run build", "php artisan test", "composer audit", "docker build → push", "helm upgrade app"], db: 1, mig: "php artisan migrate --force" },
  { n: "Express", c: 0xBFD0FF, css: "#BFD0FF", cmds: ["npm ci && tsc", "jest", "npm audit", "docker build → push", "helm upgrade api-node"], db: 1, mig: "knex migrate:latest" },
  { n: "React", c: 0x5BD3F0, css: "#5BD3F0", cmds: ["npm ci && vite build", "vitest run", "npm audit", "nginx image → push", "helm upgrade spa"], db: -1 },
  { n: "Vue.js", c: 0x3FC08A, css: "#3FC08A", cmds: ["npm ci && vite build", "vitest run", "npm audit", "nginx image → push", "helm upgrade portal"], db: -1 },
];
const STAGES = ["BUILD", "TEST", "SCAN", "PACKAGE", "DEPLOY"];
/** Which runs fail (run number → "test" | "deploy" | null). */
const failureOf = (run) => (run % 5 === 2 ? "test" : run % 5 === 4 ? "deploy" : null);

function boardTexture(app) {
  const c = document.createElement("canvas"); c.width = 1600; c.height = 380;
  const x = c.getContext("2d");
  x.fillStyle = "#0b0f1a"; x.fillRect(0, 0, 1600, 380);
  x.strokeStyle = app.css; x.lineWidth = 6; x.strokeRect(3, 3, 1594, 374);
  x.font = font(800, 46); x.fillStyle = app.css; x.fillText(app.n, 30, 64);
  x.font = font(500, 28, true); x.fillStyle = "#8B93A7";
  x.fillText("pipeline · GitHub Actions / GitLab CI" + (app.db >= 0 ? "   ·   DB: " + DBS[app.db][0] : ""), 30 + x.measureText(app.n).width * 1.75 + 30, 62);
  const colW = 1540 / 5;
  STAGES.forEach((s, k) => {
    const cx = 30 + k * colW;
    x.font = font(600, 26, true); x.fillStyle = k === 4 ? "#FFB547" : "#5B8CFF"; x.fillText(s, cx, 140);
    x.font = font(500, 25, true); x.fillStyle = "#E3E8F2";
    // wrap the command on two lines if needed
    const words = app.cmds[k].split(" "); let line = "", y = 192;
    words.forEach((w) => { if (x.measureText(line + w).width > colW - 24) { x.fillText(line, cx, y); line = ""; y += 36; } line += w + " "; });
    x.fillText(line, cx, y);
  });
  if (app.mig) { x.font = font(500, 26, true); x.fillStyle = "#38D98A"; x.fillText("migration: " + app.mig, 30, 340); }
  return canvasTexture(c, 4);
}

export function cicd(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

  // ---------- app repos (left) ----------
  const repos = APPS.map((a, k) => {
    const p = V(k % 2 ? -3.35 : -4.05, 0.75 + Math.floor(k / 2) * 0.62, 0.1);
    const b = framedBox(0.6, 0.42, 0.14, a.c, glowMat(a.c, 0.25)); b.position.copy(p); g.add(b);
    addTag(g, a.n, a.css, p.x, p.y + 0.33, p.z + 0.1, a.n.length > 6 ? 0.7 : 0.55);
    return { b, p, mat: b.children[0].material };
  });
  const repoPad = framedBox(1.6, 0.06, 0.9, LIGHT); repoPad.position.set(-3.7, 0.36, 0.1); g.add(repoPad);

  // ---------- pipeline: belt + 5 gates ----------
  const GX = [-2.35, -1.45, -0.55, 0.35, 1.25];
  const belt = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 0.7), darkMat()); belt.position.set(-0.55, 1.0, 0); g.add(belt);
  const gates = STAGES.map((n, k) => {
    const gate = new THREE.Group(); gate.position.set(GX[k], 1.0, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2A3040, emissive: 0x2A3040, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.4 });
    [-0.42, 0.42].forEach((z) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), mat); p.position.set(0, 0.5, z); gate.add(p); });
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.96), mat); top.position.y = 1.02; gate.add(top);
    const tag = tagSprite(n, k === 4 ? "#FFB547" : "#5B8CFF", 0.95); tag.position.set(0, 1.4, 0); gate.add(tag);
    g.add(gate); return mat;
  });
  const commit = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0xF2F3F5, emissive: 0xF2F3F5, emissiveIntensity: 0.5 })); g.add(commit);

  // ---------- board with the current app's commands ----------
  const boards = APPS.map(boardTexture);
  const boardMat = new THREE.MeshBasicMaterial({ map: boards[0] });
  const B = V(-0.55, 3.3, -0.35), BW = 4.4, BH = 1.05;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), boardMat); board.position.copy(B); g.add(board);
  const hl = new THREE.Mesh(new THREE.PlaneGeometry(BW / 5 - 0.04, BH * 0.62), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.08, depthWrite: false }));
  g.add(hl);

  // ---------- Kubernetes cluster with one slot per app (right) ----------
  const KX = 3.25, KZ = -0.1;
  const plat = framedBox(2.1, 0.1, 1.35, BLUE, new THREE.MeshStandardMaterial({ color: 0x141c33, emissive: BLUE, emissiveIntensity: 0.2 })); plat.position.set(KX, 0.75, KZ); g.add(plat);
  const slots = APPS.map((a, k) => {
    const p = V(KX - 0.75 + (k % 4) * 0.5, 1.05, KZ - 0.32 + Math.floor(k / 4) * 0.62);
    const grp = new THREE.Group(); grp.position.copy(p); g.add(grp);
    const n = a.n === "NestJS" ? 3 : 1;                                       // NestJS → three microservices
    const cubes = [];
    for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(n > 1 ? 0.14 : 0.3, n > 1 ? 0.14 : 0.3, n > 1 ? 0.14 : 0.3), glowMat(a.c, 0.2)); if (n > 1) c.position.set((i - 1) * 0.15, (i % 2) * 0.12, 0); grp.add(c); cubes.push(c); }
    return { grp, p, cubes };
  });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), darkMat()); stand.position.set(KX, 0.55, KZ); g.add(stand);
  const deployPath = (k) => new THREE.CatmullRomCurve3([V(GX[4] + 0.3, 1.25, 0), V(2.0, 1.9, 0.2), slots[k].p.clone().add(V(0, 0.25, 0))]);

  // ---------- databases (back right) ----------
  const dbs = DBS.map(([n, c, css], k) => {
    const p = V(2.45 + k * 0.85, 0.75, -1.6);
    const discs = [0, 1, 2].map((i) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 24), glowMat(c, 0.35)); d.position.set(p.x, p.y - 0.25 + i * 0.18, p.z); g.add(d); return d; });
    addTag(g, n, css, p.x, p.y + 0.4, p.z + 0.1, n.length > 6 ? 0.85 : 0.65);
    return { p, discs };
  });
  APPS.forEach((a, k) => { if (a.db >= 0) g.add(line3(slots[k].p, dbs[a.db].p.clone().add(V(0, 0.2, 0)), DBS[a.db][1], 0.3)); });
  const mig = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), glowMat(GREEN, 0.9)); g.add(mig);

  // ---------- labels ----------
  addTag(g, "Apps · one pipeline each", "#BFD0FF", -3.7, 3.35, 0.1, 1.6);
  addTag(g, "Kubernetes · microservices", "#5B8CFF", KX, 2.0, KZ, 1.75);
  addTag(g, "Databases", "#BFD0FF", 3.3, 1.55, -1.6, 0.8);
  addTag(g, "Green = passed", "#38D98A", -0.55, 0.55, 0.75, 1.1);
  addTag(g, "migration", "#38D98A", 2.55, 1.45, -0.85, 0.65);
  const tagTestFail = addTag(g, "Tests failed → pipeline stopped", "#FF6B5D", GX[1] + 0.3, 2.75, 0.2, 1.9);
  const tagHealth = addTag(g, "Health check failed", "#FF6B5D", KX, 2.35, KZ + 0.3, 1.25);
  const tagRollback = addTag(g, "helm rollback → previous version", "#FFB547", KX, 2.35, KZ + 0.3, 2.0);
  // rollback: an amber ring spinning backwards around the slot
  const rbRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 32, Math.PI * 1.6), glowMat(AMBER, 0.9)); g.add(rbRing);
  const rbTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 10), glowMat(AMBER, 0.9)); rbRing.add(rbTip); rbTip.position.set(0.3, 0, 0);

  const ok = new THREE.Color(GREEN), idle = new THREE.Color(0x2A3040), bad = new THREE.Color(RED), deployedAt = APPS.map(() => -1);
  anims.push(function (t) {
    const k = Math.floor(t / RUN) % APPS.length, f = (t % RUN) / RUN, app = APPS[k];
    boardMat.map = boards[k];
    // the app's repo lifts while its commit leaves
    repos.forEach((r, i) => { const on = i === k; r.b.position.x = r.p.x + (on ? 0.12 * Math.sin(Math.min(1, f * 6) * Math.PI) : 0); r.mat.emissiveIntensity = on ? 0.7 : 0.25; });
    const run = Math.floor(t / RUN), fail = failureOf(run);
    // commit travels: repo → gates (0.08 – 0.7) → cluster slot (0.72 – 0.86)
    commit.material.color.set(app.c); commit.material.emissive.set(app.c);
    let cx;
    const stopX = GX[1] - 0.25;                                              // where a failing test run stops
    if (f < 0.08) { const u = smooth(f / 0.08); commit.position.copy(repos[k].p).lerp(V(-2.9, 1.25, 0), u); cx = -2.9; }
    else if (f < 0.7) {
      cx = -2.9 + ((f - 0.08) / 0.62) * 4.45;
      if (fail === "test" && cx > stopX) cx = stopX;
      commit.position.set(cx, 1.25, 0);
    }
    else if (fail === "test") { cx = stopX; commit.position.set(cx, 1.25 - Math.min(1, (f - 0.7) / 0.2) * 0.35, 0); }
    else if (f < 0.86) { cx = 9; commit.position.copy(deployPath(k).getPointAt(smooth((f - 0.7) / 0.16))); }
    else { cx = 9; commit.position.copy(slots[k].p).add(V(0, 0.25, 0)); }
    const testFailed = fail === "test" && cx >= stopX - 0.01 && f > 0.25;
    if (testFailed) { commit.material.color.set(RED); commit.material.emissive.set(RED); }
    commit.visible = fail === "test" ? f < 0.95 : f < 0.88;
    commit.rotation.y = t * 2;
    gates.forEach((m, i) => {
      const c = testFailed && i === 1 ? bad : testFailed && i > 1 ? idle : cx > GX[i] ? ok : idle;
      m.color.copy(c); m.emissive.copy(c);
    });
    tagTestFail.visible = testFailed;
    // board highlight follows the current stage (red when a stage fails)
    const stage = testFailed ? 1 : Math.max(0, Math.min(4, GX.findIndex((x) => cx < x + 0.45)));
    hl.position.set(B.x - BW / 2 + (stage + 0.5) * (BW / 5), B.y - 0.1, B.z + 0.01);
    hl.visible = f > 0.08 && (f < 0.86 || testFailed);
    hl.material.color.set(testFailed ? RED : 0xFFFFFF); hl.material.opacity = testFailed ? 0.25 : 0.08;
    // deploy failure: new version goes red (health check), then rolls back to the previous version
    const healthBad = fail === "deploy" && f > 0.86 && f < 0.93;
    const rollingBack = fail === "deploy" && f >= 0.93;
    tagHealth.visible = healthBad; tagRollback.visible = rollingBack;
    rbRing.visible = rollingBack;
    if (rollingBack) { rbRing.position.copy(slots[k].p).add(V(0, 0.05, 0.3)); rbRing.rotation.z = -t * 6; }
    // deployed apps stay lit; the one just deployed pulses (rolling update)
    if (f > 0.86 && !fail && deployedAt[k] !== run) deployedAt[k] = run;
    slots.forEach((s, i) => {
      const live = deployedAt[i] >= 0, fresh = i === k && f > 0.86 && !fail;
      s.cubes.forEach((c, j) => {
        const red = i === k && healthBad;
        c.material.color.set(red ? RED : APPS[i].c); c.material.emissive.set(red ? RED : APPS[i].c);
        c.material.emissiveIntensity = red ? 0.6 + 0.6 * Math.max(0, Math.sin(t * 14 + j)) : fresh ? 0.6 + 0.6 * Math.max(0, Math.sin(t * 10 + j)) : live || (i === k && rollingBack) ? 0.55 : 0.12;
      });
      s.grp.scale.setScalar(fresh ? 1 + 0.12 * Math.sin((f - 0.86) / 0.14 * Math.PI) : 1);
    });
    // database migration (apps with a database, successful runs only)
    mig.visible = app.db >= 0 && f > 0.86 && !fail;
    if (mig.visible) mig.position.copy(slots[k].p).lerp(dbs[app.db].p.clone().add(V(0, 0.2, 0)), smooth((f - 0.86) / 0.12));
    dbs.forEach((d, i) => d.discs.forEach((m, j) => { m.rotation.y = t * (0.4 + j * 0.2); m.material.emissiveIntensity = i === app.db && f > 0.95 && !failureOf(Math.floor(t / RUN)) ? 0.9 : 0.35; }));
  });
}
