// Konten transisi "sebelum → sesudah banjir" (tepat sebelum peta interaktif).
// Foto: raw/banjir/*.jpeg → `pnpm banjir` → public/banjir/{sebelum,sesudah}-*.{avif,webp}.
//
// Transisi berjalan mengikuti scroll dalam beberapa TAHAP (satu layar scroll per tahap):
// hujan ekstrem → pemicu atmosfer → limpasan → debit naik → MELUAP (getar + air bah layar penuh)
// → foto sesudah. Angka & teks tahap berasal dari data redaksi (analisis Prof. Eryani, Universitas
// Warmadewa) — kalimat boleh disunting, ANGKA jangan diubah tanpa sumber.

/** Satu bagian angka besar di kartu: string statis, atau angka yang dihitung naik (count-up). */
export type SegmenAngka = string | { n: number; desimal: number; dari?: number };

export type VizTahap =
  /** Batang rentang nilai dibanding garis ambang (mis. curah hujan vs ambang ekstrem). */
  | { jenis: 'ambang'; rentang: [number, number]; ambang: number; maks: number; labelAmbang: string; labelRentang: string }
  /** Dua batang: sebelum → sesudah (mis. koefisien limpasan). */
  | { jenis: 'banding'; dari: number; ke: number; maks: number; labelDari: string; labelKe: string; desimal: number };

export interface TahapBanjir {
  id: string;
  /** Label kecil di atas angka. */
  label: string;
  angka?: SegmenAngka[];
  satuan?: string;
  teks: string;
  viz?: VizTahap;
  /** Intensitas hujan 0–1 di tahap ini. */
  hujan: number;
  /** Tinggi muka air (0–1 tinggi layar) di tahap ini, sebelum klimaks. */
  air: number;
  /** Tahap klimaks: getar + air bah layar penuh, lalu foto berganti ke "sesudah". */
  meluap?: boolean;
}

export const banjirTeks = {
  label: 'Banjir Tukad Badung, 10 September 2025',
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
  petunjukScroll: 'Gulir untuk mengikuti bagaimana banjir terjadi',
  sumberData:
    'Data: analisis Prof. Dr. Ir. I Gusti Agung Putu Eryani, MT (Guru Besar Teknik Sipil, Universitas Warmadewa) dengan data curah hujan dari PU. Visualisasi dan animasi diolah dengan bantuan kecerdasan buatan.',
  tahapan: [
    {
      id: 'hujan',
      label: 'Curah hujan harian (BMKG)',
      angka: [{ n: 245.5, desimal: 1 }, '–', { n: 385.5, desimal: 1 }],
      satuan: 'mm/hari',
      teks: 'Jauh di atas ambang hujan ekstrem 150 mm/hari, dengan intensitas lokal mencapai sekitar 70 mm/jam.',
      viz: {
        jenis: 'ambang',
        rentang: [245.5, 385.5],
        ambang: 150,
        maks: 400,
        labelAmbang: 'Ambang ekstrem 150',
        labelRentang: 'Hujan 10 Sept',
      },
      hujan: 0.55,
      air: 0,
    },
    {
      id: 'atmosfer',
      label: 'Selasa malam hingga Rabu pagi',
      angka: ['9–10 Sept 2025'],
      teks: 'Hujan deras turun terus-menerus, digerakkan gelombang atmosfer Equatorial Rossby dan Kelvin yang didukung kelembapan udara tinggi.',
      hujan: 1,
      air: 0.06,
    },
    {
      id: 'limpasan',
      label: 'Koefisien limpasan (C)',
      angka: [{ n: 0.412, desimal: 3 }, ' → ', { n: 0.466, desimal: 3, dari: 0.412 }],
      teks: 'Alih fungsi lahan, dari sawah dan area hijau menjadi permukiman, menaikkan koefisien limpasan sekitar 13,1%: lebih banyak air hujan langsung mengalir di permukaan.',
      viz: { jenis: 'banding', dari: 0.412, ke: 0.466, maks: 0.5, labelDari: 'Sebelum alih fungsi', labelKe: 'Sesudah', desimal: 3 },
      hujan: 0.8,
      air: 0.16,
    },
    {
      id: 'debit',
      label: 'Volume aliran Tukad Badung',
      angka: [{ n: 85.85, desimal: 2 }],
      satuan: 'm³/detik',
      teks: 'Waktu konsentrasi yang singkat, sekitar 2–3 jam, mempercepat bertemunya debit dari anak-anak sungai ke alur utama Tukad Badung.',
      hujan: 0.7,
      air: 0.3,
    },
    {
      id: 'meluap',
      label: 'Debit puncak DAS Badung (estimasi)',
      angka: ['±', { n: 2296, desimal: 0 }],
      satuan: 'm³/s',
      teks: 'Volume limpasan total mencapai ±24,3 juta m³. Tukad Badung meluap ke kawasan Denpasar Barat dan sekitarnya.',
      hujan: 1,
      air: 0,
      meluap: true,
    },
    {
      id: 'sesudah',
      label: 'Rabu, 10 September 2025',
      teks: '[Kalimat penutup kondisi setelah banjir — diisi redaksi]',
      hujan: 0.15,
      air: 0,
    },
  ] satisfies TahapBanjir[],
};
