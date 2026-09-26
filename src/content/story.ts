import type { Step } from './types';

// Step scrollytelling. Kamera: center [lng, lat], zoom, pitch (kemiringan°), bearing (rotasi°).
// Cara mencari kamera baru: buka harness dengan ?debug, geser peta, salin angka yang tampil di pojok.
export const story: Step[] = [
  {
    id: 'bali',
    judul: '[Judul step 1: pengantar Bali — diisi redaksi]',
    teks: [
      '[Paragraf pembuka yang memperkenalkan Pulau Bali dan konteks banjir — diisi redaksi]',
      '[Paragraf kedua (opsional) — diisi redaksi]',
    ],
    camera: { center: [115.1, -8.42], zoom: 8.6, pitch: 0, bearing: 0 },
    cameraMobile: { zoom: 7.7 },
    layers: [],
  },
  {
    id: 'das',
    judul: '[Judul step 2: Daerah Aliran Sungai Badung — diisi redaksi]',
    teks: ['[Penjelasan apa itu DAS Badung, luas & wilayah yang dilaluinya — diisi redaksi]'],
    camera: { center: [115.25, -8.48], zoom: 10.1, pitch: 0, bearing: 0 },
    cameraMobile: { zoom: 9.1 },
    layers: ['das'],
  },
  {
    id: 'sungai',
    judul: '[Judul step 3: garis sungai — diisi redaksi]',
    teks: ['[Penjelasan alur sungai di kawasan DAS Badung — diisi redaksi]'],
    camera: { center: [115.2, -8.64], zoom: 11.6, pitch: 35, bearing: -10 },
    cameraMobile: { zoom: 10.6 },
    layers: ['das', 'sungai'],
  },
  {
    id: 'topografi',
    judul: '[Judul step 4: topografi — diisi redaksi]',
    teks: ['[Penjelasan kontur ketinggian dan kaitannya dengan aliran air — diisi redaksi]'],
    camera: { center: [115.22, -8.5], zoom: 9.7, pitch: 30, bearing: 0 },
    cameraMobile: { zoom: 8.8 },
    layers: ['topografi', 'sungai'],
    legenda: 'topografi',
  },
  {
    id: 'banjir',
    judul: '[Judul step 5: titik banjir — diisi redaksi]',
    teks: ['[Penjelasan sebaran titik banjir — diisi redaksi]', 'Klik salah satu titik merah untuk melihat keterangannya.'],
    camera: { center: [115.215, -8.665], zoom: 12.2, pitch: 0, bearing: 0 },
    cameraMobile: { zoom: 11.3 },
    layers: ['das', 'sungai', 'banjir'],
    titikInteraktif: true,
    legenda: 'banjir',
  },
  {
    id: 'penutup',
    judul: '[Judul step 6: penutup — diisi redaksi]',
    teks: ['[Paragraf penutup — diisi redaksi]'],
    camera: { center: [115.24, -8.56], zoom: 10.4, pitch: 45, bearing: -15 },
    cameraMobile: { zoom: 9.5 },
    layers: ['das', 'sungai', 'banjir'],
    titikInteraktif: true,
  },
];

export const petaTeks = {
  resetPeta: 'Kembali ke tampilan cerita',
  tutupDetail: 'Tutup',
  sebelumnya: 'Sebelumnya',
  berikutnya: 'Berikutnya',
  lanjutMembaca: 'Lanjut membaca artikel',
  badgeKmz: 'Keterangan dari data lapangan',
  badgePlaceholder: 'Placeholder',
  legendaTopografi: 'Ketinggian (meter di atas permukaan laut)',
  legendaBanjir: 'Titik banjir',
  legendaFasilitasAir: 'Fasilitas air terdampak',
  tanpaKey: 'Peta belum bisa dimuat: API key MapTiler belum diatur (VITE_MAPTILER_KEY).',
  tanpaWebgl: 'Peta tidak dapat ditampilkan karena browser ini tidak mendukung WebGL2.',
  sumberData: '[Sumber data DAS, sungai, topografi & titik banjir — diisi redaksi]',
};
