import { useCallback, useEffect, useRef, useState } from "react";
import { World } from "./three/World.js";
import { createSound } from "./audio/sound.js";
import { profile } from "./data/profile.js";
import { stack } from "./data/experience.js";
import { tech } from "./data/tech.js";
import { stops } from "./data/stops.js";
import { useKeyboard } from "./hooks/useKeyboard.js";
import Loader from "./components/Loader.jsx";
import Header from "./components/Header.jsx";
import TechMenu from "./components/TechMenu.jsx";
import InfoPanel from "./components/InfoPanel.jsx";
import LinkLine from "./components/LinkLine.jsx";
import Timeline from "./components/Timeline.jsx";
import DrivePad from "./components/DrivePad.jsx";
import Hud from "./components/Hud.jsx";
import FrameworksPage from "./components/FrameworksPage.jsx";
import Garage from "./components/Garage.jsx";

/* Remember the chosen vehicle and world between visits (ignored if storage is blocked). */
const saved = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } };

/**
 * The part of the screen not covered by the header, timeline, info panel or picker (px).
 * The 3D view centres landmark close-ups inside it.
 */
function getSafeArea() {
  const W = window.innerWidth, H = window.innerHeight, mobile = W <= 900;
  const rect = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? r : null; };
  const head = rect(".head"), dock = rect(".dock"), panel = rect(".xp.show .xp-in"), garage = rect(".garage"), hud = rect(".hud");
  const area = { left: 0, right: W, top: head ? head.bottom : 70, bottom: dock ? dock.top : H - 80 };
  if (hud && !mobile) area.top = Math.max(area.top, hud.bottom * 0.6);
  if (panel) { if (mobile) area.bottom = Math.min(area.bottom, panel.top); else area.left = Math.max(area.left, panel.right); }
  if (garage) { if (mobile) area.top = Math.max(area.top, garage.bottom); else area.right = Math.min(area.right, garage.left); }
  return area;
}

export default function App() {
  const canvas = useRef(null);
  const world = useRef(null);
  const sound = useRef(null);
  const panel = useRef(null);
  const link = useRef(null);
  const timeline = useRef(null);
  const loaded = useRef(false);

  const [stopIndex, setStopIndex] = useState(-1);
  const [view, setView] = useState(null);
  const [face, setFace] = useState(0);
  const [manual, setManual] = useState(false);
  const [hud, setHud] = useState({ speed: 0, odo: "0.0", hits: 0 });
  const [held, setHeld] = useState({});
  const [techOpen, setTechOpen] = useState(false);
  const [fwOpen, setFwOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [vehicle, setVehicle] = useState(() => saved("pf.vehicle", "car"));
  const [worldId, setWorldId] = useState(() => saved("pf.world", "night"));

  /* ---------- create the 3D world once ---------- */
  useEffect(() => {
    sound.current = createSound();
    sound.current.setRide(vehicle);
    let w;
    try {
      w = new World({
        canvas: canvas.current,
        data: { stops, tech, profile, stack },
        vehicle, world: worldId,
        getPanelRect: () => panel.current?.getBoundingClientRect() ?? null,
        getSafeArea,
        onEvent: (type, p) => {
          if (type === "stop") setStopIndex(p.index);
          else if (type === "face") setFace(p.face);
          else if (type === "view") setView(p);
          else if (type === "mode") setManual(p.manual);
          else if (type === "hud") { setHud(p); sound.current.engine(p.speed / 9); }
          else if (type === "smash") sound.current.smash(p.wide);
        },
        onFrame: ({ progress, link: point }) => {
          timeline.current?.setProgress(progress);
          link.current?.update(point, panel.current?.getBoundingClientRect());
        },
      });
    } catch (e) {
      console.error(e);
      setWebglError(true);
      return undefined;
    }
    world.current = w;
    w.start();
    if (loaded.current) w.goStop(0);
    return () => { w.dispose(); world.current = null; };
  }, []);

  // keep the panel tabs in sync with the cube when the stop changes
  useEffect(() => { if (world.current) setFace(world.current.currentFace()); }, [stopIndex]);

  /* ---------- actions ---------- */
  const goStop = useCallback((i) => world.current?.goStop(i), []);
  const goTech = useCallback((k) => { setTechOpen(false); world.current?.goTech(k); }, []);
  const seeIn3D = useCallback((id) => { setFwOpen(false); const k = tech.findIndex((t) => t.id === id); if (k >= 0) world.current?.goTech(k); }, []);
  const toggleSound = useCallback(() => setSoundOn(sound.current.setOn(!sound.current.on)), []);
  const drive = useCallback((name, on) => { world.current?.setControl(name, on); setHeld((h) => ({ ...h, [name]: on })); }, []);
  const onLoaded = useCallback(() => { loaded.current = true; world.current?.goStop(0); }, []);

  useKeyboard({
    onDrive: drive,
    onNext: () => world.current?.next(),
    onPrev: () => world.current?.prev(),
    onTech: () => setTechOpen((o) => !o),
    onFrameworks: () => setFwOpen((o) => !o),
    onSound: toggleSound,
    onEscape: () => { setFwOpen(false); setTechOpen(false); },
    onBlur: () => { world.current?.releaseControls(); setHeld({}); },
  });

  // close the tech menu when clicking elsewhere
  useEffect(() => {
    if (!techOpen) return undefined;
    const close = (e) => { if (!e.target.closest("#techMenu, #techBtn")) setTechOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [techOpen]);

  // swipe left / right on touch screens to change stop
  useEffect(() => {
    let x0 = null;
    const start = (e) => { x0 = e.target.closest(".pad, .dock, .xp, .fwpage") ? null : e.touches[0].clientX; };
    const end = (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 60) (dx < 0 ? world.current?.next() : world.current?.prev());
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end);
    return () => { window.removeEventListener("touchstart", start); window.removeEventListener("touchend", end); };
  }, []);

  return (
    <>
      <canvas id="gl" ref={canvas} aria-hidden="true" />
      <div className="veil" aria-hidden="true" />
      {webglError && <p className="webgl-error">Your browser could not start 3D graphics (WebGL). Try another browser or enable hardware acceleration.</p>}

      <FrameworksPage open={fwOpen} onClose={() => setFwOpen(false)} onSeeIn3D={seeIn3D} />
      <TechMenu open={techOpen} onPick={goTech} />
      <Header
        soundOn={soundOn} onSound={toggleSound}
        onHome={() => goStop(0)}
        onFrameworks={() => setFwOpen((o) => !o)} fwOpen={fwOpen}
        onTech={() => setTechOpen((o) => !o)} techOpen={techOpen}
        onContact={() => goStop(stops.length - 1)}
      />

      <LinkLine ref={link} show={!!view} />
      <InfoPanel
        ref={panel}
        view={view}
        face={face}
        onFace={(f) => world.current?.setFace(f)}
        minimised={minimised}
        onToggleMin={() => setMinimised((m) => !m)}
      />

      <Hud hud={hud} />
      <Garage
        vehicle={vehicle} world={worldId}
        onVehicle={(id) => { setVehicle(id); save("pf.vehicle", id); world.current?.setVehicle(id); sound.current?.setRide(id); }}
        onWorld={(id) => { setWorldId(id); save("pf.world", id); world.current?.setWorld(id); }}
      />
      <DrivePad manual={manual} held={held} onControl={drive} />
      <Timeline ref={timeline} index={stopIndex} onGo={goStop} />
      <Loader onDone={onLoaded} />
    </>
  );
}
