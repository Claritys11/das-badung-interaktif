import type { Slide } from './types';

// Urutan = urutan tampil (kronologis). Untuk menambah citra tahun baru:
// 1. taruh JPG di raw/citra/ (mis. "2024.jpg"), 2. jalankan `pnpm images`,
// 3. tambahkan satu entri di bawah. `file` = nama hasil konversi (lihat log `pnpm images`).
// Tanggal "YYYY-06" = bulan tidak diketahui (dipakai hanya untuk posisi di penggaris waktu).
export const slides: Slide[] = [
  { file: '2005', label: '2005', tanggal: '2005-06', alt: '[Deskripsi citra satelit 2005 — diisi redaksi]' },
  { file: '2006', label: '2006', tanggal: '2006-06', alt: '[Deskripsi citra satelit 2006 — diisi redaksi]' },
  { file: '2009', label: '2009', tanggal: '2009-06', alt: '[Deskripsi citra satelit 2009 — diisi redaksi]' },
  { file: '2012', label: '2012', tanggal: '2012-06', alt: '[Deskripsi citra satelit 2012 — diisi redaksi]' },
  { file: '2014', label: '2014', tanggal: '2014-01', alt: '[Deskripsi citra satelit 2014 — diisi redaksi]' },
  { file: '2014-03', label: 'Maret 2014', tanggal: '2014-03', alt: '[Deskripsi citra satelit Maret 2014 — diisi redaksi]' },
  { file: '2014-10', label: 'Oktober 2014', tanggal: '2014-10', alt: '[Deskripsi citra satelit Oktober 2014 — diisi redaksi]' },
  { file: '2015', label: '2015', tanggal: '2015-06', alt: '[Deskripsi citra satelit 2015 — diisi redaksi]' },
  { file: '2016', label: '2016', tanggal: '2016-06', alt: '[Deskripsi citra satelit 2016 — diisi redaksi]' },
  { file: '2017', label: '2017', tanggal: '2017-06', alt: '[Deskripsi citra satelit 2017 — diisi redaksi]' },
  { file: '2018', label: '2018', tanggal: '2018-06', alt: '[Deskripsi citra satelit 2018 — diisi redaksi]' },
  { file: '2019', label: '2019', tanggal: '2019-06', alt: '[Deskripsi citra satelit 2019 — diisi redaksi]' },
  { file: '2020', label: '2020', tanggal: '2020-06', alt: '[Deskripsi citra satelit 2020 — diisi redaksi]' },
  { file: '2021', label: '2021', tanggal: '2021-06', alt: '[Deskripsi citra satelit 2021 — diisi redaksi]' },
  { file: '2022', label: '2022', tanggal: '2022-06', alt: '[Deskripsi citra satelit 2022 — diisi redaksi]' },
  { file: '2023', label: '2023', tanggal: '2023-06', alt: '[Deskripsi citra satelit 2023 — diisi redaksi]' },
];

export const slideshowTeks = {
  judul: '[Judul slideshow perubahan wilayah — diisi redaksi]',
  kredit: 'Citra: Google Earth / Maxar Technologies',
  keterangan: '[Keterangan lokasi & sumber citra — diisi redaksi]',
};
