# DAS Badung — komponen interaktif (IDN Times)

Komponen untuk artikel IDN Times tentang Daerah Aliran Sungai (DAS) Badung, Bali:

|        | Komponen          | Isi                                                                                                                                                                                                                             |
| ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**  | `Slideshow`       | 16 citra satelit 2005 → 2023 dengan crossfade, autoplay, dan penggaris waktu yang jaraknya sesuai tanggal                                                                                                                       |
| **B0** | `FloodTransition` | Pembuka peta: 6 tahap data hidrologi (hujan ekstrem → limpasan → debit → **meluap**) mengikuti scroll; saat meluap layar bergetar dan air bah menutup seluruh layar → foto **sesudah** banjir                                   |
| **C**  | `Timeline`        | Timeline banjir Denpasar 8 September 2025 – 3 September 2026 (18 tanggal, 57 peristiwa dari Excel redaksi; 2 peristiwa dihapus redaksi). Kartu per tanggal berisi cuplikan; klik kartu → pop-up berisi semua peristiwa hari itu |
| **B**  | `ScrollyMap`      | Peta scrollytelling (MapLibre + MapTiler), 7 step: choropleth korban jiwa & kerusakan per kabupaten/kota, 110 titik banjir (klik → nama tempat), 8 DAS, topografi, garis sungai yang menjalar dari hulu ke hilir                |
| **D**  | `Disabilitas`     | 5 bab (tanpa foto, keputusan redaksi) tentang penyandang disabilitas saat banjir: pilihan langkah evakuasi, daftar centang kesiapsiagaan, dan tab kanal peringatan dini per kelompok                                                                  |

Keduanya tersedia dalam dua bentuk:

1. **Halaman standalone untuk `<iframe>`**: `embed/slideshow.html`, `embed/peta.html`, `embed/timeline.html`, dan `embed/disabilitas.html`. Konfigurasi Cloudflare Pages sudah ada, tapi **belum di-deploy**.
2. **Komponen React + TypeScript** yang bisa dipakai ulang, termasuk wrapper untuk **Framer Code Component**.

