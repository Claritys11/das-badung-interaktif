# Serah terima: DAS Badung interaktif

Panduan untuk developer yang melanjutkan proyek ini. Baca dokumen ini dulu. Rincian teknis per komponen ada di [README.md](README.md).

## Proyek ini apa

Tujuh visual interaktif untuk artikel IDN Times tentang banjir dan Daerah Aliran Sungai (DAS) Badung, Bali. Setiap visual bisa dipasang sebagai iframe, komponen React, atau Framer Code Component. Urutan tampil di artikel:

| Urutan | Komponen | Isi | Halaman embed |
| --- | --- | --- | --- |
| 1 | `Slideshow` | 16 citra satelit 2005–2023 | `embed/slideshow.html` |
| 2 | `FloodTransition` | Transisi data banjir, sebelum ke sesudah | Bagian dari `embed/peta.html` |
| 3 | `ScrollyMap` | Peta scrollytelling 7 step | `embed/peta.html` |
| 4 | `Timeline` | Linimasa banjir per tanggal | `embed/timeline.html` |
| 5 | `Disabilitas` | Pilihan langkah, daftar centang, tab kanal peringatan | `embed/disabilitas.html` |
| 6 | `Sejarah` | Tata ruang Denpasar, peta kerajaan sampai sekarang | `embed/sejarah.html` |
| 7 | `Kesiapan` | Penutup artikel: 26 langkah kesiapan dalam 5 kelompok | `embed/kesiapan.html` |

**Stack:** React 18, TypeScript, Vite, MapLibre GL + MapTiler, motion, CSS biasa dengan token. Tidak ada backend, database, atau Tailwind. Hasil build berupa file statis.

## Status saat serah terima

**Sudah selesai**

- Ketujuh visual berjalan dan teruji di desktop, tablet, dan mobile.

**Belum dilakukan**

