import { useState } from "react";

const BUTTONS = [
  { k: "up", cls: "up", label: "Accelerate", d: "M3 9l4-4 4 4" },
  { k: "left", cls: "lf", label: "Steer left", d: "M9 3 5 7l4 4" },
  { k: "down", cls: "dn", label: "Brake and reverse", d: "M3 5l4 4 4-4" },
  { k: "right", cls: "rt", label: "Steer right", d: "m5 3 4 4-4 4" },
];

/** On-screen driving pad (hold to drive) + the auto / free-roam label. */
export default function DrivePad({ manual, held, onControl }) {
  const [local, setLocal] = useState({});
  const set = (k, on, e) => {
    if (e && on) { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* not supported */ } }
    setLocal((s) => ({ ...s, [k]: on }));
    onControl(k, on);
  };
  return (
    <>
      <span className="mode mono">mode <b>{manual ? "free roam" : "auto"}</b></span>
      <div className="pad" role="group" aria-label="Drive the car">
        {BUTTONS.map((b) => (
          <button
            key={b.k}
            type="button"
            className={b.cls + (local[b.k] || held[b.k] ? " held" : "")}
            aria-label={b.label}
            onPointerDown={(e) => set(b.k, true, e)}
            onPointerUp={() => set(b.k, false)}
            onPointerCancel={() => set(b.k, false)}
            onLostPointerCapture={() => set(b.k, false)}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={b.d} /></svg>
          </button>
        ))}
        <span className="tip mono">free drive · WASD</span>
      </div>
    </>
  );
}
