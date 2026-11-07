/*
 * Soft sounds made with the Web Audio API (no audio files). Each ride has its own driving sound:
 *   car     smooth electric rush (tyres + wind) with a faint whine, silent when stopped
 *   moto    soft engine putter that speeds up with the bike
 *   plane   propeller drone with wind; idles gently even when stopped
 *   person  soft footsteps in time with walking
 * Plus a soft "thump" when obstacles are hit.
 * Browsers only allow audio after a click, so sound starts off.
 *
 * Tweak the SETTINGS below to change how each ride sounds.
 */
const SETTINGS = {
  volume: 0.35,          // overall loudness (0 – 1)
  smooth: 0.3,           // seconds to glide to a new pitch / level

  car: {
    max: 0.1,            // loudness at full speed (silent when stopped)
    rush: 380,           // tyre / wind rush pitch at low speed
    rushPerSpeed: 70,    // how much the rush brightens with speed
    whine: 160,          // electric whine pitch at rest
    whinePerSpeed: 22,   // how much the whine rises with speed
    whineLevel: 0.18,    // whine loudness compared to the rush (0 = no whine)
  },
  moto: {
    idle: 0.012,         // putter level when stopped
    max: 0.06,           // level at full speed
    pitch: 52,           // engine pitch at rest (Hz)
    pitchPerSpeed: 7,    // pitch rise with speed
    putter: 9,           // engine pulses per second at rest
    putterPerSpeed: 2.2, // pulses added per unit of speed
    tone: 420,           // low-pass cutoff: lower = rounder
  },
  plane: {
    idle: 0.02,          // propeller level when stopped (it keeps spinning)
    max: 0.07,           // level at full speed
    pitch: 70,           // propeller drone pitch
    pitchPerSpeed: 5,
    blades: 14,          // blade "chop" rate at rest
    bladesPerSpeed: 3,
    wind: 0.5,           // wind amount at full speed (0 = none)
  },
  person: {
    step: 0.12,          // footstep loudness
    tone: 500,           // footstep brightness: lower = softer
  },
  crash: {
    light: 0.22,         // small obstacles (cones, boxes)
    heavy: 0.32,         // walls and barriers
    tone: 900,           // low-pass cutoff: lower = duller, softer
    minGap: 0.09,        // seconds between two crash sounds (avoids harsh stacking)
  },
};

