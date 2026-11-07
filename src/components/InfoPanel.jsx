import { forwardRef, useEffect, useRef, useState } from "react";
import anime from "animejs";
import Badge from "./Badge.jsx";
import { profile } from "../data/profile.js";
import { jobs, stack } from "../data/experience.js";
import { tech } from "../data/tech.js";
import { stops, FACE_LABELS } from "../data/stops.js";
import { scramble } from "../lib/scramble.js";

const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- small pieces ---------- */

function CopyEmail() {
  const [label, setLabel] = useState("Copy email");
  const copy = () => {
    navigator.clipboard?.writeText(profile.email).then(() => setLabel("Copied"), () => setLabel(profile.email));
  };
  return <button className="btn blue" type="button" onClick={copy}>{label}</button>;
}

function ContactActions() {
  return (
    <div className="xp-actions">
      <CopyEmail />
      <a className="btn ghost" href={profile.linkedin.url} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
      <a className="btn ghost" href={profile.github.url} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
    </div>
  );
}

const KV = ({ rows, keys = false }) => (
  <dl className={"xp-kv" + (keys ? " keys" : "")}>
    {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
  </dl>
);

const Grid = ({ items }) => (
  <div className="xp-grid">
    {items.map(([h, p]) => <div key={h}><h3>{h}</h3><p>{p}</p></div>)}
  </div>
);

/* ---------- stop content (one function per kind of stop) ---------- */

function stopHeader(index) {
  const s = stops[index];
  if (s.kind === "job") {
    const j = s.job;
    return {
      chips: [<span key="d" className="xp-chip mono">{j.start} — {j.end}</span>, j.kind && <span key="k" className="xp-chip ghost mono">{j.kind}</span>],
      title: <>{j.title} <em>{j.titleAccent}</em></>,
      sub: <><strong>{j.company}</strong> · {j.place}</>,
    };
  }
  const t = {
    intro: [<>Hello, I’m <em>{profile.name}</em></>, `${profile.role} · ${profile.location}`],
    stack: [<>My <em>toolchain</em></>, "What I use to build, ship and run platforms"],
    contact: [<>Let’s <em>talk</em></>, "Open to DevOps, Platform and SRE roles"],
  }[s.kind];
  return { chips: [<span key="l" className="xp-chip ghost mono">{s.label}</span>], title: t[0], sub: t[1] };
}

function StopBody({ index, face }) {
  const s = stops[index];
  if (s.kind === "job") {
    const j = s.job;
    if (face === 0) return (<>
      <KV rows={[["Role", `${j.title} ${j.titleAccent}`], [j.kind ? "School" : "Company", j.company], ["Period", `${j.start} — ${j.end}`], ["Where", j.place]]} />
      <p className="xp-lead">{j.points[0]}</p>
    </>);
    if (face === 1) return <ol className="xp-list">{j.points.map((p) => <li key={p}>{p}</li>)}</ol>;
    if (face === 2) return (
      <div className="xp-metrics">
        {j.facts.map(([v, l], k) => <div key={l} className={k === 0 ? "hot" : undefined}><b data-scramble>{v}</b><span>{l}</span></div>)}
      </div>
    );
    return <div className="xp-tags">{j.stack.map((t) => <span key={t}>{t}</span>)}</div>;
  }
  if (s.kind === "intro") return [
    <><p className="xp-lead big">I keep software <em>shipping</em> and staying up.</p><p className="xp-lead">Drive through my career: each stop is a job, each cube holds the details.</p></>,
    <p className="xp-lead">{profile.about}</p>,
    <KV keys rows={[["↑ W", "Accelerate"], ["↓ S", "Brake / reverse"], ["← → A D", "Steer anywhere"], ["N / P", "Next / previous stop"]]} />,
    <><p className="xp-lead big">Smash the <em>BUG</em> cubes on the road.</p><p className="xp-lead">Crates, barriers and FIREWALL walls break too.</p></>,
  ][face];
  if (s.kind === "stack") return [
    <Grid items={stack} />, <Grid items={stack.slice(0, 3)} />, <Grid items={stack.slice(3)} />,
    <p className="xp-lead big">Always learning the <em>next</em> tool.</p>,
  ][face];
  return [
    <><p className="xp-lead">I usually reply within one working day.</p><ContactActions /></>,
    <><KV rows={[["Email", profile.email], ["LinkedIn", profile.linkedin.label]]} /><ContactActions /></>,
    <KV rows={[["GitHub", profile.github.label], ["Based in", profile.location]]} />,
    <><p className="xp-lead big">Your next platform could be <em>my next stop</em>.</p><ContactActions /></>,
  ][face];
}

/* ---------- tech content ---------- */

function TechBody({ index }) {
  const t = tech[index];
  const has = (a, b) => a.toLowerCase().includes(b.toLowerCase());
  const usedIn = jobs.filter((j) => j.stack.some((s) => has(t.short, s) || has(s, t.short))).map((j) => j.company);
  return (<>
    <p className="xp-lead">{t.use}</p>
    {t.parts && <Grid items={t.parts} />}
    <KV rows={[["Category", t.cat], ["Used in", usedIn.length ? usedIn.join(", ") : "[Your projects]"]]} />
  </>);
}

/* ---------- the panel ---------- */

/**
 * view: null | { type: "stop", index } | { type: "tech", index }
 * face: current cube face for stops (0–3); onFace(f) turns the cube.
 */
const InfoPanel = forwardRef(function InfoPanel({ view, face, onFace, minimised, onToggleMin }, ref) {
  const [shown, setShown] = useState(view);       // keeps the last content while closing
  const inner = useRef(null), body = useRef(null), ind = useRef(null), tabs = useRef(null);
  const open = !!view;
  useEffect(() => { if (view) setShown(view); }, [view]);

  // swing open / closed in 3D
  useEffect(() => {
    const el = inner.current; if (!el) return;
    if (reduce()) { el.style.opacity = open ? 1 : 0; return; }
    anime.remove(el);
    if (open) anime({ targets: el, rotateY: [-32, 0], translateX: [-40, 0], opacity: [0, 1], scale: [0.94, 1], duration: 900, easing: "easeOutExpo" });
    else anime({ targets: el, rotateY: -18, translateX: -24, opacity: 0, duration: 380, easing: "easeInQuad" });
  }, [open]);

  // content entrance + sliding tab indicator whenever the stop, tech or face changes
  const key = shown ? shown.type + shown.index + ":" + (shown.type === "stop" ? face : 0) : "";
  useEffect(() => {
    if (!shown) return;
    const tb = tabs.current?.querySelectorAll("button")[face];
    if (tb && ind.current) {
      if (reduce()) { ind.current.style.left = tb.offsetLeft + "px"; ind.current.style.width = tb.offsetWidth + "px"; }
      else anime({ targets: ind.current, left: tb.offsetLeft, width: tb.offsetWidth, duration: 500, easing: "easeOutExpo" });
    }
    const el = body.current; if (!el) return;
    el.querySelectorAll("[data-scramble]").forEach((n, k) => setTimeout(() => scramble(n, 800), 120 + k * 110));
    if (!reduce()) anime({ targets: el.children, translateY: [16, 0], opacity: [0, 1], duration: 650, easing: "easeOutCubic", delay: anime.stagger(55) });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  let content = null;
  if (shown?.type === "stop") {
    const h = stopHeader(shown.index);
    const labels = FACE_LABELS[stops[shown.index].kind];
    content = (<>
      <div className="xp-head">
        <div className="xp-eyebrow">
          {h.chips}
          <span className="xp-num mono">{String(shown.index + 1).padStart(2, "0")} / {String(stops.length).padStart(2, "0")}</span>
          <button className="xp-min" type="button" aria-label={minimised ? "Expand details" : "Minimise details"} onClick={onToggleMin}>{minimised ? "+" : "−"}</button>
        </div>
        <h2 className="xp-title">{h.title}</h2>
        <p className="xp-sub">{h.sub}</p>
      </div>
      <div className="xp-tabs" role="tablist" ref={tabs}>
        {labels.map((l, f) => (
          <button key={l} type="button" role="tab" aria-selected={f === face} className={f === face ? "on" : undefined} onClick={() => onFace(f)}>{l}</button>
        ))}
        <i className="xp-ind" ref={ind} />
      </div>
      <div className="xp-body" role="tabpanel" ref={body} key={key}><StopBody index={shown.index} face={face} /></div>
    </>);
  } else if (shown?.type === "tech") {
    const t = tech[shown.index];
    content = (<>
      <div className="xp-head">
        <div className="xp-eyebrow">
          <span className="xp-chip ghost mono">{t.cat}</span><span className="xp-num mono">TECH</span>
          <button className="xp-min" type="button" aria-label={minimised ? "Expand details" : "Collapse details (diagram uses the whole page)"} title={minimised ? "Expand details" : "Collapse: give the diagram the whole page"} onClick={onToggleMin}>{minimised ? "+" : "−"}</button>
        </div>
        <div className="xp-tt"><Badge tech={t} big /><h2 className="xp-title"><em>{t.short}</em></h2></div>
        <p className="xp-sub">How I use it</p>
      </div>
      <div className="xp-body tech" ref={body} key={key}><TechBody index={shown.index} /></div>
    </>);
  }

  const cls = ["xp", open && "show", minimised && "min"].filter(Boolean).join(" ");
  return (
    <section className={cls} aria-live="polite" aria-label="Details">
      <div className="xp-in" ref={(el) => { inner.current = el; if (ref) ref.current = el; }}>{content}</div>
    </section>
  );
});

export default InfoPanel;
