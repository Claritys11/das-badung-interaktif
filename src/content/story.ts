import type { DataWilayah, Step } from './types';

// Step scrollytelling. Kamera: center [lng, lat], zoom, pitch (kemiringan°), bearing (rotasi°).
// Cara mencari kamera baru: buka harness dengan ?debug, geser peta, salin angka yang tampil di pojok.
// Teks dari redaksi (visual maps.docx). Angka titik banjir per wilayah/DAS/ketinggian berasal dari
// perhitungan redaksi; `pnpm data` mencetak hitungan ulang dari KMZ untuk pengecekan.

// `kode` = nama singkat di data batas wilayah (Batas Administrasi KabupatenKota (Area).kmz).
const korbanJiwa: DataWilayah = {
  judul: 'Korban Jiwa',
  satuan: 'orang',
  baris: [
    { kode: 'Denpasar', label: 'Kota Denpasar', nilai: 12 },
    { kode: 'Gianyar', label: 'Kabupaten Gianyar', nilai: 3 },
    { kode: 'Jembrana', label: 'Kabupaten Jembrana', nilai: 2 },
    { kode: 'Badung', label: 'Kabupaten Badung', nilai: 1 },
  ],
};

const kerusakanFasilitas: DataWilayah = {
  judul: 'Kerusakan Fasilitas Umum',
  satuan: 'fasilitas',
  baris: [
    { kode: 'Denpasar', label: 'Kota Denpasar', nilai: 474 },
    { kode: 'Jembrana', label: 'Kabupaten Jembrana', nilai: 145 },
    { kode: 'Badung', label: 'Kabupaten Badung', nilai: 57 },
    { kode: 'Tabanan', label: 'Kabupaten Tabanan', nilai: 29 },
  ],
};

const kameraBali = { center: [115.1, -8.42] as [number, number], zoom: 8.6, pitch: 0, bearing: 0 };

