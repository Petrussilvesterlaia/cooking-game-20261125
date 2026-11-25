// Warung Sizzle — shots.js
// Staging deterministik untuk tangkapan layar (?shot=start|play|end&seed=N).
// Setiap shot membangun keadaan permainan yang sama setiap kali dijalankan,
// supaya tangkapan layar stabil dan bisa diulang. RNG di-seed tetap.

import { RECIPES, TUNING } from './config.js';

export function applyShot(world, shot, seed) {
  const s = seed || 1;
  if (shot === 'start') {
    // Layar judul di atas dapur lengkap dengan dua pesanan di papan.
    world.startDay(s);
    world.screen = 'title';
    world.spawnOrder();
    world.spawnOrder();
    world.orders[0].timeLeft = 48;
    world.orders[1].timeLeft = 36;
    world.chef.x = 1150;
    world.chef.y = 690;
    return true;
  }
  if (shot === 'play') {
    // Koki di tengah dapur membawa bahan cincang, satu hidangan setengah
    // tersusun di piring, timer pesanan sekitar setengah jalan.
    world.startDay(s);
    world.spawnOrder(); // nasi_goreng atau acak dari seed
    world.spawnOrder();
    world.orders[0].timeLeft = world.orders[0].total * 0.5;
    world.orders[1].timeLeft = world.orders[1].total * 0.62;
    world.time = 42;
    world.dayLeft = TUNING.dayLengthSec - 42;
    world.score = 340;
    world.coins = 340;
    world.combo = 2;
    world.servedCount = 2;
    world.chef.x = 640;
    world.chef.y = 590;
    world.chef.carrying = [world.makeItem('ayam:talenan', 'cooked')];
    // Piring setengah tersusun: dua dari tiga langkah pesanan pertama.
    const first = world.orders[0];
    const steps = RECIPES[first.recipeId].steps;
    world.plate.items = steps.slice(0, 2).map((st) => st.result);
    // Wajan sedang memasak dan talenan sedang mencincang.
    world.wajan.slot = {
      item: 'nasi', result: 'nasi:wajan', progress: 3.1,
      duration: TUNING.cookTimeSec, done: false, burnt: false, burnIn: 0,
    };
    world.talenan.job = {
      item: 'sayur', result: 'sayur:talenan', progress: 1.2,
      duration: TUNING.chopTimeSec, marker: 0.72, markerDir: 1, perfect: false,
    };
    world.toast = 'Nasi Goreng hampir lengkap — susun di piring!';
    world.toastUntil = world.time + 30;
    return true;
  }
  if (shot === 'end') {
    // Piring tersaji di meja saji + skor dan kombo akhir hari.
    world.startDay(s);
    world.time = TUNING.dayLengthSec;
    world.dayLeft = 0;
    world.score = 1240;
    world.coins = 1240;
    world.combo = 4;
    world.bestCombo = 4;
    world.servedCount = 7;
    world.expiredCount = 1;
    world.burnedCount = 0;
    world.orders = [];
    world.chef.x = 640;
    world.chef.y = 560;
    world.chef.carrying = [world.makeItem('dish:nasi_goreng', 'dish')];
    world.servedFlash = 0.8;
    world.screen = 'over';
    return true;
  }
  return false;
}
