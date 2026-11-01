// Konten visual "disabilitas & bencana" (dari redaksi: visual disabilitas.docx).
// Gambar: raw/disabilitas/*.png → `pnpm disabilitas` → public/disabilitas/<file>-{640,1050}.{avif,webp}.
// Setiap bab = (gambar opsional) + label + judul + rangkaian blok; saat ini semua bab tanpa foto. Blok interaktif:
//   'pilihan'  → pembaca memilih satu langkah, akibatnya tampil (bisa ganti pilihan)
//   'ceklis'   → daftar centang (hanya di browser pembaca, tidak dikirim ke mana pun)
//   'tab'      → pilih satu kelompok untuk melihat isinya

export type BlokDisabilitas =
  | { jenis: 'paragraf'; teks: string }
  | { jenis: 'percakapan'; baris: { pembicara: string; teks: string }[] }
  | {
      jenis: 'pilihan';
      petunjuk: string;
      pertanyaan: string;
      opsi: { id: string; label: string; akibat: BlokDisabilitas[] }[];
    }
  | { jenis: 'ceklis'; petunjuk: string; item: string[] }
  | { jenis: 'tab'; petunjuk: string; opsi: { id: string; label: string; isi: BlokDisabilitas[] }[] };

export interface BabDisabilitas {
  id: string;
  label: string;
  judul: string;
  /** Foto bab (opsional; redaksi memutuskan tanpa foto). */
  gambar?: { file: string; alt: string };
  blok: BlokDisabilitas[];
}

const p = (teks: string): BlokDisabilitas => ({ jenis: 'paragraf', teks });

export const disabilitasTeks = {
  /** Label aksesibel untuk seluruh bagian. */
  labelBagian: 'Disabilitas dan bencana banjir Bali',
  /** "{n} dari {total} langkah sudah dilakukan" */
  progresCeklis: '{n} dari {total} langkah sudah dilakukan',
  pilihUlang: 'Pilih langkah lain untuk membandingkan.',
};

