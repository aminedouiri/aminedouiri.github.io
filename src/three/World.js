/*
 * World: owns the three.js scene, the vehicle, driving, the camera and the render loop.
 * React never touches three.js directly — it calls the public methods below and listens to events.
 *
 * Events (onEvent(type, payload)):
 *   "stop"  { index }                    the current stop changed
 *   "face"  { stop, face }               a cube turned to another face (0–3)
 *   "view"  null | { type: "stop", index } | { type: "tech", index }   which info panel should show
 *   "mode"  { manual }                   auto-drive vs free roam
 *   "hud"   { speed, odo, hits }         ~10 times a second
 *   "smash" { wide }                     an obstacle was hit
 * onFrame({ progress, link }) is called every frame for things that move continuously
 * (timeline puck, the line from the panel to the 3D object).
 */
import * as THREE from "three";
import anime from "animejs";
import { buildEnvironment, applyTheme, FOG_NEAR, FOG_FAR } from "./world/environment.js";
import { WORLDS } from "./world/themes.js";
import { ROAD_W, makeCurve, makeRoute, buildRoad } from "./world/road.js";
import { buildCity } from "./world/city.js";
import { Checkpoints } from "./world/checkpoints.js";
import { InfoCubes } from "./world/infoCubes.js";
import { Obstacles } from "./world/obstacles.js";
import { buildMarker } from "./world/car.js";
import { buildVehicle } from "./world/vehicles.js";
import { buildLandmarks, setZoom, FOCUS_ZOOM } from "./landmarks/index.js";
import { reduceMotion as reduce, isMobile, clamp, smoothstep } from "./utils/motion.js";

const Y = new THREE.Vector3(0, 1, 0);

export class World {
  /**
   * @param {object} o
   * @param {HTMLCanvasElement} o.canvas
   * @param {{ stops: any[], tech: any[], profile: any, stack: any[] }} o.data
   * @param {() => DOMRect | null} o.getPanelRect  where the info panel is (so the car is never hidden behind it)
   * @param {() => {left:number,right:number,top:number,bottom:number} | null} [o.getSafeArea]
   *        the part of the screen not covered by UI (px); landmark close-ups are centred in it
   * @param {(type: string, payload: any) => void} o.onEvent
   * @param {(f: { progress: number, link: {x:number,y:number} | null }) => void} o.onFrame
   * @param {string} [o.vehicle]  id from world/vehicles.js (default "car")
   * @param {string} [o.world]    id from world/themes.js (default "night")
   */
  constructor({ canvas, data, getPanelRect, getSafeArea, onEvent, onFrame, vehicle = "car", world = "night" }) {
    this.data = data;
    this.getPanelRect = getPanelRect;
    this.getSafeArea = getSafeArea || (() => null);
    this.frameCam = new THREE.PerspectiveCamera();
    this.frameCache = { key: "", at: 0, pos: null, look: null };
    this.onEvent = onEvent || (() => {});
    this.onFrame = onFrame || (() => {});
    this.ROAD_W = ROAD_W;

    // shared registries used by the builders
    this.anims = [];      // per-frame landmark animations: (timeSeconds) => void
    this.solids = [];     // round obstacles the free-driving car bounces off: { x, z, r }
    this.clutter = [];    // objects hidden in focus mode

    // state
    this.index = -1;                    // current stop
    this.manual = false;                // free roam?
    this.drive = { t: 0 };              // position along the road (0..1), animated in auto mode
    this.free = { x: 0, z: 0, yaw: 0, blend: 0 };   // free-roam pose; blend 1 = fully free
    this.ctl = { up: false, down: false, left: false, right: false };
    this.vel = 0; this.lat = 0; this.steer = 0; this.shake = 0; this.dir = 1; this.spd = 0; this.hits = 0;
    this.techFocus = -1; this.nearTech = -1; this.focusOn = -1; this.fogMix = 0;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.view = null; this.viewKey = ""; this.parkedAt = -1;
    this.lookFix = new THREE.Vector3();
    this.lastHud = 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);

