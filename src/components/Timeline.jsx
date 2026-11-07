import { forwardRef, useImperativeHandle, useRef } from "react";
import { stops, stopName } from "../data/stops.js";

const Arrow = ({ d }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

/**
 * Bottom bar: one tick per stop, a car puck that follows the drive, Back / Next.
 * The puck moves every frame, so it is updated through a ref (setProgress) instead of React state.
 */
const Timeline = forwardRef(function Timeline({ index, onGo }, ref) {
  const fill = useRef(null), puck = useRef(null);
  useImperativeHandle(ref, () => ({
    setProgress(p) {
      if (fill.current) fill.current.style.width = p + "%";
      if (puck.current) puck.current.style.left = p + "%";
    },
  }), []);

  const last = stops.length - 1;
  const nextLabel = index <= 0 ? "Start the drive" : index >= last ? "Arrived" : "Next: " + stopName(stops[index + 1]);
  return (
    <nav className="dock" aria-label="Career timeline">
      <div className="track">
        <div className="rail"><i ref={fill} /></div>
        {stops.map((s, i) => (
          <button
            key={i}
            type="button"
            className={"tick" + (i === index ? " on" : i < index ? " passed" : "")}
            style={{ left: (i / last) * 100 + "%" }}
            aria-label={"Drive to " + stopName(s)}
            aria-current={i === index ? "step" : undefined}
            onClick={() => onGo(i)}
          >
            <i /><span>{s.label}</span>
          </button>
        ))}
        <div className="puck" ref={puck} aria-hidden="true">
          <svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="12" fill="#F2F3F5" /><path d="M7 15.5h12l-1.2-3.4a1.5 1.5 0 0 0-1.4-1H9.6a1.5 1.5 0 0 0-1.4 1Z" fill="#07080B" /><circle cx="9.5" cy="16.5" r="1.4" fill="#07080B" /><circle cx="16.5" cy="16.5" r="1.4" fill="#07080B" /></svg>
        </div>
      </div>
      <div className="ctrls">
        <button className="btn ghost" type="button" aria-label="Previous stop" disabled={index <= 0} onClick={() => onGo(index - 1)}>
          <Arrow d="M10 3 5 8l5 5" /><span className="lbl">Back</span>
        </button>
        <button className="btn blue" type="button" aria-label="Next stop" disabled={index >= last} onClick={() => onGo(index + 1)}>
          <span className="lbl">{nextLabel}</span><Arrow d="m6 3 5 5-5 5" />
        </button>
      </div>
    </nav>
  );
});

export default Timeline;
