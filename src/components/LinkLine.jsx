import { forwardRef, useImperativeHandle, useRef } from "react";

/**
 * Glowing line from the info panel to the 3D object it describes.
 * Updated every frame through the ref: update(point, panelRect).
 */
const LinkLine = forwardRef(function LinkLine({ show }, ref) {
  const svg = useRef(null), line = useRef(null), dot = useRef(null);
  useImperativeHandle(ref, () => ({
    update(p, r) {
      if (!svg.current) return;
      if (!p || !r || window.innerWidth <= 900) { svg.current.style.opacity = 0; return; }
      svg.current.style.opacity = "";
      const y1 = Math.min(Math.max(p.y, r.top + 40), r.bottom - 40);
      line.current.setAttribute("x1", r.right); line.current.setAttribute("y1", y1);
      line.current.setAttribute("x2", p.x); line.current.setAttribute("y2", p.y);
      dot.current.setAttribute("cx", p.x); dot.current.setAttribute("cy", p.y);
    },
  }), []);
  return (
    <svg ref={svg} className={"link" + (show ? " show" : "")} aria-hidden="true">
      <line ref={line} x1="0" y1="0" x2="0" y2="0" />
      <circle ref={dot} r="6" />
    </svg>
  );
});

export default LinkLine;