export function createSound() {
  let ctx = null, master, noise, brown, on = false, lastCrash = 0;
  let ride = "car", voice = null, pending = "car";

  function init() {
    const AC = window.AudioContext || window["webkitAudioContext"];
    if (!AC) return false;
    ctx = new AC();

    // gentle limiter so nothing ever spikes
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24; comp.knee.value = 20; comp.ratio.value = 4;
    comp.attack.value = 0.01; comp.release.value = 0.25;
    comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = 0; master.connect(comp);

    // white noise (crashes, footsteps) and smoother brown-ish noise (rush, wind)
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    brown = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const b = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < b.length; i++) { last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04; b[i] = last * 3.5; }

    voice = VOICES[pending]();
    ride = pending;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) ctx.suspend(); else if (on) ctx.resume();
    });
    return true;
  }

  /** Smooth attack/decay so sounds never click. */
  function envelope(g, t, attack, peak, release) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }
  const glide = (param, value, t) => param.setTargetAtTime(value, t, SETTINGS.smooth);
  const loopNoise = () => { const s = ctx.createBufferSource(); s.buffer = brown; s.loop = true; s.start(); return s; };

  function fadeOut(gain, sources, t) {
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(0.0001, t, 0.15);
    setTimeout(() => { sources.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } }); gain.disconnect(); }, 900);
  }

  /* ---------- one driving sound per ride: each returns { update(speed, time), stop(time) } ---------- */
  const VOICES = {
    car() {
      const c = SETTINGS.car, out = ctx.createGain(); out.gain.value = 0; out.connect(master);
      const rush = loopNoise(), band = ctx.createBiquadFilter();
      band.type = "bandpass"; band.frequency.value = c.rush; band.Q.value = 0.7;
      rush.connect(band); band.connect(out);
      const whine = ctx.createOscillator(), wg = ctx.createGain();
      whine.type = "sine"; whine.frequency.value = c.whine; wg.gain.value = c.whineLevel;
      whine.connect(wg); wg.connect(out); whine.start();
      return {
        update(s, t) {
          const k = Math.min(1, s / 10);
          glide(whine.frequency, c.whine + s * c.whinePerSpeed, t);
          glide(band.frequency, c.rush + s * c.rushPerSpeed, t);
          glide(out.gain, s > 0.3 ? c.max * k * k * (2 - k) : 0.0001, t);
        },
        stop: (t) => fadeOut(out, [rush, whine], t),
      };
    },

    moto() {
      const m = SETTINGS.moto, out = ctx.createGain(); out.gain.value = 0; out.connect(master);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = m.tone; lp.Q.value = 0.8;
      const pulse = ctx.createGain(); pulse.gain.value = 0.6;      // amplitude pulses = the "putter"
      const eng = ctx.createOscillator(); eng.type = "sawtooth"; eng.frequency.value = m.pitch;
      const sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = m.pitch / 2;
      const subG = ctx.createGain(); subG.gain.value = 0.6;
      eng.connect(lp); sub.connect(subG); subG.connect(lp); lp.connect(pulse); pulse.connect(out);
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      lfo.type = "sine"; lfo.frequency.value = m.putter; lfoG.gain.value = 0.4;
      lfo.connect(lfoG); lfoG.connect(pulse.gain);
      [eng, sub, lfo].forEach((o) => o.start());
      return {
        update(s, t) {
          const k = Math.min(1, s / 12), hz = m.pitch + s * m.pitchPerSpeed;
          glide(eng.frequency, hz, t);
          glide(sub.frequency, hz / 2, t);
          glide(lfo.frequency, m.putter + s * m.putterPerSpeed, t);
          glide(lp.frequency, m.tone + s * 25, t);
          glide(out.gain, m.idle + (m.max - m.idle) * k, t);
        },
        stop: (t) => fadeOut(out, [eng, sub, lfo], t),
      };
    },

    plane() {
      const p = SETTINGS.plane, out = ctx.createGain(); out.gain.value = 0; out.connect(master);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 340;
      const chop = ctx.createGain(); chop.gain.value = 0.55;        // blade chop = fast tremolo
      const prop = ctx.createOscillator(); prop.type = "triangle"; prop.frequency.value = p.pitch;
      prop.connect(lp); lp.connect(chop); chop.connect(out);
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      lfo.type = "sine"; lfo.frequency.value = p.blades; lfoG.gain.value = 0.35;
      lfo.connect(lfoG); lfoG.connect(chop.gain);
      const wind = loopNoise(), wf = ctx.createBiquadFilter(), wg = ctx.createGain();
      wf.type = "bandpass"; wf.frequency.value = 700; wf.Q.value = 0.5; wg.gain.value = 0;
      wind.connect(wf); wf.connect(wg); wg.connect(out);
      [prop, lfo].forEach((o) => o.start());
      return {
        update(s, t) {
          const k = Math.min(1, s / 12);
          glide(prop.frequency, p.pitch + s * p.pitchPerSpeed, t);
          glide(lfo.frequency, p.blades + s * p.bladesPerSpeed, t);
          glide(wf.frequency, 700 + s * 60, t);
          glide(wg.gain, p.wind * k, t);
          glide(out.gain, p.idle + (p.max - p.idle) * k, t);
        },
        stop: (t) => fadeOut(out, [prop, lfo, wind], t),
      };
    },

    person() {
      const f = SETTINGS.person;
      let next = 0, left = true;
      function step(at, l) {
        const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = noise; src.playbackRate.value = l ? 0.9 : 1.05;
        lp.type = "lowpass"; lp.frequency.value = f.tone * (l ? 0.9 : 1.1);
        src.connect(lp); lp.connect(g); g.connect(master);
        envelope(g, at, 0.006, f.step, 0.09);
        src.start(at, Math.random() * 0.3); src.stop(at + 0.15);
      }
      return {
        update(s, t) {
          if (s < 0.15) { next = 0; return; }                         // standing still: no steps
          const gap = Math.max(0.26, 0.6 - s * 0.05);               // faster steps when moving faster
          if (!next || next < t) next = t + 0.02;
          while (next < t + 0.15) { step(next, left); left = !left; next += gap; }
        },
        stop() {},
      };
    },
  };

  return {
    get on() { return on; },

    setOn(value) {
      if (value && !ctx && !init()) return false;
      on = value;
      if (!ctx) return on;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      if (on) { ctx.resume(); master.gain.setTargetAtTime(SETTINGS.volume, t, 0.6); }
      else { master.gain.setTargetAtTime(0.0001, t, 0.2); setTimeout(() => { if (!on) ctx.suspend(); }, 800); }
      return on;
    },

    /** Switch the driving sound to another ride ("car" | "moto" | "plane" | "person"). */
    setRide(id) {
      if (!VOICES[id]) return;
      pending = id;
      if (!ctx || id === ride) return;
      voice.stop(ctx.currentTime);
      voice = VOICES[id]();
      ride = id;
    },

    /** Call often with the current speed (world units / s). */
    engine(speed) {
      if (!on || !ctx) return;
      voice.update(Math.min(Math.abs(speed), 12), ctx.currentTime);
    },

    /** Soft crash thump; heavy = walls and barriers. */
    smash(heavy) {
      if (!on || !ctx) return;
      const c = SETTINGS.crash, t = ctx.currentTime;
      if (t - lastCrash < c.minGap) return;
      lastCrash = t;
      const vary = 0.85 + Math.random() * 0.3; // small pitch variety so hits don't repeat exactly
      const peak = heavy ? c.heavy : c.light;

      // muffled noise "crunch"
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noise; src.playbackRate.value = vary;
      f.type = "lowpass"; f.frequency.value = (heavy ? c.tone * 0.7 : c.tone) * vary;
      src.connect(f); f.connect(g); g.connect(master);
      envelope(g, t, 0.012, peak, heavy ? 0.3 : 0.18);
      src.start(t); src.stop(t + 0.45);

      // low round "thump"
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime((heavy ? 90 : 130) * vary, t);
      o.frequency.exponentialRampToValueAtTime((heavy ? 50 : 75) * vary, t + 0.2);
      o.connect(og); og.connect(master);
      envelope(og, t, 0.01, peak * 1.2, 0.2);
      o.start(t); o.stop(t + 0.3);
    },
  };
}