export const disabilitas: BabDisabilitas[] = [
  {
    id: 'evakuasi',
    label: 'Evakuasi',
    judul: 'Menyelamatkan disabilitas bukan berdasarkan asumsi',
    blok: [
      p(
        'Lewat jaringan Forum Penanggulangan Risiko Bencana (FPRB), Leni menemukan banyak teman disabilitas ikut terdampak. Seorang pengguna kursi roda tidak bisa mengevakuasi diri saat air terus naik.',
      ),
      {
        jenis: 'pilihan',
        petunjuk: 'Pilih satu langkah di bawah ini untuk melihat akibatnya. Tidak ada jawaban salah dan benar.',
        pertanyaan: 'Saat air naik, korban tidak bisa keluar sendiri. Apa langkah pertamamu?',
        opsi: [
          {
            id: 'angkat',
            label: 'Langsung angkat orangnya, tanpa kursi roda',
            akibat: [
              p(
                'Orang itu terangkat tanpa kursi rodanya. Leni menyebut cara seperti ini justru mencederai teman disabilitas, terutama penyandang cerebral palsy. Penyelamatan dengan metode yang salah bisa melukai korban.',
              ),
              p(
                '“Dia diangkat petugas yang menyelamatkan. Tetapi ketika diangkat tanpa kursi roda, justru mencederai teman kami. (harus ada) SOP-nya menyelamatkan gitu lho,” kata Leni.',
              ),
            ],
          },
          {
            id: 'tanya',
            label: 'Tanya dulu apa yang dibutuhkan',
            akibat: [
              {
                jenis: 'percakapan',
                baris: [
                  { pembicara: 'Petugas', teks: 'Apa yang bisa saya bantu?' },
                  { pembicara: 'Korban', teks: 'Angkat kursi roda saya.' },
                ],
              },
              p(
                'Contoh percakapan di atas, menurut Leni ideal dilakukan oleh petugas kepada disabilitas. Petugas semestinya menanyakan dulu kebutuhan korban, bukan mengasumsikan satu cara penyelamatan yang seragam untuk semua orang.',
              ),
              p('Ia menekankan pentingnya pendekatan berbasis etika saat menangani kelompok disabilitas dalam situasi darurat.'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'data',
    label: 'Data dan bantuan',
    judul: 'Mungkin malu, keluarga disabilitas tak dapat bantuan',
    blok: [
      p(
        'Tidak ada data terpilah tentang penyandang disabilitas di tingkat banjar dan desa. Banyak keluarga tidak melaporkan anggota keluarganya yang disabilitas, sehingga terlewat saat bantuan pascabencana disalurkan.',
      ),
      p('“Keluarga itu tidak mencantumkan bahwa satu anggotanya adalah seorang disabilitas. Mungkin karena faktor malu,” ungkap Leni.'),
      p(
        'Alokasi 10 persen dana desa semestinya juga menyasar kelompok rentan, termasuk penyandang disabilitas. Dari puluhan desa yang ia amati, hanya segelintir yang benar-benar melibatkan mereka dalam musyawarah desa.',
      ),
      p(
        '“Berapa desa yang melibatkan teman-teman disabilitas dalam musyawarah desa? Gak ada. Bisa dihitung dengan satu, dua, mungkin tiga desa aja,” katanya.',
      ),
    ],
  },
  {
    id: 'regulasi',
    label: 'Regulasi',
    judul: 'Disabilitas perlu dilibatkan merumuskan kebijakan',
    blok: [
      p(
        'HWDI Bali ikut mendorong revisi regulasi daerah agar lebih berpihak pada penyandang disabilitas. Leni menekankan bahwa yang dilibatkan harus penyandang disabilitas secara langsung, bukan hanya pendampingnya.',
      ),
      p(
        'Pihaknya mengevaluasi Peraturan Daerah (Perda) Bali Nomor 9 Tahun 2015 yang dinilai sudah tidak relevan, dengan Undang-Undang Nomor 8 Tahun 2016 Tentang Penyandang Disabilitas.',
      ),
      p(
        'Upaya itu membuahkan hasil pada 24 Oktober 2025. Unit Layanan Disabilitas (ULD) Khusus Kebencanaan terbentuk di tingkat provinsi maupun kabupaten seperti Karangasem, Buleleng, dan Jembrana. Leni sendiri aktif dalam kepengurusannya.',
      ),
      p('“Kalau saya melihat begitu. Mereka akan coba di Buleleng untuk teman-teman disabilitas biar _feel_-nya dapat,” kata Leni.'),
    ],
  },
  {
    id: 'tangguh',
    label: 'Belajar tangguh dari bencana',
    judul: 'Apa yang bisa disiapkan sekarang',
    blok: [
      p(
        'Terlepas dari kerugiannya, Leni memilih menjadikan banjir itu pelajaran bersama. Ia mendorong rekan-rekannya untuk menyimpan berkas dalam kotak plastik kedap air, dan mengarsipkannya secara digital.',
      ),
      p(
        '“Kita tidak tahu kapan bencana itu akan terjadi, minimal kita sudah bisa menyelamatkan orang-orang yang berharga. Orang dulu, baru barang-barangnya,” pesan Leni saat ditemui _IDN Times_ pada Selasa, 15 September 2026.',
      ),
      {
        jenis: 'ceklis',
        petunjuk: 'Centang langkah yang sudah kamu atau organisasimu lakukan.',
        item: [
          'Simpan berkas penting di kotak plastik kedap air',
          'Arsipkan dokumen penting secara digital',
          'Pastikan anggota keluarga disabilitas tercatat dalam data banjar atau desa',
          'Libatkan orangtua atau keluarga dalam pelatihan kesiapsiagaan bencana',
          'Saat menolong, tanyakan dulu kebutuhan orangnya sebelum mengangkat atau memindahkan',
        ],
      },
    ],
  },
  {
    id: 'peringatan-dini',
    label: 'Peringatan Dini',
    judul: 'Sistem peringatan dini belum menjangkau ragam disabilitas',
    blok: [
      p(
        'Sembilan Januari 2026, Badan Penanggulangan Bencana Daerah (BPBD) Bali memasang _Bali Flood Early Warning System_ (B-FEWS) di enam titik.',
      ),
      {
        jenis: 'tab',
        petunjuk: 'Namun, alat ini belum menjangkau seluruh ragam disabilitas. Pilih satu kelompok untuk melihat kanal yang tersedia.',
        opsi: [
          { id: 'netra', label: 'Netra', isi: [p('Suara sirine bisa diakses oleh kelompok netra lewat indra pendengaran.')] },
          {
            id: 'tuli',
            label: 'Tuli',
            isi: [p('Kelompok ini bergantung pada teks. Mereka mengandalkan informasi tertulis lewat _short message service_ (SMS).')],
          },
          {
            id: 'intelektual-mental',
            label: 'Intelektual dan mental',
            isi: [
              p(
                'Kelompok ini yang paling tertinggal. Belum ada kanal yang sesuai. Mereka sangat mengandalkan pendamping. Namun, pelibatan pendamping dalam pelatihan kesiapsiagaan bencana juga minim.',
              ),
              p(
                'Leni mendorong pelatihan bagi pendamping terdekat, yaitu orangtua atau keluarga, supaya mereka bisa mengajarkan langkah mitigasi sederhana secara berkelanjutan kepada anggota keluarga disabilitas.',
              ),
            ],
          },
        ],
      },
    ],
  },
];
