// Warung Sizzle — world.js
// Satu-satunya tempat yang menyimpan keadaan permainan dan mengubahnya:
// koki, pesanan, stasiun (talenan / wajan / panggangan / plating / saji),
// skor, koin, kombo, dan timer hari. Render.js hanya menggambar keadaan ini.

import {
  CANVAS_W, CHEF_START, INGREDIENTS, INGREDIENT_BINS, PROCESSED, RECIPES,
  RECIPE_IDS, STATIONS, TUNING, WALK_AREA, makeRng, pickFrom, missingResults,
} from './config.js';

export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function stationCenter(st) {
  return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
}

function nearestBin(px, py) {
  let best = null;
  let bestD = Infinity;
  for (const bin of INGREDIENT_BINS) {
    const cx = bin.x + bin.w / 2;
    const cy = bin.y + bin.h / 2;
    const d = dist(px, py, cx, cy);
    if (d < bestD) { bestD = d; best = bin; }
  }
  return { bin: best, d: bestD };
}

export class World {
  constructor(audio) {
    this.audio = audio;
    this.screen = 'title'; // title | playing | paused | over
    this.time = 0;         // detik sejak hari dimulai
    this.rng = makeRng(1);
    this.reset();
  }

  reset() {
    this.screen = 'title';
    this.time = 0;
    this.dayLeft = TUNING.dayLengthSec;
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lastServeAt = -999;
    this.servedCount = 0;
    this.burnedCount = 0;
    this.expiredCount = 0;
    this.orderSeq = 0;
    this.orders = [];
    this.spawnIn = TUNING.orderSpawnFirstSec;
    this.toast = '';
    this.toastUntil = 0;
    this.chef = {
      x: CHEF_START.x, y: CHEF_START.y,
      dir: 1, moving: false,
      carrying: [], // item: {id, label, color, kind: 'raw'|'cooked'|'dish'}
      target: null, // {x, y} tujuan klik mouse
      pendingStation: null, // stasiun yang diklik: interaksi otomatis saat tiba
      chopFlash: 0,
    };
    this.talenan = { job: null }; // {item, progress, duration, marker, markerDir, perfect}
    this.wajan = { slot: null };  // {item, result, progress, duration, done, burnIn}
    this.panggang = { slot: null };
    this.plate = { items: [] };  // hasil olahan di piring plating
    this.servedFlash = 0;
  }

  startDay(seed = 1) {
    this.reset();
    this.rng = makeRng(seed);
    this.screen = 'playing';
  }

  // --- pesanan ---------------------------------------------------------------
  spawnOrder() {
    if (this.orders.length >= TUNING.maxOrders) return null;
    const recipeId = pickFrom(this.rng, RECIPE_IDS);
    const order = {
      id: ++this.orderSeq,
      recipeId,
      name: RECIPES[recipeId].name,
      timeLeft: TUNING.orderTimeSec,
      total: TUNING.orderTimeSec,
      price: RECIPES[recipeId].price,
    };
    this.orders.push(order);
    this.audio.newOrder();
    return order;
  }

  spawnInterval() {
    const t = 1 - this.dayLeft / TUNING.dayLengthSec; // 0 awal hari .. 1 akhir
    return TUNING.orderSpawnStartSec + (TUNING.orderSpawnEndSec - TUNING.orderSpawnStartSec) * t;
  }

  // --- item yang dibawa ------------------------------------------------------
  itemLabel(id) {
    if (PROCESSED[id]) return PROCESSED[id].name;
    if (INGREDIENTS[id]) return INGREDIENTS[id].name;
    if (id.startsWith('dish:')) return RECIPES[id.slice(5)].name;
    return id;
  }

  itemColor(id) {
    if (PROCESSED[id]) return PROCESSED[id].color;
    if (INGREDIENTS[id]) return INGREDIENTS[id].color;
    if (id.startsWith('dish:')) return '#ff7043';
    return '#cccccc';
  }

  makeItem(id, kind) {
    return { id, label: this.itemLabel(id), color: this.itemColor(id), kind };
  }

  canCarry() {
    return this.chef.carrying.length < TUNING.carryMax;
  }

  // --- update utama ----------------------------------------------------------
  update(dt, input) {
    if (this.screen !== 'playing') return;
    this.time += dt;
    this.dayLeft -= dt;
    if (this.chef.chopFlash > 0) this.chef.chopFlash -= dt;
    if (this.servedFlash > 0) this.servedFlash -= dt;

    this._updateOrders(dt);
    this._updateStations(dt);
    this._updateChef(dt, input);
    this._updateSpawning(dt);

    if (this.dayLeft <= 0) {
      this.dayLeft = 0;
      this.screen = 'over';
      this.audio.gameOver();
      this.audio.sizzleStop();
    }
    input.consumeFrame();
  }

