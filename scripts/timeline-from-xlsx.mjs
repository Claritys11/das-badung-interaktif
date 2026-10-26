// Excel timeline → src/content/timeline.ts. Jalankan: pnpm timeline  (atau: pnpm timeline --timpa)
// Input : raw/timeline/Timeline terbaru.xlsx  (versi lama tetap disimpan di raw/timeline/ sebagai arsip)
//         Baris 1 = tanggal (serial Excel) per kolom; baris 2 dst. = peristiwa pada tanggal itu.
// Output: src/content/timeline.ts — dibuat SEKALI (tidak menimpa hasil edit redaksi). Kalau file sudah
//         ada, script hanya melaporkan tanggal baru. `--timpa` = buat ulang dari Excel; judul kartu &
//         gambar yang SUDAH diisi redaksi (bukan placeholder) untuk tanggal yang sama tetap dipertahankan.
import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'raw/timeline/Timeline terbaru.xlsx');
const OUT = path.join(root, 'src/content/timeline.ts');
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Peristiwa yang dihapus redaksi (awal teks). Disaring di sini supaya tidak muncul lagi saat
// timeline dibuat ulang dari Excel (`--timpa`).
const DIHAPUS = ['Rincian bantuan meliputi Rp720 juta untuk 72 kios', 'Ahli waris korban meninggal menerima bantuan Rp15 juta'];

const textOf = (el) => [...el.getElementsByTagNameNS(NS, 't')].map((t) => t.textContent ?? '').join('');
const colIndex = (ref) => [...ref.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

// Serial Excel (sistem 1900) → tanggal UTC.
function excelDate(serial) {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000);
  return {
    iso: d.toISOString().slice(0, 10),
    label: `${HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  };
}

// "pukul 03.10 Wita" / "Pukul 11.59 Wita" → "03.10". Teks asli TIDAK diubah; ini hanya label jam.
const waktuDari = (teks) => teks.match(/pukul\s+(\d{1,2}[.:]\d{2})/i)?.[1].replace(':', '.') ?? null;

export async function readTimeline() {
  const zip = await JSZip.loadAsync(await readFile(SRC));
  const parse = async (name) => new DOMParser().parseFromString(await zip.file(name).async('string'), 'text/xml');
  const shared = [...(await parse('xl/sharedStrings.xml')).getElementsByTagNameNS(NS, 'si')].map(textOf);
  const sheet = await parse('xl/worksheets/sheet1.xml');

  const grid = []; // grid[baris][kolom] = teks
  for (const row of [...sheet.getElementsByTagNameNS(NS, 'row')]) {
    const r = Number(row.getAttribute('r')) - 1;
    for (const c of [...row.getElementsByTagNameNS(NS, 'c')]) {
      const v = c.getElementsByTagNameNS(NS, 'v')[0];
      const raw = v ? v.textContent : c.getElementsByTagNameNS(NS, 'is')[0] ? textOf(c) : null;
      if (raw == null) continue;
      const val = c.getAttribute('t') === 's' ? shared[Number(raw)] : raw;
      (grid[r] ??= [])[colIndex(c.getAttribute('r'))] = String(val).replace(/\s+/g, ' ').trim();
    }
  }

  const header = grid[0] ?? [];
  return header
    .map((serial, col) => {
      if (!serial || Number.isNaN(Number(serial))) return null;
      const peristiwa = grid
        .slice(1)
        .map((row) => row?.[col])
        .filter(Boolean)
        .filter((teks) => !DIHAPUS.some((awal) => teks.startsWith(awal)))
        .map((teks) => ({ teks, waktu: waktuDari(teks) }));
      return { ...excelDate(Number(serial)), peristiwa };
    })
    .filter(Boolean);
}

function render(days, keep = {}) {
  const body = days
    .map((d) => {
      const items = d.peristiwa
        .map((p) => `      { teks: ${JSON.stringify(p.teks)}${p.waktu ? `, waktu: '${p.waktu}'` : ''} },`)
        .join('\n');
      const k = keep[d.iso] ?? {};
      return `  {
    tanggal: '${d.iso}',
    label: '${d.label}',
    judul: ${k.judul ?? `'[Judul hari ${d.label} — diisi redaksi]'`},
    ${k.gambar ?? `// gambar: { src: '/timeline/${d.iso}.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },`}
    peristiwa: [
${items}
    ],
  },`;
    })
    .join('\n');
  return `// Timeline banjir Denpasar, September 2025. Dibuat dari raw/timeline/*.xlsx oleh \`pnpm timeline\`
// (sekali saja — file ini bebas diedit redaksi). Teks peristiwa = teks asli dari Excel.
// \`waktu\` diekstrak otomatis dari frasa "pukul HH.MM" (hanya label; teks tidak diubah).
// \`gambar\` opsional: isi dengan foto asli + kredit (jangan foto stok).
import type { HariTimeline } from './types';

export const timeline: HariTimeline[] = [
${body}
];
`;
}

// Judul & gambar yang sudah diisi redaksi (bukan placeholder) dari file lama, per tanggal.
function editedFields(src) {
  const keep = {};
  const re = /tanggal: '(\d{4}-\d{2}-\d{2})',[\s\S]*?judul: ((?:'[^'\n]*'|"[^"\n]*"|`[^`]*`)),\s*\n\s*((?:gambar: \{[^}]*\},)?)/g;
  for (const m of src.matchAll(re)) {
    const [, iso, judul, gambar] = m;
    keep[iso] = {};
    if (!judul.includes('diisi redaksi')) keep[iso].judul = judul;
    if (gambar) keep[iso].gambar = gambar;
  }
  return keep;
}

async function main() {
  const timpa = process.argv.includes('--timpa');
  const days = await readTimeline();
  const total = days.reduce((n, d) => n + d.peristiwa.length, 0);
  console.table(
    days.map((d) => ({ tanggal: d.iso, label: d.label, peristiwa: d.peristiwa.length, berjam: d.peristiwa.filter((p) => p.waktu).length })),
  );
  console.log(`${days.length} tanggal, ${total} peristiwa`);
  if (timpa) {
    let keep = {};
    try {
      keep = editedFields(await readFile(OUT, 'utf8'));
    } catch {
      /* belum ada file lama */
    }
    const kept = Object.entries(keep)
      .filter(([, v]) => v.judul || v.gambar)
      .map(([iso]) => iso);
    await writeFile(OUT, render(days, keep));
    console.log(`\nDitimpa: ${path.relative(root, OUT)}${kept.length ? ` (judul/gambar redaksi dipertahankan: ${kept.join(', ')})` : ''}`);
    return;
  }
  try {
    await access(OUT);
    const existing = await readFile(OUT, 'utf8');
    console.log(`\n${path.relative(root, OUT)} sudah ada — tidak ditimpa. Cek manual bila Excel berubah:`);
    for (const d of days)
      if (!existing.includes(`tanggal: '${d.iso}'`)) console.log(`  - tanggal baru: ${d.iso} (${d.peristiwa.length} peristiwa)`);
  } catch {
    await writeFile(OUT, render(days));
    console.log(`\nDibuat: ${path.relative(root, OUT)}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
