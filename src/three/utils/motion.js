/** True when the visitor asked the OS for reduced motion. */
export const reduceMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Phone / narrow layout. */
export const isMobile = () => window.innerWidth <= 900;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smoothstep = (f) => f * f * (3 - 2 * f);
