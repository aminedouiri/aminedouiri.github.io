/* Builds the list of stops on the road from your data. You normally don't need to edit this file. */
import { jobs } from "./experience.js";

export const clean = (s) => String(s).replace(/[[\]]/g, "");

/** Intro → every job (newest first) → Stack → Contact */
export const stops = [
  { kind: "intro", label: "Start" },
  ...jobs.map((job) => ({ kind: "job", label: job.kind || clean(job.start), job })),
  { kind: "stack", label: "Stack" },
  { kind: "contact", label: "Contact" },
];

/** Names of the four cube faces / panel tabs for each kind of stop. */
export const FACE_LABELS = {
  intro: ["Hello", "About me", "How to drive", "Tip"],
  job: ["Overview", "What I did", "Impact", "Tools used"],
  stack: ["Toolchain", "Platform", "Delivery", "Always"],
  contact: ["Contact", "Message me", "Reach me", "Find me"],
};

export const stopName = (s) => (s.job ? clean(s.job.kind || s.job.company) : s.label);
