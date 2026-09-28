// Konten transisi "sebelum → sesudah banjir" (tepat sebelum peta interaktif).
// Foto: raw/banjir/*.jpeg → `pnpm banjir` → public/banjir/{sebelum,sesudah}-*.{avif,webp}.
// Foto sesudah sudah diselaraskan (skala/rotasi/geser) agar framing-nya sama dengan foto sebelum.
export const banjirTeks = {
  label: 'Foto sebelum dan sesudah banjir',
  sebelum: {
    file: 'sebelum',
    penanda: 'Sebelum',
    alt: '[Deskripsi foto sebelum banjir — diisi redaksi]',
    keterangan: '[Keterangan foto sebelum banjir: lokasi & waktu — diisi redaksi]',
    kredit: 'Foto: Google Street View',
  },
  sesudah: {
    file: 'sesudah',
    penanda: 'Sesudah',
    alt: '[Deskripsi foto sesudah banjir — diisi redaksi]',
    keterangan: '[Keterangan foto sesudah banjir: lokasi & waktu — diisi redaksi]',
    kredit: '[Kredit foto sesudah banjir — diisi redaksi]',
  },
  petunjukScroll: 'Gulir untuk melihat kondisi setelah banjir',
};
