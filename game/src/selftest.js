// Warung Sizzle — selftest.js
// Uji internal yang dijalankan dengan ?test=1: memeriksa keadaan pesanan,
// resep, dan transisi permainan tanpa campur tangan manusia. Hasilnya
// ditulis ke document.title dan console agar bisa diverifikasi headless.

import { INGREDIENTS, PROCESSED, RECIPES, RECIPE_IDS, TUNING, missingResults } from './config.js';

function check(results, name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`[selftest] ${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  return !!ok;
}

export function runSelfTest(world, audio) {
  const results = [];
  let passed = 0;

  // 1. Setiap resep punya langkah yang merujuk bahan dan stasiun yang ada.
  let recipesOk = true;
  for (const id of RECIPE_IDS) {
    const r = RECIPES[id];
    if (!r.name || !Array.isArray(r.steps) || r.steps.length === 0) { recipesOk = false; break; }
    for (const st of r.steps) {
      if (!INGREDIENTS[st.ingredient]) { recipesOk = false; break; }
      if (!['wajan', 'talenan', 'panggang', 'plating'].includes(st.station)) { recipesOk = false; break; }
      if (st.station !== 'plating' && !PROCESSED[st.result]) { recipesOk = false; break; }
    }
  }
  if (check(results, 'recipes-valid', recipesOk, `${RECIPE_IDS.length} resep`)) passed++;

  // 2. Pesanan bisa dibuat dan kedaluwarsa dengan benar.
  world.startDay(7);
  const o1 = world.spawnOrder();
  const spawnOk = !!o1 && world.orders.length === 1 && o1.timeLeft === TUNING.orderTimeSec;
  if (check(results, 'order-spawn', spawnOk, o1 ? o1.name : 'tidak ada pesanan')) passed++;
  o1.timeLeft = 0.05;
  world._updateOrders(0.1);
  if (check(results, 'order-expire', world.orders.length === 0 && world.expiredCount === 1, 'pesanan hangus dihitung')) passed++;

  // 3. Alur lengkap satu pesanan Es Teh: ambil teh + es, susun, angkat, saji.
  world.startDay(7);
  const tea = world.spawnOrder();
  // Paksa pesanan pertama menjadi Es Teh agar alurnya deterministik.
  tea.recipeId = 'es_teh';
  tea.name = RECIPES.es_teh.name;
  world.chef.carrying = [];
  world._takeIngredient('teh');
  world._takeIngredient('es');
  const carryOk = world.chef.carrying.length === 2;
  if (check(results, 'carry-tea-ice', carryOk, 'teh + es di tangan')) passed++;
  world._usePlating();
  world._usePlating();
  const plateOk = world.plate.items.length === 2 && world._plateMatchesOrder() !== null;
  if (check(results, 'plate-complete', plateOk, 'piring Es Teh lengkap')) passed++;
  world._usePlating(); // angkat hidangan jadi
  const dishOk = world.chef.carrying.some((it) => it.id === 'dish:es_teh');
  if (check(results, 'dish-pickup', dishOk, 'hidangan jadi di tangan')) passed++;
  const scoreBefore = world.score;
  world._useSaji();
  const serveOk = world.orders.length === 0 && world.score > scoreBefore && world.servedCount === 1;
  if (check(results, 'serve-scores', serveOk, `skor ${scoreBefore} -> ${world.score}`)) passed++;

  // 4. Cincang: ayam mentah -> ayam cincang, dan zona hijau memberi bonus.
  world.startDay(7);
  world.chef.carrying = [world.makeItem('ayam', 'raw')];
  world._useTalenan();
  const chopStarted = !!world.talenan.job && world.talenan.job.result === 'ayam:talenan';
  if (check(results, 'chop-start', chopStarted, 'pekerjaan talenan berjalan')) passed++;
  world.talenan.job.marker = 0.75;
  const scoreBeforeChop = world.score;
  world._useTalenan(); // tekan di zona hijau
  const chopOk = !world.talenan.job && world.score === scoreBeforeChop + TUNING.perfectChopBonus;
  if (check(results, 'chop-perfect', chopOk, `bonus +${TUNING.perfectChopBonus}`)) passed++;

  // 5. Masak di wajan: nasi -> matang, lalu gosong bila dibiarkan.
  world.startDay(7);
  world.chef.carrying = [world.makeItem('nasi', 'raw')];
  world._useCooker(world.wajan, 'wajan');
  const cookStarted = !!world.wajan.slot && world.wajan.slot.result === 'nasi:wajan';
  if (check(results, 'cook-start', cookStarted, 'wajan menerima nasi')) passed++;
  world._updateStations(TUNING.cookTimeSec + 0.1);
  const cookedOk = world.wajan.slot && world.wajan.slot.done && !world.wajan.slot.burnt;
  if (check(results, 'cook-done', cookedOk, 'nasi goreng matang')) passed++;
  world._updateStations(TUNING.burnAfterSec + 0.1);
  const burntOk = world.wajan.slot && world.wajan.slot.burnt;
  if (check(results, 'cook-burns', burntOk, 'dibiarkan -> gosong')) passed++;
  world._useCooker(world.wajan, 'wajan'); // buang yang gosong
  if (check(results, 'burnt-cleared', world.wajan.slot === null, 'slot bersih lagi')) passed++;

  // 6. missingResults: piring setengah tersusun masih kurang satu langkah.
  const miss = missingResults('nasi_goreng', ['nasi:wajan', 'telur:talenan']);
  if (check(results, 'missing-results', miss.length === 1 && miss[0] === 'bumbu:wajan', 'kurang bumbu tumis')) passed++;

  // 7. Hari berakhir setelah 120 detik dan layar menjadi 'over'.
  world.startDay(7);
  world.dayLeft = 0.05;
  const fakeInput = {
    moveVector: () => ({ dx: 0, dy: 0 }),
    click: null, interactPressed: false,
    consumeFrame: () => {},
  };
  world.update(0.1, fakeInput);
  if (check(results, 'day-ends', world.screen === 'over' && world.dayLeft === 0, 'layar akhir muncul')) passed++;

  // 8. Audio: semua bunyi bisa dipanggil tanpa melempar (tanpa gestur pun).
  let audioOk = true;
  try {
    audio.pickup(); audio.chop(); audio.chopPerfect(); audio.ding();
    audio.serve(); audio.fail(); audio.tick(); audio.click();
    audio.newOrder(); audio.gameOver(); audio.sizzleStart(); audio.sizzleStop();
  } catch (e) {
    audioOk = false;
  }
  if (check(results, 'audio-safe', audioOk, 'semua bunyi aman dipanggil')) passed++;

  const total = results.length;
  const summary = `SELFTEST ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`;
  console.log(`[selftest] ${summary}`);
  document.title = summary;
  // Tulis juga ringkasan ke badan halaman agar headless --dump-dom bisa membacanya.
  const pre = document.createElement('pre');
  pre.id = 'selftest-result';
  pre.textContent = summary + '\n' + results.map((r) => `${r.ok ? 'PASS' : 'FAIL'} ${r.name} ${r.detail}`).join('\n');
  document.body.appendChild(pre);
  return { passed, total, results };
}
