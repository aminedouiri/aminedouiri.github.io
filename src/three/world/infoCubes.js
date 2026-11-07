/*
 * Experience cubes: one floating cube per stop, on the LEFT of the road.
 * Faces: 0 front, 1 right, 2 back, 3 left (the four panel tabs), 4 top (stop number), 5 bottom.
 */
import * as THREE from "three";
import anime from "animejs";
import { canvasTexture, font, glowTexture } from "../utils/textures.js";
import { card, chip, fitTitle, roundRect, wrapText } from "../utils/canvas2d.js";
import { reduceMotion as reduce, isMobile } from "../utils/motion.js";

export const CUBE = 3.6;
const CS = 1024;                 // canvas size per face
const TURN = Math.PI / 2;        // one face
const BASE = 0.9;                // height of the pedestal

export class InfoCubes {
  /** @param {import("../World.js").World} w */
  constructor(w) {
    this.w = w;
    this.items = [];
    w.data.stops.forEach((s, i) => this.items.push(this.build(i)));
    this.redrawAll();
    // repaint once the web fonts are ready so canvas text uses them
    if (document.fonts && document.fonts.load) {
      const fonts = ["800 100px 'Plus Jakarta Sans'", "700 50px 'Plus Jakarta Sans'", "600 46px 'Plus Jakarta Sans'", "500 46px 'Plus Jakarta Sans'", "400 42px 'Plus Jakarta Sans'", "500 28px 'JetBrains Mono'", "600 46px 'JetBrains Mono'"];
      Promise.all(fonts.map((f) => document.fonts.load(f))).then(() => this.redrawAll(), () => this.redrawAll());
    }
  }

  /** Where the camera sits when parked at stop i. */
  stopCamera(i) {
    const { curve, stopT } = this.w;
    const p = curve.getPointAt(stopT[i]), tg = curve.getTangentAt(stopT[i]);
    const right = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
    if (isMobile()) return p.clone().addScaledVector(tg, -8).addScaledVector(right, 2.2).add(new THREE.Vector3(0, 3.6, 0));
    return p.clone().addScaledVector(tg, -5.5).addScaledVector(right, 3.0).add(new THREE.Vector3(0, 2.6, 0));
  }

