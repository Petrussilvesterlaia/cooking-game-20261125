// Warung Sizzle — input.js
// Satu-satunya tempat yang mendengarkan keyboard dan mouse.
// Menghasilkan status yang dibaca world.js tiap frame: arah gerak (dx, dy),
// tombol interaksi yang baru ditekan, dan klik stasiun (target jalan).

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.interactPressed = false; // E / Spasi, true hanya pada frame ditekan
    this.restartPressed = false;  // R
    this.pausePressed = false;    // P
    this.anyKeyPressed = false;   // sembarang tombol (untuk mulai dari judul)
    this.click = null;            // {x, y} dalam koordinat canvas, sekali pakai
    this.mouse = { x: 0, y: 0 };  // posisi kursor terakhir (koordinat canvas)

    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    canvas.addEventListener('pointerdown', (e) => this._onPointer(e));
    canvas.addEventListener('pointermove', (e) => this._onPointerMove(e));
  }

  _onKeyDown(e) {
    const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
    if (gameKeys.includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    this.keys.add(e.code);
    this.anyKeyPressed = true;
    if (e.code === 'KeyE' || e.code === 'Space') this.interactPressed = true;
    if (e.code === 'KeyR') this.restartPressed = true;
    if (e.code === 'KeyP' || e.code === 'Escape') this.pausePressed = true;
  }

  _canvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * this.canvas.height,
    };
  }

  _onPointer(e) {
    const p = this._canvasPos(e);
    this.click = p;
    this.mouse = p;
    this.anyKeyPressed = true;
  }

  _onPointerMove(e) {
    this.mouse = this._canvasPos(e);
  }

  // Arah gerak ternormalisasi dari WASD / panah. (0,0) bila diam.
  moveVector() {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.hypot(dx, dy);
      dx *= inv;
      dy *= inv;
    }
    return { dx, dy };
  }

  // Dipanggil world.js di akhir tiap frame: tombol sekali-tekan dibersihkan.
  consumeFrame() {
    this.interactPressed = false;
    this.restartPressed = false;
    this.pausePressed = false;
    this.anyKeyPressed = false;
    this.click = null;
  }

  // Apakah kursor sedang di atas sebuah kotak (untuk hover stasiun).
  hoverRect(rect) {
    const m = this.mouse;
    return m.x >= rect.x && m.x <= rect.x + rect.w && m.y >= rect.y && m.y <= rect.y + rect.h;
  }
}
