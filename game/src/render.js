// Warung Sizzle — render.js
// Satu-satunya tempat yang menggambar ke canvas: dapur, papan pesanan,
// stasiun, koki, makanan, HUD, dan layar judul / jeda / akhir.
// Semua seni digambar dengan bentuk canvas — tanpa gambar atau font luar.

import {
  CANVAS_W, CANVAS_H, INGREDIENTS, INGREDIENT_BINS, PALETTE, PROCESSED,
  RECIPES, STATIONS, TUNING, WALK_AREA,
} from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bar(ctx, x, y, w, h, frac, fill, bg = 'rgba(0,0,0,0.25)') {
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, w * f, h, h / 2);
    ctx.fill();
  }
}

function text(ctx, s, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// Gambar satu bahan / olahan sebagai ikon makanan kecil yang menggugah.
export function drawFood(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  const ing = INGREDIENTS[id];
  const proc = PROCESSED[id];
  if (id === 'nasi' || id === 'nasi:wajan') {
    ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.arc(0, r * 0.25, r, 0, Math.PI); ctx.fill();
    ctx.fillStyle = id === 'nasi' ? '#fff8e1' : '#ffb74d';
    ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.82, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ff7043';
    ctx.fillRect(-r * 0.5, -r * 0.55, r * 0.28, r * 0.2);
    ctx.fillStyle = '#66bb6a';
    ctx.fillRect(r * 0.15, -r * 0.6, r * 0.3, r * 0.18);
  } else if (id === 'mie' || id === 'mie:wajan') {
    ctx.strokeStyle = id === 'mie' ? '#ffd54f' : '#ff9800';
    ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.55 + Math.abs(i) * 0.18), Math.PI * (0.15 + i * 0.12), Math.PI * (0.85 - i * 0.1));
      ctx.stroke();
    }
    ctx.fillStyle = '#66bb6a';
    ctx.beginPath(); ctx.arc(-r * 0.45, -r * 0.5, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef5350';
    ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.45, r * 0.16, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'ayam' || id === 'ayam:talenan' || id === 'ayam:panggang') {
    if (id === 'ayam:panggang') {
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = r * 0.14;
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
      ctx.fillStyle = '#6d4c41';
      for (const ox of [-r * 0.55, 0, r * 0.55]) {
        ctx.beginPath(); ctx.arc(ox, 0, r * 0.34, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ff8a65';
      ctx.beginPath(); ctx.arc(0, -r * 0.28, r * 0.16, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#fff3e0';
      ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.15, r * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = id === 'ayam' ? '#ffab91' : '#ffccbc';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef9a9a';
      ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.2, r * 0.2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'telur' || id === 'telur:talenan') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.7, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = id === 'telur' ? '#ffca28' : '#ffee58';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sayur' || id === 'sayur:talenan') {
    ctx.fillStyle = '#43a047';
    for (const a of [0, 1.2, 2.4, 3.6, 4.8]) {
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(r * 0.45, 0, r * 0.5, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'bumbu' || id === 'bumbu:wajan') {
    ctx.fillStyle = '#e53935';
    ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.3, r * 0.62, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.45); ctx.quadraticCurveTo(r * 0.3, -r * 0.8, r * 0.5, -r * 0.7); ctx.stroke();
    ctx.fillStyle = '#ff7043';
    ctx.beginPath(); ctx.arc(-r * 0.35, r * 0.4, r * 0.16, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'teh') {
    ctx.fillStyle = '#fff'; rr(ctx, -r * 0.55, -r * 0.4, r * 1.1, r * 0.9, r * 0.2); ctx.fill();
    ctx.fillStyle = '#8d6e63'; rr(ctx, -r * 0.45, -r * 0.3, r * 0.9, r * 0.55, r * 0.12); ctx.fill();
    ctx.strokeStyle = '#bcaaa4'; ctx.lineWidth = r * 0.12;
    ctx.beginPath(); ctx.arc(r * 0.55, 0, r * 0.3, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  } else if (id === 'es') {
    ctx.fillStyle = '#b3e5fc';
    ctx.save(); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-r * 0.5, -r * 0.5, r, r);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.3); ctx.lineTo(0, -r * 0.5); ctx.lineTo(r * 0.2, -r * 0.2); ctx.closePath(); ctx.fill();
  } else if (id.startsWith('dish:')) {
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALETTE.plateEdge; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2); ctx.stroke();
    drawFood(ctx, RECIPES[id.slice(5)].steps[0].result === 'teh' ? 'teh' : RECIPES[id.slice(5)].steps[0].result, 0, 0, r * 0.55);
  } else {
    ctx.fillStyle = (ing && ing.color) || (proc && proc.color) || '#ccc';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hoverStation = null;
  }

  draw(world, input) {
    const ctx = this.ctx;
    this._drawKitchen(ctx, world);
    this._drawOrderBoard(ctx, world);
    this._drawStations(ctx, world, input);
    this._drawChef(ctx, world);
    this._drawHud(ctx, world);
    if (world.screen === 'title') this._drawTitle(ctx, world);
    else if (world.screen === 'paused') this._drawPaused(ctx);
    else if (world.screen === 'over') this._drawGameOver(ctx, world);
  }

  _drawKitchen(ctx, world) {
    // Dinding atas + lantai papan catur hangat.
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(0, 0, CANVAS_W, 128);
    ctx.fillStyle = PALETTE.wallBottom;
    ctx.fillRect(0, 118, CANVAS_W, 12);
    for (let y = 130; y < CANVAS_H; y += 56) {
      for (let x = 0; x < CANVAS_W; x += 56) {
        const odd = ((x / 56) + (y / 56)) % 2 === 0;
        ctx.fillStyle = odd ? PALETTE.floorA : PALETTE.floorB;
        ctx.fillRect(x, y, 56, 56);
      }
    }
    // Garis lantai area jalan.
    ctx.strokeStyle = 'rgba(93,54,22,0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(WALK_AREA.x, WALK_AREA.y, WALK_AREA.w, WALK_AREA.h);
    // Hiasan dinding: lampu gantung + spanduk warung.
    for (const lx of [180, 640, 1100]) {
      ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 26); ctx.stroke();
      ctx.fillStyle = '#ffca28';
      ctx.beginPath(); ctx.arc(lx, 36, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,202,40,0.25)';
      ctx.beginPath(); ctx.arc(lx, 36, 26, 0, Math.PI * 2); ctx.fill();
    }
    text(ctx, '🍜  WARUNG SIZZLE  🍢', CANVAS_W / 2, 18, 20, '#ffe0b2', 'center', '800');
  }

  _drawOrderBoard(ctx, world) {
    // Papan pesanan: papan kayu di bawah spanduk, tiket-tiket pesanan aktif.
    ctx.fillStyle = PALETTE.board;
    rr(ctx, 24, 40, CANVAS_W - 48, 84, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.counterEdge;
    ctx.lineWidth = 3;
    rr(ctx, 24, 40, CANVAS_W - 48, 84, 10);
    ctx.stroke();
    text(ctx, 'PESANAN', 44, 82, 17, PALETTE.boardInk, 'left', '800');
    if (world.orders.length === 0) {
      text(ctx, 'Belum ada pesanan — bersiaplah, pelanggan segera datang…', 150, 82, 16, '#8d6e63');
      return;
    }
    let x = 150;
    for (const o of world.orders) {
      const w = 268;
      const urgent = o.timeLeft < 12;
      ctx.fillStyle = urgent && Math.floor(world.time * 4) % 2 === 0 ? '#ffebee' : PALETTE.ticketBg;
      rr(ctx, x, 48, w, 68, 8);
      ctx.fill();
      ctx.strokeStyle = urgent ? PALETTE.bad : PALETTE.ticketEdge;
      ctx.lineWidth = urgent ? 3 : 1.5;
      rr(ctx, x, 48, w, 68, 8);
      ctx.stroke();
      drawFood(ctx, RECIPES[o.recipeId].steps[0].result, x + 30, 82, 18);
      text(ctx, o.name, x + 56, 66, 16, PALETTE.boardInk);
      text(ctx, `Rp${o.price}  •  ${Math.ceil(o.timeLeft)} dtk`, x + 56, 90, 13, '#6d4c41');
      const frac = o.timeLeft / o.total;
      bar(ctx, x + 56, 102, w - 70, 7, frac, frac < 0.25 ? PALETTE.bad : frac < 0.5 ? PALETTE.warn : PALETTE.good);
      x += w + 10;
    }
  }

  _drawStations(ctx, world, input) {
    for (const [key, st] of Object.entries(STATIONS)) {
      const hover = input && input.hoverRect(st);
      const busy = world.stationBusy(key);
      ctx.fillStyle = PALETTE.counterFront;
      rr(ctx, st.x, st.y + 6, st.w, st.h, 10);
      ctx.fill();
      ctx.fillStyle = hover ? '#ffe0b2' : PALETTE.counterTop;
      rr(ctx, st.x, st.y, st.w, st.h - 6, 10);
      ctx.fill();
      if (busy) {
        ctx.strokeStyle = PALETTE.accentGold;
        ctx.lineWidth = 4;
        rr(ctx, st.x, st.y, st.w, st.h - 6, 10);
        ctx.stroke();
      }
      text(ctx, st.label, st.x + st.w / 2, st.y + 16, 13, PALETTE.boardInk, 'center', '800');
      if (key === 'counter') this._drawCounterBins(ctx);
      if (key === 'talenan') this._drawTalenan(ctx, world, st);
      if (key === 'wajan') this._drawCooker(ctx, world, st, world.wajan, 'wajan');
      if (key === 'panggang') this._drawCooker(ctx, world, st, world.panggang, 'panggang');
      if (key === 'plating') this._drawPlating(ctx, world, st);
      if (key === 'saji') this._drawSaji(ctx, world, st);
    }
  }

  _drawCounterBins(ctx) {
    for (const bin of INGREDIENT_BINS) {
      const ing = INGREDIENTS[bin.id];
      ctx.fillStyle = ing.color;
      rr(ctx, bin.x, bin.y, bin.w, bin.h, 6);
      ctx.fill();
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = 2;
      rr(ctx, bin.x, bin.y, bin.w, bin.h, 6);
      ctx.stroke();
      drawFood(ctx, bin.id, bin.x + bin.w / 2, bin.y + bin.h / 2 - 2, 15);
      text(ctx, ing.name, bin.x + bin.w / 2, bin.y + bin.h - 9, 9, '#3e2723', 'center', '700');
    }
  }

  _drawTalenan(ctx, world, st) {
    const cx = st.x + st.w / 2;
    const cy = st.y + 62;
    ctx.fillStyle = '#d7a05b';
    rr(ctx, cx - 82, cy - 26, 164, 52, 8);
    ctx.fill();
    ctx.strokeStyle = '#a4713a';
    ctx.lineWidth = 2;
    rr(ctx, cx - 82, cy - 26, 164, 52, 8);
    ctx.stroke();
    const job = world.talenan.job;
    if (job && !job.waiting) {
      drawFood(ctx, job.item, cx, cy - 2, 20);
      bar(ctx, cx - 70, cy + 32, 140, 9, job.progress / job.duration, PALETTE.good);
      // Penanda waktu: tekan E saat di zona hijau untuk cincang sempurna.
      const zx0 = cx - 70 + 140 * 0.62;
      const zx1 = cx - 70 + 140 * 0.88;
      ctx.fillStyle = 'rgba(102,187,106,0.5)';
      ctx.fillRect(zx0, cy + 32, zx1 - zx0, 9);
      const mx = cx - 70 + 140 * job.marker;
      ctx.fillStyle = '#fff';
      ctx.fillRect(mx - 2, cy + 28, 4, 17);
      text(ctx, 'Tekan E di zona hijau!', cx, cy + 52, 11, PALETTE.boardInk, 'center');
    } else if (job && job.waiting) {
      drawFood(ctx, job.result, cx, cy - 2, 20);
      text(ctx, 'Siap diambil — tekan E', cx, cy + 44, 12, PALETTE.boardInk, 'center');
    } else {
      text(ctx, 'Bawa ayam / telur / sayur', cx, cy + 40, 12, '#8d6e63', 'center');
    }
  }

  _drawCooker(ctx, world, st, cooker, kind) {
    const cx = st.x + st.w / 2;
    const cy = st.y + 64;
    const s = cooker.slot;
    // Kompor: lingkaran api di bawah wajan.
    ctx.fillStyle = '#37474f';
    ctx.beginPath(); ctx.ellipse(cx, cy + 26, 74, 12, 0, 0, Math.PI * 2); ctx.fill();
    if (s && !s.done) {
      ctx.fillStyle = Math.floor(world.time * 6) % 2 === 0 ? '#ff7043' : '#ffa726';
      ctx.beginPath(); ctx.ellipse(cx, cy + 22, 52, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Wajan / panggangan.
    ctx.fillStyle = kind === 'wajan' ? '#455a64' : '#5d4037';
    ctx.beginPath(); ctx.ellipse(cx, cy + 4, 78, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = kind === 'wajan' ? '#263238' : '#3e2723';
    ctx.beginPath(); ctx.ellipse(cx, cy, 66, 22, 0, 0, Math.PI * 2); ctx.fill();
    if (s) {
      if (s.burnt) {
        ctx.fillStyle = '#212121';
        ctx.beginPath(); ctx.ellipse(cx, cy, 58, 18, 0, 0, Math.PI * 2); ctx.fill();
        text(ctx, 'GOSONG — tekan E', cx, cy + 44, 12, PALETTE.bad, 'center', '800');
      } else {
        drawFood(ctx, s.done ? s.result : s.item, cx, cy - 4, 22);
        bar(ctx, cx - 60, cy + 34, 120, 9, s.progress / s.duration, s.done ? PALETTE.good : PALETTE.warn);
        text(ctx, s.done ? 'MATANG! Tekan E untuk ambil' : 'Memasak…', cx, cy + 52, 11, PALETTE.boardInk, 'center');
        if (!s.done) {
          // Uap naik dari wajan.
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 3;
          const off = (world.time * 30) % 20;
          for (const sx of [-30, 0, 30]) {
            ctx.beginPath();
            ctx.moveTo(cx + sx, cy - 26 - off * 0.4);
            ctx.quadraticCurveTo(cx + sx + 6, cy - 40 - off * 0.4, cx + sx, cy - 50 - off * 0.4);
            ctx.stroke();
          }
        }
      }
    } else {
      text(ctx, kind === 'wajan' ? 'Bawa nasi / mie / bumbu' : 'Bawa ayam mentah', cx, cy + 46, 12, '#8d6e63', 'center');
    }
  }

  _drawPlating(ctx, world, st) {
    const cx = st.x + st.w / 2;
    const cy = st.y + 62;
    // Piring besar.
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath(); ctx.ellipse(cx, cy, 76, 42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALETTE.plateEdge; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy, 76, 42, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, 56, 30, 0, 0, Math.PI * 2); ctx.stroke();
    const items = world.plate.items;
    if (items.length === 0) {
      text(ctx, 'Susun hidangan di sini', cx, cy + 46, 12, '#8d6e63', 'center');
    } else {
      items.forEach((id, i) => {
        const ox = (i - (items.length - 1) / 2) * 34;
        drawFood(ctx, id, cx + ox, cy - 4, 17);
      });
      const prog = world.plateOrderProgress();
      bar(ctx, cx - 60, cy + 34, 120, 9, prog, prog >= 1 ? PALETTE.good : PALETTE.accentGold);
      text(ctx, prog >= 1 ? 'LENGKAP! Tekan E untuk angkat' : `${items.length} dari resep tersusun`, cx, cy + 52, 11, PALETTE.boardInk, 'center');
    }
  }

  _drawSaji(ctx, world, st) {
    const cx = st.x + 140;
    const cy = st.y + st.h / 2;
    // Bel saji + nampan.
    ctx.fillStyle = '#b0bec5';
    ctx.beginPath(); ctx.arc(cx, cy - 6, 26, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#eceff1';
    ctx.fillRect(cx - 32, cy + 18, 64, 6);
    ctx.fillStyle = '#ff7043';
    ctx.beginPath(); ctx.arc(cx, cy - 34, 5, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'Antar hidangan jadi ke sini — pelanggan menunggu!', 340, cy, 17, '#5d4037');
    if (world.servedFlash > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${Math.min(1, world.servedFlash)})`;
      text(ctx, '✦ TER SAJI! ✦', 900, cy, 26, '#ff8f00', 'center', '800');
    }
    // Piring yang sudah tersaji di akhir hari.
    if (world.screen === 'over' && world.servedCount > 0) {
      drawFood(ctx, 'dish:nasi_goreng', 1060, cy - 4, 26);
      text(ctx, 'Tersaji!', 1060, cy + 34, 13, '#5d4037', 'center', '800');
    }
  }

  _drawChef(ctx, world) {
    const c = world.chef;
    const bob = c.moving ? Math.sin(world.time * 12) * 3 : 0;
    const x = c.x;
    const y = c.y + bob * 0.3;
    // Bayangan.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(x, c.y + 34, 30, 9, 0, 0, Math.PI * 2); ctx.fill();
    // Badan + celemek.
    ctx.fillStyle = PALETTE.chefShirt;
    rr(ctx, x - 22, y - 6, 44, 40, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.chefApron;
    rr(ctx, x - 16, y + 8, 32, 26, 8);
    ctx.fill();
    ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2;
    rr(ctx, x - 16, y + 8, 32, 26, 8);
    ctx.stroke();
    // Lengan.
    ctx.fillStyle = PALETTE.chefShirt;
    ctx.beginPath(); ctx.arc(x - 24, y + 8, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 24, y + 8, 9, 0, Math.PI * 2); ctx.fill();
    // Kepala + topi koki.
    ctx.fillStyle = PALETTE.chefSkin;
    ctx.beginPath(); ctx.arc(x, y - 22, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.chefHat;
    ctx.beginPath(); ctx.arc(x - 10, y - 34, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 38, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 10, y - 34, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 16, y - 36, 32, 8);
    // Mata + senyum.
    ctx.fillStyle = '#3e2723';
    ctx.beginPath(); ctx.arc(x - 6 + c.dir * 2, y - 22, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6 + c.dir * 2, y - 22, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + c.dir * 2, y - 16, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    // Kilau cincang sempurna.
    if (c.chopFlash > 0) {
      ctx.fillStyle = `rgba(255, 235, 59, ${c.chopFlash})`;
      text(ctx, '✦', x + 30, y - 40, 26, '#ffeb3b', 'center');
    }
    // Barang bawaan di atas kepala.
    c.carrying.forEach((it, i) => {
      const ox = (i - (c.carrying.length - 1) / 2) * 30;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(x + ox, y - 62, 15, 0, Math.PI * 2); ctx.fill();
      drawFood(ctx, it.id, x + ox, y - 62, 12);
    });
    if (c.carrying.length > 0) {
      const label = c.carrying.map((it) => it.label).join(' • ');
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(62,39,35,0.8)';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(label, x, y + 52);
      text(ctx, label, x, y + 52, 12, '#fff', 'center', '700');
    }
  }

  _drawHud(ctx, world) {
    // Bilah HUD bawah.
    ctx.fillStyle = PALETTE.hudBg;
    rr(ctx, 16, CANVAS_H - 56, CANVAS_W - 32, 44, 10);
    ctx.fill();
    text(ctx, `SKOR  ${world.score}`, 40, CANVAS_H - 34, 20, PALETTE.hudText, 'left', '800');
    text(ctx, `🪙 ${world.coins}`, 250, CANVAS_H - 34, 20, PALETTE.hudText, 'left', '800');
    const comboTxt = world.combo > 1 ? `🔥 KOMBO x${world.combo}` : 'Kombo —';
    text(ctx, comboTxt, 420, CANVAS_H - 34, 20, world.combo > 1 ? '#ffca28' : PALETTE.hudText, 'left', '800');
    text(ctx, `Tersaji: ${world.servedCount}`, 640, CANVAS_H - 34, 18, PALETTE.hudText, 'left');
    const dayFrac = world.dayLeft / TUNING.dayLengthSec;
    const dayColor = dayFrac < 0.2 ? PALETTE.bad : dayFrac < 0.45 ? PALETTE.warn : PALETTE.good;
    text(ctx, 'HARI', 880, CANVAS_H - 34, 16, PALETTE.hudText, 'left', '800');
    bar(ctx, 940, CANVAS_H - 42, 200, 16, dayFrac, dayColor);
    text(ctx, `${Math.ceil(world.dayLeft)} dtk`, 1150, CANVAS_H - 34, 16, PALETTE.hudText, 'left', '800');
    // Toast tengah.
    if (world.toast && world.time < world.toastUntil) {
      ctx.fillStyle = 'rgba(46,26,10,0.85)';
      const w = ctx.measureText(world.toast).width + 36;
      rr(ctx, CANVAS_W / 2 - w / 2 - 120, 440, w + 240, 36, 18);
      ctx.fill();
      text(ctx, world.toast, CANVAS_W / 2, 459, 16, '#ffe0b2', 'center');
    }
    // Petunjuk kontrol.
    text(ctx, 'WASD / panah gerak  •  E / Spasi interaksi  •  klik stasiun  •  P jeda  •  R ulang', CANVAS_W / 2, CANVAS_H - 66, 13, 'rgba(255,255,255,0.75)', 'center');
  }

  _drawTitle(ctx, world) {
    // Panel judul di area jalan bawah, supaya baris stasiun dan papan
    // pesanan tetap terlihat penuh di belakangnya.
    ctx.fillStyle = 'rgba(46, 26, 10, 0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#fff7e6';
    rr(ctx, CANVAS_W / 2 - 390, 438, 780, 296, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.accentGold;
    ctx.lineWidth = 5;
    rr(ctx, CANVAS_W / 2 - 390, 438, 780, 296, 18);
    ctx.stroke();
    text(ctx, '🍜  WARUNG SIZZLE  🍢', CANVAS_W / 2, 478, 38, '#bf360c', 'center', '800');
    text(ctx, 'Warung makan paling sibuk di kampung — masak, susun, sajikan!', CANVAS_W / 2, 510, 16, '#5d4037', 'center');
    const lines = [
      '1. Ambil bahan di KONTER BAHAN (klik kotaknya / tekan E).',
      '2. Cincang ayam, telur, dan sayur di TALENAN — tekan E di zona hijau!',
      '3. Masak di WAJAN dan PANGGANGAN. Jangan sampai gosong!',
      '4. Susun di MEJA PLATING sesuai resep, lalu antar ke MEJA SAJI.',
      '5. Sajikan sebelum timer pesanan habis. Kombo beruntun = skor berlipat.',
    ];
    lines.forEach((l, i) => text(ctx, l, CANVAS_W / 2, 538 + i * 22, 15, '#3e2723', 'center'));
    text(ctx, 'Satu hari kerja: 120 detik. Resep: Nasi Goreng, Mie Goreng, Sate Ayam, Es Teh.', CANVAS_W / 2, 656, 13, '#6d4c41', 'center');
    const blink = Math.floor(world.time * 2) % 2 === 0;
    if (blink) text(ctx, 'Tekan tombol apa saja / klik untuk mulai memasak', CANVAS_W / 2, 688, 17, '#e65100', 'center', '800');
    text(ctx, 'WASD / panah gerak  •  E interaksi  •  klik stasiun  •  P jeda', CANVAS_W / 2, 714, 13, '#8d6e63', 'center');
  }

  _drawPaused(ctx) {
    ctx.fillStyle = 'rgba(46, 26, 10, 0.65)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    text(ctx, '⏸  JEDA', CANVAS_W / 2, CANVAS_H / 2 - 20, 44, '#fff', 'center', '800');
    text(ctx, 'Tekan P untuk lanjut memasak', CANVAS_W / 2, CANVAS_H / 2 + 30, 18, '#ffe0b2', 'center');
  }

  _drawGameOver(ctx, world) {
    ctx.fillStyle = 'rgba(46, 26, 10, 0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#fff7e6';
    rr(ctx, CANVAS_W / 2 - 320, 170, 640, 380, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.accentGold;
    ctx.lineWidth = 5;
    rr(ctx, CANVAS_W / 2 - 320, 170, 640, 380, 18);
    ctx.stroke();
    text(ctx, '🍽️  HARI SELESAI!  🍽️', CANVAS_W / 2, 230, 38, '#bf360c', 'center', '800');
    text(ctx, `Skor akhir: ${world.score}`, CANVAS_W / 2, 300, 30, '#3e2723', 'center', '800');
    text(ctx, `🪙 Koin: ${world.coins}    🍽️ Tersaji: ${world.servedCount}    🔥 Kombo terbaik: x${world.bestCombo}`, CANVAS_W / 2, 350, 19, '#5d4037', 'center');
    text(ctx, `Pesanan hangus: ${world.expiredCount}    Masakan gosong: ${world.burnedCount}`, CANVAS_W / 2, 392, 17, '#8d6e63', 'center');
    const verdict = world.servedCount >= 8
      ? 'Warungmu legendaris! Pelanggan antre sampai ke ujung jalan.'
      : world.servedCount >= 4
        ? 'Warung ramai! Sedikit lagi jadi langganan kampung.'
        : 'Hari pertama yang berat — besok pasti lebih lancar.';
    text(ctx, verdict, CANVAS_W / 2, 440, 17, '#bf360c', 'center');
    text(ctx, 'Tekan R untuk buka warung lagi', CANVAS_W / 2, 500, 18, '#e65100', 'center', '800');
  }
}
