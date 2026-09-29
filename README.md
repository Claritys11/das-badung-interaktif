# DAS Badung — komponen interaktif (IDN Times)

Dua komponen untuk artikel IDN Times tentang Daerah Aliran Sungai (DAS) Badung, Bali:

| | Komponen | Isi |
|---|---|---|
| **A** | `Slideshow` | 16 citra satelit 2005 → 2023 dengan crossfade, autoplay, dan penggaris waktu yang jaraknya sesuai tanggal |
| **B0** | `FloodTransition` | Pembuka peta: foto **sebelum** banjir → digulir → layar bergetar, air lumpur naik dengan cipratan tanah, lalu surut → foto **sesudah** banjir |
| **C** | `Timeline` | Timeline banjir Denpasar 10–19 September 2025 (9 tanggal, 45 peristiwa dari Excel redaksi). Kartu per tanggal berisi cuplikan; klik kartu → pop-up berisi semua peristiwa hari itu |
| **B** | `ScrollyMap` | Peta scrollytelling (MapLibre + MapTiler) dengan layer DAS, garis sungai, topografi, dan 80 titik banjir yang bisa diklik |

Keduanya tersedia dalam dua bentuk:

1. **Halaman standalone untuk `<iframe>`**: `embed/slideshow.html` dan `embed/peta.html`. Konfigurasi Cloudflare Pages sudah ada, tapi **belum di-deploy**.
2. **Komponen React + TypeScript** yang bisa dipakai ulang, termasuk wrapper untuk **Framer Code Component**.

