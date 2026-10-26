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
  /** Daftar istilah (glosarium) di kartu — dipakai di tahap penutup. */
  istilah?: { istilah: string; arti: string }[];
}

export const banjirTeks = {
  label: 'Banjir Tukad Badung, 10 September 2025',
  sebelum: {
    file: 'sebelum',
    penanda: 'Sebelum',
    alt: 'Kondisi Tukad Badung di Jalan Sulawesi sebelum banjir 10 September 2025, dari Google Earth (2019).',
    keterangan:
      'Kondisi Tukad Badung di Jalan Sulawesi sebelum banjir 10 September 2025. Foto diambil melalui citra satelit Google Earth pada 2019.',
    kredit: '(Dok.Google Earth)',
  },
  sesudah: {
    file: 'sesudah',
    penanda: 'Sesudah',
    alt: 'Bagian belakang Toko Tasnim Textile di Jalan Sulawesi roboh setelah bah di Tukad Badung pada 10 September 2025.',
    keterangan: 'Bagian belakang Toko Tasnim Textile di Jalan Sulawesi roboh setelah bah di Tukad Badung pada 10 September 2025.',
    kredit: '(IDN Times/Irma Yudistirani)',
  },
  petunjukScroll: 'Gulir untuk mengikuti bagaimana banjir terjadi',
  sumberData:
    'Keterangan: hasil estimasi model hidrologi dihitung oleh Guru Besar Tetap Bidang Ilmu Teknik Sipil Bidang Hidro, Universitas Warmadewa, Prof Dr Ir I Gusti Agung Putu Eryani MT IPU ASEAN Eng. Angka bisa berbeda dari pengukuran langsung di lapangan. Visualisasi dan animasi diolah dengan bantuan kecerdasan buatan.',
  judulIstilah: 'Istilah',
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
      teks: 'Alih fungsi lahan, dari sawah dan area hijau menjadi permukiman, menaikkan koefisien limpasan sekitar 13,1 persen. Lebih banyak air hujan langsung mengalir di permukaan.',
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
      teks: 'Bagian belakang Toko Tasnim Textile di Jalan Sulawesi, Kecamatan Denpasar Barat, roboh sekitar pukul 05.30 Wita bersamaan dengan hanyutnya dua penghuni di sana. Kedua jenazah ditemukan keesokan hari di bendungan Jalan Tanah Kilap.',
      hujan: 0.15,
      air: 0,
      istilah: [
        { istilah: 'Debit', arti: 'jumlah air yang mengalir melewati satu titik sungai setiap detik' },
        { istilah: 'DAS (Daerah Aliran Sungai)', arti: 'seluruh wilayah yang airnya mengalir ke satu sungai' },
        {
          istilah: 'Koefisien limpasan',
          arti: 'bagian air hujan yang mengalir di permukaan. Makin besar angkanya, makin sedikit air yang meresap',
        },
        { istilah: 'Waktu konsentrasi', arti: 'lama air dari titik terjauh di DAS sampai ke sungai utama' },
      ],
    },
  ] satisfies TahapBanjir[],
};
