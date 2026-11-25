// Warung Sizzle — audio.js
// Semua bunyi disintesis dengan WebAudio di tempat: tidak ada berkas audio,
// tidak ada jaringan. Setiap bunyi adalah fungsi kecil yang membangun
// osilator / noise buffer, memainkannya, lalu membuangnya.

export class SizzleAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.sizzleNodes = null; // bunyi desis wajan yang sedang berjalan
  }

  // Dipanggil dari gestur pengguna pertama (klik / tombol) agar AudioContext
  // diizinkan browser. Aman dipanggil berulang kali.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  // --- primitif -------------------------------------------------------------
  _tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  _noise(dur, vol, filterFreq, type = 'bandpass', when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // --- bunyi permainan ------------------------------------------------------
  pickup() { this._tone(520, 0.09, 'triangle', 0.25, 0, 760); }
  drop() { this._tone(320, 0.08, 'triangle', 0.2, 0, 220); }
  chop() {
    this._noise(0.07, 0.5, 2400, 'highpass');
    this._tone(180, 0.06, 'square', 0.12, 0, 90);
  }
  chopPerfect() {
    this.chop();
    this._tone(880, 0.12, 'sine', 0.22, 0.05);
    this._tone(1320, 0.16, 'sine', 0.18, 0.12);
  }
  sizzleStart() {
    if (!this.ctx || this.muted || this.sizzleNodes) return;
    const len = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5200;
    filter.Q.value = 0.6;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.3);
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    this.sizzleNodes = { src, gain };
  }
  sizzleStop() {
    if (!this.sizzleNodes) return;
    const { src, gain } = this.sizzleNodes;
    this.sizzleNodes = null;
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
    setTimeout(() => { try { src.stop(); } catch (_) { /* sudah berhenti */ } }, 250);
  }

  ding() {
    this._tone(1046, 0.35, 'sine', 0.28);
    this._tone(1568, 0.45, 'sine', 0.2, 0.09);
  }
  serve() {
    this._tone(523, 0.12, 'triangle', 0.25);
    this._tone(659, 0.12, 'triangle', 0.25, 0.1);
    this._tone(784, 0.22, 'triangle', 0.28, 0.2);
    this._tone(1046, 0.3, 'sine', 0.2, 0.3);
  }
  fail() {
    this._tone(220, 0.25, 'sawtooth', 0.16, 0, 110);
    this._tone(160, 0.3, 'sawtooth', 0.14, 0.12, 90);
  }
  tick() { this._tone(980, 0.05, 'square', 0.1); }
  click() { this._tone(700, 0.05, 'triangle', 0.18); }
  newOrder() {
    this._tone(660, 0.1, 'sine', 0.2);
    this._tone(880, 0.14, 'sine', 0.2, 0.09);
  }
  gameOver() {
    this._tone(392, 0.3, 'triangle', 0.25);
    this._tone(330, 0.3, 'triangle', 0.25, 0.25);
    this._tone(262, 0.55, 'triangle', 0.25, 0.5);
  }
}