> Semua teks penjelasan masih **placeholder** bertanda `[… — diisi redaksi]`. Daftarnya ada di [TODO redaksi](#todo-redaksi).

---

## Menjalankan

Butuh Node ≥ 20 dan pnpm.

```bash
pnpm install
cp .env.example .env          # isi VITE_MAPTILER_KEY
pnpm dev                      # http://localhost:5173
```

| URL (dev) | Isi |
|---|---|
| `/` | Dev harness: artikel tiruan dengan teks dummy panjang di atas dan bawah komponen, untuk menguji sticky dan scroll halaman penuh |
| `/?tema=hijau` | Harness dengan latar hijau Insidenesia (`#DAEBC6`) |
| `/?debug` | Menampilkan angka kamera peta (untuk menyusun step baru) |
| `/embed/slideshow.html` | Halaman iframe slideshow (`?autoplay=0`, `?interval=4000`) |
| `/embed/timeline.html` | Halaman iframe timeline |
| `/embed/peta.html` | Halaman iframe peta, dibuka dengan transisi banjir (`?intro=0` untuk peta saja, `?terrain=1` untuk terrain 3D, `?debug`) |

### Perintah

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Server pengembangan |
| `pnpm build` | Typecheck, build halaman ke `dist/`, lalu build bundle Framer ke `dist/framer/` |
| `pnpm preview` | Menyajikan `dist/` secara lokal |
| `pnpm data` | Regenerasi GeoJSON dari KMZ |
| `pnpm images` | Regenerasi citra AVIF/WebP |
| `pnpm timeline` | Buat `src/content/timeline.ts` dari Excel (sekali; tidak menimpa hasil edit) |
| `pnpm banjir` | Regenerasi foto sebelum/sesudah banjir (termasuk penyelarasan foto sesudah) |
| `pnpm test` | Unit test (Vitest) untuk logika state peta |
| `pnpm e2e` | E2E Playwright di 3 viewport, dengan screenshot ke `tests/screenshots/` |

E2E memakai Chrome yang terpasang di sistem (`channel: 'chrome'`), jadi tidak perlu mengunduh browser Playwright.

---

## Struktur

```
raw/                         aset asli dari redaksi (jangan diedit)
  citra/*.jpg                16 citra satelit (screenshot Google Earth)
  kmz/*.kmz                  DAS, garis sungai, topografi, titik banjir
scripts/
  kmz-to-geojson.mjs         KMZ → public/data/*.geojson (build time)
  optimize-images.mjs        JPG → public/citra/*.{avif,webp} (640/1024/1485 px)
public/
  data/*.geojson             hasil pnpm data (di-commit)
  citra/*                    hasil pnpm images (di-commit)
  _headers                   header Cloudflare Pages (CORS, cache, frame-ancestors)
src/
  content/                   ← SEMUA TEKS REDAKSI ADA DI SINI
    slides.ts                daftar citra, label, dan alt
    story.ts                 step peta (judul, teks, kamera, layer) + label UI
    titik-banjir.ts          penjelasan per titik banjir (80 entri)
    types.ts
  components/
    slideshow/               Slideshow.tsx, useAutoplay.ts, slideshow.css
    scrolly-map/             ScrollyMap.tsx (layout & scroll), MapView.tsx (MapLibre),
                             storyState.ts (reducer), layers.ts (gaya layer),
                             PointDetail.tsx, Legend.tsx, StoryNav.tsx
  styles/tokens.css          token visual (CSS variable, bisa ditimpa host)
  entries/                   harness + 2 halaman embed
  framer-entry.ts            entry bundle Framer
framer/                      file Code Component untuk ditempel di Framer
tests/unit, tests/e2e        Vitest & Playwright; tests/screenshots/ = hasil tiap step
```

---

## Data: regenerasi GeoJSON dari KMZ

```bash
pnpm data
```

KMZ di-unzip dan diubah dengan `@tmcw/togeojson` **di Node saat build**. Browser tidak pernah mem-parsing KMZ.

| File | Isi | Properti |
|---|---|---|
| `das.geojson` | 3 polygon (semua bernama "Pharenial" di KMZ) | `id` (`das-1..3`), `nama`, `warna` (warna asli KMZ) |
| `sungai.geojson` | 19 garis | `id` (`sungai-01..19`), `lebar` (dari style KMZ) |
| `topografi.geojson` | 5 kelas ketinggian (vektor, disederhanakan) | `kelas`, `minM`, `maxM` |
| `titik-banjir.geojson` | 80 titik | `id` (`banjir-<slug-nama>`), `nama`, `ikon` (`umum` / `fasilitas-air`), `deskripsiKmz` |

- **ID titik stabil**, dibentuk dari nama. Kalau nama di KMZ berubah, ID ikut berubah, dan entri di `src/content/titik-banjir.ts` perlu disesuaikan (script akan menampilkan daftar titik yang belum punya entri).
- `src/content/titik-banjir.ts` **hanya dibuat sekali**. Menjalankan ulang `pnpm data` tidak menimpa hasil edit redaksi.

## Menambah citra tahun baru

1. Taruh file JPG di `raw/citra/`, misalnya `2024.jpg` atau `Juni 2024.jpg`. Nama bulan dalam Bahasa Indonesia dikenali otomatis dan menghasilkan `2024-06`. Framing citra harus sama dengan yang lain.
2. Jalankan `pnpm images`. Log-nya menampilkan nama hasil konversi.
3. Tambahkan satu entri di `src/content/slides.ts`, sesuai urutan waktu:
   ```ts
   { file: '2024', label: '2024', tanggal: '2024-06', alt: '[Deskripsi citra 2024 — diisi redaksi]' },
   ```
   `tanggal` menentukan posisi tick di penggaris waktu. Isi `YYYY-06` kalau bulannya tidak diketahui.
4. Kalau citra pertama (`slides[0]`) berganti, sesuaikan juga `<link rel="preload">` di `embed/slideshow.html`.

> Citra adalah screenshot **Google Earth**. Watermark "Google Earth" dan "Image © Maxar Technologies" **tidak boleh dipotong**. Di ukuran mobile watermark jadi tidak terbaca, sehingga caption kredit teks (`slideshowTeks.kredit`) **wajib** tetap tampil.

## Transisi sebelum → sesudah banjir

Posisinya tepat sebelum peta. Foto **sebelum** diam di layar; saat pembaca menggulir melewati titik tengah section, efek berikut berjalan sekali (±1,9 detik):

1. Layar **bergetar** ±0,8 detik.
2. **Air lumpur** naik dari bawah (dua lapis gelombang bertekstur sedimen dengan buih), disertai **cipratan tanah** yang terlempar lalu jatuh, dan **tetes lumpur di lensa**.
3. Di puncak air, foto berganti ke **sesudah**; saat air surut, kerusakan terlihat.

Scroll balik → kembali ke foto sebelum **tanpa** getar/efek. `prefers-reduced-motion` → hanya pergantian foto instan. Efek hanya memakai `transform`/`opacity` (ringan di HP) dan tidak ada kedip terang. Getar fisik HP (`haptic`, Vibration API, Android) tersedia sebagai opsi, **default mati**.

- **Konten:** `src/content/banjir.ts` (alt, keterangan, kredit, teks petunjuk).
- **Foto:** `raw/banjir/sebelum_banjir.jpeg` (Google Street View, **tidak di-crop** — watermark Google tetap utuh) dan `raw/banjir/sesudah_banjir.jpeg`. Jalankan `pnpm banjir`.
- **Penyelarasan:** foto sesudah diskalakan (0,833), diputar (1,81°), dan digeser agar mural, jendela, dan parabola jatuh di posisi yang sama dengan foto sebelum (selisih 3–10 px). Parameter ada di `scripts/banjir-images.mjs` (`ALIGN`), hasil fit dari 7 titik patokan. Foto sesudah tidak menutupi strip kiri bingkai (±130–160 px); area itu diisi versi **buram & gelap dari foto sesudah sendiri** (bukan isi foto sebelum, supaya tidak menyesatkan). **Kalau salah satu foto diganti, titik patokan harus diukur ulang.**
- **Di iframe peta**, transisi ini ikut di dalam scroll internal yang sama; tombol Berikutnya/Sebelumnya berhenti di: foto sebelum → foto sesudah → step 1 … step 6.
- **Di halaman penuh / Framer**, pasang `<FloodTransition teks={banjirTeks} />` tepat sebelum `<ScrollyMap … />` (lihat harness).

## Timeline banjir (September 2025)

Posisinya setelah peta. Sumber datanya `raw/timeline/Timeline Banjir Denpasar September 2025.xlsx`: baris 1 berisi tanggal (serial Excel), baris berikutnya berisi peristiwa pada tanggal itu.

- `pnpm timeline` mengubah Excel menjadi `src/content/timeline.ts` **sekali saja**. Setelah itu file tersebut milik redaksi: judul kartu, gambar, dan urutan boleh diedit. Kalau Excel diperbarui, script hanya melaporkan tanggal yang belum ada, tidak menimpa file.
- Teks peristiwa adalah **teks asli** Excel. Label jam (`waktu`) diekstrak otomatis dari frasa "pukul HH.MM" tanpa mengubah teks.
- **Kartu** (cuplikan, alias "foreshadow" isi pop-up): tanggal, jumlah peristiwa, dan *tally* (satu garis = satu peristiwa, sehingga kepadatan kejadian per hari terlihat sekilas), judul, lalu 1 peristiwa pertama. Kartu yang paling dekat ke 1/3 tinggi layar menjadi **aktif**: garis kiri merah, dan cuplikan terbuka menjadi 3 peristiwa (pola komponen *release-time-line*).
- **Pop-up** memakai `<dialog>` bawaan browser: berisi semua peristiwa hari itu beserta jamnya, tombol hari sebelumnya/berikutnya, Esc/klik latar untuk menutup, dan fokus kembali ke kartu. Scroll halaman terkunci selama pop-up terbuka. Di HP, pop-up tampil sebagai *bottom sheet*.
- **Gambar** per tanggal opsional (`gambar: { src, alt, kredit }`). Gunakan foto asli, **bukan foto stok**.
- Dibangun dengan CSS dan token project (tanpa Tailwind/shadcn), supaya tidak ada CSS reset yang bocor ke halaman IDN Times atau Framer.

## Mengganti placeholder

Semua teks ada di `src/content/`, dan komponen tidak menyimpan teks redaksi sama sekali.

- **Slideshow:** `slides.ts` → `alt` per citra, `slideshowTeks.judul/keterangan`.
- **Peta:** `story.ts` → `judul` dan `teks` (array paragraf) per step, `petaTeks.sumberData`.
- **Titik banjir:** `titik-banjir.ts`, satu entri per titik:
  ```ts
  'banjir-pasar-badung': {
    judul: "Pasar Badung",
    deskripsi: "[Penjelasan titik Pasar Badung — diisi redaksi]",
    sumber: 'placeholder',   // ubah ke 'kmz' / hapus badge bila teks sudah final
    tampil: true,            // false = sembunyikan titik tanpa menghapus data
  },
  ```
  `sumber: 'kmz'` = teks asli dari KMZ (9 titik), ditandai badge "Keterangan dari data lapangan". `sumber: 'placeholder'` ditampilkan miring dengan label "Placeholder".
- **Kamera step:** buka `/?debug`, geser peta ke tampilan yang diinginkan, lalu salin angka `center`, `zoom`, `pitch`, `bearing` ke `story.ts`. `cameraMobile` bisa menimpa kamera khusus untuk layar < 768 px.
- **Warna tema:** timpa CSS variable, misalnya `--das-bg: #DAEBC6`, di elemen pembungkus (lihat `src/styles/tokens.css`).

---

## Perilaku peta (keputusan desain)

- **State:** `{ activeStep, selectedPointId, resetToken }` (`storyState.ts`). Kamera dan layer **diturunkan** dari state (`resolveView`), bukan diubah bertahap, sehingga scroll mundur selalu memulihkan tampilan step dengan benar.
- **Klik titik banjir** (aktif di step 5–6): peta zoom ke titik (zoom 15,5) dan penjelasan khusus titik tampil di panel kiri (desktop) atau bottom sheet (mobile). Ada juga **daftar 80 titik** di step 5 untuk pengguna keyboard dan pembaca layar.
- **Titik bertumpuk:** kalau satu ketukan mengenai beberapa titik saat peta masih jauh (zoom < 14), peta **zoom ke kumpulan itu dulu**. Ketukan berikutnya baru memilih titik. Di zoom mobile, sekitar Pasar Badung ada 7 titik dalam radius 20 px, sehingga menebak satu titik akan sering salah.
- **Tombol "Kembali ke tampilan cerita"** muncul saat detail terbuka atau peta digeser user. Tombol ini menutup detail dan mengembalikan kamera ke step aktif.
- **Scroll saat detail terbuka:** selama step belum berganti, detail tetap terbuka. Begitu step berganti, detail ditutup otomatis dan kamera pindah ke step baru. *Alasannya: cerita selalu menang, jadi teks di kolom kiri dan isi peta tidak pernah saling bertentangan.* Pembaca yang ingin kembali ke titik itu bisa scroll balik ke step titik banjir.
- **Batas area:** `maxBounds` Pulau Bali. Di mode halaman, zoom peta dengan scroll memerlukan Ctrl/⌘ (`cooperativeGestures`), supaya scroll artikel tidak tersangkut di peta.
- **Reduced motion:** `flyTo` diganti `jumpTo`, transisi layer 0 ms, dan autoplay slideshow mati (masih bisa dinyalakan manual).
- **Terrain 3D:** prop `terrain3d` (default mati), memakai `terrain-rgb-v2` MapTiler. Termasuk kuota paket gratis, tidak butuh akun berbayar.

### Mode scroll

| `scrollMode` | Dipakai di | Cara kerja |
|---|---|---|
| `"page"` (default) | Source code / Framer | Step dipicu oleh scroll **halaman**. Peta sticky di kolom kanan (mobile: di atas). |
| `"internal"` | Halaman iframe | Komponen setinggi layar dengan scroll sendiri, ditambah tombol Sebelumnya/Berikutnya dan titik progres. Di ujung, scroll diteruskan ke halaman induk (opsi C, hibrida). |

Iframe tidak bisa membaca scroll halaman induk, karena itu versi iframe memakai mode `internal`.

---

## Embed via iframe

Setelah `dist/` di-hosting (misalnya di `https://das-badung.pages.dev`), gunakan snippet berikut.

**Slideshow**: halaman embed menyesuaikan diri dengan tinggi iframe apa pun. Citra di-*contain* di ruang yang tersisa, dan kontrol serta caption selalu terlihat. Kalau tingginya kurang pas, yang muncul hanya ruang kosong tipis, tidak pernah ada konten yang terpotong. Tinggi yang disarankan (lebar kolom → tinggi): **1120 px → 780 px**, **768 px → 580 px**, **390 px → 360 px**, atau pakai rumus `lebar × 0,6 + 120 px`.

```html
<iframe
  src="https://das-badung.pages.dev/embed/slideshow.html"
  title="Citra satelit perubahan wilayah DAS Badung 2005–2023"
  loading="lazy"
  style="display:block;width:100%;max-width:1120px;margin:0 auto;border:0;height:calc(min(100vw, 1120px) * 0.6 + 120px);"
  allow="fullscreen"
></iframe>
```

**Timeline**: setinggi layar, dengan scroll di dalam iframe (pop-up tampil di dalam area iframe):

```html
<iframe
  src="https://das-badung.pages.dev/embed/timeline.html"
  title="Timeline banjir Denpasar, 10–19 September 2025"
  loading="lazy"
  style="display:block;width:100%;height:100vh;height:100svh;min-height:600px;border:0;"
></iframe>
```

**Peta scrollytelling**: setinggi layar, dengan scroll internal:

```html
<iframe
  src="https://das-badung.pages.dev/embed/peta.html"
  title="Peta interaktif DAS Badung: garis sungai, topografi, dan titik banjir"
  loading="lazy"
  style="display:block;width:100%;height:100vh;height:100svh;min-height:600px;border:0;"
  allow="fullscreen"
></iframe>
```

Di Framer: tambahkan komponen **Embed**, pilih **URL**, isi URL di atas, dan set lebar *Fill*. Untuk tinggi: peta `100vh`; slideshow memakai tinggi per breakpoint (Desktop 780, Tablet 580, Phone 360).

Header `frame-ancestors *` di `public/_headers` mengizinkan embed dari domain mana pun. Batasi ke domain IDN Times bila perlu.

## Integrasi sebagai komponen React

```tsx
import { Slideshow } from './components/slideshow/Slideshow';
import { ScrollyMap } from './components/scrolly-map/ScrollyMap';
import { slides, slideshowTeks } from './content/slides';
import { story, petaTeks } from './content/story';
import { titikBanjir } from './content/titik-banjir';

<Slideshow slides={slides} kredit={slideshowTeks.kredit} keterangan={slideshowTeks.keterangan} />

<ScrollyMap steps={story} titik={titikBanjir} teks={petaTeks} apiKey={MAPTILER_KEY} scrollMode="page" />
```

Prop penting: `assetBaseUrl` (folder citra) dan `dataBaseUrl` (folder GeoJSON), keduanya default ke `/<base>/citra/` dan `/<base>/data/`, serta `autoplay`, `intervalMs`, `terrain3d`, dan `debug`. Agar peta bisa sticky, **tidak boleh ada parent dengan `overflow: hidden/clip`**.

MapLibre (±280 KB gzip) di-*lazy-load* dan baru dimuat saat peta berjarak ≤ 1 layar dari viewport.

## Integrasi sebagai Framer Code Component

`pnpm build` menghasilkan bundle ESM `dist/framer/das-badung.js` + `das-badung.css`. React tidak ikut di-bundle (memakai React milik Framer), dan **key MapTiler juga tidak ikut di-bundle** (wajib diisi lewat property).

1. Hosting `dist/` (Cloudflare Pages). `_headers` sudah mengizinkan CORS untuk `/framer/*`, `/assets/*`, dan `/data/*`.
2. Di Framer: **Assets → Code → New File**, lalu tempel isi `framer/Slideshow.framer.tsx` atau `framer/ScrollyMap.framer.tsx`.
3. Ganti `HOST` dengan domain hosting (ada di 2 tempat per file).
4. Taruh komponen di halaman, isi property **MapTiler key**, dan matikan **Clip content** pada frame pembungkus supaya peta bisa sticky.
5. Di canvas editor, peta hanya menampilkan placeholder (WebGL berat). Periksa hasilnya lewat **Preview/Publish**.

Catatan teknis yang sudah ditangani: worker MapLibre dimuat lintas-origin lewat `blob:` URL, dan `process.env.NODE_ENV` di-*define* saat build. Keduanya sudah diuji dengan halaman simulasi di origin lain (React lewat import map).

> ⚠️ **Belum diuji di Framer yang sebenarnya** (kami tidak punya akses ke proyek Framer client). Kalau import URL gagal di Framer, gunakan **Embed iframe** di atas. Cara itu pasti berfungsi.

---

## MapTiler: API key

- Key disimpan di `.env` (`VITE_MAPTILER_KEY`). File itu di-*gitignore* dan **tidak pernah di-commit**. Salin `.env.example` untuk memulai.
- Key MapTiler memang dikirim ke browser (tertanam di bundle halaman embed). Karena itu **key wajib dibatasi "Allowed HTTP origins"** di dashboard MapTiler (Account → Keys), misalnya `https://das-badung.pages.dev`, domain situs IDN Times, dan `http://localhost:5173` untuk pengembangan.
- **Paket Free MapTiler bersifat non-komersial dan logo MapTiler wajib tampil.** Untuk production di media komersial, **gunakan key dan paket dari akun MapTiler milik client sendiri**. Key yang dipakai selama pengembangan hanya untuk demo.
- Di Cloudflare Pages, isi `VITE_MAPTILER_KEY` sebagai *Environment variable* build.
- Atribusi yang ditampilkan: © MapTiler, © OpenStreetMap contributors, dan logo MapTiler. Jangan dihapus.

## Deploy (Cloudflare Pages)

Belum dilakukan dan menunggu persetujuan. Konfigurasinya sudah ada di `wrangler.toml` dan `public/_headers`.

```bash
pnpm build
npx wrangler pages deploy dist --project-name das-badung-interaktif
```

## Testing & performa

- `pnpm test`: 8 unit test reducer (scroll maju/mundur, pilih titik, reset, ganti step saat detail terbuka).
- `pnpm e2e`: 14 skenario × 3 viewport (1440 × 900, 834 × 1112, 390 × 844) = 42 test (termasuk transisi banjir: getar, fase maju-mundur, navigasi tombol, reduced motion). Isinya: 0 error console, tiap step, klik titik (termasuk titik bertumpuk), reset, scroll mundur, lompat step lewat titik progres, mode halaman penuh, crossfade saat navigasi cepat, tombol Play, dan `prefers-reduced-motion`. Screenshot tiap step ada di `tests/screenshots/<viewport>/`.
- **Ukuran (gzip):**
  - JS awal halaman artikel ±99 KB (React + motion + konten)
  - MapLibre ±280 KB + worker, di-lazy-load
  - Slideshow iframe ±89 KB JS
  - Citra: 9,1 MB JPG → 2,1 MB AVIF (1485 px) atau 0,5 MB (640 px) untuk seluruh 16 citra, dan browser hanya memuat 1 ukuran
- **LCP slideshow:** 1,95 s di emulasi mobile Slow 4G dengan CPU 4×. CLS 0.
- **Lighthouse:** Accessibility 96–98, Best Practices 100.

---

## TODO redaksi

- [ ] Judul dan paragraf 6 step peta (`src/content/story.ts`)
- [ ] Penjelasan **71 titik banjir** yang masih placeholder (`src/content/titik-banjir.ts`). 9 titik sudah berisi teks asli dari KMZ; periksa apakah sudah final.
- [ ] Pastikan arti **3 polygon DAS** (di KMZ ketiganya bernama "Pharenial", dengan warna hijau, kuning, dan oranye): apakah sub-DAS? Perlu legenda?
- [ ] Pastikan arti ketebalan garis sungai di KMZ (orde sungai?)
- [ ] 6 titik banjir berada di luar DAS (Tabanan dan Klungkung). Saat ini semuanya ditampilkan; set `tampil: false` bila perlu disembunyikan.
- [ ] Judul, keterangan, dan **alt text** 16 citra (`src/content/slides.ts`)
- [ ] Pastikan tanggal citra "2014" (saat ini diasumsikan Januari 2014, sebelum Maret 2014)
- [ ] Sumber data peta (`petaTeks.sumberData`)
- [ ] Kamera tiap step setelah teks final (pakai `?debug`)
- [ ] Timeline (`src/content/timeline.ts`): judul & pengantar timeline, **judul kartu 9 tanggal**, sumber, dan (opsional) foto asli per tanggal
- [ ] Timeline, cek salah ketik di teks sumber (sengaja belum diubah): "hing**gat** lebat" (16 Sept) dan "Ekuatorial **Rosby**" (10 Sept, Rossby?). Tanggal 14 September tidak ada di Excel; apakah disengaja?
- [ ] Transisi banjir (`src/content/banjir.ts`): alt & keterangan kedua foto, **kredit foto sesudah**, serta lokasi/waktu pengambilan foto
