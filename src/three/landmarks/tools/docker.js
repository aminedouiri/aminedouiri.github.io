import * as THREE from "three";
import { glowMat, addTag, framedBox } from "../helpers.js";

/**
 * Docker, one workflow every CYCLE seconds:
 *   1. pull   — the base image comes down from Docker Hub,
 *   2. build  — image layers stack up (base OS → runtime → deps → app code),
 *   3. push   — the image goes to the local registry (and is published to Docker Hub),
 *   4. run    — docker compose starts web, api and db on a shared network, db keeps its data in a volume;
 *               a k3d cluster (k3s nodes running as Docker containers) pulls the image from the local registry.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const CYCLE = 12;

export function docker(g, anims) {
  const BLUE = 0x5B8CFF, DEEP = 0x3E63D9, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, VIOLET = 0xB58CFF;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const win = (ph, a, b) => (ph - a) / (b - a);                     // 0 … 1 inside [a, b]
  const tube = (c, col, op = 0.3, r = 0.014) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })));
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x0E1220, metalness: 0.5, roughness: 0.5 });
  const container = (w, h, d, col, op = 1) => {             // a shipping-container style box with ribs
    const c = new THREE.Group();
    c.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, transparent: op < 1, opacity: op })));
    const n = Math.max(3, Math.round(w / 0.14));
    for (let r = 0; r < n; r++) { const rib = new THREE.Mesh(new THREE.BoxGeometry(0.025, h - 0.04, d + 0.02), ribMat); rib.position.x = -w / 2 + (r + 0.5) * (w / n); c.add(rib); }
    return c;
  };

  // ---------- Docker host ----------
  const host = framedBox(4.3, 0.06, 3.1, BLUE, new THREE.MeshStandardMaterial({ color: 0x141c33, emissive: BLUE, emissiveIntensity: 0.15, transparent: true, opacity: 0.7 }));
  host.position.set(0.65, 0.36, -0.15); g.add(host);

  // ---------- Docker Hub (top left) ----------
  const HUB = V(-2.6, 3.7, -0.6);
  const hub = framedBox(1.5, 0.12, 0.95, LIGHT, glowMat(DEEP, 0.4)); hub.position.copy(HUB); g.add(hub);
  const hubImgs = [-0.45, 0, 0.45].map((dx, k) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.3), glowMat(k === 1 ? AMBER : LIGHT, 0.5)); b.position.set(HUB.x + dx, HUB.y + 0.2, HUB.z); g.add(b); return b; });

  // ---------- image build (left) ----------
  const LX = -2.6, LZ = 0.3;
  const layerCols = [DEEP, BLUE, LIGHT, AMBER];
  const layers = layerCols.map((c, k) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.95), glowMat(c, 0.4)); l.geometry.translate(0, 0.11, 0); l.position.set(LX, 0.4 + k * 0.25, LZ); g.add(l); return l; });
  const imgTop = V(LX, 1.55, LZ);

  // ---------- local registry ----------
  const REG = V(-1.0, 0.75, -1.15);
  const reg = framedBox(1.0, 0.75, 0.6, GREEN, new THREE.MeshStandardMaterial({ color: 0x1a2131, metalness: 0.7, roughness: 0.3 })); reg.position.copy(REG); g.add(reg);
  const regImgs = [0, 1, 2].map((k) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.05), glowMat(k === 2 ? AMBER : LIGHT, 0.4)); b.position.set(REG.x - 0.28 + k * 0.28, REG.y + 0.12, REG.z + 0.31); g.add(b); return b; });

  // ---------- docker compose: web, api, db on one network + a volume ----------
  const CZ = 0.75, CY = 0.68;
  const svcX = [-0.6, 0.45, 1.5];
  const svcs = svcX.map((x, k) => { const c = container(0.8, 0.5, 0.55, [LIGHT, BLUE, AMBER][k]); c.position.set(x, CY, CZ); c.scale.setScalar(0.001); g.add(c); return c; });
  const compose = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.5), new THREE.MeshBasicMaterial({ color: 0xE9EEF9, side: THREE.DoubleSide }));
  compose.position.set(0.45, 1.55, CZ); g.add(compose);
  [0.25, 0.4, 0.3, 0.45].forEach((w, k) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.04), new THREE.MeshBasicMaterial({ color: k % 2 ? BLUE : GREEN })); r.position.set(0.45 - 0.27 + w / 2, 1.7 - k * 0.1, CZ + 0.005); g.add(r); });
  // network: a bus in front of the containers
  const net = new THREE.CatmullRomCurve3([V(-1.05, 0.48, CZ + 0.42), V(1.95, 0.48, CZ + 0.42)]);
  const netMat = new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.8 });
  g.add(new THREE.Mesh(new THREE.TubeGeometry(net, 20, 0.035, 8, false), netMat));
  svcX.forEach((x) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), netMat); s.position.set(x, 0.55, CZ + 0.32); g.add(s); });
  const netBits = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFFFFF })); g.add(m); return m; });
  // volume next to db
  const vol = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.42, 24), glowMat(AMBER, 0.35)); vol.position.set(2.45, 0.6, CZ); g.add(vol);
  const volRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.02, 6, 24), glowMat(AMBER, 0.8)); volRing.rotation.x = Math.PI / 2; volRing.position.set(2.45, 0.82, CZ); g.add(volRing);
  const volBit = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: AMBER })); g.add(volBit);

  // ---------- k3d: a k3s cluster whose nodes are Docker containers ----------
  const K = V(1.2, 1.05, -1.15);
  const k3d = container(2.1, 1.25, 1.0, BLUE, 0.28); k3d.position.copy(K); g.add(k3d);
  const nodes = [-0.62, 0, 0.62].map((dx, k) => { const n = framedBox(0.5, 0.08, 0.6, k === 0 ? AMBER : LIGHT); n.position.set(K.x + dx, K.y - 0.45, K.z); g.add(n); return n; });
  const kpods = [];
  [-0.62, 0, 0.62].forEach((dx, n) => [-0.11, 0.11].forEach((ox, j) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), glowMat(n === 0 && j === 0 ? AMBER : GREEN, 0.5));
    p.position.set(K.x + dx + ox, K.y - 0.32, K.z); p.scale.setScalar(0.001); g.add(p); kpods.push(p);
  }));

  // ---------- flights ----------
  const fly = (pts) => { const c = new THREE.CatmullRomCurve3(pts); tube(c, PALE, 0.22); return c; };
  const pullHub = fly([V(HUB.x, HUB.y - 0.1, HUB.z), V(LX - 0.2, 2.6, 0), V(LX, 0.6, LZ)]);
  const pushReg = fly([imgTop.clone(), V(-1.8, 1.9, -0.6), V(REG.x, REG.y + 0.4, REG.z)]);
  const regToK3d = fly([V(REG.x + 0.5, REG.y + 0.2, REG.z), V(0.0, 1.5, -1.15), V(K.x - 0.62, K.y - 0.2, K.z)]);
  const runCompose = fly([imgTop.clone(), V(-1.2, 1.9, 0.75), V(0.45, 1.3, CZ)]);
  const pushHub = fly([imgTop.clone(), V(-1.9, 3.0, -0.2), V(HUB.x + 0.45, HUB.y + 0.1, HUB.z)]);
  const pkt = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.17), glowMat(AMBER, 0.8)); g.add(pkt);
  const pkt2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), glowMat(AMBER, 0.8)); g.add(pkt2);

  // ---------- labels ----------
  addTag(g, "Docker Hub", "#8FB0FF", HUB.x, HUB.y + 0.6, HUB.z, 1.0);
  addTag(g, "Image", "#5B8CFF", LX, 1.95, LZ, 0.55);
  ["Base OS", "Runtime", "Deps", "App code"].forEach((n, k) => addTag(g, n, ["#3E63D9", "#5B8CFF", "#8FB0FF", "#FFB547"][k], LX - 0.95, 0.5 + k * 0.25, LZ + 0.2, 0.7));
  addTag(g, "Local registry", "#38D98A", REG.x, REG.y + 0.62, REG.z, 1.05);
  addTag(g, "docker compose", "#38D98A", 0.45, 1.98, CZ, 1.2);
  ["web", "api", "db"].forEach((n, k) => addTag(g, n, ["#8FB0FF", "#5B8CFF", "#FFB547"][k], svcX[k], 1.12, CZ + 0.3, 0.4));
  addTag(g, "Network", "#B58CFF", 0.45, 0.25, CZ + 0.55, 0.75);
  addTag(g, "Volume", "#FFB547", 2.45, 1.08, CZ, 0.65);
  addTag(g, "k3d cluster (k3s in Docker)", "#8FB0FF", K.x, K.y + 0.9, K.z, 1.9);
  addTag(g, "server", "#FFB547", K.x - 0.62, K.y - 0.05, K.z + 0.45, 0.5);
  addTag(g, "Docker host", "#5B8CFF", 2.4, 0.3, 1.45, 0.95);

  anims.push(function (t) {
    const ph = (t / CYCLE) % 1;
    // 1. pull base image from Docker Hub (0 – 0.12)
    // 2. build layers (0.1 – 0.35)
    layers.forEach((l, k) => { l.scale.y = Math.max(0.01, smooth(win(ph, 0.1 + k * 0.06, 0.16 + k * 0.06))); });
    hubImgs.forEach((b, k) => { b.position.y = HUB.y + 0.2 + 0.04 * Math.sin(t * 3 + k); });
    // packets: one main packet follows the current step
    pkt.visible = true;
    if (ph < 0.12) pkt.position.copy(pullHub.getPointAt(smooth(win(ph, 0, 0.12))));
    else if (ph < 0.36) pkt.visible = false;
    else if (ph < 0.5) pkt.position.copy(pushReg.getPointAt(smooth(win(ph, 0.36, 0.5))));          // docker push → local registry
    else if (ph < 0.62) pkt.position.copy(regToK3d.getPointAt(smooth(win(ph, 0.5, 0.62))));        // k3d pulls from it
    else if (ph < 0.78) pkt.position.copy(pushHub.getPointAt(smooth(win(ph, 0.62, 0.78))));         // publish to Docker Hub
    else pkt.visible = false;
    pkt2.visible = ph > 0.38 && ph < 0.52;
    if (pkt2.visible) pkt2.position.copy(runCompose.getPointAt(smooth(win(ph, 0.38, 0.52))));     // compose up uses the image
    regImgs[2].visible = ph > 0.5 || ph < 0.04;
    // 3. compose up (0.5 – 0.62) and k3d pods start (0.62 – 0.72)
    svcs.forEach((c, k) => { const s = ph > 0.5 ? Math.max(0.001, smooth(win(ph, 0.5 + k * 0.04, 0.56 + k * 0.04))) : 0.001; c.scale.setScalar(s); c.visible = s > 0.01; });
    kpods.forEach((p, k) => { const s = ph > 0.6 ? Math.max(0.001, smooth(win(ph, 0.6 + k * 0.02, 0.65 + k * 0.02))) : 0.001; p.scale.setScalar(s); p.visible = s > 0.01; });
    compose.rotation.y = 0.15 * Math.sin(t * 0.8);
    // network traffic web ↔ api ↔ db, and db ↔ volume writes
    const up = ph > 0.62;
    netBits.forEach((b, k) => { b.visible = up; const u = (t * 0.45 + k * 0.5) % 1; b.position.copy(net.getPointAt(0.15 + 0.7 * (u < 0.5 ? u * 2 : 2 - u * 2))); });
    netMat.opacity = up ? 0.8 : 0.3;
    volBit.visible = up;
    if (up) { const u = (t * 0.8) % 1; volBit.position.set(1.9 + 0.55 * u, 0.75, CZ); }
    volRing.material.emissiveIntensity = up ? 0.5 + 0.5 * Math.max(0, Math.sin(t * 6)) : 0.4;
    nodes.forEach((n, k) => { n.position.y = K.y - 0.45 + (ph > 0.6 ? 0 : 0.02 * Math.sin(t * 2 + k)); });
  });
}
