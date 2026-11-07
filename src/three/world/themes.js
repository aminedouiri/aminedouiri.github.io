/*
 * World themes: sky, fog, light and ground colours. Edit or add entries here;
 * the picker lists them in this order.
 */
export const WORLDS = [
  { id: "night", label: "Night city", swatch: ["#0e1a3a", "#07080b"],
    fog: 0x07080b, skyTop: 0x0e1a3a, skyBottom: 0x07080b, stars: 0.7,
    hemiSky: 0x7f97e6, hemiGround: 0x07080b, hemi: 0.5, sun: 0xc9d6ff, sunI: 0.6,
    ground: 0x0b0c10, grid: [0x161a24, 0x11141b], exposure: 1.1 },
  { id: "sunset", label: "Sunset", swatch: ["#ff8a5c", "#3a1d4a"],
    fog: 0x2b1626, skyTop: 0x2d1846, skyBottom: 0xd9704f, stars: 0.12,
    hemiSky: 0xffb38a, hemiGround: 0x2b1626, hemi: 0.75, sun: 0xffc49a, sunI: 1.0,
    ground: 0x1c1118, grid: [0x40263a, 0x2c1a28], exposure: 1.15 },
  { id: "arctic", label: "Arctic day", swatch: ["#e6edf5", "#8fb4e6"],
    fog: 0xc9d4e2, skyTop: 0x7fa6dc, skyBottom: 0xdfe7f1, stars: 0,
    hemiSky: 0xffffff, hemiGround: 0x9aa8bc, hemi: 0.95, sun: 0xffffff, sunI: 1.1,
    ground: 0xcfd8e4, grid: [0xaab7c8, 0xbcc7d5], exposure: 0.95 },
  { id: "neon", label: "Neon", swatch: ["#ff2fb3", "#2a0a4a"],
    fog: 0x12051f, skyTop: 0x2a0a4a, skyBottom: 0x12051f, stars: 0.8,
    hemiSky: 0xff4fd8, hemiGround: 0x12051f, hemi: 0.55, sun: 0x7a5cff, sunI: 0.7,
    ground: 0x0d0618, grid: [0xff2fb3, 0x3a1a5a], exposure: 1.15 },
];
