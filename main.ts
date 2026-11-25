// Warung Sizzle — program hand-in (Node 22, standard library only).
// Menyalin game/ dan screenshots/ dari samping berkas ini ke /output
// (atau $MAKEFUN_OUTPUT_DIR di luar grader), lalu menulis
// /output/dossier.json dengan buildDossier dari vendor/makefun-game.ts.
// Deterministik: dua kali jalan menulis byte yang sama.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//   # lalu periksa out/dossier.json dan out/game/index.html

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Batas gate (lihat RULES.txt): teks dossier dibatasi 160 KiB; paling banyak
// 4 tangkapan layar @ 256 KiB; game/ paling banyak 993 entri / 48 MiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
