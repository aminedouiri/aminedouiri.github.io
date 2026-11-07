import { profile } from "../data/profile.js";

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
);

const SpeakerIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 6h2.5l3.5-3v10L5 10H2.5z" />
    <path className="w1" d="M11 5.5a3.5 3.5 0 0 1 0 5" />
    <path className="w2" d="M12.8 3.6a6 6 0 0 1 0 8.8" />
    <path className="x" d="m11 6 3.5 4M14.5 6 11 10" />
  </svg>
);

export default function Header({ soundOn, onSound, onHome, onFrameworks, fwOpen, onTech, techOpen, onContact }) {
  return (
    <header className="head">
      <button className="brand" type="button" onClick={onHome}>
        <span className="mark">{profile.initials}</span>
        <span><b>{profile.name}</b><small>{profile.role}</small></span>
      </button>
      <div className="right">
        <span className="status mono"><i />Open to work</span>
        <button className={"btn ghost snd" + (soundOn ? " on" : "")} type="button" aria-pressed={soundOn} aria-label="Toggle car sounds" onClick={onSound}>
          <SpeakerIcon /><span className="snd-lbl">{soundOn ? "Sound on" : "Sound off"}</span>
        </button>
        <button className="btn ghost" type="button" aria-expanded={fwOpen} onClick={onFrameworks}>Frameworks</button>
        <button className="btn ghost tech-btn" id="techBtn" type="button" aria-haspopup="true" aria-expanded={techOpen} onClick={onTech}>Tech<Chevron /></button>
        <button className="btn solid" type="button" onClick={onContact}>Contact</button>
      </div>
    </header>
  );
}
