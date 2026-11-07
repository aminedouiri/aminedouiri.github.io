import { useEffect } from "react";

const DRIVE_KEYS = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };

/**
 * Keyboard shortcuts.
 *   WASD / arrows  drive        N / P  next / previous stop
 *   T  tech menu   F  frameworks   M  sound   Z  zoom lens   Esc  close overlays
 */
export function useKeyboard({ onDrive, onNext, onPrev, onTech, onFrameworks, onSound, onLoupe, onEscape, onBlur }) {
  useEffect(() => {
    const typing = (e) => e.target.closest && e.target.closest("input, textarea, [contenteditable]");
    const handle = (e, down) => {
      if (typing(e)) return;
      const k = e.key.toLowerCase();
      if (DRIVE_KEYS[k]) { e.preventDefault(); onDrive(DRIVE_KEYS[k], down); return; }
      if (!down) return;
      if (k === "n" || k === "pagedown") onNext();
      else if (k === "p" || k === "pageup") onPrev();
      else if (k === "t") onTech();
      else if (k === "f") onFrameworks();
      else if (k === "m") onSound();
      else if (k === "z") onLoupe?.();
      else if (k === "escape") onEscape();
    };
    const kd = (e) => handle(e, true), ku = (e) => handle(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", onBlur);
    };
  }, [onDrive, onNext, onPrev, onTech, onFrameworks, onSound, onLoupe, onEscape, onBlur]);
}
