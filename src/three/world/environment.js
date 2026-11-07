/* Sky, stars, lights, ground and grid. Colours are set by a world theme (see themes.js). */
import * as THREE from "three";

export const FOG_COLOR = 0x07080b;
export const FOG_NEAR = 30;
export const FOG_FAR = 140;

/** @returns handles that applyTheme() recolours */
export function buildEnvironment(scene) {
  scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

  // sky dome: soft gradient from horizon to zenith
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x0e1a3a) }, bottom: { value: new THREE.Color(0x07080b) } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = smoothstep(-0.05, 0.6, vP.y); gl_FragColor = vec4(mix(bottom, top, h), 1.0); }",
    })
  );
  scene.add(sky);
  const env = { sky: sky.material.uniforms };

  const stars = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 1800; i++) {
    const th = Math.random() * 6.283, ph = Math.random() * 1.2;
    sp.push(Math.cos(th) * Math.sin(ph) * 280, Math.cos(ph) * 280, Math.sin(th) * Math.sin(ph) * 280);
  }
  stars.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  env.stars = new THREE.PointsMaterial({ color: 0xc9d6ff, size: 0.9, sizeAttenuation: false, transparent: true, opacity: 0.7, fog: false });
  scene.add(new THREE.Points(stars, env.stars));

  env.hemi = new THREE.HemisphereLight(0x7f97e6, 0x07080b, 0.5);
  scene.add(env.hemi);
  const moon = new THREE.DirectionalLight(0xc9d6ff, 0.6);
  moon.position.set(-20, 30, 10);
  scene.add(moon);
  env.sun = moon;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.5, metalness: 0.25 }));
  ground.rotation.x = -Math.PI / 2;
  env.ground = ground.material;
  scene.add(ground);
  let grid = null;
  env.setGrid = (centre, lines) => {             // GridHelper colours are baked in, so rebuild it
    if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
    grid = new THREE.GridHelper(900, 300, centre, lines);
    grid.position.y = 0.01;
    scene.add(grid);
  };
  env.setGrid(0x161a24, 0x11141b);
  return env;
}

/** Recolour the environment for a world theme (instantly, or mixed by k from `from`). */
export function applyTheme(env, scene, renderer, to, from = to, k = 1) {
  const mix = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k);
  scene.fog.color.copy(mix(from.fog, to.fog));
  env.sky.top.value.copy(mix(from.skyTop, to.skyTop));
  env.sky.bottom.value.copy(mix(from.skyBottom, to.skyBottom));
  env.stars.opacity = from.stars + (to.stars - from.stars) * k;
  env.hemi.color.copy(mix(from.hemiSky, to.hemiSky));
  env.hemi.groundColor.copy(mix(from.hemiGround, to.hemiGround));
  env.hemi.intensity = from.hemi + (to.hemi - from.hemi) * k;
  env.sun.color.copy(mix(from.sun, to.sun));
  env.sun.intensity = from.sunI + (to.sunI - from.sunI) * k;
  env.ground.color.copy(mix(from.ground, to.ground));
  renderer.toneMappingExposure = from.exposure + (to.exposure - from.exposure) * k;
  if (k >= 1) env.setGrid(to.grid[0], to.grid[1]);
}
