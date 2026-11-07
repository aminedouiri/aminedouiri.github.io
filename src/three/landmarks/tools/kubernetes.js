import * as THREE from "three";
import { glowMat, darkMat, line3, addTag, framedBox, gear } from "../helpers.js";

/**
 * Kubernetes: a working cluster.
 *   Top: the control plane — etcd, kube-apiserver, kube-controller-manager — bootstrapped with kubeadm.
 *   Left: how changes arrive — kubectl, Helm charts and Kustomize overlays all talk to the API server.
 *   Middle: three worker nodes, each with a kubelet (talks to the API server) and kube-proxy.
 *     A Deployment runs one replica per node; HPA adds replicas when load rises; VPA grows a pod;
 *     KEDA scales queue workers from 0 with the queue length; CoreDNS answers lookups;
 *     every replica carries an Istio sidecar and they talk over the mesh.
 *   Front: traffic enters through the API gateway → Istio ingress gateway → Service → replicas.
 *   Back: a volume provisioned through a StorageClass on NFS for the stateful pod.
 * Original design (not an official logo).
 * @param {THREE.Group} g   group to build into (faces the road on +z)
 * @param {Function[]} anims  push per-frame animation callbacks: (timeSeconds) => void
 */
export function kubernetes(g, anims) {
  const BLUE = 0x5B8CFF, LIGHT = 0x8FB0FF, AMBER = 0xFFB547, GREEN = 0x38D98A, PALE = 0xBFD0FF, VIOLET = 0xB58CFF;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const tube = (curve, col = PALE, op = 0.3, r = 0.015) => g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })));
  const dot = (col, r = 0.055) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; };
  const smoothTo = (m, on, k = 0.08) => { const s = m.scale.x + ((on ? 1 : 0.001) - m.scale.x) * k; m.scale.setScalar(s); m.visible = s > 0.02; };

  // ======================= worker nodes =======================
  const NX = [-1.7, 0, 1.7], NZ = 0.2, NY = 0.55, PY = 0.82;
  const kubelets = [], proxies = [];
  NX.forEach((x) => {
    const slab = framedBox(1.5, 0.12, 1.3, BLUE); slab.position.set(x, NY, NZ); g.add(slab);
    const kl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), glowMat(AMBER, 0.6)); kl.position.set(x - 0.55, 0.72, NZ - 0.45); g.add(kl); kubelets.push(kl);
    const kp = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), glowMat(GREEN, 0.6)); kp.position.set(x + 0.55, 0.76, NZ - 0.45); g.add(kp); proxies.push(kp);
  });
  const pod = (x, z, col, size = 0.3) => { const p = framedBox(size, size, size, col, glowMat(col === AMBER ? AMBER : BLUE, 0.35)); p.position.set(x, PY, z); g.add(p); return p; };

  // Deployment: one replica per node (+ Istio sidecar on each)
  const replicas = NX.map((x) => pod(x - 0.25, NZ + 0.25, LIGHT));
  const sidecars = replicas.map((r) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), glowMat(VIOLET, 0.8)); s.position.set(r.position.x + 0.2, PY + 0.14, r.position.z + 0.12); g.add(s); return s; });
  // HPA: extra replicas on nodes 1 and 2
  const extras = [pod(NX[0] + 0.25, NZ + 0.25, LIGHT), pod(NX[1] + 0.25, NZ + 0.25, LIGHT)];
  extras.forEach((e) => e.scale.setScalar(0.001));
  g.add(line3(V(NX[0] - 0.25, 1.1, NZ + 0.25), V(NX[2] - 0.25, 1.1, NZ + 0.25), LIGHT, 0.45));   // the Deployment owns these
  // stateful pod with a volume (node 1), CoreDNS (node 2), VPA pod + KEDA workers (node 3)
  const db = pod(NX[0] - 0.05, NZ - 0.2, AMBER);
  const dns = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 6), glowMat(GREEN, 0.5)); dns.position.set(NX[1] - 0.05, PY, NZ - 0.2); g.add(dns);
  const vpa = pod(NX[2] + 0.25, NZ + 0.25, AMBER); vpa.children.forEach((c) => c.geometry.translate(0, 0.15, 0)); vpa.position.y = PY - 0.15;
  const workers = [pod(NX[2] - 0.2, NZ - 0.2, PALE, 0.24), pod(NX[2] + 0.2, NZ - 0.2, PALE, 0.24)];

  // ======================= traffic in: API gateway → Istio gateway → Service =======================
  const apigw = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 10, 32, Math.PI), glowMat(PALE, 0.6)); apigw.position.set(0, 0.4, 2.45); g.add(apigw);
  const istioGw = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 6), glowMat(VIOLET, 0.6)); istioGw.position.set(0, 0.6, 1.85); g.add(istioGw);
  const svc = framedBox(2.2, 0.1, 0.18, GREEN, glowMat(GREEN, 0.4)); svc.position.set(0, 0.62, 1.32); g.add(svc);
  const svcPaths = replicas.map((r) => new THREE.CatmullRomCurve3([V(0, 0.75, 3.0), V(0, 0.75, 2.45), V(0, 0.75, 1.85), V(0, 0.75, 1.32), V(r.position.x, 0.85, 0.9), r.position.clone().setY(0.85)]));
  svcPaths.forEach((c) => tube(c, PALE, 0.22));
  const reqs = svcPaths.map(() => dot(0xFFFFFF));
  // Istio mesh: sidecars talk to each other (mTLS)
  const meshPaths = [[0, 1], [1, 2], [2, 0]].map(([a, b]) => new THREE.CatmullRomCurve3([sidecars[a].position.clone(), sidecars[a].position.clone().lerp(sidecars[b].position, 0.5).add(V(0, 0.45, 0)), sidecars[b].position.clone()]));
  meshPaths.forEach((c) => tube(c, VIOLET, 0.35, 0.01));
  const meshBits = meshPaths.map(() => dot(VIOLET, 0.045));
  // DNS lookups: replicas → CoreDNS
  const dnsBits = replicas.map(() => dot(GREEN, 0.035));

  // ======================= control plane =======================
  const CY = 3.55, CZ = -0.5;
  const cpSlab = framedBox(3.9, 0.12, 1.4, AMBER); cpSlab.position.set(0, CY, CZ); g.add(cpSlab);
  const etcd = [0, 1, 2].map((k) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 24), glowMat(k === 2 ? PALE : 0x3E63D9, 0.5)); d.position.set(-1.35, CY + 0.16 + k * 0.2, CZ); g.add(d); return d; });
  const api = framedBox(0.95, 0.55, 0.65, PALE, glowMat(BLUE, 0.55)); api.position.set(0, CY + 0.34, CZ); g.add(api);
  const cm = gear(0.2, AMBER, 9); cm.position.set(1.35, CY + 0.42, CZ + 0.1); g.add(cm);
  const apiPt = V(0, CY + 0.1, CZ + 0.3);
  // API server ↔ kubelets
  const kubeletPaths = kubelets.map((k) => new THREE.CatmullRomCurve3([apiPt.clone(), k.position.clone().lerp(apiPt, 0.5).add(V(0, 0.2, 0.2)), k.position.clone()]));
  kubeletPaths.forEach((c) => tube(c, AMBER, 0.25, 0.012));
  const kubeletBits = kubeletPaths.map(() => dot(AMBER, 0.045));
  // kubeadm: bootstraps the cluster and joins nodes
  const kubeadm = framedBox(0.55, 0.38, 0.3, GREEN, darkMat()); kubeadm.position.set(2.7, CY + 0.2, CZ); g.add(kubeadm);
  const joinCurve = new THREE.CatmullRomCurve3([V(2.7, CY, CZ), V(2.5, 2.0, -0.2), kubelets[2].position.clone()]);
  const joinMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.1 });
  g.add(new THREE.Mesh(new THREE.TubeGeometry(joinCurve, 40, 0.025, 6, false), joinMat));

  // ======================= how changes arrive: kubectl, Helm, Kustomize =======================
  const TX = -3.45;
  const term = framedBox(0.75, 0.5, 0.06, LIGHT, new THREE.MeshBasicMaterial({ color: 0x0b0f1a })); term.position.set(TX, 1.1, 0.7); g.add(term);
  const prompt = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.05), new THREE.MeshBasicMaterial({ color: GREEN })); prompt.position.set(TX - 0.12, 1.15, 0.74); g.add(prompt);
  const cursor = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.08), new THREE.MeshBasicMaterial({ color: 0xF2F3F5 })); cursor.position.set(TX + 0.1, 1.15, 0.74); g.add(cursor);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), darkMat()); stand.position.set(TX, 0.6, 0.7); g.add(stand);
  const helm = new THREE.Group(); helm.position.set(TX, 2.25, 0.15); g.add(helm);
  const helmMat = glowMat(LIGHT, 0.6);
  helm.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 32), helmMat));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2, sp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.03), helmMat); sp.rotation.z = a; helm.add(sp);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), helmMat); knob.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0); helm.add(knob);
  }
  const sheets = [0, 1, 2].map((k) => {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.45), new THREE.MeshStandardMaterial({ color: k ? AMBER : LIGHT, emissive: k ? AMBER : LIGHT, emissiveIntensity: 0.4, transparent: true, opacity: 0.75 }));
    sh.position.set(TX, 3.15 + k * 0.14, -0.25); g.add(sh); return sh;
  });
  const toolPaths = [V(TX + 0.4, 1.15, 0.7), V(TX + 0.45, 2.25, 0.15), V(TX + 0.35, 3.3, -0.25)].map((p) => new THREE.CatmullRomCurve3([p, p.clone().lerp(apiPt, 0.5).add(V(0, 0.5, 0.3)), V(-0.5, CY + 0.34, CZ + 0.1)]));
  toolPaths.forEach((c) => tube(c, LIGHT, 0.25, 0.012));
  const toolBits = toolPaths.map(() => dot(0xFFFFFF, 0.045));

  // ======================= storage: StorageClass → NFS =======================
  const nfs = framedBox(1.3, 0.75, 0.5, LIGHT, darkMat()); nfs.position.set(-0.6, 0.72, -1.4); g.add(nfs);
  const disks = [0, 1, 2].map((k) => { const d = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.02), new THREE.MeshBasicMaterial({ color: k === 1 ? AMBER : LIGHT })); d.position.set(-1.0 + k * 0.4, 0.82, -1.14); g.add(d); return d; });
  const sc = framedBox(1.3, 0.05, 0.5, AMBER, glowMat(AMBER, 0.35)); sc.position.set(-0.6, 1.15, -1.4); g.add(sc);
  const pvc = new THREE.CatmullRomCurve3([db.position.clone(), V(-1.45, 1.1, -0.7), V(-0.9, 1.0, -1.15)]);
  tube(pvc, AMBER, 0.4, 0.018);
  const pvcBits = [dot(AMBER, 0.045), dot(AMBER, 0.045)];

  // ======================= HPA meter and KEDA queue =======================
  const hpaTube = framedBox(0.2, 1.0, 0.2, GREEN); hpaTube.position.set(-2.75, 1.1, 1.05); g.add(hpaTube);
  const hpaFill = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.94, 0.14), glowMat(GREEN, 0.7)); hpaFill.geometry.translate(0, 0.47, 0); hpaFill.position.set(-2.75, 0.63, 1.05); g.add(hpaFill);
  const queue = [];
  for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.26), glowMat(k % 2 ? VIOLET : PALE, 0.5)); m.position.set(3.05, 0.45 + k * 0.16, 0.3); g.add(m); queue.push(m); }
  const qFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.44, 1.05, 0.36)), new THREE.LineBasicMaterial({ color: VIOLET })); qFrame.position.set(3.05, 0.88, 0.3); g.add(qFrame);

  // ======================= labels =======================
  addTag(g, "Control plane", "#FFB547", 0, CY + 1.0, CZ, 1.2);
  addTag(g, "etcd", "#8FB0FF", -1.35, CY + 0.85, CZ + 0.2, 0.5);
  addTag(g, "kube-apiserver", "#8FB0FF", 0, CY + 0.78, CZ + 0.35, 1.2);
  addTag(g, "controller-manager", "#FFB547", 1.35, CY + 0.85, CZ + 0.2, 1.4);
  addTag(g, "kubeadm", "#38D98A", 2.7, CY + 0.62, CZ, 0.8);
  addTag(g, "kubectl", "#8FB0FF", TX, 1.55, 0.75, 0.7);
  addTag(g, "Helm charts", "#8FB0FF", TX, 2.75, 0.2, 1.0);
  addTag(g, "Kustomize", "#FFB547", TX, 3.65, -0.2, 0.9);
  ["Node 1", "Node 2", "Node 3"].forEach((n, i) => addTag(g, n, "#5B8CFF", NX[i] - 0.45, 0.3, NZ + 0.75, 0.6));
  addTag(g, "kubelet", "#FFB547", NX[0] - 0.55, 1.0, NZ - 0.4, 0.6);
  addTag(g, "kube-proxy", "#38D98A", NX[0] + 0.55, 1.0, NZ - 0.4, 0.85);
  addTag(g, "Deployment · replicas", "#8FB0FF", -0.85, 1.3, NZ + 0.3, 1.5);
  addTag(g, "Pod", "#8FB0FF", NX[1] - 0.25, 1.3, NZ + 0.3, 0.4);
  addTag(g, "Istio mesh", "#B58CFF", 0.95, 1.65, NZ + 0.25, 0.9);
  addTag(g, "CoreDNS", "#38D98A", NX[1] - 0.05, 1.18, NZ - 0.2, 0.7);
  addTag(g, "VPA", "#FFB547", NX[2] + 0.3, 1.45, NZ + 0.3, 0.4);
  addTag(g, "KEDA", "#B58CFF", 3.05, 1.65, 0.3, 0.5);
  addTag(g, "HPA", "#38D98A", -2.75, 1.85, 1.05, 0.45);
  addTag(g, "Service", "#38D98A", 1.55, 0.95, 1.35, 0.65);
  addTag(g, "Istio gateway", "#B58CFF", -0.95, 0.95, 1.85, 1.05);
  addTag(g, "API gateway", "#BFD0FF", 0.95, 0.75, 2.45, 0.95);
  addTag(g, "StorageClass", "#FFB547", -0.6, 1.4, -1.35, 1.0);
  addTag(g, "NFS", "#8FB0FF", 0.3, 0.75, -1.15, 0.4);

  // ======================= animation =======================
  anims.push(function (t) {
    // traffic in, mesh calls, DNS lookups
    reqs.forEach((r, k) => r.position.copy(svcPaths[k].getPointAt((t * 0.22 + k / 3) % 1)));
    meshBits.forEach((b, k) => b.position.copy(meshPaths[k].getPointAt((t * 0.35 + k / 3) % 1)));
    dnsBits.forEach((b, k) => { const u = (t * 0.5 + k / 3) % 1; b.position.copy(replicas[k].position).lerp(dns.position, u < 0.5 ? u * 2 : 2 - u * 2).setY(PY + 0.2); });
    dns.material.emissiveIntensity = 0.4 + 0.4 * Math.max(0, Math.sin(t * 6));
    istioGw.rotation.y = t * 0.8;

    // HPA: replicas follow load
    const load = 0.5 + 0.5 * Math.sin(t * 0.45);
    hpaFill.scale.y = 0.1 + 0.9 * load;
    hpaFill.material.color.set(load > 0.8 ? AMBER : GREEN); hpaFill.material.emissive.copy(hpaFill.material.color);
    smoothTo(extras[0], load > 0.45); smoothTo(extras[1], load > 0.8);

    // VPA: one pod gets more CPU / memory (grows taller)
    vpa.scale.set(1, 1 + 0.9 * (0.5 + 0.5 * Math.sin(t * 0.3)), 1);

    // KEDA: workers scale from 0 with the queue length; messages drain
    const q = Math.round(6 * (0.5 + 0.5 * Math.sin(t * 0.55 + 1)));
    queue.forEach((m, k) => { m.visible = k < q; m.position.x = 3.05 + (k === q - 1 ? 0.03 * Math.sin(t * 8) : 0); });
    smoothTo(workers[0], q >= 2); smoothTo(workers[1], q >= 4);

    // control plane
    etcd.forEach((d, k) => { d.rotation.y = t * (0.5 + k * 0.2); });
    cm.rotation.z = t * 1.2;
    kubeletBits.forEach((b, k) => { const u = (t * 0.3 + k / 3) % 1; b.position.copy(kubeletPaths[k].getPointAt(u < 0.5 ? u * 2 : 2 - u * 2)); });
    kubelets.forEach((k, i) => { k.material.emissiveIntensity = 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 - i)); });
    proxies.forEach((p) => { p.rotation.y = t * 1.5; });
    joinMat.opacity = 0.1 + 0.6 * Math.max(0, Math.sin(t * 0.6)) ** 4;

    // kubectl / Helm / Kustomize → API server
    cursor.visible = Math.sin(t * 6) > 0;
    helm.rotation.z = t * 0.6;
    sheets.forEach((sh, k) => { sh.position.x = TX + (k ? 0.06 * Math.sin(t * 1.2 + k) : 0); });
    toolBits.forEach((b, k) => b.position.copy(toolPaths[k].getPointAt((t * 0.2 + k / 3) % 1)));

    // storage
    pvcBits.forEach((b, k) => { const u = (t * 0.4 + k * 0.5) % 1; b.position.copy(pvc.getPointAt(k ? 1 - u : u)); });
    disks.forEach((d, k) => { d.material.color.set(Math.sin(t * 5 + k * 2) > 0.6 ? GREEN : k === 1 ? AMBER : LIGHT); });
  });
}
