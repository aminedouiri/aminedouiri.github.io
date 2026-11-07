/*
 * Landmarks: one 3D shape per tech / framework, all on the RIGHT side of the road
 * (the experience cubes own the left side).
 *
 * To add a landmark: create a shape file (see tools/docker.js for a small example),
 * import it here, add it to SHAPES under the same id as in src/data/tech.js.
 */
import * as THREE from "three";
import { pedestal, titleSprite, badgeSprite } from "./helpers.js";

import { devopsLoop } from "./frameworks/devopsLoop.js";
import { calms } from "./frameworks/calms.js";
import { dora } from "./frameworks/dora.js";
import { srePyramid } from "./frameworks/srePyramid.js";
import { threeWays } from "./frameworks/threeWays.js";
import { mlops } from "./frameworks/mlops.js";
import { devsecops } from "./frameworks/devsecops.js";
import { kubernetes } from "./tools/kubernetes.js";
import { docker } from "./tools/docker.js";
import { terraform } from "./tools/terraform.js";
import { cicd } from "./tools/cicd.js";
import { argocd } from "./tools/argocd.js";
import { prometheus } from "./tools/prometheus.js";
import { opentelemetry } from "./tools/opentelemetry.js";
import { grafana } from "./tools/grafana.js";
import { googleCloud } from "./tools/googleCloud.js";
import { proxmox } from "./tools/proxmox.js";
import { vmware } from "./tools/vmware.js";
import { networking } from "./tools/networking.js";

/** id (from src/data/tech.js) → shape builder */
export const SHAPES = {
  loop: devopsLoop, calms, dora, sre: srePyramid, ways: threeWays, mlops, devsecops,
  k8s: kubernetes, docker, tf: terraform, cicd, argo: argocd,
  prom: prometheus, otel: opentelemetry, graf: grafana, gcp: googleCloud,
  proxmox, vmware, net: networking,
};

const NEAR_ROW = 8, FAR_ROW = 15.5, SCALE = 0.58, BIG_SCALE = 0.85;

/** How much a landmark's shape grows while you are parked at it (everything else is hidden then). */
export const FOCUS_ZOOM = 1.6;

/**
 * Builds every landmark and returns one entry per tech item (aliases point at their target's entry).
 * @param {import("../World.js").World} w
 */
export function buildLandmarks(w) {
  const { scene, curve, stopT, ROAD_W, data } = w;
  const last = stopT.length - 1;

  // three slots per gap between stops, alternating near / far row
  const slots = [];
  for (let g = 0; g < last; g++) {
    [0.22, 0.5, 0.78].forEach((f, k) => slots.push({ t: stopT[g] + (stopT[g + 1] - stopT[g]) * f, row: k % 2 }));
  }

  const out = [];
  let si = 0;
  data.tech.forEach((tc, k) => {
    const shape = SHAPES[tc.id];
    if (tc.alias || !shape) { out[k] = null; return; }
    let t, off, scale;
    if (tc.big) { t = 0.012; off = ROAD_W + 12; scale = BIG_SCALE; }
    else { const s = slots[si++ % slots.length]; t = s.t; off = ROAD_W + (s.row ? FAR_ROW : NEAR_ROW); scale = SCALE; }

    const p = curve.getPointAt(t), tg = curve.getTangentAt(t);
    const n = new THREE.Vector3(-tg.z, 0, tg.x);            // right-hand side of the road
    const g = new THREE.Group();
    g.position.copy(p).addScaledVector(n, off);
    g.lookAt(p.x, 0, p.z);                                   // face the road

    const body = new THREE.Group();                          // pedestal + shape: grows in focus mode
    shape(body, w.anims);
    const bounds = new THREE.Box3().setFromObject(body);     // real size of the shape (before the pedestal's glow)
    bounds.expandByPoint(new THREE.Vector3(-3, 0, -3)).expandByPoint(new THREE.Vector3(3, 0, 3)); // + pedestal
    pedestal(body);
    g.add(body);
    const title = titleSprite(tc.name, tc.cat);
    title.position.y = tc.big ? 8.2 : 6.4;
    g.add(title);
    const badge = badgeSprite(tc);
    badge.position.y = title.position.y + 1.6;
    g.add(badge);

    g.scale.setScalar(scale);
    g.traverse((o) => { o.userData.tech = k; });
    scene.add(g);
    w.solids.push({ x: g.position.x, z: g.position.z, r: tc.big ? 3.4 : 2.1 });

    const toRoad = n.clone().multiplyScalar(-1);
    const height = (title.position.y + 2.4) * scale;           // ground → top of the badge
    const width = 6.6 * scale;                                   // pedestal / title width
    // park beside the pedestal (along the road side), so the close-up can stay tight on the shape
    const side = tg.clone().setY(0).normalize();
    const park = g.position.clone().addScaledVector(side, -(3 * scale * FOCUS_ZOOM + 0.9)).addScaledVector(toRoad, 1.2);
    park.y = 0;
    out[k] = {
      g, t, toRoad, park, height, width,
      body, title, badge, scale, zoom: 1,
      titleY: title.position.y,
      shapeTop: tc.big ? 6.8 : 5.2,                              // rough top of the shape (unscaled), to lift the title clear of it
      centerY: (tc.big ? 3.6 : 2.8) * scale,
      side, bounds,                                              // bounds: shape + pedestal, local units
      size: (tc.big ? 8.6 : 6.6) * scale,
      center: g.position.clone().setY((tc.big ? 3.6 : 2.8) * scale),
    };
  });
  // aliases (e.g. GitHub Actions → CI/CD pipeline) reuse their target's landmark
  data.tech.forEach((tc, k) => {
    if (tc.alias) out[k] = out[data.tech.findIndex((x) => x.id === tc.alias)] || null;
  });
  return out;
}

/** Grow / shrink a landmark's shape and keep its title and badge above it. */
export function setZoom(lm, z) {
  lm.zoom = z;
  lm.body.scale.setScalar(z);
  const lift = (z - 1) * lm.shapeTop;
  lm.title.position.y = lm.titleY + lift;
  lm.badge.position.y = lm.titleY + 1.6 + lift;
  // the info panel already shows the name, so title + badge fade out in the close-up
  const fade = 1 - Math.min(1, (z - 1) / (FOCUS_ZOOM - 1 || 1));
  lm.title.material.opacity = lm.badge.material.opacity = fade;
  lm.title.visible = lm.badge.visible = fade > 0.02;
  lm.center.y = lm.centerY * z;
}

/** Size of a landmark at a given zoom, for camera framing. */
export function zoomedSize(lm, z) {
  return { height: (lm.titleY + (z - 1) * lm.shapeTop + 2.4) * lm.scale, width: lm.width * z };
}
