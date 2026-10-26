// Tipe konten. Semua teks redaksi tinggal di src/content/*, bukan di komponen.

export interface Slide {
  /** Nama dasar file hasil `pnpm images`, mis. "2014-03" → public/citra/2014-03-1024.avif */
  file: string;
  /** Label besar yang tampil di slide. */
  label: string;
  /** Tanggal perkiraan (YYYY-MM) untuk menaruh tahun secara proporsional di penggaris waktu. */
  tanggal: string;
  alt: string;
}

export type LayerId = 'kabupaten' | 'das' | 'sungai' | 'topografi' | 'banjir';

export interface Camera {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
}

/** Angka per kabupaten/kota: tampil sebagai daftar batang di kartu step DAN sebagai warna (choropleth) di peta. */
export interface DataWilayah {
  judul: string;
  /** Satuan di belakang angka, mis. "orang" / "fasilitas". */
  satuan: string;
  baris: {
    /** Nama singkat persis seperti di data batas wilayah: "Denpasar", "Badung", "Gianyar", ... */
    kode: string;
    /** Label tampil, mis. "Kota Denpasar". */
    label: string;
    nilai: number;
  }[];
}

export interface TabelStep {
  kolom: string[];
  baris: string[][];
  /** Baris yang disorot (indeks), mis. DAS Badung. */
  sorot?: number[];
}

export interface Step {
  id: string;
  /** Judul kartu; '' = tanpa judul (mis. lanjutan step sebelumnya). */
  judul: string;
  /** Paragraf teks; tiap string = satu paragraf. */
  teks: string[];
  camera: Camera;
  /** Kamera alternatif untuk layar sempit (map lebih kecil → biasanya zoom lebih jauh). */
  cameraMobile?: Partial<Camera>;
  layers: LayerId[];
  /** Kabupaten/kota diwarnai sesuai angka ini (layer 'kabupaten' harus ikut tampil). */
  dataWilayah?: DataWilayah;
  /** Tabel kecil di kartu (mis. luas & titik banjir per DAS). */
  tabel?: TabelStep;
  /** Garis sungai muncul bertahap dari hulu (utara) ke hilir (selatan) saat step ini aktif. */
  sungaiMenjalar?: boolean;
  /** Kabupaten/kota yang batasnya ditebalkan, mis. "Denpasar". */
  sorotWilayah?: string;
  /** DAS yang batasnya ditebalkan, mis. "Badung" (tampil tanpa layer 'das'). */
  sorotDas?: string;
  /** Titik banjir bisa diklik pada step ini. */
  titikInteraktif?: boolean;
  /** Tampilkan daftar semua titik banjir di kartu (untuk keyboard & pembaca layar). */
  daftarTitik?: boolean;
  /** Legenda di pojok peta. */
  legenda?: 'topografi' | 'banjir';
  /** Catatan kecil di bawah kartu (mis. sumber data). */
  keterangan?: string;
}

export interface PeristiwaTimeline {
  /** Teks asli dari Excel. */
  teks: string;
  /** Jam (mis. "03.10"), diekstrak dari frasa "pukul HH.MM" bila ada. */
  waktu?: string;
}

export interface HariTimeline {
  /** Tanggal ISO (YYYY-MM-DD). */
  tanggal: string;
  /** Label tampil, mis. "Rabu, 10 September 2025". */
  label: string;
  /** Judul kartu (cuplikan) — diisi redaksi. */
  judul: string;
  /** Foto asli opsional + kredit (jangan foto stok). */
  gambar?: { src: string; alt: string; kredit: string };
  peristiwa: PeristiwaTimeline[];
}
