// Warung Sizzle — config.js
// Satu-satunya tempat menyimpan data resep, tuning permainan, dan palet warna.
// Tidak ada logika permainan di sini: berkas lain membaca nilai dari sini.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

// ---- Bahan mentah yang tersedia di konter bahan ---------------------------
export const INGREDIENTS = {
  nasi:   { name: 'Nasi',   color: '#fff8e1', dark: '#e8dcc0', emoji: '🍚', chop: false, cook: 'wajan' },
  mie:    { name: 'Mie',    color: '#ffd54f', dark: '#c9a227', emoji: '🍜', chop: false, cook: 'wajan' },
  ayam:   { name: 'Ayam',   color: '#ffab91', dark: '#d84315', emoji: '🍗', chop: true,  cook: 'panggang' },
  telur:  { name: 'Telur',  color: '#ffe082', dark: '#ff8f00', emoji: '🥚', chop: true,  cook: null },
  sayur:  { name: 'Sayur',  color: '#81c784', dark: '#2e7d32', emoji: '🥬', chop: true,  cook: null },
  bumbu:  { name: 'Bumbu',  color: '#ef5350', dark: '#b71c1c', emoji: '🌶️', chop: false, cook: 'wajan' },
  teh:    { name: 'Teh',    color: '#a1887f', dark: '#5d4037', emoji: '🍵', chop: false, cook: null },
  es:     { name: 'Es',     color: '#b3e5fc', dark: '#0277bd', emoji: '🧊', chop: false, cook: null },
};

// Hasil olahan: kunci = id bahan + cara olah.
export const PROCESSED = {
  'nasi:wajan':    { name: 'Nasi Goreng',  color: '#ffb74d' },
  'mie:wajan':     { name: 'Mie Goreng',   color: '#ffcc80' },
  'bumbu:wajan':   { name: 'Bumbu Tumis',  color: '#e57373' },
  'ayam:talenan':  { name: 'Ayam Cincang', color: '#ffccbc' },
  'ayam:panggang': { name: 'Sate Ayam',    color: '#a1887f' },
  'telur:talenan': { name: 'Telur Cincang',color: '#fff176' },
  'sayur:talenan': { name: 'Sayur Cincang',color: '#a5d6a7' },
};

// ---- Resep: tiap pesanan minta satu hidangan jadi --------------------------
// steps: bahan mentah -> stasiun olah -> hasil olahan. Hidangan selesai
// bila semua hasil olahan pesanan sudah tersusun di piring.
export const RECIPES = {
  nasi_goreng: {
    name: 'Nasi Goreng',
    price: 120,
    steps: [
      { ingredient: 'nasi',  station: 'wajan',   result: 'nasi:wajan' },
      { ingredient: 'telur', station: 'talenan', result: 'telur:talenan' },
      { ingredient: 'bumbu', station: 'wajan',   result: 'bumbu:wajan' },
    ],
  },
  mie_goreng: {
    name: 'Mie Goreng',
    price: 110,
    steps: [
      { ingredient: 'mie',   station: 'wajan',   result: 'mie:wajan' },
      { ingredient: 'sayur', station: 'talenan', result: 'sayur:talenan' },
      { ingredient: 'bumbu', station: 'wajan',   result: 'bumbu:wajan' },
    ],
  },
  sate_ayam: {
    name: 'Sate Ayam',
    price: 150,
    steps: [
      { ingredient: 'ayam',  station: 'talenan', result: 'ayam:talenan' },
      { ingredient: 'ayam',  station: 'panggang', result: 'ayam:panggang' },
      { ingredient: 'sayur', station: 'talenan', result: 'sayur:talenan' },
    ],
  },
  es_teh: {
    name: 'Es Teh Manis',
    price: 60,
    steps: [
      { ingredient: 'teh', station: 'plating', result: 'teh' },
      { ingredient: 'es',  station: 'plating', result: 'es' },
    ],
  },
};

export const RECIPE_IDS = Object.keys(RECIPES);

