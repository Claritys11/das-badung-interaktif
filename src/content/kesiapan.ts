// Konten daftar centang penutup artikel: 26 langkah dari redaksi, dikelompokkan per tema.
// Teks butir persis dari redaksi. Nama kelompok ditulis developer dan perlu dicek redaksi.

export interface KelompokKesiapan {
  id: string;
  judul: string;
  item: string[];
}

export const kesiapanTeks = {
  labelBagian: 'Daftar langkah kesiapan menghadapi bencana',
  /** "{n} dari {total} langkah sudah dilakukan" */
  progresCeklis: '{n} dari {total} langkah sudah dilakukan',
};

export const kesiapan: KelompokKesiapan[] = [
  {
    id: 'sungai',
    judul: 'Sungai dan lingkungan',
    item: [
      'Keruk sedimen dan gelontor drainase rutin sebelum, saat, dan sesudah musim hujan, tidak terlalu dalam agar tak memicu intrusi air laut',
      'Buat kolam retensi dan ruang hijau',
      'Pasang sistem peringatan dini berbasis pemantauan langsung',
      'Bangun pengelolaan sampah di permukiman tepi sungai',
      'Riset daya tampung sungai bersama perguruan tinggi',
    ],
  },
  {
    id: 'tata-ruang',
    judul: 'Tata ruang dan aturan',
    item: [
      'Arahkan tata guna lahan menjauh dari zona risiko tinggi',
      'Perketat zonasi kawasan rawan banjir dan batasi pembangunan di dalamnya',
      'Kaji ulang aturan, bagi peran penegakan dan pengerukan secara jelas',
      'Pendanaan dari pelaku usaha di sepanjang DAS (hotel, vila, restoran) lewat skema mirip CSR',
      'Libatkan desa adat dalam penegakan sempadan',
      'Bongkar bangunan yang melanggar sempadan lewat prosedur benar (pemberitahuan dan surat peringatan)',
      'Mengonsep arsitektur agar rumah di tepi sungai menghadap sungai',
    ],
  },
  {
    id: 'cagar-budaya',
    judul: 'Cagar budaya',
    item: [
      'Zonasi dan mitigasi bencana untuk cagar budaya dan ODCB',
      'Program pengecekan struktur bangunan bersejarah',
      'Ada kompensasi untuk pemilik cagar budaya/ODCB yang bangunannya mau dirobohkan',
    ],
  },
  {
    id: 'evakuasi',
    judul: 'Evakuasi dan disabilitas',
    item: [
      'Evakuasi inklusif, ada SOP penyelamatan disabilitas',
      'Data terpilah penyandang disabilitas di banjar dan desa',
      'Ada pelibatan penyandang disabilitas dalam musyawarah desa',
      'SOP evakuasi mandiri warga (siapa, kapan, ke mana)',
    ],
  },
  {
    id: 'hak-warga',
    judul: 'Hak warga',
    item: [
      'Warga rentan bencana mendapatkan pelindungan sosial dan rasa aman',
      'Warga mendapatkan pendidikan, pelatihan, dan keterampilan penanggulangan bencana',
      'Warga mendapatkan informasi secara tertulis dan/atau lisan tentang kebijakan penanggulangan bencana',
      'Warga berperan serta dalam perencanaan, pengoperasian, dan pemeliharaan program penyediaan bantuan pelayanan kesehatan termasuk dukungan psikososial',
      'Warga berpartisipasi dalam pengambilan keputusan terhadap kegiatan penanggulangan bencana',
      'Setiap orang yang terkena bencana mendapatkan bantuan pemenuhan kebutuhan dasar',
      'Setiap orang memperoleh ganti kerugian karena terkena bencana yang disebabkan oleh kegagalan konstruksi',
    ],
  },
];
