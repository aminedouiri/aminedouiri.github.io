# DevOps Portfolio — 3D drive

A one-page portfolio where a small car drives through an open 3D world.
Each stop on the road is a rotating info cube (experience, education, stack, contact),
and the right side of the road holds 3D landmarks for each tool and DevOps framework.

Built with **React 18 + Vite**, **three.js** (3D) and **anime.js** (UI animation).

## Run it

```bash
npm install
npm run dev       # local dev server (opens the browser)
npm run build     # production build -> dist/
npm run preview   # serve the built dist/ locally
```

Requires Node.js 18 or newer.

## Where to edit things

| You want to change…                   | Edit this file                         |
| ------------------------------------- | -------------------------------------- |
| Name, role, email, LinkedIn, GitHub   | `src/data/profile.js`                  |
| Jobs, education, skills stack         | `src/data/experience.js`               |
| Tools / frameworks shown in the world | `src/data/tech.js`                     |
| Order of the stops on the road        | `src/data/stops.js`                    |
| Vehicles (car, motorcycle, plane, person) | `src/three/world/vehicles.js`      |
| World themes (night, sunset, arctic, neon) | `src/three/world/themes.js`       |
| Driving & crash sounds                | `src/audio/sound.js` (`SETTINGS` at the top) |
| Colours, fonts, spacing               | `src/styles/*.css`                     |
| Frameworks one-page view (SVG cards)  | `src/components/FrameworksPage.jsx`, `frameworkDiagrams.js` |

### Add a job

Add an object to `jobs` in `src/data/experience.js`:

```js
{
  start: "2024", end: "Now",
  title: "Senior DevOps", titleAccent: "Engineer",
  company: "Company", place: "City",
  points: ["What you did…", "Impact…"],
  facts: [["Team", "8"], ["Cloud", "GCP"]],
  stack: ["Kubernetes", "Terraform"],
  // kind: "Education"   // optional: label the stop as education
}
```

A new cube and checkpoint appear on the road automatically.

### Add a tool landmark

1. Add an entry to `tech` in `src/data/tech.js` (`id`, `mono`, `name`, `short`, `cat`, `use`, `parts`).
2. Create `src/three/landmarks/tools/<name>.js` exporting `function build(g, anims)`:
   add meshes to the group `g`; push `(now, dt) => {}` callbacks to `anims` for animation.
3. Register it in the `SHAPES` map in `src/three/landmarks/index.js` under the same `id`.

Use the helpers in `src/three/landmarks/helpers.js` (`glowMat`, `darkMat`, `rack`, `pedestal`, `badgeSprite`…)
to keep the look consistent. To reuse another landmark, set `alias: "<id>"` in `tech.js` instead.

### Add a world theme

Copy an entry in `src/three/world/themes.js`, give it a new `id` and `label`, and change the colours.
It appears in the picker automatically.

### Label a part of a landmark

Inside a shape file, call `addTag(group, "Text", "#5B8CFF", x, y, z, width)` (from `landmarks/helpers.js`).

## Project structure

```
src/
  main.jsx            entry (imports styles)
  App.jsx             creates the 3D World and wires it to the React UI
  data/               ← all content lives here
  components/         React UI: Header, InfoPanel, TechMenu, Timeline, Hud, DrivePad, FrameworksPage…
  hooks/              useKeyboard
  audio/sound.js      engine + crash sounds (Web Audio, no files)
  lib/scramble.js     text scramble effect
  three/
    World.js          the 3D engine: scene, camera, car physics, stops, focus mode
    world/            environment, road, city, checkpoints, info cubes, obstacles, car
    landmarks/        index.js (layout) + helpers + frameworks/* + tools/*
    utils/            textures, 2D canvas drawing, motion helpers
```

### How React and three.js talk

`World` is a plain class (no React inside). `App.jsx` creates it once and:

- calls methods on it: `goStop(i)`, `next()`, `prev()`, `goTech(id)`, `turnFace(dir)`, `setControl(key, on)`
- receives events through `onEvent({ type, ... })`: `stop`, `face`, `view`, `mode`, `hud`, `smash`
- receives per-frame data through `onFrame({ progress, link })`, applied via refs (no re-render each frame)

## Controls

- **Arrows / WASD** — drive and steer
- **N / P** or the buttons — next / previous stop
- **Click a cube** or the tabs — rotate its faces
- **T** — tech menu: fly directly to any tool or framework
- **F** — frameworks one-page view
- **M** — sound on / off
- **Esc** — close overlays

Shortcuts are defined in `src/hooks/useKeyboard.js`.

## Notes

- `three` is pinned to `0.128.0` and `animejs` to `3.2.2`; newer majors change APIs
  (`outputEncoding`, anime.js v4 imports). Upgrade deliberately.
- React StrictMode is intentionally off so the 3D world isn't created twice in dev.
- The tool badges are simple monograms, not official logos.
