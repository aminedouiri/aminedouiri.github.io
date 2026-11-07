import { useEffect, useRef, useState } from "react";
import anime from "animejs";

const STEPS = ["terraform apply", "paving the road", "building the city", "starting engine", "ready"];

/** Short boot screen; calls onDone when finished, then fades out. */
export default function Loader({ onDone }) {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const finish = () => {
      onDone();
      anime({ targets: ref.current, opacity: [1, 0], duration: 700, easing: "easeOutQuad", complete: () => setGone(true) });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onDone(); setGone(true); return; }
    const o = { v: 0 };
    const a = anime({ targets: o, v: 100, duration: 1500, easing: "easeInOutQuad", update: () => setPct(o.v), complete: finish });
    return () => a.pause();
  }, [onDone]);

  if (gone) return null;
  return (
    <div className="loader" ref={ref} aria-hidden="true">
      <div className="box">
        <div className="row mono">
          <span>{STEPS[Math.min(STEPS.length - 1, Math.floor(pct / 21))]}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="bar"><i style={{ width: pct + "%" }} /></div>
      </div>
    </div>
  );
}
