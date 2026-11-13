You are working on my DevOps engineer portfolio: a one-page 3D "drive" website built with
React 18 + Vite 5, three.js 0.128.0 and anime.js 3.2.2. Match the existing design EXACTLY.
If the repository is available, read it first and treat it as the source of truth; this brief
describes it so you never drift from it.

## Hard rules
- Do not change the visual design, colours, fonts, spacing, camera behaviour or animations unless I ask.
- Keep versions pinned: three@0.128.0 (uses renderer.outputEncoding / sRGBEncoding), animejs@3.2.2 (`import anime from "animejs"`). Do not upgrade.
- No React StrictMode (it would build the 3D world twice).
- All content lives in `src/data/*`. Never hard-code names, jobs or tech text in components.
- Badges are original monograms (e.g. "K8s", "TF"), never official logos. All 3D shapes are original designs built from three.js primitives (no model files, no images).
- No background music. Only Web Audio synthesized ride sounds + soft crash thumps (`src/audio/sound.js`).
- Respect `prefers-reduced-motion` everywhere (no bobbing, no orbit, instant transitions).
- Keep files small and single-purpose, as in the current structure. Comment the "why", not the "what".

## Design tokens (src/styles/base.css)
- Background ink `#07080B`; text `#F2F3F5`; muted `#A2A8B3`; rules `rgba(242,243,245,.12)`.
- One signal blue `#5B8CFF` (Dev, links, active). Amber `#FFB547` only marks "you are here" / Ops / frameworks.
- Green `#38D98A` = healthy / passed / elite. Red `#FF5A5A` = blocked / alert.
- Fonts: "Plus Jakarta Sans" (UI, weights 500–800, tight negative letter-spacing on titles) and "JetBrains Mono" (`.mono`: 11.5px, uppercase, letter-spacing .08em) for labels, HUD and eyebrows.
- Glass surfaces: `background: rgba(10,11,15,.72)`, `backdrop-filter: blur(12px)`, `border: 1px solid var(--rule)`, radius 16px (buttons 10–12px).
- Page side margin `clamp(18px, 3.6vw, 56px)`. Minimum touch target 44px for header buttons, 40px for pad/picker buttons.
- A top/bottom dark gradient veil over the canvas keeps UI readable.

## Screen layout (fixed over a full-screen WebGL canvas, no scrolling)
- Header (top): monogram brand + name/role left; right: "Open to work" status dot, Sound on/off, Frameworks, Tech ▾ (dropdown menu, 2 columns, grouped), Contact (white filled button).
- HUD (top-right, under header): SPEED km/h, ODOMETER km, SMASHED count, mono 10px.
- Info panel (left, top 96px, width min(370px, 32vw)): eyebrow chip, monogram + title, text, small fact cards, tabs; minimisable; animated with anime.js. A thin blue line links the panel to the active 3D object.
- Ride & World picker (right, top 150px): glass card, "RIDE" 2×2 icon buttons (car, motorcycle, airplane, person) and "WORLD" 2×2 swatches (Night city, Sunset, Arctic day, Neon). Active ride = solid blue; active world = amber inset ring. Collapses to two cycle buttons on ≤900px.
- Drive pad (bottom-right, 3×2 grid of 40px buttons) with "MODE AUTO/FREE DRIVE · WASD" label.
- Dock (bottom-centre, width min(860px, 100vw − 36px)): timeline of stops (Start, years…, Education, Stack, Contact) with progress fill and car marker, plus Back / Next buttons (Next is solid blue).
- Frameworks page: full-screen overlay, 3-column grid of cards (DevOps loop and DevSecOps span 2 columns), each with an SVG diagram and "See it in 3D ↗".

## 3D world (src/three/World.js + world/* + landmarks/*)
- Night highway: open curved road (ROAD_W 3.4) with kerbs, studs and lamps, an infinite grid floor, fog (near 30, far 140), sky gradient + stars, distant city blocks.
- Camera: perspective FOV 42 (55 on mobile), smooth chase camera; the vehicle is ALWAYS visible (framing guard keeps it out from behind the panel).
- Vehicle is small (scale 0.28) with an amber arrow marker + ground ring above it; marker holds still when stopped. Rides are swappable (car / motorcycle with rider / low-flying airplane / walking person).
- Stops: each job/education/stack/contact stop is a rotating 3D info cube (CUBE 3.6) on the LEFT side of the road with canvas-drawn faces, reached through a checkpoint gate.
- Landmarks: every tool and framework is a 3D landmark on the RIGHT side of the road (near row 8, far row 15.5, scale 0.58), on a hexagonal glowing pedestal, with a title sprite and monogram badge above, and small camera-facing part labels (`addTag`). Shapes: Kubernetes, Docker, Terraform, CI/CD (GitHub Actions + GitLab CI alias), Argo CD, Prometheus, OpenTelemetry, Grafana, Google Cloud, Proxmox, VMware, Networking; frameworks: DevOps loop (big, start of road), CALMS, DORA, SRE pyramid, Three Ways, MLOps, DevSecOps.
- Breakable obstacles on the road; hits shake the camera (never while parked) and play a soft thump.
- Choosing a tech from the menu drives there and parks BESIDE the pedestal. Focus mode hides everything else, the landmark grows (FOCUS_ZOOM 1.6), its title/badge fade out (the panel shows the name), and the camera fits the measured shape + car inside the screen area left free by the UI (`getSafeArea`). The camera is steady while parked: no orbit, no mouse sway, no shake.
- World themes recolour sky, fog, lights, ground and grid with a 0.9s fade.

## Architecture
- `World` is a plain class (no React). App creates it once and calls methods (`goStop`, `next`, `prev`, `goTech`, `turnFace`, `setControl`, `setVehicle`, `setWorld`); World reports back via `onEvent({type})` (stop, face, view, mode, hud, smash) and `onFrame({progress, link})`, applied through refs (no re-render per frame).
- New landmark = data entry in `src/data/tech.js` + `src/three/landmarks/tools|frameworks/<name>.js` exporting `(g, anims) => void` + register in `SHAPES` in `landmarks/index.js`. Reuse helpers: `glowMat`, `darkMat`, `framedBox`, `gear`, `bar`, `rack`, `line3`, `addTag`, `pedestal`.
- Deployed to GitHub Pages via `.github/workflows/deploy.yml` (Vite `base: "/"`).

## Your task
[Describe the change you want here.]

When done: run `npm run build`, make sure there are no errors, list the files you changed, and explain any
visual change in one line each.