> Teks yang masih **placeholder** bertanda `[… — diisi redaksi]`. Daftarnya ada di [TODO redaksi](#todo-redaksi).

---

## Menjalankan

Butuh Node ≥ 20 dan pnpm.

```bash
pnpm install
cp .env.example .env          # isi VITE_MAPTILER_KEY
pnpm dev                      # http://localhost:5173
```

| URL (dev)               | Isi                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/`                     | Dev harness: artikel tiruan dengan teks dummy panjang di atas dan bawah komponen, untuk menguji sticky dan scroll halaman penuh |
| `/?tema=hijau`          | Harness dengan latar hijau Insidenesia (`#DAEBC6`)                                                                              |
| `/?debug`               | Menampilkan angka kamera peta (untuk menyusun step baru)                                                                        |
| `/embed/slideshow.html` | Halaman iframe slideshow (`?autoplay=0`, `?interval=4000`)                                                                      |
| `/embed/timeline.html`  | Halaman iframe timeline                                                                                                         |
| `/embed/peta.html`      | Halaman iframe peta, dibuka dengan transisi banjir (`?intro=0` untuk peta saja, `?terrain=1` untuk terrain 3D, `?debug`)        |

### Perintah

| Perintah        | Fungsi                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`      | Server pengembangan                                                                                                                                                                              |
| `pnpm build`    | Typecheck, build halaman ke `dist/`, lalu build bundle Framer ke `dist/framer/`                                                                                                                  |
| `pnpm preview`  | Menyajikan `dist/` secara lokal                                                                                                                                                                  |
| `pnpm data`     | Regenerasi GeoJSON dari KMZ                                                                                                                                                                      |
| `pnpm images`   | Regenerasi citra AVIF/WebP                                                                                                                                                                       |
| `pnpm timeline` | Buat `src/content/timeline.ts` dari Excel (sekali; tidak menimpa hasil edit). `pnpm timeline --timpa` = buat ulang dari Excel terbaru, judul/gambar yang sudah diisi redaksi tetap dipertahankan |
| `pnpm banjir`   | Regenerasi foto sebelum/sesudah banjir (foto asli, tanpa crop)                                                                                                                                   |
| `pnpm test`     | Unit test (Vitest) untuk logika state peta                                                                                                                                                       |
| `pnpm e2e`      | E2E Playwright di 3 viewport, dengan screenshot ke `tests/screenshots/`                                                                                                                          |

E2E memakai Chrome yang terpasang di sistem (`channel: 'chrome'`), jadi tidak perlu mengunduh browser Playwright.

---

## Struktur

```
raw/                         aset asli dari redaksi (jangan diedit)
  citra/*.jpg                16 citra satelit (screenshot Google Earth)
  kmz/*.kmz                  batas kabupaten/kota, DAS, garis sungai, topografi, titik banjir
  disabilitas/*.png          5 gambar visual disabilitas (berlogo INSIDE NESIA)
scripts/
  kmz-to-geojson.mjs         KMZ → public/data/*.geojson (build time)
  optimize-images.mjs        JPG → public/citra/*.{avif,webp} (640/1024/1485 px)
  disabilitas-images.mjs     PNG → public/disabilitas/*.{avif,webp} (640/1050 px)
public/
  data/*.geojson             hasil pnpm data (di-commit)
  citra/*                    hasil pnpm images (di-commit)
  _headers                   header Cloudflare Pages (CORS, cache, frame-ancestors)
src/
  content/                   ← SEMUA TEKS REDAKSI ADA DI SINI
    slides.ts                daftar citra, label, dan alt
    story.ts                 step peta (judul, teks, data kabupaten, tabel DAS, kamera, layer) + label UI
    disabilitas.ts           5 bab visual disabilitas (teks, gambar opsional, blok interaktif)
    types.ts
  components/
    slideshow/               Slideshow.tsx, useAutoplay.ts, slideshow.css
    scrolly-map/             ScrollyMap.tsx (layout & scroll), MapView.tsx (MapLibre),
                             storyState.ts (reducer), layers.ts (gaya layer),
                             StepCard.tsx (isi kartu step), Legend.tsx, StoryNav.tsx
    disabilitas/             Disabilitas.tsx, disabilitas.css
  styles/tokens.css          token visual (CSS variable, bisa ditimpa host)
  entries/                   harness + 4 halaman embed
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

| File                      | Isi                                                   | Properti                                                                                        |
| ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `kabupaten.geojson`       | 7 kabupaten/kota (Buleleng & Bangli tidak ada di KMZ) | `id`, `nama` ("Kota Denpasar"), `singkat` ("Denpasar")                                          |
| `kabupaten-label.geojson` | titik label per kabupaten/kota                        | sama; posisi Badung & Gianyar diatur manual di script                                           |
| `das.geojson`             | 8 DAS (BWS Bali-Penida 2017)                          | `id`, `nama` ("Badung"), `luasKm2`, `titik` (jumlah titik banjir di dalamnya, dihitung script)  |
| `das-label.geojson`       | titik label per DAS                                   | sama                                                                                            |
| `sungai.geojson`          | 76 garis dipotong per ±150 m                          | `lebar` (dari style KMZ), `ord` (0 = paling utara … 1 = paling selatan, untuk animasi menjalar) |
| `topografi.geojson`       | 5 kelas ketinggian (vektor, disederhanakan)           | `kelas`, `minM`, `maxM`                                                                         |
| `titik-banjir.geojson`    | 110 titik                                             | `id` (`banjir-<slug-nama>`), `nama`, `ikon` (`umum` / `fasilitas-air`)                          |

`pnpm data` juga mencetak **rekap titik banjir** per kabupaten/kota, per DAS, dan per kelas ketinggian di Denpasar, untuk dicocokkan dengan angka di teks redaksi.

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

## Transisi data banjir: sebelum → sesudah

Posisinya tepat sebelum peta. Transisi ini **mengikuti scroll** dalam 6 tahap (satu layar scroll per tahap). Tiap tahap punya kartu data, intensitas hujan, dan tinggi muka air sendiri. Semua efek **menutup seluruh layar**, atau seluruh area iframe di versi iframe.

| Tahap      | Data di kartu                                                                                                   | Visual                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `hujan`    | Curah hujan 245,5–385,5 mm/hari (BMKG), ambang ekstrem 150 mm/hari, ±70 mm/jam, dengan grafik rentang vs ambang | hujan sedang, langit menggelap                                                                  |
| `atmosfer` | 9–10 Sept 2025: hujan terus-menerus, gelombang Equatorial Rossby & Kelvin                                       | hujan paling deras                                                                              |
| `limpasan` | Koefisien limpasan 0,412 → 0,466 (+13,1%) karena alih fungsi lahan, dengan grafik dua batang                    | muka air mulai naik                                                                             |
| `debit`    | Volume aliran Tukad Badung 85,85 m³/detik, waktu konsentrasi 2–3 jam                                            | muka air tinggi                                                                                 |
| `meluap`   | Debit puncak DAS Badung ±2.296 m³/s, volume limpasan ±24,3 juta m³                                              | **getar + air bah, cipratan tanah, dan tetes lumpur layar penuh**; foto berganti ke **sesudah** |
| `sesudah`  | [kalimat penutup — diisi redaksi]                                                                               | gerimis, foto sesudah                                                                           |

- Angka dihitung naik (count-up) dengan format Indonesia. Pembaca layar membacakan nilai akhirnya sekali saja.
- Klimaks (getar + air bah) dipicu **sekali, saat bergerak maju** melewati tahap `meluap`. Scroll balik tidak memicu efek. `prefers-reduced-motion`: tanpa getar/air bah/animasi hujan, dan foto berganti instan.
- Keterangan sumber data tampil di setiap kartu: analisis Prof Dr Ir I Gusti Agung Putu Eryani MT (Guru Besar Teknik Sipil Universitas Warmadewa), data curah hujan PU, beserta keterangan bahwa visualisasi dan animasi diolah dengan bantuan kecerdasan buatan.
- **Konten:** `src/content/banjir.ts` (`tahapan`: label, angka, satuan, teks, grafik, intensitas hujan, tinggi air). Kalimat boleh disunting; **angka jangan diubah tanpa sumber**.
- **Foto:** `raw/banjir/sebelum_banjir.jpeg` (Google Earth 2019, 5:3, watermark utuh) dan `raw/banjir/sesudah_banjir.jpeg` (IDN Times/Irma Yudistirani, 4:3). Jalankan `pnpm banjir`. Keduanya ditampilkan **asli** (tanpa crop/penyelarasan), utuh di tengah panggung dengan rasio masing-masing; saat berganti, foto sebelum memudar sepenuhnya agar tepinya tidak terlihat di samping foto sesudah yang lebih sempit.
- **Di iframe peta**, tombol Berikutnya/Sebelumnya berhenti di setiap tahap, lalu lanjut ke step peta.
- **Di halaman penuh / Framer**, pasang `<FloodTransition teks={banjirTeks} />` tepat sebelum `<ScrollyMap … />`.

## Timeline banjir (September 2025 – September 2026)

Posisinya setelah peta. Sumber datanya `raw/timeline/Timeline terbaru.xlsx` (versi pertama disimpan sebagai arsip di folder yang sama): baris 1 berisi tanggal (serial Excel), baris berikutnya berisi peristiwa pada tanggal itu.

- Teks antarmuka (judul linimasa, pengantar, label tombol) ada di `src/content/timeline-teks.ts`, file yang **tidak pernah disentuh script**. Judul kartu per tanggal ada di `src/content/timeline.ts`; di dalam kotak kartu hanya judul yang tampil, sedangkan tanggal ada di kolom kiri.
- `pnpm timeline` mengubah Excel menjadi `src/content/timeline.ts` **sekali saja**. Setelah itu file tersebut milik redaksi: judul kartu, gambar, dan urutan boleh diedit. Kalau Excel diperbarui, jalankan `pnpm timeline --timpa`: peristiwa diambil ulang dari Excel, sedangkan **judul kartu & gambar yang sudah diisi redaksi** (bukan placeholder) untuk tanggal yang sama tetap dipertahankan.
- **Penanda jeda**: tanggal yang berjarak lebih dari 7 hari diberi penanda, mis. "35 hari kemudian" atau "6 bulan 18 hari kemudian" (dihitung per kalender, tidak dibulatkan). Kartu dengan satu peristiwa memakai label "Baca selengkapnya".
- Teks peristiwa adalah **teks asli** Excel. Label jam (`waktu`) diekstrak otomatis dari frasa "pukul HH.MM" tanpa mengubah teks.
- **Kartu** (cuplikan, alias "foreshadow" isi pop-up): tanggal, jumlah peristiwa, dan _tally_ (satu garis = satu peristiwa, sehingga kepadatan kejadian per hari terlihat sekilas), judul, lalu 1 peristiwa pertama. Kartu yang paling dekat ke 1/3 tinggi layar menjadi **aktif**: garis kiri merah, dan cuplikan terbuka menjadi 3 peristiwa (pola komponen _release-time-line_).
- **Pop-up** memakai `<dialog>` bawaan browser: berisi semua peristiwa hari itu beserta jamnya, tombol hari sebelumnya/berikutnya, Esc/klik latar untuk menutup, dan fokus kembali ke kartu. Scroll halaman terkunci selama pop-up terbuka. Di HP, pop-up tampil sebagai _bottom sheet_.
- **Gambar** per tanggal opsional (`gambar: { src, alt, kredit }`). Gunakan foto asli, **bukan foto stok**.
- Dibangun dengan CSS dan token project (tanpa Tailwind/shadcn), supaya tidak ada CSS reset yang bocor ke halaman IDN Times atau Framer.

## Mengganti placeholder

Semua teks ada di `src/content/`, dan komponen tidak menyimpan teks redaksi sama sekali.

- **Slideshow:** `slides.ts` → `alt` per citra, `slideshowTeks.judul/keterangan`.
- **Peta:** `story.ts` → `judul` dan `teks` (array paragraf; `_teks_` = cetak miring, mis. nama media/istilah asing — berlaku juga di `disabilitas.ts` dan `timeline-teks.ts`) per step, `dataWilayah` (angka per kabupaten/kota: tampil sebagai batang di kartu sekaligus warna di peta), `tabel` (DAS), `keterangan` (sumber data di step terakhir).
- **Visual disabilitas:** `disabilitas.ts` → bab, gambar + alt, paragraf, dan blok interaktif (`pilihan`, `ceklis`, `tab`).
- **Kamera step:** buka `/?debug`, geser peta ke tampilan yang diinginkan, lalu salin angka `center`, `zoom`, `pitch`, `bearing` ke `story.ts`. `cameraMobile` bisa menimpa kamera khusus untuk layar < 768 px.
- **Warna tema:** latar default krem hangat `#FAF7EE` (terinspirasi Kontinentalist), kartu/pop-up `#FFFDF8`; aksen tetap merah IDN Times. Transisi banjir sengaja tetap gelap (sinematik). Timpa CSS variable, misalnya `--das-bg: #DAEBC6`, di elemen pembungkus (lihat `src/styles/tokens.css`).

---

## Perilaku peta (keputusan desain)

- **State:** `{ activeStep, selectedPointId, flyToPoint, resetToken }` (`storyState.ts`). Kamera dan layer **diturunkan** dari state (`resolveView`), bukan diubah bertahap, sehingga scroll mundur selalu memulihkan tampilan step dengan benar.
- **Klik titik banjir** (step Titik Banjir, DAS, Topografi, penutup): **nama tempat** langsung tampil di atas titik, kamera tidak berpindah. Ada juga **daftar 110 titik** di step Titik Banjir untuk pengguna keyboard dan pembaca layar; memilih dari daftar menerbangkan peta ke titik itu (zoom 15,5).
- **Choropleth** (step 1–2): satu hue merah, terang → gelap, skala akar (nilai kecil tetap terlihat). Batang di kartu memakai warna yang sama, jadi berfungsi sebagai legenda. Label peta dasar disembunyikan selama label data tampil supaya tidak bertumpuk.
- **Sungai menjalar** (step Sungai): potongan sungai tampil berurutan dari utara ke selatan (±4 detik) setiap kali step dimasuki; reduced motion → langsung utuh.
- **Titik bertumpuk:** kalau satu ketukan mengenai beberapa titik saat peta masih jauh (zoom < 14), peta **zoom ke kumpulan itu dulu**. Ketukan berikutnya baru memilih titik. Di zoom mobile, sekitar Pasar Badung ada 7 titik dalam radius 20 px, sehingga menebak satu titik akan sering salah.
- **Tombol "Kembali ke tampilan cerita"** muncul saat titik dipilih atau peta digeser user. Tombol ini melepas pilihan dan mengembalikan kamera ke step aktif.
- **Scroll saat titik terpilih:** selama step belum berganti, nama titik tetap tampil. Begitu step berganti, pilihan dilepas dan kamera pindah ke step baru. _Alasannya: cerita selalu menang, jadi teks di kolom kiri dan isi peta tidak pernah saling bertentangan._
- **Batas area:** `maxBounds` Pulau Bali. Di mode halaman, zoom peta dengan scroll memerlukan Ctrl/⌘ (`cooperativeGestures`), supaya scroll artikel tidak tersangkut di peta.
- **Reduced motion:** `flyTo` diganti `jumpTo`, transisi layer 0 ms, dan autoplay slideshow mati (masih bisa dinyalakan manual).
- **Terrain 3D:** prop `terrain3d` (default mati), memakai `terrain-rgb-v2` MapTiler. Termasuk kuota paket gratis, tidak butuh akun berbayar.

### Mode scroll

| `scrollMode`       | Dipakai di           | Cara kerja                                                                                                                                                              |
| ------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"page"` (default) | Source code / Framer | Step dipicu oleh scroll **halaman**. Peta sticky di kolom kanan (mobile: di atas).                                                                                      |
| `"internal"`       | Halaman iframe       | Komponen setinggi layar dengan scroll sendiri, ditambah tombol Sebelumnya/Berikutnya dan titik progres. Di ujung, scroll diteruskan ke halaman induk (opsi C, hibrida). |

Iframe tidak bisa membaca scroll halaman induk, karena itu versi iframe memakai mode `internal`.

---

## Embed via iframe

Setelah `dist/` di-hosting (misalnya di `https://das-badung.pages.dev`), gunakan snippet berikut.

**Slideshow**: halaman embed menyesuaikan diri dengan tinggi iframe apa pun. Citra di-_contain_ di ruang yang tersisa, dan kontrol serta caption selalu terlihat. Kalau tingginya kurang pas, yang muncul hanya ruang kosong tipis, tidak pernah ada konten yang terpotong. Tinggi yang disarankan (lebar kolom → tinggi): **1120 px → 780 px**, **768 px → 580 px**, **390 px → 360 px**, atau pakai rumus `lebar × 0,6 + 120 px`.

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
  title="Timeline banjir Denpasar, September 2025 – September 2026"
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

Di Framer: tambahkan komponen **Embed**, pilih **URL**, isi URL di atas, dan set lebar _Fill_. Untuk tinggi: peta `100vh`; slideshow memakai tinggi per breakpoint (Desktop 780, Tablet 580, Phone 360).

Header `frame-ancestors *` di `public/_headers` mengizinkan embed dari domain mana pun. Batasi ke domain IDN Times bila perlu.

## Integrasi sebagai komponen React

```tsx
import { Slideshow } from './components/slideshow/Slideshow';
import { ScrollyMap } from './components/scrolly-map/ScrollyMap';
import { slides, slideshowTeks } from './content/slides';
import { story, petaTeks } from './content/story';
import { Disabilitas } from './components/disabilitas/Disabilitas';
import { disabilitas, disabilitasTeks } from './content/disabilitas';

<Slideshow slides={slides} kredit={slideshowTeks.kredit} keterangan={slideshowTeks.keterangan} />

<ScrollyMap steps={story} teks={petaTeks} apiKey={MAPTILER_KEY} scrollMode="page" />

<Disabilitas bab={disabilitas} teks={disabilitasTeks} />
```

Prop penting: `assetBaseUrl` (folder citra / gambar disabilitas) dan `dataBaseUrl` (folder GeoJSON), default ke `/<base>/citra/`, `/<base>/disabilitas/`, dan `/<base>/data/`, serta `autoplay`, `intervalMs`, `terrain3d`, dan `debug`. Agar peta bisa sticky, **tidak boleh ada parent dengan `overflow: hidden/clip`**.

MapLibre (±280 KB gzip) di-_lazy-load_ dan baru dimuat saat peta berjarak ≤ 1 layar dari viewport.

## Integrasi sebagai Framer Code Component

`pnpm build` menghasilkan bundle ESM `dist/framer/das-badung.js` + `das-badung.css`. React tidak ikut di-bundle (memakai React milik Framer), dan **key MapTiler juga tidak ikut di-bundle** (wajib diisi lewat property).

1. Hosting `dist/` (Cloudflare Pages). `_headers` sudah mengizinkan CORS untuk `/framer/*`, `/assets/*`, dan `/data/*`.
2. Di Framer: **Assets → Code → New File**, lalu tempel isi `framer/Slideshow.framer.tsx` atau `framer/ScrollyMap.framer.tsx`.
3. Ganti `HOST` dengan domain hosting (ada di 2 tempat per file).
4. Taruh komponen di halaman, isi property **MapTiler key**, dan matikan **Clip content** pada frame pembungkus supaya peta bisa sticky.
5. Di canvas editor, peta hanya menampilkan placeholder (WebGL berat). Periksa hasilnya lewat **Preview/Publish**.

Catatan teknis yang sudah ditangani: worker MapLibre dimuat lintas-origin lewat `blob:` URL, dan `process.env.NODE_ENV` di-_define_ saat build. Keduanya sudah diuji dengan halaman simulasi di origin lain (React lewat import map).

> ⚠️ **Belum diuji di Framer yang sebenarnya** (kami tidak punya akses ke proyek Framer client). Kalau import URL gagal di Framer, gunakan **Embed iframe** di atas. Cara itu pasti berfungsi.

---

## MapTiler: API key

- Key disimpan di `.env` (`VITE_MAPTILER_KEY`). File itu di-_gitignore_ dan **tidak pernah di-commit**. Salin `.env.example` untuk memulai.
- Key MapTiler memang dikirim ke browser (tertanam di bundle halaman embed). Karena itu **key wajib dibatasi "Allowed HTTP origins"** di dashboard MapTiler (Account → Keys), misalnya `https://das-badung.pages.dev`, domain situs IDN Times, dan `http://localhost:5173` untuk pengembangan.
- **Paket Free MapTiler bersifat non-komersial dan logo MapTiler wajib tampil.** Untuk production di media komersial, **gunakan key dan paket dari akun MapTiler milik client sendiri**. Key yang dipakai selama pengembangan hanya untuk demo.
- Di Cloudflare Pages, isi `VITE_MAPTILER_KEY` sebagai _Environment variable_ build.
- Atribusi yang ditampilkan: © MapTiler, © OpenStreetMap contributors, dan logo MapTiler. Jangan dihapus.

## Deploy (Cloudflare Pages)

Belum dilakukan dan menunggu persetujuan. Konfigurasinya sudah ada di `wrangler.toml` dan `public/_headers`.

```bash
pnpm build
npx wrangler pages deploy dist --project-name das-badung-interaktif
```

## Testing & performa

- `pnpm test`: 9 unit test reducer (scroll maju/mundur, pilih titik dari peta vs dari daftar, reset, ganti step saat titik terpilih).
- `pnpm e2e`: 16 skenario × 3 viewport (1440 × 900, 834 × 1112, 390 × 844) = 48 test (termasuk visual disabilitas: pilihan, centang, tab dengan keyboard) (termasuk transisi banjir: getar, fase maju-mundur, navigasi tombol, reduced motion). Isinya: 0 error console, tiap step, klik titik (termasuk titik bertumpuk), reset, scroll mundur, lompat step lewat titik progres, mode halaman penuh, crossfade saat navigasi cepat, tombol Play, dan `prefers-reduced-motion`. Screenshot tiap step ada di `tests/screenshots/<viewport>/`.
- **Ukuran (gzip):**
  - JS awal halaman artikel ±99 KB (React + motion + konten)
  - MapLibre ±280 KB + worker, di-lazy-load
  - Slideshow iframe ±89 KB JS
  - Citra: 9,1 MB JPG → 2,1 MB AVIF (1485 px) atau 0,5 MB (640 px) untuk seluruh 16 citra, dan browser hanya memuat 1 ukuran
- **LCP slideshow:** 1,95 s di emulasi mobile Slow 4G dengan CPU 4×. CLS 0.
- **Lighthouse:** Accessibility 96–98, Best Practices 100.

---

## TODO redaksi

- [ ] Angka titik banjir di teks peta vs hitungan ulang dari KMZ (`pnpm data`): Denpasar **64** titik (teks: "sekitar 70"; 56 + 11 = 67), ketinggian Denpasar **53** di 0–50 mdpl dan **11** di 50–100 mdpl (teks, revisi redaksi: 56 dan 11), DAS Yeh Poh **2** (tabel: 3), di luar DAS **29** (teks: 28). DAS lain cocok. Selisih kemungkinan karena titik di dekat garis batas.
- [ ] Judul untuk step 2 (kerusakan) dan step 7 (penutup) peta: dokumen redaksi tidak memberi judul, jadi saat ini tanpa judul.
- [ ] Pastikan arti ketebalan garis sungai di KMZ (orde sungai?)
- [ ] Judul, keterangan, dan **alt text** 16 citra (`src/content/slides.ts`)
- [ ] Pastikan tanggal citra "2014" (saat ini diasumsikan Januari 2014, sebelum Maret 2014)
- [ ] Kamera tiap step setelah teks final (pakai `?debug`)
- [ ] Timeline: (opsional) foto asli per tanggal di `src/content/timeline.ts`. Judul linimasa, pengantar, dan judul 18 kartu sudah diisi.
- [ ] Timeline, cek salah ketik di teks sumber (sengaja belum diubah): "Ekuatorial **Rosby**" (10 Sept, Rossby?). Tanggal 14 September 2025 tidak ada di Excel; apakah disengaja?
- [x] Visual disabilitas: foto dihapus dari semua bab (keputusan redaksi). Gambar mentah & `pnpm disabilitas` tetap ada; isi lagi `gambar: { file, alt }` di `disabilitas.ts` bila foto dipakai kembali.