- Deploy ke Cloudflare Pages, sehingga belum ada URL publik.
- Pembatasan key MapTiler per domain.
- Pengujian di proyek Framer sungguhan.
- Pemasangan iframe di halaman IDN Times sungguhan.
- Beberapa pengecekan redaksi. Daftarnya ada di [TODO redaksi](README.md#todo-redaksi).

## Menjalankan

Butuh Node 20 atau lebih baru (terakhir diuji di Node 26) dan pnpm (terakhir diuji di pnpm 11).

```bash
git clone git@github.com:Claritys11/das-badung-interaktif.git
cd das-badung-interaktif
pnpm install
cp .env.example .env     # isi VITE_MAPTILER_KEY
pnpm dev                 # http://localhost:5173
```

Tanpa key, visual tanpa peta tetap berjalan, sedangkan `ScrollyMap` dan `Sejarah` menampilkan pesan bahwa key belum diisi.

Buka `/` untuk melihat semua visual dalam artikel tiruan, atau `/embed/<nama>.html` untuk satu visual.

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | Server pengembangan |
| `pnpm build` | Typecheck, build halaman ke `dist/`, build bundle Framer ke `dist/framer/` |
| `pnpm preview` | Menyajikan `dist/` |
| `pnpm test` | Unit test |
| `pnpm e2e` | E2E Playwright di 3 viewport. Butuh Google Chrome terpasang |
| `pnpm data` `images` `banjir` `timeline` `disabilitas` `sejarah` | Membuat ulang aset dari `raw/` (lihat [Mengganti aset](#mengganti-aset)) |

## Cara kerja repo

Alurnya satu arah. Aset redaksi masuk ke `raw/`, skrip mengolahnya, komponen memakai hasilnya.

```
raw/  ──pnpm <skrip>──►  public/       aset jadi (AVIF/WebP, GeoJSON, video)
                         src/content/  sejarah-peta.ts dan timeline.ts
                              │
src/content/*.ts  ──props──►  src/components/<visual>/
                              │
              ┌───────────────┼──────────────────┐
              ▼               ▼                  ▼
   embed/*.html       src/entries/harness   src/framer-entry.ts
   (iframe)           (artikel tiruan)      (bundle Framer)
```

| Folder | Isi | Boleh diedit? |
| --- | --- | --- |
| `src/content/` | Semua teks redaksi, caption, alt, angka, kamera peta | Ya. Tempat utama perubahan isi |
| `src/content/sejarah-peta.ts` | Koordinat dari KMZ | Tidak. Dibuat ulang oleh `pnpm sejarah` |
| `src/components/` | Komponen. Tidak menyimpan teks redaksi | Ya |
| `src/styles/tokens.css` | Warna, font, radius | Ya. Bisa ditimpa host |
| `raw/` | Aset asli redaksi | Jangan. Tambah atau ganti file saja |
| `public/` | Hasil skrip, ikut di-commit | Jangan. Buat ulang lewat skrip |
| `embed/`, `src/entries/` | Halaman iframe dan artikel tiruan | Ya |
| `framer/` | File untuk ditempel di Framer | Ya. Ganti `HOST` saat dipasang |
| `tests/` | Unit, E2E, dan screenshot | Ya |

Penanda teks: `_teks_` di file konten menjadi cetak miring, lewat `src/components/TeksInline.tsx`. HTML mentah tidak didukung.

## Cara mengambil visual

Pilih salah satu dari tiga cara ini.

### 1. Iframe (paling mudah dan paling aman)

Jalankan `pnpm build`, hosting folder `dist/`, lalu pasang `https://<host>/embed/<nama>.html` di iframe. Snippet tiap visual ada di [README: Embed via iframe](README.md#embed-via-iframe).

Iframe punya scroll sendiri, terpisah dari scroll artikel. Karena itu `embed/peta.html` memakai mode scroll internal dan tombol navigasi. Halaman `sejarah`, `disabilitas`, dan `kesiapan` memakai scroll dokumen di dalam iframe.

### 2. Komponen React (kalau scroll harus menyatu dengan artikel)

Salin komponen beserta file yang dibutuhkannya ke proyek React lain:

| Visual | File di `src/` | Paket npm |
| --- | --- | --- |
| Slideshow | `components/slideshow/`, `components/icons.tsx`, `content/slides.ts`, `content/types.ts` | `motion` |
| FloodTransition | `components/flood-transition/`, `content/banjir.ts` | `motion` |
| ScrollyMap | `components/scrolly-map/`, `components/icons.tsx`, `components/TeksInline.tsx`, `content/story.ts`, `content/types.ts` | `maplibre-gl`, `motion` |
| Timeline | `components/timeline/`, `components/icons.tsx`, `components/TeksInline.tsx`, `content/timeline.ts`, `content/timeline-teks.ts`, `content/types.ts` | Tidak ada |
| Disabilitas | `components/disabilitas/`, `components/TeksInline.tsx`, `content/disabilitas.ts` | Tidak ada |
| Kesiapan | `components/kesiapan/`, `components/disabilitas/Ceklis.tsx`, `components/disabilitas/disabilitas.css`, `content/kesiapan.ts` | Tidak ada |
| Sejarah | `components/sejarah/`, `components/scrolly-map/maplibreWorker.ts`, `components/TeksInline.tsx`, `content/sejarah.ts`, `content/sejarah-peta.ts` | `maplibre-gl`, `motion` |

Semuanya juga butuh `styles/tokens.css`, font Poppins, dan folder aset terkait di `public/`. Lalu pasang seperti ini:

```tsx
import { Sejarah } from './components/sejarah/Sejarah';
import { sejarah, sejarahTeks } from './content/sejarah';

<Sejarah bab={sejarah} teks={sejarahTeks} apiKey={MAPTILER_KEY} assetBaseUrl="/sejarah/" />;
```

Kode ini memakai Vite (`import.meta.env`, impor `?worker&url`). Di bundler lain, bagian itu perlu disesuaikan. Jangan taruh komponen ber-sticky (`ScrollyMap`, `FloodTransition`, `Sejarah`) di dalam parent ber-`overflow: hidden` atau `clip`.

### 3. Framer Code Component

Hosting `dist/`, lalu tempel file dari `framer/` ke Framer dan ganti `HOST`. Langkahnya ada di [README: Framer](README.md#integrasi-sebagai-framer-code-component). Cara ini **belum pernah diuji di Framer sungguhan**. Kalau gagal, pakai iframe.

### Mengambil data atau aset saja

| Butuh | Ambil dari |
| --- | --- |
| Batas wilayah, DAS, sungai, topografi, titik banjir (GeoJSON) | `public/data/` |
| KMZ asli | `raw/kmz/`, `raw/sejarah/kmz/` |
| Koordinat tapak dara dan sudut peta lama | `src/content/sejarah-peta.ts` |
| Peta 1915 dan 1930 | `public/sejarah/peta-*.jpg`, aslinya di `raw/sejarah/` |
| Citra satelit | `public/citra/`, aslinya di `raw/citra/` |
| Foto | `public/banjir/`, `public/sejarah/`, aslinya di `raw/` |
| Data linimasa | `src/content/timeline.ts`, aslinya di `raw/timeline/*.xlsx` |
| Angka korban dan kerusakan per wilayah | `dataWilayah` di `src/content/story.ts` |
| Angka hidrologi | `tahapan` di `src/content/banjir.ts` |

## Tugas yang sering muncul

### Mengubah teks

Edit file di `src/content/`. Komponen tidak perlu disentuh.

| Visual | File |
| --- | --- |
| Slideshow | `slides.ts` |
| Transisi banjir | `banjir.ts`. Jangan ubah angka tanpa sumber |
| Peta | `story.ts` |
| Linimasa | `timeline.ts` untuk peristiwa dan judul kartu, `timeline-teks.ts` untuk teks antarmuka |
| Disabilitas | `disabilitas.ts` |
| Daftar langkah penutup | `kesiapan.ts` |
| Sejarah | `sejarah.ts` |

### Mengganti aset

Ganti file di `raw/`, jalankan skrip, lalu commit hasilnya di `public/`.

| Skrip | Input | Catatan |
| --- | --- | --- |
| `pnpm data` | `raw/kmz/` | Juga mencetak rekap titik banjir untuk dicocokkan dengan teks |
| `pnpm images` | `raw/citra/` | Jangan potong watermark Google Earth dan Maxar. Tambahkan entri di `slides.ts` |
| `pnpm banjir` | `raw/banjir/` | Foto ditampilkan apa adanya, tanpa crop |
| `pnpm timeline` | `raw/timeline/Timeline terbaru.xlsx` | Tidak menimpa `timeline.ts`. Pakai `--timpa` untuk membuat ulang dari Excel; judul dan gambar yang sudah diisi tetap dipertahankan |
| `pnpm disabilitas` | `raw/disabilitas/` | Saat ini tidak ada bab yang memakai foto |
| `pnpm sejarah` | `raw/sejarah/` | Video pembuka hanya dibuat ulang kalau `sejarah.gif` ada (lihat di bawah) |

`raw/sejarah/sejarah.gif` (54 MB) **tidak ada di Git**. Hasilnya, `public/sejarah/hero.*`, sudah di-commit. Tanpa GIF, `pnpm sejarah` tetap memproses KMZ, peta lama, dan foto, lalu melewati video. Untuk membuat ulang video, minta GIF dari pemilik proyek atau folder redaksi "visual sejarah", dan pastikan `ffmpeg` terpasang.

### Mengatur kamera peta

- **`ScrollyMap`:** buka `/?debug`, geser peta, lalu salin angkanya ke `story.ts`.
- **`Sejarah`:** ubah konstanta `KAMERA_*` di `sejarah.ts`. Saat dev, objek peta tersedia di `window.__sjMap`, misalnya `__sjMap.getCenter()` dan `__sjMap.getZoom()`. Di build produksi, tambahkan `?debug` ke URL.

### Menambah visual baru

Contoh terlengkap: `Sejarah`.

1. `src/content/<nama>.ts` dan `src/components/<nama>/`.
2. `src/entries/embed-<nama>.tsx` dan `embed/<nama>.html`.
3. Daftarkan halaman embed di `build.rollupOptions.input`, `vite.config.ts`. **Kalau terlewat, halamannya tidak ikut build**, walau tetap jalan di `pnpm dev`.
4. Ekspor dari `src/framer-entry.ts`, lalu buat `framer/<Nama>.framer.tsx`.
5. Tambahkan ke `src/entries/harness.tsx`.
6. Kalau ada aset di `public/`, tambahkan aturannya di `public/_headers`.
7. Tambahkan `tests/e2e/<nama>.spec.ts`.

## Keputusan yang perlu dipahami sebelum diubah

**Umum**

- **Isi terpisah dari komponen.** Redaksi hanya perlu menyentuh `src/content/`.
- **CSS tidak memakai reset global.** Semua kelas berawalan `das-`, supaya tidak bocor ke halaman IDN Times atau Framer.
- **Peta dimuat belakangan.** MapLibre besar, jadi baru diunduh saat pembaca hampir sampai.
- **`prefers-reduced-motion` dihormati di semua visual.** Fitur baru juga harus begitu.

**`ScrollyMap`**

- **Tampilan diturunkan dari state** (`storyState.ts`), bukan diubah bertahap, supaya scroll mundur selalu benar. Lihat [README: Perilaku peta](README.md#perilaku-peta-keputusan-desain).

**`Sejarah`**

- **Peta tetap ada di belakang foto,** pada masa terakhir yang tampil. Foto lama sengaja bertahan penuh selama foto baru muncul (aturan `data-jenis='foto'` di `sejarah.css`). Kalau keduanya memudar bersamaan, peta tembus dan terlihat seperti berkedip.
- **Pergantian media mengikuti "garis baca":** 62% tinggi layar di desktop, dan di tengah ruang teks di layar sempit.
- **Judul pembuka memakai variabel CSS `--das-sj-judul`,** bukan `useTransform` dari motion, karena opasitasnya sempat memudar lagi setelah rentang selesai.
- **Peta lama ditempatkan sesuai koordinat KMZ.** Sudutnya dihitung `scripts/sejarah-aset.mjs`, termasuk rotasinya. Jangan isi tangan.
- **`/sejarah/*` punya header CORS,** karena MapLibre mengunduh peta lama lewat `fetch`, dan di Framer asalnya berbeda domain.

**`Disabilitas`**

- **Status centang tidak disimpan atau dikirim ke mana pun.** Hilang saat halaman dimuat ulang. Berlaku juga untuk `Kesiapan`, yang memakai komponen `Ceklis` yang sama.

## Test

```bash
pnpm test      # 9 unit test
pnpm e2e       # 22 skenario × 3 viewport = 66 test
```

- E2E menjalankan `pnpm build`, lalu menguji hasil build di port 4173. **Kalau ada server lain yang sudah memakai port itu, Playwright memakainya** dan tidak mem-build ulang. Hentikan dulu supaya tidak menguji build lama.
- E2E butuh Google Chrome dan internet untuk tile MapTiler serta font. Test peta butuh key di `.env`.
- Setiap E2E menimpa `tests/screenshots/`, jadi `git status` akan menampilkan banyak JPG berubah walau tidak ada yang rusak. Commit hanya yang relevan.

## Deploy

Konfigurasi Cloudflare Pages sudah ada (`wrangler.toml`, `public/_headers`), tapi belum pernah di-deploy.

```bash
pnpm build
npx wrangler pages deploy dist --project-name das-badung-interaktif
```

Sebelum dipublikasikan:

1. Gunakan **key MapTiler dan paket berbayar milik IDN Times.** Paket Free bersifat non-komersial, dan key di `.env` hanya untuk pengembangan.
2. Batasi key lewat "Allowed HTTP origins" di dashboard MapTiler. Key ini memang terlihat di browser.
3. Isi `VITE_MAPTILER_KEY` di environment variable build Cloudflare.
4. Batasi `frame-ancestors` di `public/_headers` ke domain IDN Times. Saat ini masih `*`.
5. Pertahankan logo MapTiler dan atribusi OpenStreetMap di peta.

## Yang perlu diserahkan di luar repo

| Item | Keterangan |
| --- | --- |
| Akses GitHub | Repo privat `Claritys11/das-badung-interaktif`. Tambahkan developer baru atau transfer repo |
| Key MapTiler | Tidak ada di Git. Developer baru membuat sendiri untuk pengembangan |
| Akun Cloudflare | Belum ada proyek yang dibuat |
| `sejarah.gif` | Hanya untuk membuat ulang video pembuka |
| Folder aset redaksi | Sumber asli PDF, Excel, foto, dan KMZ di luar repo |
| Akses proyek Framer | Dibutuhkan kalau memilih cara Framer |

## Pekerjaan yang tersisa

1. Selesaikan [TODO redaksi](README.md#todo-redaksi). Yang paling penting: kredit "Dok. _Google Earth_" di caption peta sejarah, padahal citra yang tampil berasal dari MapTiler.
2. Cek nama 5 kelompok di `src/content/kesiapan.ts`. Nama ini ditulis developer; isi 26 butirnya dari redaksi.
3. Tentukan cara pemasangan di artikel: iframe, komponen React, atau Framer.
4. Deploy sesuai daftar di atas, lalu uji di halaman IDN Times sungguhan, termasuk rasa scroll di dalam iframe dan di HP.
