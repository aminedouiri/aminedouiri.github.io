import * as THREE from "three";
import { glowMat, darkMat, addTag, framedBox, line3, rack } from "../helpers.js";
import { canvasTexture, font } from "../../utils/textures.js";

/**
 * Linux system administration, told by a terminal: every STEP seconds a new command runs and the part of the
 * server it touches reacts —
 *   dnf install (packages → /usr) · vim (/etc) · systemctl (systemd units) · firewall-cmd (firewalld zones / ports) ·
 *   useradd (users, groups, /home) · chown / chmod (permissions) · lvextend (disks → LVM) · ip / nmcli (network) ·
 *   top / kill (processes) · journalctl (logs).
 * Also shown: the directory tree, SSH key login, cron jobs and SELinux.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
const STEP = 2.6;

const COMMANDS = [
  ["dnf install -y nginx", ["Installing: nginx-1.24   [appstream]", "Complete!"]],
  ["vim /etc/nginx/nginx.conf", ["-- INSERT --", "server_name app.example.com;"]],
  ["systemctl enable --now nginx", ["Created symlink …/multi-user.target.wants/nginx.service", "● nginx.service — active (running)"]],
  ["firewall-cmd --permanent --add-service=https", ["success", "firewall-cmd --reload → success"]],
  ["useradd -m -G wheel amine && passwd amine", ["home /home/amine · groups amine,wheel", "passwd: all authentication tokens updated"]],
  ["chown -R amine:deploy /srv/app && chmod 750 /srv/app", ["drwxr-x---  amine deploy  /srv/app", ""]],
  ["lvextend -r -L +10G /dev/vg0/data", ["vg0/data changed to 30.00 GiB", "resize2fs: filesystem resized"]],
  ["ip -br addr && nmcli con show", ["eth0   UP   10.0.10.21/24", "eth1   UP   10.0.20.21/24"]],
  ["top   →   kill -15 4242", ["4242 backup.sh   98.7 %CPU", "Terminated"]],
  ["journalctl -u nginx -f", ["nginx: GET /health 200", "nginx: upstream timed out (110)"]],
];

function terminalTexture(step) {
  const c = document.createElement("canvas"); c.width = 1200; c.height = 620;
  const x = c.getContext("2d");
  x.fillStyle = "#0b0f1a"; x.fillRect(0, 0, 1200, 620);
  x.fillStyle = "#151c2e"; x.fillRect(0, 0, 1200, 64);
  ["#FF6B5D", "#FFB547", "#38D98A"].forEach((col, k) => { x.fillStyle = col; x.beginPath(); x.arc(40 + k * 34, 32, 11, 0, Math.PI * 2); x.fill(); });
  x.font = font(600, 28, true); x.fillStyle = "#8B93A7"; x.fillText("root@srv01: ~   (bash)", 160, 42);
  x.font = font(500, 32, true);
  let y = 120;
  for (let k = Math.max(0, step - 2); k < step; k++) { x.fillStyle = "#4b5468"; x.fillText("# " + COMMANDS[k][0], 32, y); y += 52; }
  const [cmd, out] = COMMANDS[step];
  x.fillStyle = "#38D98A"; x.fillText("root@srv01:~#", 32, y);
  x.fillStyle = "#F2F3F5"; x.fillText(cmd, 290, y); y += 60;
  out.forEach((line) => { x.fillStyle = /timed out|Terminated/.test(line) ? "#FF6B5D" : /active|success|Complete|resized/.test(line) ? "#38D98A" : "#BFD0FF"; x.fillText(line, 32, y); y += 52; });
  return canvasTexture(c, 4);
}

export function linux(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, PALE = 0xBFD0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, RED = 0xFF6B5D, VIOLET = 0xB58CFF, GREY = 0x3a4152;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const dot = (col, r = 0.06) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };
  const tube = (c, col, op = 0.3, r = 0.014) => g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, r, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })));

  // ================= terminal (top centre) =================
  const T = V(0.1, 3.35, -1.55);
  const texes = COMMANDS.map((_, k) => terminalTexture(k));
  const termMat = new THREE.MeshBasicMaterial({ map: texes[0] });
  const term = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.5), termMat); term.position.copy(T); g.add(term);
  const termFrame = framedBox(2.98, 1.58, 0.05, GREEN, darkMat()); termFrame.position.set(T.x, T.y, T.z - 0.04); g.add(termFrame);
  const cursor = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.08), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })); cursor.position.set(T.x + 1.25, T.y - 0.55, T.z + 0.01); g.add(cursor);

  // ================= directory tree (left back) =================
  const ROOT = V(-3.05, 3.05, -1.0);
  const rootBox = framedBox(0.36, 0.26, 0.26, AMBER, glowMat(AMBER, 0.4)); rootBox.position.copy(ROOT); g.add(rootBox);
  const DIRS = ["/etc", "/home", "/var", "/usr", "/boot", "/opt", "/tmp", "/dev"];
  const dirs = {};
  DIRS.forEach((name, k) => {
    const p = V(-4.0 + (k % 4) * 0.62, k < 4 ? 2.3 : 1.55, -1.0);
    const m = framedBox(0.34, 0.22, 0.22, LIGHT, glowMat(0x22304d, 0.35)); m.position.copy(p); g.add(m);
    g.add(line3(ROOT.clone().add(V(0, -0.13, 0)), p.clone().add(V(0, 0.11, 0)), PALE, 0.35));
    addTag(g, name, "#8FB0FF", p.x, p.y - 0.25, p.z + 0.15, 0.45);
    dirs[name] = { p, mat: m.children[0].material };
  });
  const doc = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), new THREE.MeshBasicMaterial({ color: 0xE9EEF9, side: THREE.DoubleSide })); g.add(doc);   // vim editing a file in /etc

  // ================= users & groups (left front) =================
  const person = (x, z, col) => {
    const grp = new THREE.Group(); grp.position.set(x, 0.36, z); g.add(grp);
    const mat = glowMat(col, 0.45);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.42, 14), mat); body.position.y = 0.21; grp.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), mat); head.position.y = 0.55; grp.add(head);
    return { grp, mat };
  };
  const upad = framedBox(2.1, 0.06, 1.0, BLUE); upad.position.set(-3.05, 0.36, 0.75); g.add(upad);
  const uRoot = person(-3.7, 0.75, RED), uDeploy = person(-2.45, 0.75, LIGHT), uAmine = person(-3.05, 0.75, GREEN);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.025, 8, 48), glowMat(AMBER, 0.5)); wheel.rotation.x = Math.PI / 2; wheel.scale.set(1, 0.55, 1); wheel.position.set(-2.75, 0.45, 0.75); g.add(wheel);
  const perm = framedBox(0.85, 0.22, 0.05, AMBER, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); perm.position.set(-3.05, 1.45, 0.75); g.add(perm);
  const permBits = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.1), new THREE.MeshBasicMaterial({ color: k < 3 || k === 3 || k === 5 ? GREEN : GREY })); b.position.set(-3.38 + k * 0.083, 1.45, 0.78); g.add(b); return b; });

  // ================= systemd (PID 1) + processes (centre) =================
  const PID1 = V(-0.15, 1.85, -0.25);
  const pid1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), glowMat(BLUE, 0.6)); pid1.position.copy(PID1); g.add(pid1);
  const PROCS = [["nginx", -1.0], ["sshd", -0.35], ["crond", 0.3], ["backup.sh", 0.95]];
  const procs = PROCS.map(([name, x], k) => {
    const base = framedBox(0.48, 0.06, 0.4, LIGHT, darkMat()); base.position.set(x, 0.4, 0.45); g.add(base);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.26), glowMat(k === 3 ? AMBER : GREEN, 0.5)); bar.geometry.translate(0, 0.5, 0); bar.position.set(x, 0.43, 0.45); g.add(bar);
    g.add(line3(PID1, V(x, 0.95, 0.45), PALE, 0.35));
    addTag(g, name, "#8FB0FF", x, 0.22, 0.75, name.length > 6 ? 0.7 : 0.5);
    return { bar, x, k };
  });
  const units = PROCS.map(() => dot(BLUE, 0.05));
  const selinux = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.32, 6), glowMat(VIOLET, 0.5)); selinux.rotation.x = Math.PI; selinux.position.set(-0.95, 1.95, -0.3); g.add(selinux);
  const cron = new THREE.Group(); cron.position.set(0.85, 1.95, -0.3); g.add(cron);
  cron.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 28), glowMat(AMBER, 0.6)));
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.13, 0.02), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })); hand.geometry.translate(0, 0.06, 0); cron.add(hand);

  // ================= journalctl (log panel) =================
  const J = V(1.85, 2.3, -0.75);
  const jp = framedBox(1.1, 0.75, 0.04, VIOLET, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); jp.position.copy(J); g.add(jp);
  const jl = [0, 1, 2, 3, 4].map((k) => { const w = 0.5 + ((k * 3) % 4) * 0.1; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.05), new THREE.MeshBasicMaterial({ color: PALE, transparent: true })); m.geometry.translate(w / 2, 0, 0); g.add(m); return m; });
  g.add(line3(PID1, J.clone().add(V(-0.55, -0.2, 0)), VIOLET, 0.3));

  // ================= packages: repo → /usr =================
  const REPO = V(-1.55, 3.85, -1.4);
  const repo = framedBox(0.75, 0.4, 0.4, BLUE, glowMat(0x1d2b55, 0.35)); repo.position.copy(REPO); g.add(repo);
  const pkg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), glowMat(AMBER, 0.8)); g.add(pkg);
  const pkgPath = new THREE.CatmullRomCurve3([REPO.clone().add(V(-0.3, -0.2, 0)), V(-2.2, 3.2, -0.8), dirs["/usr"].p.clone().add(V(0, 0.15, 0.05))]);
  tube(pkgPath, AMBER, 0.25);

  // ================= disks → LVM (right front) =================
  const DX = 2.85, DZ = 0.7;
  const dpad = framedBox(1.6, 0.06, 1.0, AMBER); dpad.position.set(DX, 0.36, DZ); g.add(dpad);
  [-0.4, 0.4].forEach((dx) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 24), glowMat(LIGHT, 0.35)); d.position.set(DX + dx, 0.5, DZ); g.add(d); });
  const vg = framedBox(1.4, 0.2, 0.6, VIOLET, glowMat(0x241a3d, 0.4)); vg.position.set(DX, 0.85, DZ); g.add(vg);
  [-0.4, 0.4].forEach((dx) => g.add(line3(V(DX + dx, 0.6, DZ), V(DX + dx, 0.75, DZ), VIOLET, 0.6)));
  const lvRoot = new THREE.Mesh(new THREE.BoxGeometry(1, 0.16, 0.45), glowMat(LIGHT, 0.5)); lvRoot.geometry.translate(0.5, 0, 0); lvRoot.position.set(DX - 0.65, 1.12, DZ); lvRoot.scale.x = 0.55; g.add(lvRoot);
  const lvData = new THREE.Mesh(new THREE.BoxGeometry(1, 0.16, 0.45), glowMat(GREEN, 0.5)); lvData.geometry.translate(0.5, 0, 0); lvData.position.set(DX - 0.65, 1.33, DZ); g.add(lvData);

  // ================= network + firewalld (right back) =================
  const NX = 2.95, NZ = -1.15;
  const nic = rack(0.8, LIGHT); nic.position.set(NX - 0.45, 0.76, NZ); g.add(nic);
  const ifaces = [0, 1].map((k) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), new THREE.MeshBasicMaterial({ color: GREEN })); p.position.set(NX - 0.45, 0.65 + k * 0.25, NZ + 0.33); g.add(p); return p.material; });
  // firewalld zone wall with service gaps (ssh 22 always open, https 443 opens on firewall-cmd)
  const FWX = NX + 0.4;
  const wallMat = glowMat(RED, 0.35);
  [-0.55, -0.35, 0.05, 0.25, 0.55].forEach((dz) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.14), wallMat); p.position.set(FWX, 0.72, NZ + dz); g.add(p); });
  const gate443 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.18), glowMat(RED, 0.5)); gate443.position.set(FWX, 0.72, NZ - 0.15); g.add(gate443);
  const inSsh = dot(GREEN, 0.055), inHttps = dot(0xFFFFFF, 0.055);
  // SSH client with a key, connecting to sshd
  const laptop = framedBox(0.42, 0.04, 0.3, LIGHT, darkMat()); laptop.position.set(4.25, 0.5, NZ + 0.45); g.add(laptop);
  const lscr = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26), glowMat(BLUE, 0.4)); lscr.position.set(4.25, 0.66, NZ + 0.31); lscr.rotation.x = -0.25; g.add(lscr);

  // ================= labels =================
  addTag(g, "Terminal", "#38D98A", T.x - 1.0, T.y + 0.98, T.z, 0.75);
  addTag(g, "/ (root)", "#FFB547", ROOT.x, ROOT.y + 0.32, ROOT.z, 0.7);
  addTag(g, "Users & groups", "#38D98A", -3.05, 1.75, 0.75, 1.15);
  addTag(g, "root", "#FF6B5D", -3.7, 0.25, 1.2, 0.4);
  const tagAmine = addTag(g, "amine", "#38D98A", -3.05, 0.25, 1.2, 0.5);
  addTag(g, "deploy", "#8FB0FF", -2.45, 0.25, 1.2, 0.5);
  addTag(g, "wheel (sudo)", "#FFB547", -2.1, 0.62, 1.25, 0.85);
  addTag(g, "rwx r-x ---", "#FFB547", -3.05, 1.2, 0.85, 0.85);
  addTag(g, "systemd (PID 1)", "#5B8CFF", PID1.x, PID1.y + 0.45, PID1.z, 1.15);
  addTag(g, "Processes", "#38D98A", 0, 0.05, 1.0, 0.8);
  addTag(g, "SELinux", "#B58CFF", -0.95, 2.3, -0.3, 0.6);
  addTag(g, "cron", "#FFB547", 0.85, 2.3, -0.3, 0.4);
  addTag(g, "journalctl", "#B58CFF", J.x, J.y + 0.55, J.z, 0.8);
  addTag(g, "Packages (dnf / apt)", "#5B8CFF", REPO.x, REPO.y + 0.42, REPO.z, 1.4);
  addTag(g, "Disks → LVM", "#FFB547", DX, 1.75, DZ, 0.95);
  addTag(g, "PV · VG · LV", "#B58CFF", DX + 1.0, 0.85, DZ + 0.2, 0.85);
  addTag(g, "/  (root LV)", "#8FB0FF", DX - 0.95, 1.12, DZ + 0.3, 0.7);
  addTag(g, "/data", "#38D98A", DX - 0.95, 1.33, DZ + 0.3, 0.45);
  addTag(g, "Network · eth0 / eth1", "#8FB0FF", NX - 0.45, 1.5, NZ, 1.4);
  addTag(g, "firewalld zones", "#FF6B5D", FWX + 0.1, 1.3, NZ, 1.15);
  addTag(g, "ssh :22 · https :443", "#38D98A", FWX + 0.2, 0.2, NZ + 0.3, 1.35);
  addTag(g, "SSH (keys)", "#5B8CFF", 4.25, 1.0, NZ + 0.45, 0.8);

  const highlight = (d, on) => { d.mat.color.set(on ? AMBER : 0x22304d); d.mat.emissive.copy(d.mat.color); d.mat.emissiveIntensity = on ? 0.7 : 0.35; };

  anims.push(function (t) {
    const step = Math.floor(t / STEP) % COMMANDS.length, f = (t % STEP) / STEP;
    termMat.map = texes[step];
    cursor.visible = Math.sin(t * 7) > 0;
    const cyc = (t / (STEP * COMMANDS.length)) % 1;
    const after = (s) => step > s || (step === s && f > 0.4);

    // directories react to the commands that touch them
    DIRS.forEach((n) => highlight(dirs[n], false));
    if (step === 0) highlight(dirs["/usr"], f > 0.6);
    if (step === 1) highlight(dirs["/etc"], true);
    if (step === 4 || step === 5) highlight(dirs["/home"], true);
    if (step === 9) highlight(dirs["/var"], true);
    if (step === 6) highlight(dirs["/dev"], true);

    // 0 · packages
    pkg.visible = step === 0;
    if (pkg.visible) pkg.position.copy(pkgPath.getPointAt(smooth(f / 0.75)));
    // 1 · vim edits a file in /etc
    doc.visible = step === 1;
    if (doc.visible) { doc.position.copy(dirs["/etc"].p).add(V(0, 0.45 + 0.05 * Math.sin(t * 3), 0.15)); doc.rotation.y = 0.2 * Math.sin(t * 2); }
    // 2 · systemd starts nginx (installed in step 0, active from step 2)
    const nginxOn = after(2);
    procs.forEach((p) => {
      let h;
      if (p.k === 0) h = nginxOn ? 0.45 + 0.25 * Math.max(0, Math.sin(t * 3)) : step >= 0 && after(0) ? 0.08 : 0.02;
      else if (p.k === 3) h = step === 8 ? (f < 0.5 ? 1.1 : Math.max(0.02, 1.1 - (f - 0.5) * 4)) : step > 8 ? 0.02 : 0.35 + 0.2 * Math.sin(t);
      else h = 0.3 + 0.2 * Math.max(0, Math.sin(t * 2 + p.k));
      p.bar.scale.y = Math.max(0.02, h);
      const c = p.k === 0 ? (nginxOn ? GREEN : GREY) : p.k === 3 ? (step === 8 ? RED : AMBER) : GREEN;
      p.bar.material.color.set(c); p.bar.material.emissive.set(c);
    });
    units.forEach((u, k) => { const uu = (t * 0.6 + k / 4) % 1; u.position.copy(PID1).lerp(V(procs[k].x, 0.95, 0.45), uu); u.visible = !(k === 0 && !nginxOn); });
    pid1.rotation.y = t; pid1.material.emissiveIntensity = step === 2 ? 0.6 + 0.6 * Math.max(0, Math.sin(t * 10)) : 0.6;
    // 3 · firewalld opens https
    const httpsOpen = after(3);
    gate443.visible = !httpsOpen;
    const u1 = (t * 0.5) % 1, u2 = (t * 0.5 + 0.5) % 1;
    inSsh.position.set(4.6 - u1 * 1.7, 0.72, NZ + 0.15);
    if (httpsOpen) inHttps.position.set(4.6 - u2 * 1.7, 0.72, NZ - 0.15);
    else inHttps.position.set(4.6 - (u2 < 0.5 ? u2 : 1 - u2) * 2.4, 0.72, NZ - 0.15);       // bounces off the closed port
    // 4 · useradd amine (joins wheel); 5 · chown / chmod
    const s4 = after(4) ? 1 : 0.001;
    uAmine.grp.scale.setScalar(uAmine.grp.scale.x + (s4 - uAmine.grp.scale.x) * 0.1); tagAmine.visible = after(4);
    wheel.material.emissiveIntensity = step === 4 ? 1.0 : 0.5;
    perm.visible = after(5);
    permBits.forEach((b) => { b.scale.y = step === 5 ? 1 + 0.5 * Math.max(0, Math.sin(t * 10)) : 1; });
    uRoot.mat.emissiveIntensity = 0.45; uDeploy.mat.emissiveIntensity = step === 5 ? 0.9 : 0.45;
    // 6 · lvextend grows /data
    const grow = step < 6 ? 0.55 : step === 6 ? 0.55 + 0.4 * smooth(f / 0.8) : 0.95;
    lvData.scale.x = grow;
    // 7 · network interfaces
    ifaces.forEach((m, k) => m.color.set(step === 7 && Math.sin(t * 14 + k * 2) > 0 ? 0xFFFFFF : GREEN));
    // 9 · journalctl: log lines stream (fast while following), the last one is an error
    jl.forEach((m, k) => {
      const u = (t * (step === 9 ? 0.9 : 0.25) + k / jl.length) % 1;
      m.position.set(J.x - 0.48, J.y - 0.3 + u * 0.6, J.z + 0.03);
      m.material.opacity = Math.min(1, Math.min(u, 1 - u) * 8);
      m.material.color.set(step === 9 && k === 2 ? RED : PALE);
    });
    jp.children[1].material.color.set(step === 9 ? 0xFFFFFF : VIOLET);
    // always: cron ticks, SELinux guards
    hand.rotation.z = -t * 1.5;
    selinux.rotation.y = t * 0.8;
    void cyc;
  });
}