// ---- Tuning permainan ------------------------------------------------------
export const TUNING = {
  dayLengthSec: 120,        // satu hari kerja
  orderTimeSec: 55,         // waktu tiap pesanan sebelum hangus
  orderSpawnFirstSec: 3,    // pesanan pertama muncul
  orderSpawnStartSec: 14,   // jeda antar pesanan di awal hari
  orderSpawnEndSec: 7,      // jeda antar pesanan di akhir hari
  maxOrders: 4,
  chopTimeSec: 2.6,         // lama mencincang di talenan
  cookTimeSec: 5.0,         // lama memasak di wajan
  grillTimeSec: 6.0,        // lama memanggang sate
  burnAfterSec: 4.0,        // jeda sebelum masakan gosong setelah matang
  carryMax: 3,              // jumlah item yang bisa dibawa koki
  playerSpeed: 260,         // piksel per detik
  comboWindowSec: 12,       // pesanan beruntun dalam jendela ini menaikkan kombo
  timeBonusPerSec: 2,       // koin bonus per detik tersisa saat menyajikan
  perfectChopBonus: 15,     // skor bonus cincang sempurna
};

// ---- Palet warna dapur Warung Sizzle ---------------------------------------
export const PALETTE = {
  wallTop: '#8d5a2b',
  wallBottom: '#6d4420',
  floorA: '#c9a06a',
  floorB: '#b98d55',
  counterTop: '#f5e6c8',
  counterFront: '#7a4a21',
  counterEdge: '#5d3616',
  board: '#fff7e6',
  boardInk: '#3e2723',
  ticketBg: '#fffde7',
  ticketEdge: '#d7ccc8',
  hudBg: 'rgba(46, 26, 10, 0.88)',
  hudText: '#ffe0b2',
  accent: '#ff7043',
  accentGold: '#ffc107',
  good: '#66bb6a',
  warn: '#ffa726',
  bad: '#ef5350',
  chefHat: '#ffffff',
  chefSkin: '#ffcc9e',
  chefShirt: '#e53935',
  chefApron: '#eceff1',
  plate: '#fafafa',
  plateEdge: '#b0bec5',
};

// ---- Denah stasiun dapur (x, y, lebar, tinggi, label) ---------------------
// Koordinat dalam ruang canvas 1280x800. Papan pesanan menempati y 0..118.
export const STATIONS = {
  counter:  { x: 36,  y: 150, w: 252, h: 128, label: 'KONTER BAHAN',  kind: 'counter' },
  talenan:  { x: 316, y: 150, w: 220, h: 128, label: 'TALENAN',       kind: 'talenan' },
  wajan:    { x: 564, y: 150, w: 220, h: 128, label: 'WAJAN / KOMPOR', kind: 'wajan' },
  panggang: { x: 812, y: 150, w: 220, h: 128, label: 'PANGGANGAN',    kind: 'panggang' },
  plating:  { x: 1060,y: 150, w: 184, h: 128, label: 'MEJA PLATING',  kind: 'plating' },
  saji:     { x: 36,  y: 330, w: 1208, h: 96, label: 'MEJA SAJI', kind: 'saji' },
};

// Kotak bahan di dalam konter (8 bahan, dua baris x empat kolom).
export const INGREDIENT_BINS = [
  { id: 'nasi',  x: 48,  y: 182, w: 56, h: 44 },
  { id: 'mie',   x: 110, y: 182, w: 56, h: 44 },
  { id: 'ayam',  x: 172, y: 182, w: 56, h: 44 },
  { id: 'telur', x: 234, y: 182, w: 56, h: 44 },
  { id: 'sayur', x: 48,  y: 232, w: 56, h: 44 },
  { id: 'bumbu', x: 110, y: 232, w: 56, h: 44 },
  { id: 'teh',   x: 172, y: 232, w: 56, h: 44 },
  { id: 'es',    x: 234, y: 232, w: 56, h: 44 },
];

// Area jalan koki: lantai dapur di bawah meja saji.
export const WALK_AREA = { x: 20, y: 452, w: 1240, h: 300 };

// Posisi awal koki.
export const CHEF_START = { x: 640, y: 620 };

// RNG deterministik (mulberry32) untuk staging screenshot yang stabil.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// Cari langkah resep yang menghasilkan item olahan tertentu.
export function stepForResult(recipeId, resultId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return null;
  return recipe.steps.find((s) => s.result === resultId) || null;
}

// Daftar hasil olahan yang masih kurang di sebuah piring untuk satu resep.
export function missingResults(recipeId, plateItems) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return [];
  const have = [...plateItems];
  return recipe.steps
    .map((s) => s.result)
    .filter((r) => {
      const i = have.indexOf(r);
      if (i === -1) return true;
      have.splice(i, 1);
      return false;
    });
}
