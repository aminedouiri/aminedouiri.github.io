import { isFramework } from "../data/tech.js";

/** Original monogram badge (not an official logo). */
export default function Badge({ tech, big = false }) {
  const cls = ["tb", isFramework(tech) && "fw", big && "big"].filter(Boolean).join(" ");
  return <span className={cls} aria-hidden="true">{tech.mono || "?"}</span>;
}
