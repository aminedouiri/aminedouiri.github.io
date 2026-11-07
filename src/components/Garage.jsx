import { VEHICLES } from "../three/world/vehicles.js";
import Badge from "./Badge.jsx";
import { tech } from "../data/tech.js";

/* Simple original line icons (24×24). */
const ICONS = {
  car: <path d="M3 15v-3l2.2-4.2A2 2 0 0 1 7 6.7h8.6a2 2 0 0 1 1.6.8L20 11l1 .6V15M3 15h18M6.5 17.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM6 11h13" />,
  moto: <path d="M5.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5.5 15l4-5h5l4 5M14.5 10l-1.5-3h3M9.5 10l2 5h2" />,
  plane: <path d="M12 3c.8 0 1.3.9 1.3 2v4.6L21 14v2l-7.7-2.4V18l2.2 1.6V21L12 20l-3.5 1v-1.4L10.7 18v-4.4L3 16v-2l7.7-4.4V5c0-1.1.5-2 1.3-2Z" />,
  person: <path d="M12 7.5a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4ZM12 9.5v6m0 0-3 5.5m3-5.5 3 5.5M7 12l5-2.5 5 2.5" />,
};

/**
 * Right-hand picker: choose what you drive, and jump straight to any technology.
 * On phones it collapses to one button that cycles the vehicle (tech lives in the header menu there).
 */
export default function Garage({ vehicle, onVehicle, activeTech = -1, onTech }) {
  const cycle = (list, id) => list[(list.findIndex((x) => x.id === id) + 1) % list.length].id;
  const v = VEHICLES.find((x) => x.id === vehicle) || VEHICLES[0];
  // entries that only reuse another landmark (GitHub Actions, GitLab CI → CI/CD) get no badge of their own
  const items = tech.map((t, k) => ({ t, k })).filter(({ t }) => !t.alias);
  const aliasOf = activeTech >= 0 && tech[activeTech].alias;
  const active = aliasOf ? tech.findIndex((t) => t.id === aliasOf) : activeTech;

  return (
    <aside className="garage" aria-label="Vehicle and technologies">
      <div className="g-full">
        <div className="g-group">
          <span className="mono g-lbl">Ride <b>{v.label}</b></span>
          <div className="g-row">
            {VEHICLES.map((x) => (
              <button key={x.id} className={"g-btn" + (x.id === vehicle ? " on" : "")} onClick={() => onVehicle(x.id)} title={x.label} aria-label={x.label} aria-pressed={x.id === vehicle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[x.id]}</svg>
              </button>
            ))}
          </div>
        </div>
        <div className="g-group">
          <span className="mono g-lbl">Tech <b>{active >= 0 ? tech[active].short : `${items.length} items`}</b></span>
          <div className="g-row g-tech">
            {items.map(({ t, k }) => (
              <button key={t.id} className={"g-btn g-tb" + (k === active ? " on" : "")} onClick={() => onTech(k)} title={t.short} aria-label={`Go to ${t.short}`} aria-pressed={k === active}>
                <Badge tech={t} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="g-compact">
        <button className="g-btn on" onClick={() => onVehicle(cycle(VEHICLES, vehicle))} aria-label={`Ride: ${v.label}. Tap to change`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[v.id]}</svg>
        </button>
      </div>
    </aside>
  );
}