    const n = data.stops.length;
    this.stopT = data.stops.map((_, i) => 0.06 + i * (0.86 / (n - 1)));
    this.drive.t = this.stopT[0];
    this.curve = makeCurve(n);
    this.curveLen = this.curve.getLength();
    const route = makeRoute(this.curve);
    this.bounds = route.bounds;
    this.nearestT = route.nearestT;
    this.stopPts = this.stopT.map((t) => this.curve.getPointAt(t));

    this.env = buildEnvironment(this.scene);
    this.theme = WORLDS.find((w) => w.id === world) || WORLDS[0];
    applyTheme(this.env, this.scene, this.renderer, this.theme);
    const road = buildRoad(this);
    this.doneLine = road.doneLine; this.doneCount = road.doneCount;
    buildCity(this);
    this.checkpoints = new Checkpoints(this);
    this.cubes = new InfoCubes(this);
    this.obstacles = new Obstacles(this);
    this.landmarks = buildLandmarks(this);

    this.vehicleId = vehicle;
    this.vehicle = buildVehicle(vehicle);
    this.car = this.vehicle.group;           // "car" = whatever vehicle is being driven
    this.scene.add(this.car);
    this.marker = buildMarker(this.scene);
    const p0 = this.curve.getPointAt(this.drive.t), t0 = this.curve.getTangentAt(this.drive.t);
    this.car.position.copy(p0); this.car.lookAt(p0.clone().add(t0));
    this.camPos = p0.clone().add(new THREE.Vector3(8, 5, 10));
    this.camLook = p0.clone();
    this.lastT = this.drive.t;
    this.lastCp = null;
    this.dummy = new THREE.Object3D();

