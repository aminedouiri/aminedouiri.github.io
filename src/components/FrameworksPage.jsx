import { useEffect, useRef } from "react";
import anime from "animejs";
import { loopSvg, calmsSvg, doraSvg, sreSvg, waysSvg, mlopsSvg, devsecopsSvg } from "./frameworkDiagrams.js";

/** ✏️  Cards on the Frameworks page. `id` must match an entry in src/data/tech.js ("See it in 3D"). */
const CARDS = [
  { id: "loop", title: "The DevOps loop", sub: "How I work end to end, from planning to monitoring and back.", svg: loopSvg, wide: true },
  { id: "calms", title: "CALMS", sub: "What a team needs to adopt DevOps.", svg: calmsSvg },
  { id: "dora", title: "DORA metrics", sub: "How I measure delivery speed and stability.", svg: doraSvg },
  { id: "sre", title: "SRE pyramid", sub: "Reliability, built from the bottom up.", svg: sreSvg },
  { id: "ways", title: "The Three Ways", sub: "Flow, feedback and continual learning.", svg: waysSvg },
  { id: "mlops", title: "MLOps", sub: "DevOps for machine-learning models.", svg: mlopsSvg },
  { id: "devsecops", title: "DevSecOps", sub: "Security built into every step of the pipeline.", svg: devsecopsSvg, wide: true },
];
const MARKUP = CARDS.map((c) => c.svg());     // static, built once

function tilt(e) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = e.currentTarget, r = c.getBoundingClientRect();
  c.style.transform = `perspective(900px) rotateY(${((e.clientX - r.left) / r.width - 0.5) * 6}deg) rotateX(${-((e.clientY - r.top) / r.height - 0.5) * 6}deg)`;
}

/** Every DevOps framework on one screen. */
export default function FrameworksPage({ open, onClose, onSeeIn3D }) {
  const grid = useRef(null);

  useEffect(() => {
    if (!open || !grid.current) return;
    const g = grid.current;
    const lp = g.querySelector("#fwLoopPath"), dot = g.querySelector("#fwPulse");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    if (lp && dot && !reduce) {         // pulse travelling around the loop
      const len = lp.getTotalLength(), t0 = performance.now();
      const step = (now) => {
        const p = lp.getPointAtLength((((now - t0) / 9000) % 1) * len);
        dot.setAttribute("cx", p.x.toFixed(1)); dot.setAttribute("cy", p.y.toFixed(1));
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    if (!reduce) {
      anime({ targets: g.querySelectorAll(".fw-card"), translateY: [30, 0], rotateX: [12, 0], opacity: [0, 1], duration: 900, easing: "easeOutExpo", delay: anime.stagger(80) });
      if (lp) { const L = lp.getTotalLength(); lp.style.strokeDasharray = L; anime({ targets: lp, strokeDashoffset: [L, 0], duration: 1600, easing: "easeInOutSine" }); }
      anime({ targets: g.querySelectorAll(".fw-node"), opacity: [0, 1], scale: [0.6, 1], duration: 600, easing: "easeOutBack", delay: anime.stagger(80, { start: 600 }) });
      g.querySelectorAll(".fw-bar").forEach((r, k) => { const h = +r.getAttribute("height"), y = +r.getAttribute("y"); anime({ targets: r, height: [0, h], y: [y + h, y], duration: 900, delay: 300 + k * 90, easing: "easeOutExpo" }); });
      g.querySelectorAll(".fw-needle").forEach((n, k) => anime({ targets: n, rotate: [-90, -90 + 180 * +n.dataset.v], duration: 1400, delay: 400 + k * 120, easing: "easeOutElastic(1, .6)" }));
      anime({ targets: g.querySelectorAll(".fw-layer"), opacity: [0, 1], translateY: [10, 0], duration: 600, delay: anime.stagger(90, { start: 300, direction: "reverse" }), easing: "easeOutCubic" });
      g.querySelectorAll(".fw-draw").forEach((p, k) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; anime({ targets: p, strokeDashoffset: [L, 0], duration: 1100, delay: 400 + k * 250, easing: "easeInOutSine" }); });
    }
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return (
    <section className={"fwpage" + (open ? " open" : "")} aria-hidden={!open} aria-label="DevOps frameworks">
      <div className="fw-head">
        <div><span className="mono" style={{ color: "var(--amber)" }}>DevOps frameworks</span><h2>How I think about delivery</h2></div>
        <button className="btn ghost" type="button" onClick={onClose}>Close ✕</button>
      </div>
      <div className="fw-grid" ref={grid}>
        {CARDS.map((c, i) => (
          <article key={c.id} className={"fw-card" + (c.wide ? " wide" : "")} onPointerMove={tilt} onPointerLeave={(e) => { e.currentTarget.style.transform = ""; }}>
            <div className="fw-top">
              <div><h3>{c.title}</h3><p>{c.sub}</p></div>
              <button className="fw-go" type="button" onClick={() => onSeeIn3D(c.id)}>See it in 3D ↗</button>
            </div>
            <div className="fw-svg-wrap" dangerouslySetInnerHTML={{ __html: MARKUP[i] }} />
          </article>
        ))}
      </div>
    </section>
  );
}
