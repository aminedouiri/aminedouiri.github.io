import * as THREE from "three";

/**
 * Magnifying loupe: a round lens that follows the pointer and shows the scene enlarged.
 * The zoomed view is a real second render (sharp, not stretched pixels): the area under the
 * pointer is rendered into a texture with the same camera narrowed to that area, then drawn
 * on top of the frame as a circle with a glowing rim.
 */
export class Loupe {
  constructor(renderer, { radius = 150, zoom = 2.5 } = {}) {
    this.renderer = renderer;
    this.radius = radius;
    this.zoom = zoom;
    this.on = false;
    this.x = 0; this.y = 0; this.inside = false;

    const size = 1024;
    this.target = new THREE.WebGLRenderTarget(size, size, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.cam = new THREE.PerspectiveCamera();

    this.overlay = new THREE.Scene();
    this.ortho = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
    this.lens = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: this.target.texture, depthTest: false, depthWrite: false }));
    this.rim = new THREE.Mesh(new THREE.RingGeometry(1, 1.035, 64), new THREE.MeshBasicMaterial({ color: 0xffb547, toneMapped: false, depthTest: false, depthWrite: false }));
    this.glow = new THREE.Mesh(new THREE.RingGeometry(1.035, 1.12, 64), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, toneMapped: false, depthTest: false, depthWrite: false }));
    this.cross = new THREE.Group();
    [0, Math.PI / 2].forEach((r) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.006), new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: 0.7, toneMapped: false, depthTest: false }));
      m.rotation.z = r; this.cross.add(m);
    });
    this.lens.renderOrder = 1; this.glow.renderOrder = 2; this.rim.renderOrder = 3; this.cross.renderOrder = 4;
    this.overlay.add(this.lens, this.glow, this.rim, this.cross);
  }

  setZoom(z) { this.zoom = Math.min(6, Math.max(1.5, z)); return this.zoom; }

  /** Call right after the main render. */
  render(scene, camera) {
    if (!this.on || !this.inside) return;
    const r = this.renderer;
    const W = window.innerWidth, H = window.innerHeight;
    const R = Math.min(this.radius, Math.min(W, H) * 0.3);

    // 1) the area under the pointer, rendered at full lens resolution
    const span = (2 * R) / this.zoom;
    this.cam.copy(camera);
    this.cam.aspect = W / H;
    this.cam.setViewOffset(W, H, this.x - span / 2, this.y - span / 2, span, span);
    this.cam.updateProjectionMatrix();
    const prevTarget = r.getRenderTarget();
    r.setRenderTarget(this.target);
    r.clear();
    r.render(scene, this.cam);
    r.setRenderTarget(prevTarget);

    // 2) draw it as a lens on top of the frame (pixel coordinates, y up)
    this.ortho.right = W; this.ortho.top = H; this.ortho.updateProjectionMatrix();
    [this.lens, this.rim, this.glow, this.cross].forEach((m) => { m.position.set(this.x, H - this.y, 0); m.scale.set(R, R, 1); });
    const auto = r.autoClear;
    r.autoClear = false;
    r.clearDepth();
    r.render(this.overlay, this.ortho);
    r.autoClear = auto;
  }

  dispose() {
    this.target.dispose();
    this.overlay.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  }
}