    this.onResize = () => this.resize();
    this.onPointer = (e) => { this.mouse.tx = e.clientX / window.innerWidth - 0.5; this.mouse.ty = e.clientY / window.innerHeight - 0.5; };
    this.onClick = (e) => this.pick(e);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointer);
    canvas.addEventListener("click", this.onClick);
    this.resize();
  }

  /* ================= public API ================= */

  start() {
    this.last = performance.now();
    const loop = (now) => { this.frame(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointer);
    this.renderer.domElement.removeEventListener("click", this.onClick);
    anime.remove([this.drive, this.free]);
    this.renderer.dispose();
  }

  get stopCount() { return this.data.stops.length; }

  /** Auto-drive to stop i. */
  goStop(i) {
    i = clamp(i, 0, this.stopCount - 1);
    this.techFocus = -1;
    if (i === this.index && Math.abs(this.drive.t - this.stopT[i]) < 1e-4 && this.free.blend < 0.001) return;
    this.leaveFree();
    const first = this.index < 0;
    this.setActive(i, false);
    const span = Math.abs(this.stopT[i] - this.drive.t);
    if (!reduce && !first) {
      anime.remove(this.drive);
      anime({ targets: this.drive, t: this.stopT[i], duration: 1300 + span * 3600, easing: "easeInOutCubic", complete: () => { if (this.index === i && !this.manual) this.arrive(i); } });
    } else { this.drive.t = this.stopT[i]; this.arrive(i); }
  }
  next() { this.goStop(this.index + 1); }
  prev() { this.goStop(this.index - 1); }

  /** Drive to a tech / framework landmark, leave the road and park in front of it. */
  goTech(k) {
    const lm = this.landmarks[k];
    if (!lm) return;
    const fromFree = this.free.blend > 0.001;
    this.setMode(false); this.vel = 0; this.lat = 0; this.techFocus = k;
    anime.remove([this.drive, this.free]);
    const park = () => {
      const p = this.curve.getPointAt(this.drive.t), tg = this.curve.getTangentAt(this.drive.t);
      if (this.free.blend < 0.999) { this.free.x = p.x; this.free.z = p.z; this.free.yaw = Math.atan2(tg.x * this.dir, tg.z * this.dir); this.free.blend = 1; }
      let yaw = Math.atan2(lm.g.position.x - lm.park.x, lm.g.position.z - lm.park.z);
      while (yaw - this.free.yaw > Math.PI) yaw -= Math.PI * 2;
      while (yaw - this.free.yaw < -Math.PI) yaw += Math.PI * 2;
      if (!reduce) anime({ targets: this.free, x: lm.park.x, z: lm.park.z, yaw, duration: 1500, easing: "easeInOutCubic" });
      else Object.assign(this.free, { x: lm.park.x, z: lm.park.z, yaw });
    };
    if (fromFree) { park(); return; }
    const span = Math.abs(lm.t - this.drive.t);
    if (!reduce && span > 0.002) anime({ targets: this.drive, t: lm.t, duration: 1100 + span * 3400, easing: "easeInOutCubic", complete: () => { if (this.techFocus === k && !this.manual) park(); } });
    else { this.drive.t = lm.t; park(); }
  }

  /** Swap the vehicle being driven (keeps position and heading). */
  setVehicle(id) {
    if (id === this.vehicleId) return;
    const next = buildVehicle(id);
    next.group.position.copy(this.car.position);
    next.group.quaternion.copy(this.car.quaternion);
    this.scene.remove(this.car);
    this.car.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.vehicleId = id; this.vehicle = next; this.car = next.group;
    this.scene.add(this.car);
  }

  /** Change the world theme with a short colour fade. */
  setWorld(id) {
    const to = WORLDS.find((w) => w.id === id);
    if (!to || to === this.theme) return;
    const from = this.theme; this.theme = to;
    if (reduce) { applyTheme(this.env, this.scene, this.renderer, to); return; }
    const mix = { k: 0 };
    anime.remove(this.themeMix);
    this.themeMix = mix;
    anime({ targets: mix, k: 1, duration: 900, easing: "easeInOutQuad",
      update: () => applyTheme(this.env, this.scene, this.renderer, to, from, mix.k) });
  }

  /** Turn the current stop's cube by delta faces, or straight to face f. */
  turnFace(delta) { if (this.index >= 0) this.cubes.turn(this.index, delta); }
  setFace(f) {
    if (this.index < 0) return;
    let d = (f - this.cubes.face(this.index) + 4) % 4;
    if (d === 3) d = -1;
    if (d) this.cubes.turn(this.index, d);
  }
  currentFace() { return this.index >= 0 ? this.cubes.face(this.index) : 0; }

  /** Drive controls: name = up | down | left | right. */
  setControl(name, on) { if (name in this.ctl) this.ctl[name] = on; }
  releaseControls() { Object.keys(this.ctl).forEach((k) => { this.ctl[k] = false; }); }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = isMobile() ? 55 : 42;
    this.camera.updateProjectionMatrix();
  }

  /* ================= internals ================= */

  emit(type, payload) { this.onEvent(type, payload); }

  setMode(manual) {
    if (this.manual === manual) return;
    this.manual = manual;
    this.emit("mode", { manual });
  }

  setActive(i, arriving) {
    if (i === this.index) return;
    this.index = i;
    this.cubes.activate(i);
    this.checkpoints.setActive(i);
    if (arriving) this.arrive(i);
    this.emit("stop", { index: i });
  }

  arrive(i) { this.checkpoints.arrive(i); }

  /** Return the car to the road (when leaving free roam or a landmark). */
  leaveFree() {
    const wasFree = this.free.blend > 0.001;
    this.setMode(false); this.vel = 0; this.lat = 0;
    if (!wasFree) return;
    this.drive.t = this.nearestT(this.car.position.x, this.car.position.z);
    anime.remove(this.free);
    if (!reduce) anime({ targets: this.free, blend: 0, duration: 1100, easing: "easeInOutQuad" });
    else this.free.blend = 0;
  }

  /** Click on a cube (turn it / go there), an arch (go there) or a landmark (go there). */
  pick(e) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1), this.camera);
    const stopHit = ray.intersectObjects(this.checkpoints.gates.map((g) => g.g).concat(this.cubes.items.map((c) => c.grp)), true)[0];
    const techTargets = this.landmarks.filter((lm, k) => lm && !this.data.tech[k].alias).map((lm) => lm.g);
    const techHit = ray.intersectObjects(techTargets, true)[0];
    if (techHit && (!stopHit || techHit.distance < stopHit.distance)) { this.goTech(techHit.object.userData.tech); return; }
    if (!stopHit) return;
    const st = stopHit.object.userData.stop;
    if (stopHit.object.userData.cube && st === this.index) this.cubes.turn(st, 1);
    else this.goStop(st);
  }

  /** Free-roam physics (arrow keys / WASD / on-screen pad). */
  driveManual(dt) {
    const { ctl, free } = this;
    const anyKey = ctl.up || ctl.down || ctl.left || ctl.right;
    if (anyKey && !this.manual) {
      this.setMode(true);
      this.techFocus = -1;
      anime.remove([this.drive, this.free]);
      const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(this.car.quaternion);
      Object.assign(free, { x: this.car.position.x, z: this.car.position.z, yaw: Math.atan2(fw.x, fw.z), blend: 1 });
      this.lat = 0; this.vel = this.spd * (this.dir >= 0 ? 1 : -1) * 0.5;
    }
    if (!this.manual) {
      this.lat += (0 - this.lat) * Math.min(1, dt * 2);
      this.steer += (0 - this.steer) * Math.min(1, dt * 8);
      return;
    }
    const ACC = 15, MAX_FWD = 22, MAX_REV = -7;
    if (ctl.up) this.vel += ACC * dt;
    else if (ctl.down) this.vel -= (this.vel > 0 ? ACC * 1.7 : ACC * 0.7) * dt;
    this.vel *= 1 - Math.min(1, dt * (ctl.up || ctl.down ? 0.35 : 1.3));
    this.vel = clamp(this.vel, MAX_REV, MAX_FWD);
    if (Math.abs(this.vel) < 0.03 && !ctl.up && !ctl.down) this.vel = 0;
    const want = (ctl.left ? 1 : 0) - (ctl.right ? 1 : 0);
    this.steer += (want - this.steer) * Math.min(1, dt * 7);
    free.yaw += this.steer * 1.9 * dt * clamp(this.vel / 5, -1, 1);   // turn rate grows with speed
    let nx = free.x + Math.sin(free.yaw) * this.vel * dt, nz = free.z + Math.cos(free.yaw) * this.vel * dt;
    const b = this.bounds;
    if (nx < b.minX || nx > b.maxX || nz < b.minZ || nz > b.maxZ) {
      this.vel *= -0.3; nx = clamp(nx, b.minX, b.maxX); nz = clamp(nz, b.minZ, b.maxZ); this.shake = 0.2;
    }
    for (const o of this.solids) {
      const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz);
      if (d < o.r) { nx = o.x + (dx / (d || 1)) * o.r; nz = o.z + (dz / (d || 1)) * o.r; if (Math.abs(this.vel) > 2) this.shake = 0.22; this.vel *= -0.25; }
    }
    free.x = nx; free.z = nz;
    this.drive.t = this.nearestT(nx, nz);
    // reaching a stop opens that part of the story
    let near = -1, best = 7.5;
    this.stopPts.forEach((sp, k) => { const d = Math.hypot(sp.x - nx, sp.z - nz); if (d < best) { best = d; near = k; } });
    if (near >= 0 && near !== this.index) this.setActive(near, true);
  }

  /** Hide everything except the chosen landmark and pull the fog in (or undo it with k = -1). */
  applyFocus(k, dt) {
    if (k !== this.focusOn) {
      this.focusOn = k;
      const keep = k >= 0 ? this.landmarks[k].g : null;
      const all = [
        ...this.clutter,
        ...this.cubes.items.map((c) => c.grp),
        ...this.checkpoints.towers.map((t) => t.g),
        ...this.checkpoints.gates.map((g) => g.g),
        ...this.landmarks.filter(Boolean).map((lm) => lm.g),
      ];
      all.forEach((o) => { if (o !== keep) o.visible = k < 0; });
      if (keep) keep.visible = true;
    }
    // the focused landmark grows smoothly; the others go back to normal size
    const focused = k >= 0 ? this.landmarks[k] : null;
    new Set(this.landmarks.filter(Boolean)).forEach((lm) => {
      const want = lm === focused ? FOCUS_ZOOM : 1;
      if (Math.abs(lm.zoom - want) < 0.002) { if (lm.zoom !== want) setZoom(lm, want); return; }
      setZoom(lm, reduce ? want : lm.zoom + (want - lm.zoom) * Math.min(1, dt * 4));
    });
    this.fogMix += ((k >= 0 ? 1 : 0) - this.fogMix) * Math.min(1, dt * 3);
    this.scene.fog.near = FOG_NEAR + (9 - FOG_NEAR) * this.fogMix;
    this.scene.fog.far = FOG_FAR + (36 - FOG_FAR) * this.fogMix;
  }

  setView(view) {
    const key = view ? view.type + view.index : "";
    if (key === this.viewKey) return;
    this.viewKey = key; this.view = view;
    this.emit("view", view);
  }

  /* ================= frame ================= */

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const m = this.mouse, k = 1 - Math.pow(0.003, dt);
    m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k;

    this.driveManual(dt);
    const t = clamp(this.drive.t, 0, 1);
    const moved = t - this.lastT; this.lastT = t;
    if (!this.manual && Math.abs(moved) > 1e-6) this.dir = moved > 0 ? 1 : -1;
    if (this.manual && Math.abs(this.vel) > 0.05) this.dir = this.vel > 0 ? 1 : -1;
    const travel = this.manual ? Math.abs(this.vel) * dt : Math.abs(moved) * this.curveLen;
    this.spd += (travel / Math.max(dt, 1e-3) - this.spd) * Math.min(1, dt * 6);

    const cp = this.updateCar(t, dt, now, travel);
    this.updateWorld(now, dt, t, cp);
    this.updateCamera(now, dt, t, cp);

    // keep the car on screen; tell the UI where things are
    const link = this.screenPoint(this.view ? (this.view.type === "tech" ? this.landmarks[this.view.index]?.center : this.cubes.items[this.view.index]?.center) : null);
    this.keepCarVisible(cp, dt);
    this.renderer.render(this.scene, this.camera);

    const span = this.stopT[this.stopT.length - 1] - this.stopT[0];
    this.onFrame({ progress: clamp((t - this.stopT[0]) / span, 0, 1) * 100, link });
    if (now - this.lastHud > 100) {
      this.lastHud = now;
      this.emit("hud", { speed: Math.round(this.spd * 9), odo: (t * this.curveLen * 0.05).toFixed(1), hits: this.hits });
    }
  }

  updateCar(t, dt, now, travel) {
    const { curve, free } = this;
    const p = curve.getPointAt(t), tg = curve.getTangentAt(t);
    const right = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
    const roadPos = p.clone().addScaledVector(right, this.lat);
    const freeFwd = new THREE.Vector3(Math.sin(free.yaw), 0, Math.cos(free.yaw));
    const cp = roadPos.clone().lerp(new THREE.Vector3(free.x, 0, free.z), free.blend);
    const glide = !this.manual && this.lastCp && free.blend > 0.999 ? Math.hypot(cp.x - this.lastCp.x, cp.z - this.lastCp.z) : 0;
    this.lastCp = cp.clone();
    const fwd = tg.clone().multiplyScalar(this.dir).lerp(freeFwd, free.blend).normalize();
    this.fwdFree = freeFwd; this.tangent = tg;

    this.dummy.position.copy(cp);
    this.dummy.lookAt(cp.clone().add(fwd));
    if (!this.manual) this.dummy.rotateY(-this.steer * 0.28 * Math.min(1, this.spd / 4) * this.dir);
    this.car.position.copy(cp);
    this.car.quaternion.slerp(this.dummy.quaternion, 1 - Math.pow(0.0004, dt));
    this.vehicle.animate({ travel: travel + glide, turn: this.manual ? this.steer : -this.steer, spd: this.spd, dir: this.dir, now, reduce });

    const hit = this.obstacles.collide(cp, fwd.clone().multiplyScalar(this.manual ? this.dir : 1), this.spd, this.manual);
    if (hit) {
      this.hits++;
      this.shake = Math.max(this.shake, hit.breaks ? (hit.wide ? 0.3 : 0.18) : 0.12);
      if (this.manual) this.vel *= hit.breaks ? (hit.wide ? 0.55 : 0.8) : 0.75;
      this.emit("smash", { wide: hit.breaks && hit.wide });
    }
    this.marker.update(cp, now, reduce, this.spd > 0.15 || glide > 1e-4, this.vehicle.markerY);
    return cp;
  }

  updateWorld(now, dt, t, cp) {
    this.doneLine.geometry.setDrawRange(0, Math.floor(t * this.doneCount));
    this.cubes.update(now, dt, this.index);
    this.obstacles.update(dt, now);
    if (!reduce) { const ts = now / 1000; this.anims.forEach((fn) => fn(ts)); }

    // which landmark (if any) is the car parked at?
    this.nearTech = -1;
    this.landmarks.forEach((lm, k) => {
      if (!lm || (this.data.tech[k].alias && this.techFocus !== k)) return;
      const parkedAuto = this.techFocus === k && !this.manual && Math.hypot(cp.x - lm.park.x, cp.z - lm.park.z) < 1.2;
      const nearManual = this.manual && Math.hypot(cp.x - lm.g.position.x, cp.z - lm.g.position.z) < 9 && Math.abs(this.vel) < 1.5;
      if (parkedAuto || nearManual) this.nearTech = k;
    });
    const sp = this.stopPts[this.index];
    const atStop = sp && Math.hypot(cp.x - sp.x, cp.z - sp.z) < 2.5 && Math.abs(this.vel) < 1.5;
    if (this.nearTech >= 0) this.setView({ type: "tech", index: this.nearTech });
    else if (atStop && this.cubes.items[this.index]?.visited) this.setView({ type: "stop", index: this.index });
    else this.setView(null);
  }

  updateCamera(now, dt, t, cp) {
    const { camera, mouse: m } = this;
    const mobile = isMobile();
    // chase camera: follows the road in auto, the car's heading in free roam
    const camT = this.tangent.clone().lerp(this.fwdFree, this.free.blend).normalize();
    const right = new THREE.Vector3(-camT.z, 0, camT.x).normalize();
    const still = this.parkedAt >= 0 ? 0 : 1;               // 0 while parked at a landmark: no drift, no mouse sway
    const orbit = reduce ? 0 : Math.sin(now / 5000) * 0.8 * still;
    const pull = Math.min(4, this.spd * 0.3);
    let wantPos = cp.clone().addScaledVector(camT, -(4.2 + pull) + orbit).addScaledVector(right, 3.3 + m.x * 1.6 * still).add(new THREE.Vector3(0, 2.3 + pull * 0.25 - m.y * 0.6 * still, 0));
    let look = cp.clone().addScaledVector(camT, 2.4).add(new THREE.Vector3(0, 0.3, 0));

    // parked at a stop: frame the car and its cube together
    const cube = this.cubes.items[this.index];
    if (cube) {
      const stp = this.stopPts[this.index];
      let f = smoothstep(clamp(1 - Math.hypot(cp.x - stp.x, cp.z - stp.z) / 5, 0, 1));
      if (this.manual) f *= Math.max(0, 1 - Math.abs(this.vel) / 1.5) * 0.85;
      const sp = this.cubes.stopCamera(this.index).add(new THREE.Vector3(0, -m.y * 0.5, 0)).addScaledVector(right, m.x * 1.2);
      const sLook = cube.center.clone().lerp(cp, 0.5);
      sLook.y = mobile ? 0.4 : 1.0;
      const camR = new THREE.Vector3().crossVectors(sLook.clone().sub(sp).normalize(), Y).normalize();
      if (mobile) sLook.y -= 1.4; else sLook.addScaledVector(camR, -1.5);
      wantPos.lerp(sp, f); look.lerp(sLook, f);
    }

    // parked at a landmark: steady close-up, whole shape + car centred in the free part of the screen
    const tgt = this.nearTech >= 0 ? this.nearTech : this.techFocus >= 0 && !this.manual && this.free.blend > 0.5 ? this.techFocus : -1;
    let focusAmt = 0;
    if (tgt >= 0) {
      const lm = this.landmarks[tgt];
      const fr = this.frameLandmark(tgt, lm, now);
      const near = Math.hypot(cp.x - lm.park.x, cp.z - lm.park.z);
      const tf = smoothstep(this.manual ? 0.7 : clamp(1 - (near - 1) / 10, 0, 1));
      focusAmt = this.manual ? (Math.abs(this.vel) < 1.5 ? 1 : 0) : clamp(1 - (near - 1) / 4, 0, 1);
      wantPos.lerp(fr.pos, tf); look.lerp(fr.look, tf);
    }
    this.applyFocus(focusAmt > 0.55 ? tgt : -1, dt);
    this.parkedAt = focusAmt > 0.55 ? tgt : -1;

    const ck = 1 - Math.pow(0.03, dt);
    this.wantLook = look.clone();
    look.add(this.lookFix);
    this.camPos.lerp(wantPos, ck); this.camLook.lerp(look, ck);
    camera.position.copy(this.camPos);
    if (this.parkedAt >= 0) this.shake = 0;
    if (this.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * this.shake;
      camera.position.y += (Math.random() - 0.5) * this.shake;
      this.shake = Math.max(0, this.shake - dt * 1.2);
    }
    camera.lookAt(this.camLook);
    this.checkpoints.update(now, dt, this.index, camera);
  }

  /**
   * Camera pose that shows a landmark (title and badge included) and the parked car,
   * as large as possible inside the screen area left free by the UI.
   * Cached and refreshed a few times a second (the UI can change size).
   */
  frameLandmark(k, lm, now) {
    const W = window.innerWidth, H = window.innerHeight;
    const safe = this.getSafeArea() || { left: 40, right: W - 40, top: 90, bottom: H - 100 };
    const key = [k, W, H, Math.round(safe.left), Math.round(safe.right), Math.round(safe.top), Math.round(safe.bottom)].join(",");
    const c = this.frameCache;
    if (c.key === key && now - c.at < 400) return c;

    // points that must be on screen: the shape's measured box (at focused size) and the car
    const pts = [];
    lm.g.updateMatrixWorld();
    const b = lm.bounds;
    [b.min.x, b.max.x].forEach((x) => [b.min.y, b.max.y].forEach((y) => [b.min.z, b.max.z].forEach((z) => {
      pts.push(lm.g.localToWorld(new THREE.Vector3(x, Math.max(0, y), z).multiplyScalar(FOCUS_ZOOM)));
    })));
    [-1, 1].forEach((a) => [-1, 1].forEach((c) => [0, 0.5].forEach((y) => {
      pts.push(lm.park.clone().addScaledVector(lm.side, a * 0.6).addScaledVector(lm.toRoad, c * 0.6).setY(y));
    })));
    const box = new THREE.Box3().setFromPoints(pts);
    const target = box.getCenter(new THREE.Vector3());

    // view direction: slightly from the side and from above
    const flat = lm.toRoad.clone().applyAxisAngle(Y, 0.3);
    const dir = flat.multiplyScalar(Math.cos(0.32)).add(new THREE.Vector3(0, Math.sin(0.32), 0)).normalize();

    // usable screen rect in normalised device coordinates (-1 … 1), with a little breathing room
    const pad = 16;
    const uL = ((safe.left + pad) / W) * 2 - 1, uR = ((safe.right - pad) / W) * 2 - 1;
    const uT = 1 - ((safe.top + pad) / H) * 2, uB = 1 - ((safe.bottom - pad) / H) * 2;

    const cam = this.frameCam;
    cam.fov = this.camera.fov; cam.aspect = this.camera.aspect; cam.near = 0.1; cam.far = 400; cam.updateProjectionMatrix();
    const v = new THREE.Vector3();
    const bounds = () => {
      cam.updateMatrixWorld();
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      pts.forEach((p) => { v.copy(p).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); });
      return { x0, x1, y0, y1 };
    };
    const place = (D, shift) => { cam.position.copy(target).addScaledVector(dir, D).add(shift); cam.lookAt(v.copy(target).add(shift)); };

    // 1) closest distance at which everything fits the usable size
    const zero = new THREE.Vector3();
    let lo = 2, hi = 80;
    for (let i = 0; i < 22; i++) {
      const D = (lo + hi) / 2; place(D, zero);
      const b = bounds();
      if (b.x1 - b.x0 <= uR - uL && b.y1 - b.y0 <= uT - uB) hi = D; else lo = D;
    }
    const D = hi;

    // 2) slide the camera sideways / up-down so the shapes sit in the middle of the usable rect
    const right = new THREE.Vector3().crossVectors(dir.clone().negate(), Y).normalize();
    const up = new THREE.Vector3().crossVectors(right, dir.clone().negate()).normalize();
    const halfH = D * Math.tan((cam.fov * Math.PI) / 360), halfW = halfH * cam.aspect;
    const shift = new THREE.Vector3();
    for (let i = 0; i < 3; i++) {
      place(D, shift);
      const b = bounds();
      const dx = (b.x0 + b.x1) / 2 - (uL + uR) / 2, dy = (b.y0 + b.y1) / 2 - (uT + uB) / 2;
      shift.addScaledVector(right, dx * halfW).addScaledVector(up, dy * halfH);
    }

    c.key = key; c.at = now;
    c.pos = target.clone().addScaledVector(dir, D).add(shift);
    c.look = target.clone().add(shift);
    return c;
  }

  /** If the car slips behind the panel or off-screen, steer the view back to it. */
  keepCarVisible(cp, dt) {
    const { camera } = this;
    camera.updateMatrixWorld();
    const v = cp.clone(); v.y += 0.3; v.project(camera);
    const sx = ((v.x + 1) / 2) * window.innerWidth, sy = ((1 - v.y) / 2) * window.innerHeight;
    let L = 40, R = window.innerWidth - 40, T = 96, B = window.innerHeight - 110;
    const r = this.view ? this.getPanelRect() : null;
    if (r) { if (isMobile()) B = Math.min(B, r.top - 20); else L = Math.max(L, r.right + 40); }
    if (this.parkedAt >= 0) return;                         // parked: keep the framing steady
    const out = v.z > 1 || sx < L || sx > R || sy < T || sy > B;
    if (out) this.lookFix.lerp(cp.clone().setY(0.4).sub(this.wantLook), Math.min(1, dt * 4));
    else this.lookFix.multiplyScalar(1 - Math.min(1, dt * 0.35));
  }

  /** World point → screen pixels (null when behind the camera or missing). */
  screenPoint(p) {
    if (!p) return null;
    const v = p.clone().project(this.camera);
    if (v.z > 1) return null;
    return { x: ((v.x + 1) / 2) * window.innerWidth, y: ((1 - v.y) / 2) * window.innerHeight };
  }
}
