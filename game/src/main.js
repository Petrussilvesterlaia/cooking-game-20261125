// Warung Sizzle — main.js
// Titik masuk permainan: membaca query (?shot=, ?test=, ?seed=), membuat
// dunia + renderer + input, lalu menjalankan loop frame dan mesin layar
// (judul -> bermain -> jeda -> akhir -> ulang).

import { SizzleAudio } from './audio.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { applyShot } from './shots.js';
import { runSelfTest } from './selftest.js';
import { World } from './world.js';

const canvas = document.getElementById('game');
const params = new URLSearchParams(window.location.search);
const seed = parseInt(params.get('seed') || '1', 10) || 1;

const audio = new SizzleAudio();
const input = new Input(canvas);
const world = new World(audio);
const renderer = new Renderer(canvas);

let lastTs = 0;

function frame(ts) {
  const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
  lastTs = ts;

  // Mesin layar di luar permainan berjalan.
  if (world.screen === 'title') {
    world.time += dt; // untuk kedip teks judul
    if (input.anyKeyPressed || input.click) {
      audio.ensure();
      audio.click();
      world.startDay(seed);
    }
    input.consumeFrame();
  } else if (world.screen === 'paused') {
    if (input.pausePressed || input.anyKeyPressed) {
      world.screen = 'playing';
      audio.click();
    }
    input.consumeFrame();
  } else if (world.screen === 'over') {
    if (input.restartPressed || (input.anyKeyPressed && world.time > 1)) {
      audio.click();
      world.startDay(seed);
    }
    input.consumeFrame();
  } else {
    if (input.pausePressed) {
      world.screen = 'paused';
      audio.sizzleStop();
      input.consumeFrame();
    } else if (input.restartPressed) {
      world.startDay(seed);
      input.consumeFrame();
    } else {
      world.update(dt, input);
    }
  }

  renderer.draw(world, input);
  requestAnimationFrame(frame);
}

// Mode uji: jalankan asersi internal, jangan mulai loop permainan.
if (params.get('test') === '1') {
  audio.ensure();
  const result = runSelfTest(world, audio);
  window.__selftest = result;
  renderer.draw(world, input);
} else {
  const shot = params.get('shot');
  if (shot) {
    const ok = applyShot(world, shot, seed);
    if (!ok) console.warn('[shot] shot tidak dikenal:', shot);
    renderer.draw(world, input);
    // Loop ringan khusus staging: hanya menggambar ulang (uap, kedip) tanpa
    // memajukan logika permainan, supaya tangkapan layar stabil.
    let shotTs = 0;
    const shotFrame = (ts) => {
      const dt = Math.min(0.05, shotTs ? (ts - shotTs) / 1000 : 0.016);
      shotTs = ts;
      world.time += dt;
      renderer.draw(world, input);
      requestAnimationFrame(shotFrame);
    };
    requestAnimationFrame(shotFrame);
  } else {
    requestAnimationFrame(frame);
  }
}