  _updateOrders(dt) {
    for (const o of this.orders) o.timeLeft -= dt;
    const expired = this.orders.filter((o) => o.timeLeft <= 0);
    if (expired.length > 0) {
      this.orders = this.orders.filter((o) => o.timeLeft > 0);
      this.expiredCount += expired.length;
      this.combo = 0;
      this.toast = `Pesanan ${expired[0].name} hangus! Kombo putus.`;
      this.toastUntil = this.time + 2.5;
      this.audio.fail();
    }
  }

  _updateSpawning(dt) {
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnOrder();
      this.spawnIn = this.spawnInterval();
    }
  }

  _updateStations(dt) {
    // Talenan: penanda waktu bergerak; pekerjaan selesai otomatis.
    const t = this.talenan.job;
    if (t) {
      t.progress += dt;
      t.marker += t.markerDir * dt * 1.6;
      if (t.marker > 1) { t.marker = 1; t.markerDir = -1; }
      if (t.marker < 0) { t.marker = 0; t.markerDir = 1; }
      if (t.progress >= t.duration) this._finishChop(false);
    }
    for (const slot of [this.wajan, this.panggang]) {
      const s = slot.slot;
      if (!s) continue;
      if (!s.done) {
        s.progress += dt;
        if (s.progress >= s.duration) {
          s.done = true;
          s.burnIn = TUNING.burnAfterSec;
          this.audio.ding();
        }
      } else {
        s.burnIn -= dt;
        if (s.burnIn <= 0) {
          s.burnt = true;
          this.burnedCount += 1;
          this.toast = 'Masakan gosong! Tekan E di kompor untuk membuangnya.';
          this.toastUntil = this.time + 3;
          this.audio.fail();
        }
      }
    }
    const anyCooking = (this.wajan.slot && !this.wajan.slot.done)
      || (this.panggang.slot && !this.panggang.slot.done);
    if (anyCooking) this.audio.sizzleStart();
    else this.audio.sizzleStop();
  }

  _finishChop(perfect) {
    const t = this.talenan.job;
    if (!t) return;
    this.talenan.job = null;
    this.chef.chopFlash = 0.4;
    if (perfect) {
      this.score += TUNING.perfectChopBonus;
      this.toast = `Cincang sempurna! +${TUNING.perfectChopBonus}`;
      this.toastUntil = this.time + 1.5;
      this.audio.chopPerfect();
    } else {
      this.audio.chop();
    }
    // Hasil cincangan langsung ke tangan koki bila ada tempat.
    if (this.canCarry()) {
      this.chef.carrying.push(this.makeItem(t.result, 'cooked'));
    } else {
      // Tangan penuh: hasil cincangan menunggu di talenan.
      this.talenan.job = { waiting: true, result: t.result };
    }
  }

  _updateChef(dt, input) {
    const c = this.chef;
    const mv = input.moveVector();
    if (mv.dx !== 0 || mv.dy !== 0) {
      c.target = null;
      c.pendingStation = null;
      c.x += mv.dx * TUNING.playerSpeed * dt;
      c.y += mv.dy * TUNING.playerSpeed * dt;
      c.dir = mv.dx !== 0 ? Math.sign(mv.dx) : c.dir;
      c.moving = true;
    } else if (c.target) {
      const d = dist(c.x, c.y, c.target.x, c.target.y);
      const step = TUNING.playerSpeed * dt;
      if (d <= step + 4) {
        c.x = c.target.x;
        c.y = c.target.y;
        c.target = null;
        c.moving = false;
        if (c.pendingStation) {
          const st = c.pendingStation;
          c.pendingStation = null;
          this.interact(st);
        }
      } else {
        c.x += ((c.target.x - c.x) / d) * step;
        c.y += ((c.target.y - c.y) / d) * step;
        c.dir = (c.target.x - c.x) >= 0 ? 1 : -1;
        c.moving = true;
      }
    } else {
      c.moving = false;
    }
    c.x = Math.max(WALK_AREA.x, Math.min(WALK_AREA.x + WALK_AREA.w, c.x));
    c.y = Math.max(WALK_AREA.y, Math.min(WALK_AREA.y + WALK_AREA.h, c.y));

    if (input.click) this._handleClick(input.click);
    if (input.interactPressed) this.interact(this._nearestStation());
  }

  _handleClick(p) {
    // Klik pada kotak bahan konter: jalan ke konter lalu ambil bahan itu.
    for (const bin of INGREDIENT_BINS) {
      if (p.x >= bin.x && p.x <= bin.x + bin.w && p.y >= bin.y && p.y <= bin.y + bin.h) {
        const ctr = stationCenter(STATIONS.counter);
        this.chef.target = { x: ctr.x, y: WALK_AREA.y + 10 };
        this.chef.pendingStation = 'counter:' + bin.id;
        return;
      }
    }
    for (const [key, st] of Object.entries(STATIONS)) {
      if (p.x >= st.x && p.x <= st.x + st.w && p.y >= st.y && p.y <= st.y + st.h) {
        const ctr = stationCenter(st);
        this.chef.target = { x: ctr.x, y: WALK_AREA.y + 10 };
        this.chef.pendingStation = key;
        return;
      }
    }
    // Klik di lantai: jalan ke sana.
    const tx = Math.max(WALK_AREA.x, Math.min(WALK_AREA.x + WALK_AREA.w, p.x));
    const ty = Math.max(WALK_AREA.y, Math.min(WALK_AREA.y + WALK_AREA.h, p.y));
    this.chef.target = { x: tx, y: ty };
    this.chef.pendingStation = null;
  }

  _nearestStation() {
    let best = null;
    let bestD = Infinity;
    for (const [key, st] of Object.entries(STATIONS)) {
      const ctr = stationCenter(st);
      const d = dist(this.chef.x, this.chef.y, ctr.x, ctr.y);
      if (d < bestD) { bestD = d; best = key; }
    }
    return bestD < 260 ? best : null;
  }

  // --- interaksi (tombol E / Spasi, atau klik stasiun) -----------------------
  interact(stationKey) {
    if (!stationKey || this.screen !== 'playing') return;
    if (stationKey.startsWith('counter:')) {
      this._takeIngredient(stationKey.slice(8));
      return;
    }
    if (stationKey === 'counter') { this._takeIngredient(null); return; }
    if (stationKey === 'talenan') this._useTalenan();
    else if (stationKey === 'wajan') this._useCooker(this.wajan, 'wajan');
    else if (stationKey === 'panggang') this._useCooker(this.panggang, 'panggang');
    else if (stationKey === 'plating') this._usePlating();
    else if (stationKey === 'saji') this._useSaji();
  }

  _takeIngredient(forcedId) {
    if (!this.canCarry()) {
      this.toast = 'Tangan penuh! Antar dulu bahanmu.';
      this.toastUntil = this.time + 1.5;
      this.audio.fail();
      return;
    }
    let id = forcedId;
    if (!id) {
      const { bin, d } = nearestBin(this.chef.x, this.chef.y);
      if (!bin || d > 300) return;
      id = bin.id;
    }
    this.chef.carrying.push(this.makeItem(id, 'raw'));
    this.audio.pickup();
  }

  _useTalenan() {
    const t = this.talenan.job;
    // Hasil cincangan yang menunggu diambil dulu.
    if (t && t.waiting) {
      if (!this.canCarry()) return;
      this.chef.carrying.push(this.makeItem(t.result, 'cooked'));
      this.talenan.job = null;
      this.audio.pickup();
      return;
    }
    if (t) {
      // Tekan tepat waktu: penanda di zona hijau (0.62..0.88) = sempurna.
      if (t.marker >= 0.62 && t.marker <= 0.88) this._finishChop(true);
      else this.audio.tick();
      return;
    }
    const idx = this.chef.carrying.findIndex((it) => it.kind === 'raw' && INGREDIENTS[it.id].chop);
    if (idx === -1) {
      this.toast = 'Bawa bahan yang bisa dicincang (ayam, telur, sayur).';
      this.toastUntil = this.time + 2;
      return;
    }
    const item = this.chef.carrying.splice(idx, 1)[0];
    const result = item.id + ':talenan';
    this.talenan.job = {
      item: item.id, result,
      progress: 0, duration: TUNING.chopTimeSec,
      marker: 0, markerDir: 1, perfect: false,
    };
    this.audio.chop();
  }

  _useCooker(cooker, kind) {
    const s = cooker.slot;
    if (s && s.burnt) {
      cooker.slot = null;
      this.toast = 'Masakan gosong dibuang.';
      this.toastUntil = this.time + 1.5;
      this.audio.drop();
      return;
    }
    if (s && s.done) {
      if (!this.canCarry()) {
        this.toast = 'Tangan penuh!';
        this.toastUntil = this.time + 1.5;
        return;
      }
      this.chef.carrying.push(this.makeItem(s.result, 'cooked'));
      cooker.slot = null;
      this.audio.pickup();
      return;
    }
    if (s) return; // masih memasak
    const idx = this.chef.carrying.findIndex((it) => {
      if (it.kind !== 'raw') return false;
      if (kind === 'wajan') return INGREDIENTS[it.id].cook === 'wajan';
      return it.id === 'ayam'; // panggangan hanya untuk sate ayam
    });
    if (idx === -1) {
      this.toast = kind === 'wajan'
        ? 'Bawa nasi, mie, atau bumbu ke wajan.'
        : 'Bawa ayam mentah ke panggangan.';
      this.toastUntil = this.time + 2;
      return;
    }
    const item = this.chef.carrying.splice(idx, 1)[0];
    const result = item.id + ':' + kind;
    cooker.slot = {
      item: item.id, result,
      progress: 0,
      duration: kind === 'wajan' ? TUNING.cookTimeSec : TUNING.grillTimeSec,
      done: false, burnt: false, burnIn: 0,
    };
    this.audio.sizzleStart();
  }

  _usePlating() {
    const c = this.chef;
    // Piring sudah lengkap: ambil hidangan jadi.
    const doneOrder = this._plateMatchesOrder();
    if (doneOrder && c.carrying.length === 0) {
      this.plate.items = [];
      c.carrying.push(this.makeItem('dish:' + doneOrder.recipeId, 'dish'));
      this.audio.pickup();
      this.toast = `${RECIPES[doneOrder.recipeId].name} siap! Antar ke Meja Saji.`;
      this.toastUntil = this.time + 2;
      return;
    }
    // Letakkan satu bahan olahan / teh / es ke piring bila dibutuhkan pesanan.
    const idx = c.carrying.findIndex((it) => this._plateNeeds(it.id));
    if (idx === -1) {
      if (c.carrying.length > 0) {
        this.toast = 'Piring ini tidak butuh bahan itu.';
        this.toastUntil = this.time + 1.5;
      }
      return;
    }
    const item = c.carrying.splice(idx, 1)[0];
    this.plate.items.push(item.id);
    this.audio.drop();
    const nowDone = this._plateMatchesOrder();
    if (nowDone) {
      this.audio.ding();
      this.toast = 'Hidangan lengkap! Tekan E lagi untuk mengangkat piring.';
      this.toastUntil = this.time + 2;
    }
  }

  // Pesanan mana pun yang masih butuh item ini di piring?
  _plateNeeds(itemId) {
    for (const o of this.orders) {
      const missing = missingResults(o.recipeId, this.plate.items);
      if (missing.includes(itemId)) return true;
    }
    return false;
  }

  // Pesanan pertama yang piringnya sudah lengkap.
  _plateMatchesOrder() {
    for (const o of this.orders) {
      if (missingResults(o.recipeId, this.plate.items).length === 0) return o;
    }
    return null;
  }

  _useSaji() {
    const idx = this.chef.carrying.findIndex((it) => it.kind === 'dish');
    if (idx === -1) {
      this.toast = 'Bawa hidangan jadi ke Meja Saji.';
      this.toastUntil = this.time + 1.5;
      return;
    }
    const dish = this.chef.carrying[idx];
    const recipeId = dish.id.slice(5);
    const order = this.orders.find((o) => o.recipeId === recipeId);
    if (!order) {
      this.toast = 'Tidak ada pesanan untuk hidangan ini.';
      this.toastUntil = this.time + 1.5;
      this.audio.fail();
      return;
    }
    this.chef.carrying.splice(idx, 1);
    this.orders = this.orders.filter((o) => o !== order);
    const timeBonus = Math.round(order.timeLeft) * TUNING.timeBonusPerSec;
    if (this.time - this.lastServeAt <= TUNING.comboWindowSec) this.combo += 1;
    else this.combo = 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.lastServeAt = this.time;
    const mult = 1 + (this.combo - 1) * 0.25;
    const earned = Math.round((order.price + timeBonus) * mult);
    this.score += earned;
    this.coins += earned;
    this.servedCount += 1;
    this.servedFlash = 0.8;
    this.toast = `Tersaji! ${order.name} +${earned} (kombo x${this.combo})`;
    this.toastUntil = this.time + 2.5;
    this.audio.serve();
  }

  // --- keadaan untuk screenshot / self-test ---------------------------------
  // Apakah stasiun sedang dipakai (untuk sorot visual).
  stationBusy(key) {
    if (key === 'talenan') return !!this.talenan.job;
    if (key === 'wajan') return !!this.wajan.slot;
    if (key === 'panggang') return !!this.panggang.slot;
    if (key === 'plating') return this.plate.items.length > 0;
    return false;
  }

  plateOrderProgress() {
    // Kemajuan piring terhadap pesanan yang paling dekat selesai (0..1).
    let best = 0;
    for (const o of this.orders) {
      const total = RECIPES[o.recipeId].steps.length;
      const missing = missingResults(o.recipeId, this.plate.items).length;
      best = Math.max(best, (total - missing) / total);
    }
    return best;
  }
}
