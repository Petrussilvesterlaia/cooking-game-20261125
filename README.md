[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Petrussilvesterlaia/cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Petrussilvesterlaia/cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Warung Sizzle — Game Memasak

Warung makan paling sibuk di kampung. Kamu koki satu-satunya: ambil bahan di
konter, cincang di talenan (tekan tepat waktu di zona hijau untuk cincang
sempurna), masak di wajan dan panggangan (jangan sampai gosong!), susun
hidangan di meja plating sesuai resep, lalu antar ke meja saji sebelum timer
pesanan habis. Empat resep — Nasi Goreng, Mie Goreng, Sate Ayam, Es Teh Manis
— satu hari kerja 120 detik, kombo beruntun melipatgandakan skor.

Game orisinal: semua seni digambar di canvas, semua bunyi disintesis dengan
WebAudio, tanpa aset unduhan, tanpa jaringan, tanpa library eksternal.

## Cara main

- **WASD / panah** — gerakkan koki
- **E / Spasi** — interaksi dengan stasiun terdekat
- **Klik mouse** — klik stasiun untuk berjalan ke sana dan berinteraksi
- **P** — jeda, **R** — mulai ulang hari

## Run it

```sh
# dari folder repo ini, sajikan game/ dengan server statis:
python3 -m http.server 8080 --directory game
# lalu buka http://localhost:8080
```

Atau langsung buka `game/index.html` lewat server statis apa pun — game
tidak memanggil jaringan sama sekali.

## Struktur

- `game/index.html` — halaman game
- `game/src/config.js` — resep, tuning, warna, denah stasiun
- `game/src/audio.js` — bunyi WebAudio yang disintesis sendiri
- `game/src/input.js` — keyboard + mouse
- `game/src/world.js` — keadaan permainan: pesanan, stasiun, skor, kombo
- `game/src/render.js` — gambar canvas: dapur, koki, makanan, HUD
- `game/src/shots.js` — staging deterministik `?shot=start|play|end`
- `game/src/main.js` — boot, loop, mesin layar
- `game/src/selftest.js` — asersi internal `?test=1`
- `main.ts` — program hand-in (Node 22) yang menulis `/output/dossier.json`
- `screenshots/` — tiga tangkapan layar dari game ini

## Lisensi

MIT — lihat [LICENSE](LICENSE).

---
<sub>Entered on [make.fun](https://make.fun/?ref=dr95t7s8&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