  build(i) {
    const { scene, curve, stopT, ROAD_W, renderer } = this.w;
    const p = curve.getPointAt(stopT[i]), tg = curve.getTangentAt(stopT[i]);
    const left = new THREE.Vector3(tg.z, 0, -tg.x).normalize();
    const center = p.clone().addScaledVector(tg, 5).addScaledVector(left, ROAD_W + 3.2);
    center.y = 0;
    const cam = this.stopCamera(i);
    const aniso = renderer.capabilities.getMaxAnisotropy();

    const canvases = [], textures = [], mats = [];
    for (let f = 0; f < 6; f++) {
      const cv = document.createElement("canvas"); cv.width = cv.height = CS;
      const tx = canvasTexture(cv, aniso);
      canvases.push(cv); textures.push(tx);
      mats.push(new THREE.MeshBasicMaterial({ map: tx, toneMapped: false, color: 0x4d4d4d }));
    }
    // BoxGeometry material order: +x, -x, +y, -y, +z, -z
    const order = [mats[1], mats[3], mats[4], mats[5], mats[0], mats[2]];

    const grp = new THREE.Group();
    grp.position.copy(center);
    grp.lookAt(cam.x, 0, cam.z);
    const holder = new THREE.Group(); holder.position.y = BASE + CUBE / 2; grp.add(holder);
    const spin = new THREE.Group(); holder.add(spin);
    spin.add(new THREE.Mesh(new THREE.BoxGeometry(CUBE, CUBE, CUBE), order));

    // metal frame on the 12 edges, glowing strips, amber corner nodes
    const h = CUBE / 2 + 0.03, T = 0.13;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c2333, metalness: 0.85, roughness: 0.28 });
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x8fb0ff, transparent: true, opacity: 0.9, toneMapped: false });
    const nodeMat = new THREE.MeshStandardMaterial({ color: 0xffb547, emissive: 0xffb547, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.3 });
    const barGeo = new THREE.BoxGeometry(CUBE + T, T, T), stripGeo = new THREE.BoxGeometry(CUBE - 0.1, 0.035, 0.035), nodeGeo = new THREE.BoxGeometry(T * 1.5, T * 1.5, T * 1.5);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => {
      [["x", 0, a * h, b * h], ["y", a * h, 0, b * h], ["z", a * h, b * h, 0]].forEach(([axis, x, y, z]) => {
        const bar = new THREE.Mesh(barGeo, frameMat), strip = new THREE.Mesh(stripGeo, stripMat);
        bar.position.set(x, y, z);
        if (axis === "y") bar.rotation.z = Math.PI / 2;
        if (axis === "z") bar.rotation.y = Math.PI / 2;
        strip.position.copy(bar.position).multiplyScalar(1.022); strip.rotation.copy(bar.rotation);
        spin.add(bar, strip);
      });
    });
    [-1, 1].forEach((a) => [-1, 1].forEach((b) => [-1, 1].forEach((c) => {
      const n = new THREE.Mesh(nodeGeo, nodeMat); n.position.set(a * h, b * h, c * h); spin.add(n);
    })));
    const halo = new THREE.Mesh(new THREE.BoxGeometry(CUBE * 1.08, CUBE * 1.08, CUBE * 1.08), new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }));
    spin.add(halo);

    // orbit ring with satellites (keeps turning on its own)
    const orbit = new THREE.Group(); orbit.rotation.x = 0.42; orbit.rotation.z = -0.18; holder.add(orbit);
    orbit.add(new THREE.Mesh(new THREE.TorusGeometry(CUBE * 0.86, 0.025, 8, 140), new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })));
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const sat = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: k ? 0xbfd0ff : 0xffb547 }));
      sat.position.set(Math.cos(a) * CUBE * 0.86, 0, Math.sin(a) * CUBE * 0.86); orbit.add(sat);
    }

    // pedestal
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(CUBE * 0.36, CUBE * 0.43, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x151a26, metalness: 0.7, roughness: 0.3, emissive: 0x5b8cff, emissiveIntensity: 0.2 }));
    pad.position.y = 0.1; grp.add(pad);
    const ring = new THREE.Mesh(new THREE.RingGeometry(CUBE * 0.37, CUBE * 0.41, 6), new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.21; grp.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(CUBE * 0.22, CUBE * 0.32, BASE, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 0.2 + BASE / 2; grp.add(beam);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(CUBE * 1.6, CUBE * 1.6), new THREE.MeshBasicMaterial({ map: glowTexture("rgba(91,140,255,0.5)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.05; grp.add(pool);

    grp.traverse((o) => { o.userData.stop = i; o.userData.cube = true; });
    scene.add(grp);
    this.w.solids.push({ x: center.x, z: center.z, r: CUBE * 0.62 + 0.4 });

    return { grp, holder, spin, orbit, halo, stripMat, mats, canvases, textures, center: center.clone().setY(holder.position.y), baseY: holder.position.y, phase: i * 1.7, turn: 0, visited: false };
  }

  /** Index (0–3) of the face currently turned toward the camera. */
  face(i) { const c = this.items[i]; return c ? ((c.turn % 4) + 4) % 4 : 0; }

  /** Turn cube i by `steps` faces (negative = backwards). */
  turn(i, steps) {
    const c = this.items[i]; if (!c) return;
    c.turn += steps;
    const target = -c.turn * TURN;
    if (!reduce) {
      anime.remove(c.spin.rotation);
      anime({ targets: c.spin.rotation, y: target, duration: 1000 + Math.min(Math.abs(steps), 4) * 200, easing: "easeInOutBack" });
    } else c.spin.rotation.y = target;
    this.w.emit("face", { stop: i, face: this.face(i) });
  }

  tint(c, v) {
    c.mats.forEach((m) => {
      if (!reduce) { anime.remove(m.color); anime({ targets: m.color, r: v, g: v, b: v, duration: 700, easing: "easeOutQuad" }); }
      else m.color.setRGB(v, v, v);
    });
    c.stripMat.opacity = v > 0.9 ? 0.95 : 0.45;
    c.halo.material.opacity = v > 0.9 ? 0.1 : 0.03;
  }

  /** Highlight stop i; on the first visit the cube pops and spins onto its front face. */
  activate(i) {
    this.items.forEach((c, k) => {
      if (k !== i) { this.tint(c, c.visited ? 0.55 : 0.38); return; }
      this.tint(c, 1);
      if (!c.visited) { c.spin.rotation.y %= Math.PI * 2; c.turn = 0; }
      const back = (4 - (c.turn % 4)) % 4;
      this.turn(i, c.visited ? back : 4);
      if (!c.visited && !reduce) {
        anime.remove(c.holder.scale);
        anime({ targets: c.holder.scale, x: [0.4, 1], y: [0.4, 1], z: [0.4, 1], duration: 1300, easing: "easeOutElastic(1, .6)" });
      }
      c.visited = true;
    });
  }

  update(now, dt, activeIndex) {
    this.items.forEach((c, k) => {
      const still = k === activeIndex;
      if (!reduce) c.orbit.rotation.y += dt * (still ? 0.5 : 0.2);
      c.holder.position.y = c.baseY + (reduce || still ? 0 : Math.sin(now / 1100 + c.phase) * 0.14);
      c.holder.rotation.x = reduce || still ? 0 : Math.sin(now / 1700 + c.phase) * 0.04;
      if (!c.visited && !reduce) c.spin.rotation.y += dt * 0.25;     // waiting cubes idle-spin
    });
  }

  redrawAll() { this.items.forEach((_, i) => { for (let f = 0; f < 6; f++) this.drawFace(i, f); }); }

  /* ---------- face painting ---------- */
  drawFace(i, f) {
    const c = this.items[i], x = c.canvases[f].getContext("2d");
    const { stops, profile, stack } = this.w.data;
    const s = stops[i], P = 72, W = CS - P * 2;
    x.clearRect(0, 0, CS, CS);
    this.faceBackground(x, f < 4 ? f : -1);
    const heading = (t) => { x.font = font(600, 40, true); x.fillStyle = "#5B8CFF"; x.fillText(t, P, P + 40); };

    if (f === 4) {                      // top: stop number
      x.textAlign = "center";
      x.font = font(800, 300); x.fillStyle = "#F2F3F5"; x.fillText(String(i + 1).padStart(2, "0"), CS / 2, CS / 2 + 70);
      x.font = font(500, 40, true); x.fillStyle = "#FFB547"; x.fillText(s.label.toUpperCase(), CS / 2, CS / 2 + 190);
      x.textAlign = "left";
    } else if (f === 5) {
      /* bottom: frame only */
    } else if (s.kind === "intro") {
      if (f === 0) { chip(x, "DEVOPS ENGINEER", P, P + 6, "rgba(91,140,255,.2)", "#9DB8FF"); fitTitle(x, [{ text: "I keep" }, { text: "software" }, { text: "shipping.", accent: true }], P, P + 300, W, 150); }
      if (f === 1) { heading("ABOUT ME"); x.font = font(500, 48); x.fillStyle = "#E4E7EC"; wrapText(x, profile.about, P, P + 170, W, 70, 8); }
      if (f === 2) {
        heading("HOW TO DRIVE");
        [["↑ W", "accelerate"], ["↓ S", "brake / reverse"], ["←→ A D", "steer"], ["N / P", "next / previous stop"]].forEach(([k, label], n) => {
          const by = P + 110 + n * 190; card(x, P, by, W, 160);
          x.font = font(500, 44, true); x.fillStyle = "#FFB547"; x.fillText(k, P + 36, by + 98);
          x.font = font(500, 42); x.fillStyle = "#D5D8DE"; x.fillText(label, P + 360, by + 96);
        });
      }
      if (f === 3) { heading("TIP"); x.font = font(800, 96); x.fillStyle = "#F2F3F5"; wrapText(x, "Smash the bugs on the road.", P, P + 260, W, 104, 4); x.font = font(500, 40); x.fillStyle = "#A2A8B3"; x.fillText("Crates, walls and BUG cubes break.", P, CS - P - 20); }
    } else if (s.kind === "job") {
      const j = s.job;
      if (f === 0) {
        const cx = chip(x, `${j.start} — ${j.end}`.toUpperCase(), P, P + 6, "#FFB547", "#07080B");
        if (j.kind) chip(x, j.kind.toUpperCase(), cx + 12, P + 6, "rgba(91,140,255,.2)", "#9DB8FF");
        const y = fitTitle(x, [{ text: j.title }, { text: j.titleAccent, accent: true }], P, P + 280, W, 140);
        x.font = font(700, 52); x.fillStyle = "#F2F3F5"; wrapText(x, j.company, P, y + 50, W, 62, 1);
        x.font = font(400, 42); x.fillStyle = "#A2A8B3"; wrapText(x, j.place, P, y + 116, W, 54, 2);
      }
      if (f === 1) {
        heading("WHAT I DID");
        let y = P + 170;
        j.points.slice(0, 3).forEach((pt, k) => {
          x.font = font(600, 36, true); x.fillStyle = "#5B8CFF"; x.fillText("0" + (k + 1), P, y);
          x.font = font(500, 52); x.fillStyle = "#E4E7EC"; y = wrapText(x, pt, P + 90, y, W - 90, 68, 3) + 50;
        });
      }
      if (f === 2) {
        heading("IMPACT");
        j.facts.forEach(([value, label], k) => {
          const by = P + 100 + k * 265; card(x, P, by, W, 235);
          x.font = font(800, 110); x.fillStyle = k === 0 ? "#FFB547" : "#F2F3F5"; wrapText(x, value, P + 40, by + 140, W - 80, 110, 1);
          x.font = font(500, 36, true); x.fillStyle = "#A2A8B3"; x.fillText(label.toUpperCase(), P + 42, by + 205);
        });
      }
      if (f === 3) {
        heading("TOOLS USED");
        let px = P, py = P + 130;
        x.font = font(600, 46, true);
        j.stack.forEach((t) => {
          const w = x.measureText(t).width + 56;
          if (px + w > CS - P) { px = P; py += 110; }
          if (py > CS - P - 90) return;
          x.fillStyle = "rgba(91,140,255,.14)"; roundRect(x, px, py, w, 84, 14); x.fill();
          x.strokeStyle = "rgba(91,140,255,.6)"; x.lineWidth = 2; x.stroke();
          x.fillStyle = "#E4E7EC"; x.fillText(t, px + 28, py + 57); px += w + 18;
        });
      }
    } else if (s.kind === "stack") {
      if (f === 0) { chip(x, "TOOLCHAIN", P, P + 6, "rgba(91,140,255,.2)", "#9DB8FF"); fitTitle(x, [{ text: "The tools" }, { text: "I drive", accent: true }, { text: "every day." }], P, P + 300, W, 140); }
      if (f === 1 || f === 2) {
        heading(f === 1 ? "PLATFORM" : "DELIVERY & INSIGHT");
        stack.slice((f - 1) * 3, (f - 1) * 3 + 3).forEach(([cat, tools], k) => {
          const by = P + 100 + k * 265; card(x, P, by, W, 235);
          x.font = font(500, 30, true); x.fillStyle = "#5B8CFF"; x.fillText(cat.toUpperCase(), P + 40, by + 70);
          x.font = font(600, 46); x.fillStyle = "#F2F3F5"; wrapText(x, tools, P + 40, by + 136, W - 80, 56, 2);
        });
      }
      if (f === 3) { heading("ALWAYS"); x.font = font(800, 120); x.fillStyle = "#F2F3F5"; wrapText(x, "learning the next tool.", P, P + 280, W, 126, 4); }
    } else {
      if (f === 0) { chip(x, "DESTINATION", P, P + 6, "#FFB547", "#07080B"); fitTitle(x, [{ text: "Let’s" }, { text: "build your" }, { text: "next one.", accent: true }], P, P + 300, W, 150); }
      if (f === 1 || f === 2) {
        heading(f === 1 ? "REACH ME" : "FIND ME");
        const rows = f === 1 ? [["EMAIL", profile.email], ["LINKEDIN", profile.linkedin.label]] : [["GITHUB", profile.github.label], ["BASED IN", profile.location]];
        rows.forEach(([label, value], k) => {
          const by = P + 110 + k * 380; card(x, P, by, W, 340);
          x.font = font(500, 30, true); x.fillStyle = "#A2A8B3"; x.fillText(label, P + 40, by + 80);
          x.font = font(700, 56); x.fillStyle = "#F2F3F5"; wrapText(x, value, P + 40, by + 170, W - 80, 66, 2);
        });
      }
      if (f === 3) { heading("CONTACT"); x.font = font(800, 104); x.fillStyle = "#F2F3F5"; wrapText(x, "Use the panel to copy or open.", P, P + 260, W, 112, 5); }
    }
    c.textures[f].needsUpdate = true;
  }

  faceBackground(x, f) {
    const g = x.createLinearGradient(0, 0, CS, CS);
    g.addColorStop(0, "#131A2C"); g.addColorStop(1, "#090C14");
    x.fillStyle = g; x.fillRect(0, 0, CS, CS);
    x.strokeStyle = "rgba(91,140,255,.65)"; x.lineWidth = 10; x.strokeRect(5, 5, CS - 10, CS - 10);
    x.strokeStyle = "rgba(91,140,255,.18)"; x.lineWidth = 2; x.strokeRect(26, 26, CS - 52, CS - 52);
    if (f >= 0) for (let d = 0; d < 4; d++) {   // face indicator dots
      x.fillStyle = d === f ? "#FFB547" : "rgba(242,243,245,.22)";
      x.fillRect(CS - 80 - (3 - d) * 34, 74, 24, 7);
    }
  }
}