export const story: Step[] = [
  {
    id: 'korban',
    judul: '',
    teks: [
      'Bencana hidrometeorologi yang melanda Bali pada Rabu, 10 September 2025 menelan korban jiwa, merendam permukiman hingga fasilitas umum. Total 18 orang meninggal dunia, 4 orang hilang, 22 jiwa mengungsi, dan 6.309 kepala keluarga terdampak.',
    ],
    camera: kameraBali,
    cameraMobile: { zoom: 7.7 },
    layers: ['kabupaten'],
    dataWilayah: korbanJiwa,
  },
  {
    id: 'kerusakan',
    judul: '',
    teks: [
      'Sebanyak 520 bangunan mengalami kerusakan yang mencakup kios, toko, ruko, dan pasar. Delapan jembatan, satu tanggul, 82 titik penyengker, 24 tembok, 23 titik jalan, 11 fasilitas ibadah, 194 unit rumah, dan 15 bangunan irigasi juga rusak.',
      'Wilayah terdampak mencakup Badung, Tabanan, Karangasem, Jembrana, Gianyar, Klungkung, dan Kota Denpasar. Dari tujuh wilayah itu, Denpasar menjadi daerah yang paling terdampak banjir.',
    ],
    camera: kameraBali,
    cameraMobile: { zoom: 7.7 },
    layers: ['kabupaten'],
    dataWilayah: kerusakanFasilitas,
  },
  {
    id: 'titik',
    judul: 'Titik Banjir',
    teks: [
      'Pemetaan 110 titik banjir menunjukkan beban terberat ada di Kota Denpasar, Ibu Kotanya Provinsi Bali. Sekitar 70 titik berada di Denpasar. Itu lebih dari separuh titik yang terpetakan.',
      'Genangan terlihat di kawasan perdagangan, pelayanan kesehatan, pelayanan air bersih, pendidikan, hingga permukiman.',
      'Instalasi Pengolahan Air (IPA) Waribang berhenti berproduksi sejak pukul 03.10 Wita, dan Sistem Penyediaan Air Minum (SPAM) Penet berhenti pukul 08.00 Wita.',
      'Ketinggian air di Jalan Pulau Buru mencapai 1,5 meter. Air di Jalan Pulau Misol setinggi pinggang orang dewasa, dan genangan di Jalan Kertapura Teuku Umar Barat setinggi lutut orang dewasa pada pukul 05.00 Wita.',
      'Klik salah satu titik merah untuk melihat nama tempatnya.',
    ],
    camera: { center: [115.06, -8.55], zoom: 9.5, pitch: 0, bearing: 0 },
    cameraMobile: { zoom: 8.4 },
    layers: ['kabupaten', 'banjir'],
    sorotWilayah: 'Denpasar',
    titikInteraktif: true,
    daftarTitik: true,
    legenda: 'banjir',
  },
  {
    id: 'das',
    judul: 'Daerah Aliran Sungai (DAS)',
    teks: [
      'Sebagian besar titik banjir terkonsentrasi di delapan DAS. Hampir setengah dari titik tersebut berada di DAS Badung. Sedangkan sisanya, 28 titik, berada di luar kedelapan DAS tersebut.',
      'DAS Ayung memang terluas. Sekitar 303,26 kilometer persegi, membentang hingga pegunungan di utara. Sementara DAS Badung sekitar 54,95 kilometer persegi, tetapi menampung aliran air di kawasan kota yang paling padat.',
    ],
    tabel: {
      kolom: ['DAS', 'Luas', 'Titik banjir'],
      baris: [
        ['Badung', '54,95 km²', '40'],
        ['Mati', '33,94 km²', '14'],
        ['Buaji', '22,45 km²', '10'],
        ['Singapadu', '29,76 km²', '7'],
        ['Ayung', '303,26 km²', '6'],
        ['Yeh Poh', '22,41 km²', '3'],
        ['Loloan', '11,72 km²', '1'],
        ['Ngenjung', '3,28 km²', '1'],
      ],
      sorot: [0],
    },
    camera: { center: [115.235, -8.48], zoom: 10.1, pitch: 0, bearing: 0 },
    cameraMobile: { zoom: 9.2 },
    layers: ['das', 'banjir'],
    titikInteraktif: true,
    legenda: 'banjir',
  },
  {
    id: 'topografi',
    judul: 'Topografi',
    teks: [
      'Data topografi membantu menjelaskan mengapa Denpasar paling terdampak. Dari sekitar 70 titik di kota itu, 56 titik berada di zona ketinggian 0–50 mdpl (di atas permukaan laut). Sisanya, 11 titik, berada di zona 50–100 mdpl.',
      'Tidak ada satu pun titik banjir di Denpasar yang berada di atas 100 mdpl. Itu berarti kontur Denpasar lebih rendah dan landai.',
      'Elevasinya hampir setara wilayah hilir, membuat air sulit mengalir cepat ke laut ketika sungai penuh. Sehingga genangan banyak terkonsentrasi di dataran rendah.',
    ],
    camera: { center: [115.225, -8.64], zoom: 11.2, pitch: 30, bearing: 0 },
    cameraMobile: { zoom: 10.3 },
    layers: ['topografi', 'kabupaten', 'banjir'],
    sorotWilayah: 'Denpasar',
    titikInteraktif: true,
    legenda: 'topografi',
  },
  {
    id: 'sungai',
    judul: 'Sungai',
    teks: [
      'Kota Denpasar juga dilintasi banyak sungai. _IDN Times_ memetakan manual puluhan segmen sungai di sekitar titik banjir. Jaringan sungainya cukup rapat untuk mengalirkan air dari hulu ke kawasan padat bangunan di hilir.',
    ],
    camera: { center: [115.212, -8.66], zoom: 11.55, pitch: 45, bearing: -15 },
    cameraMobile: { zoom: 10.6, pitch: 35 },
    // Titik banjir ikut tampil supaya terlihat dekatnya dengan anak-anak sungai.
    layers: ['sungai', 'banjir'],
    sungaiMenjalar: true,
    titikInteraktif: true,
    legenda: 'banjir',
  },
  {
    id: 'penutup',
    judul: '',
    teks: [
      'Seluruh data di peta ini memperlihatkan bahwa banjir paling banyak terjadi di dataran rendah, terutama DAS Badung. Air dari hulu mengalir melalui banyak anak sungai, lalu tertahan di kawasan padat penduduk di hilir.',
    ],
    camera: { center: [115.212, -8.645], zoom: 11.4, pitch: 35, bearing: -10 },
    cameraMobile: { zoom: 10.4 },
    layers: ['sungai', 'banjir'],
    sorotDas: 'Badung',
    titikInteraktif: true,
    legenda: 'banjir',
    keterangan:
      'Keterangan: Data dikumpulkan dan diolah dari _IDN Times Bali_, _Antaranews Bali_, _KalderaNews_, citra satelit _Google Earth_, Balai Wilayah Sungai Bali-Penida, Data dan Informasi Tata Ruang Bali (Sitaru Bali)',
  },
];

export const petaTeks = {
  resetPeta: 'Kembali ke tampilan cerita',
  sebelumnya: 'Sebelumnya',
  berikutnya: 'Berikutnya',
  lanjutMembaca: 'Lanjut membaca artikel',
  legendaTopografi: 'Ketinggian (meter di atas permukaan laut)',
  legendaBanjir: 'Titik banjir',
  legendaFasilitasAir: 'Fasilitas air terdampak',
  tanpaKey: 'Peta belum bisa dimuat: API key MapTiler belum diisi.',
  gagalMuat:
    'Peta gagal dimuat. Periksa koneksi internet, lalu muat ulang halaman. (Untuk pengelola situs: pastikan domain ini ada di "Allowed HTTP origins" key MapTiler dan kuotanya belum habis.)',
  gagalData: 'Data peta gagal dimuat. Muat ulang halaman untuk mencoba lagi.',
  tanpaWebgl: 'Peta tidak dapat ditampilkan karena browser ini tidak mendukung WebGL2.',
  daftarTitik: 'Daftar {n} titik banjir',
};
