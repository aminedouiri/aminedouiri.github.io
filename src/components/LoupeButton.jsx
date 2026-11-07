/** Toggle for the magnifying lens (desktop): it follows the pointer, scroll changes the zoom, Z toggles, Esc closes. */
export default function LoupeButton({ on, zoom, onToggle }) {
  return (
    <button type="button" className={"loupe-btn" + (on ? " on" : "")} aria-pressed={on} onClick={onToggle}
      title={on ? "Zoom lens on: scroll to change zoom · Z or Esc to close" : "Zoom lens (Z): magnify details of big diagrams"}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5M10.5 8v5M8 10.5h5" />
      </svg>
      <span className="mono">{on ? `${zoom.toFixed(1)}×` : "Zoom"}</span>
    </button>
  );
}
