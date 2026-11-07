/* Distant city blocks with LED strips, far from the road on both sides. */
import * as THREE from "three";
import { ROAD_W } from "./road.js";

export function buildCity(w, count = 220) {
  const { scene, curve } = w;
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x10131a, roughness: 0.5, metalness: 0.3 }), count);
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }), count * 3);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), col = new THREE.Color(), Y = new THREE.Vector3(0, 1, 0);
  let li = 0;
  for (let i = 0; i < count; i++) {
    const t = Math.random(), p = curve.getPointAt(t), tg = curve.getTangentAt(t);
    const side = Math.random() < 0.5 ? -1 : 1, off = ROAD_W + 24 + Math.random() * 40;
    const bw = 1.4 + Math.random() * 2.4, bh = 2 + Math.random() ** 2 * 16, bd = 1.4 + Math.random() * 2.4;
    ps.set(p.x - tg.z * side * off, bh / 2, p.z + tg.x * side * off);
    q.setFromAxisAngle(Y, Math.atan2(tg.x, tg.z)); sc.set(bw, bh, bd);
    m4.compose(ps, q, sc); city.setMatrixAt(i, m4);
    for (let r = 0; r < 3 && li < count * 3; r++) {
      if (Math.random() < 0.35) continue;
      const face = new THREE.Vector3(0, 0, bd / 2 + 0.02).applyQuaternion(q);
      const lp = new THREE.Vector3(ps.x, 0.5 + Math.random() * (bh - 0.8), ps.z).add(face);
      m4.compose(lp, q, new THREE.Vector3(bw * (0.3 + Math.random() * 0.6), 1, 1));
      leds.setMatrixAt(li, m4);
      col.set(Math.random() < 0.82 ? 0x5b8cff : 0xffb547); leds.setColorAt(li, col);
      li++;
    }
  }
  leds.count = li;
  scene.add(city, leds);
  w.clutter.push(city, leds);
}
