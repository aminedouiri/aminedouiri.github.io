import Badge from "./Badge.jsx";
import { tech } from "../data/tech.js";

/** Drop-down list of every tech / framework. Picking one drives the car to its landmark. */
export default function TechMenu({ open, onPick }) {
  return (
    <div className={"techmenu" + (open ? " open" : "")} id="techMenu" role="menu" aria-label="Go to a technology">
      <span className="tm-h mono">Frameworks <i /> · Tools <i className="b" /></span>
      {tech.map((t, k) => (
        <button key={t.id} type="button" role="menuitem" onClick={() => onPick(k)}>
          <Badge tech={t} />
          <span><b>{t.short}</b><small>{t.cat}</small></span>
        </button>
      ))}
    </div>
  );
}
