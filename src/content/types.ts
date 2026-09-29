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

export type LayerId = 'das' | 'sungai' | 'topografi' | 'banjir';

export interface Camera {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
}

export interface Step {
  id: string;
  judul: string;
  /** Paragraf teks; tiap string = satu paragraf. */
  teks: string[];
  camera: Camera;
  /** Kamera alternatif untuk layar sempit (map lebih kecil → biasanya zoom lebih jauh). */
  cameraMobile?: Partial<Camera>;
  layers: LayerId[];
  /** Titik banjir bisa diklik pada step ini. */
  titikInteraktif?: boolean;
  /** Tampilkan legenda topografi. */
  legenda?: 'topografi' | 'banjir';
}

export interface KontenTitik {
  judul: string;
  deskripsi: string;
  /** 'kmz' = teks asli dari data sumber; 'placeholder' = wajib diganti redaksi. */
  sumber: 'kmz' | 'placeholder';
  tampil: boolean;
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
