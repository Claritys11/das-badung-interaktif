// Konten visual "Sejarah Tata Ruang Kota Pusaka" (dari redaksi: visual sejarah denpasar.pdf).
// `_teks_` = cetak miring, mengikuti penanda miring di PDF redaksi.
// Tiap bab terdiri dari segmen. Saat segmen melewati garis baca, panel media berganti ke `media` milik
// segmen itu. Segmen ber-media sama boleh punya `kamera` sendiri (peta bergerak tanpa ganti media).
// Aset: raw/sejarah → `pnpm sejarah` → public/sejarah + sejarah-peta.ts.

export type EraPeta = 'kerajaan' | '1915' | '1930' | 'sekarang';

export interface KameraSejarah {
  center: [number, number];
  zoom: number;
  /** Zoom di layar sempit (panel media lebih kecil). */
  zoomSempit: number;
}

export type MediaSejarah =
  | { jenis: 'peta'; id: string; era: EraPeta; alt: string; caption: string }
  | { jenis: 'foto'; id: string; file: string; lebar: number; tinggi: number; alt: string; caption: string };

export interface SegmenSejarah {
  media: MediaSejarah;
  kamera?: KameraSejarah;
  paragraf: string[];
  /** Kalimat penutup yang tampil besar. */
  kutipanPenutup?: string;
}

export interface BabSejarah {
  id: string;
  label: string;
  judul: string;
  segmen: SegmenSejarah[];
}

const foto = (file: string, alt: string, caption: string, lebar = 1050, tinggi = 585): MediaSejarah => ({
  jenis: 'foto',
  id: file,
  file,
  lebar,
  tinggi,
  alt,
  caption,
});

const KAMERA_DEKAT: KameraSejarah = { center: [115.2172, -8.6562], zoom: 17.1, zoomSempit: 16.2 };
const KAMERA_1915_DEKAT: KameraSejarah = { center: [115.2172, -8.6562], zoom: 16.5, zoomSempit: 15.7 };
const KAMERA_1915_SUNGAI: KameraSejarah = { center: [115.2135, -8.6562], zoom: 15.1, zoomSempit: 14.3 };
const KAMERA_1930_DEKAT: KameraSejarah = { center: [115.2172, -8.6562], zoom: 16.3, zoomSempit: 15.5 };
const KAMERA_1930_KOTA: KameraSejarah = { center: [115.2165, -8.6556], zoom: 15.2, zoomSempit: 14.4 };

const PETA_SEKARANG: MediaSejarah = {
  jenis: 'peta',
  id: 'peta-sekarang',
  era: 'sekarang',
  alt: 'Citra satelit perempatan Patung Catur Muka masa kini, dengan Jaya Sabha di timur laut dan Lapangan Puputan Badung di tenggara.',
  caption: 'Rumah Dinas dan Kantor Resmi Gubernur Bali (Jaya Sabha) di masa sekarang. (Dok. _Google Earth_)',
};
const PETA_KERAJAAN: MediaSejarah = {
  jenis: 'peta',
  id: 'peta-kerajaan',
  era: 'kerajaan',
  alt: 'Garis merah berbentuk palang menandai tapak dara, membagi Puri Agung Denpasar di timur laut, wantilan di barat laut, pasar di barat daya, dan ruang terbuka hijau di tenggara.',
  caption:
    'Pusat Pemerintahan Kerajaan Badung, diolah berdasarkan rujukan jurnal “Catuspatha Konsep, Transformasi, dan Perubahan”. (Dok. _Google Earth_ | Jurnal I Gusti Made Putra)',
};
const PETA_1915: MediaSejarah = {
  jenis: 'peta',
  id: 'peta-1915',
  era: '1915',
  alt: 'Peta Denpasar buatan 1915 skala 1:5000 ditumpangkan di atas citra satelit, memperlihatkan jaringan jalan, alun-alun, dan Tukad Badung.',
  caption:
    'Peta pusat pemerintahan kolonial di lokasi tapak dara berdasarkan dokumen Kantor Pekerjaan Umum Singaraja, yang dibuat pada 28 Januari 1915. (Koleksi Digital Perpustakaan Universitas Leiden | DF 11,7)',
};
const PETA_1930: MediaSejarah = {
  jenis: 'peta',
  id: 'peta-1930',
  era: '1930',
  alt: 'Denah Kota Denpasar dari selebaran studio foto EFD ditumpangkan di atas citra satelit, memuat Bali Hotel, alun-alun, dan nama kampung.',
  caption:
    'Perubahan pusat Pemerintahan Belanda pada 1930 berdasarkan selebaran _Fotografisch Atelier EFD_. (Dok. _Google Earth_ | _Fotografisch Atelier EFD_)',
};

const FOTO_GAJAH_MADA_KINI = foto(
  'jalan-gajah-mada',
  'Pekerja memasang kembali paving trotoar di depan deretan ruko Jalan Gajah Mada, dengan kerucut lalu lintas di sekitarnya.',
  'Perbaikan infrastruktur di Jalan Gajah Mada yang dilakukan Pemerintah Kota Denpasar. Foto diambil 5 Oktober 2026. (IDN Times/Irma Yudistirani)',
);

export const sejarahTeks = {
  labelBagian: 'Sejarah tata ruang Kota Pusaka',
  judul: 'Sejarah Tata Ruang Kota Pusaka',
  heroVideo: { mp4: 'hero.mp4', webm: 'hero.webm', poster: 'hero-poster.webp' },
  heroCaption:
    'Tentara Kerajaan Hindia Belanda (KNIL) saat ekspedisi Bali ketujuh di Puri Agung Denpasar pada 1906. Foto diolah dengan kecerdasan buatan. (_Leiden University Libraries_/KITLV 10113)',
  jeda: 'Jeda video',
  putar: 'Putar video',
  pembuka:
    'Denpasar hari ini adalah hasil tata ruang yang terus berganti sejak zaman kerajaan hingga kolonial. Dengan memahami ruko tua yang berdiri di dekat sungai, berarti menengok ke masa sebelum bencana itu terjadi, bahkan sebelum ada aturan sempadan.',
  eraLabel: 'Pilih masa peta',
  era: { kerajaan: 'Kerajaan', '1915': '1915', '1930': '1930', sekarang: 'Sekarang' } satisfies Record<EraPeta, string>,
  petaLama: 'Peta lama',
  petaLamaLabel: 'Tingkat ketebalan peta lama di atas citra satelit',
  labelKerajaan: { Wantilan: '_Wantilan_' } as Record<string, string>,
  /** Label titik bekas kawasan pada peta lama; posisinya titik yang sama dengan peta masa kerajaan. */
  labelBekas: {
    'Puri Agung Denpasar': 'Bekas Puri Agung',
    Wantilan: 'Bekas _wantilan_',
    Pasar: 'Bekas pasar',
    'Ruang terbuka hijau': 'Alun-alun',
  } as Record<string, string>,
  tanpaKey: 'Peta belum bisa dimuat: API key MapTiler belum diisi.',
  gagalMuat: 'Peta gagal dimuat. Periksa koneksi internet, lalu muat ulang halaman.',
};

export const sejarah: BabSejarah[] = [
  {
    id: 'tapak-dara',
    label: 'Tapak Dara',
    judul: 'Konsep tata ruang kerajaan',
    segmen: [
      {
        media: PETA_SEKARANG,
        kamera: KAMERA_DEKAT,
        paragraf: [
          'Sebelum Belanda datang, Denpasar adalah pusat Kerajaan Badung yang tertata berdasarkan konsep _catuspatha_, yaitu perempatan agung (_pempatan agung_) berbentuk palang (+) atau dalam istilah Bali disebut _tapak dara_.',
          'Perempatan itu dibagi empat kawasan. Puri (istana raja), pasar, _wantilan_ (bangunan serbaguna untuk budaya dan hiburan), dan ruang terbuka hijau (RTH) milik kerajaan.',
          'Gambar di samping merupakan peta lokasi perempatan jalan di Lapangan I Gusti Ngurah Made Agung di masa sekarang. Warga lebih mengenalnya dengan nama Lapangan Puputan Badung.',
        ],
      },
      {
        media: PETA_KERAJAAN,
        kamera: KAMERA_DEKAT,
        paragraf: [
          'Menurut jurnal “Catuspatha Konsep, Transformasi, dan Perubahan” karya I Gusti Made Putra, pasar berada di sisi Barat Daya, berdampingan dengan _wantilan_ di Barat Laut, Puri Agung Denpasar di Timur Laut, dan ruang terbuka hijau (RTH) di Tenggara.',
          'Jadi, Rumah Dinas dan Kantor Resmi Gubernur Bali (Jaya Sabha) yang kamu kenal sekarang, dulunya adalah Puri Agung Denpasar. Sedangkan Lapangan Puputan Badung yang biasa buat _jogging_ dan karaoke, dulunya tempat rekreasi sekaligus latihan para prajurit kerajaan. _Tapak dara_ ditandai dengan garis merah.',
          'Posisi itu mengacu pada Lontar Batur Kelawasan, yang mempertimbangkan arah mata angin dan makna baik–buruk bagi keberlangsungan kerajaan.',
        ],
      },
    ],
  },
  {
    id: '1906',
    label: '1906',
    judul: 'Kolonial mengubah tata letak',
    segmen: [
      {
        media: foto(
          'puri-denpasar',
          'Foto lama hitam putih: orang-orang duduk di tanah dan penunggang kuda di depan reruntuhan gerbang puri.',
          'Latar bangunan yang terlihat di gambar adalah Puri Agung Denpasar setelah Perang Puputan Badung. (Koleksi Digital Perpustakaan Universitas Leiden | KITLV 10107)',
        ),
        paragraf: [
          'Dua puluh September 1906, Raja Badung kalah dalam Perang Puputan Badung. Kerajaan runtuh dan terbakar, dan Belanda mengambil alih pusat kota. _Catuspatha_ yang semula sarat makna filosofis, diubah tata letak dan fungsinya sesuai kepentingan pemerintah kolonial.',
          'Berdasarkan salinan dokumen Kantor Pekerjaan Umum Singaraja yang diterbitkan dalam _Koleksi Digital Perpustakaan Universitas Leiden_ pada 1915, kawasan Puri Agung berubah menjadi rumah dinas asisten residen, kantor residen pembantu, pos pemadam kebakaran, dan rumah dinas perwira polisi bersenjata Eropa.',
        ],
      },
      {
        media: PETA_1915,
        kamera: KAMERA_1915_DEKAT,
        paragraf: [
          '_Wantilan_ yang dulu jadi tempat pertemuan maupun budaya, beralih menjadi penginapan (_pesanggrahan_) dan gudang opium, lengkap dengan rumah dinas penjaganya. Belanda masih mempertahankan RTH sebagai alun-alun.',
        ],
      },
      {
        media: PETA_1915,
        kamera: KAMERA_1915_SUNGAI,
        paragraf: [
          'Pasar, yang tadinya bagian integral pusat kota, dipindahkan keluar dan direlokasi ke dekat Tukad Badung. Bekas lokasi pasar lama menjadi kantor pengawas pemerintahan dalam negeri dan rumah dinas.',
        ],
      },
    ],
  },
  {
    id: '1930',
    label: '1930',
    judul: 'Kawasan multikultural',
    segmen: [
      {
        media: PETA_1930,
        kamera: KAMERA_1930_DEKAT,
        paragraf: [
          'Pada 1930, studio foto era kolonial bernama “_Fotografisch Atelier EFD_” membuat selebaran promosi yang memuat denah Denpasar dengan perubahan fungsi kawasan.',
          'Kawasan puri menjadi kantor, rumah dinas, dan kantor pos. _Wantilan_ dan sebagian puri menjadi Bali Hotel. Bekas pasar menjadi kantor pengawas pemerintah dan bank milik _Koninklijke Paketvaart Maatschappij (KPM)_.',
          'Belanda menambahkan lapangan tenis di alun-alun. Lalu di perempatan, ada Jam Lonceng yang kini menjadi ikonnya Kota Denpasar.',
        ],
      },
      {
        media: PETA_1930,
        kamera: KAMERA_1930_KOTA,
        paragraf: [
          'Belanda juga membagi Denpasar menjadi kawasan multikultural, di antaranya Kampung Arab dekat Tukad Badung dan Kampung Titih di sebelah timur.',
        ],
      },
    ],
  },
  {
    id: 'infrastruktur',
    label: 'Infrastruktur',
    judul: 'Bukan dirancang sebagai ibu kota',
    segmen: [
      {
        media: foto(
          'catur-muka',
          'Patung Catur Muka berdiri di atas kolam air mancur di tengah perempatan, dengan mobil dan sepeda motor melintas.',
          'Patung Catur Muka di perempatan jalan Lapangan Puputan Badung, yang dulunya berdiri Jam Lonceng pada masa pemerintahan kolonial. Foto ini diambil pada 25 Februari 2021. Jam Lonceng itu dipindahkan sekitar 50 meter ke Timur Laut. Posisinya tak berubah sampai sekarang. (IDN Times/Irma Yudistirani)',
        ),
        paragraf: [
          'Keputusan Denpasar menjadi Ibu Kota Provinsi ikut mewariskan persoalan infrastruktur hingga kini. Belanda memperhatikan infrastruktur saat membuat perkotaan.',
          'Itu terlihat di Singaraja, ibu kota provinsi sebelumnya, Belanda membangun jalan dan trotoar yang lebar. Sedangkan Denpasar, Belanda hanya menambahkan hotel, Jam Lonceng, dan perbaikan pelabuhan tanpa merencanakan jalan dari nol.',
          '“Kota Denpasar tidak dirancang untuk ibu kota sebuah provinsi, yang dirancang itu memang Singaraja,” kata Dewa, sapaan akrab Dewa Gde Yadhu Basudewa, Penulis dan Pegiat Warisan Budaya di Bali.',
          'Sebelum era kolonial, pasar bagian dari kekuasaan tiga puri besar yakni Puri Pemecutan, Puri Denpasar (kini Puri Satria), dan Puri Kesiman. Setelah 1906, Belanda membentuk sistem Distrik Kesiman dan Distrik Denpasar, yang menandai berakhirnya era kerajaan, serta dimulainya tata kota versi kolonial yang jejaknya masih membentuk wajah Denpasar hingga hari ini.',
        ],
      },
    ],
  },
  {
    id: 'aktivitas',
    label: 'Aktivitas',
    judul: 'Dari pasar temporer ke bangunan permanen',
    segmen: [
      {
        media: foto(
          'pasar-badung',
          'Tukad Badung saat senja diapit gedung Pasar Badung dan Pasar Kumbasari, dengan lampu warna-warni terpantul di air.',
          'Tukad Badung diapit oleh Pasar Badung dan Pasar Kumbasari. Foto ini diambil pada 13 Desember 2021. (IDN Times/Irma Yudistirani)',
        ),
        paragraf: [
          'Menurut Dewa, pasar di bantaran Tukad Badung dulu beroperasi secara temporer. Pedagang menggelar dagangan dengan atap daun kelapa dan membawa pulang barangnya setiap hari, sehingga tidak ada yang hilang ketika sungai meluap.',
          'Sedangkan di barat Tukad Badung, pedagang periuk tanah liat dari Binoh (kini Kelurahan Ubung Kaja) berdagang di _Peken Payuk_ atau Pasar Periuk. Tempat itu kini bernama Pasar Kumbasari, dari kata “_kumba_” yang berarti gentong atau gerabah.',
          'Dewa berasumsi komunitas Arab dan Tionghoa di sana datang bersama pasukan Belanda dari Singaraja, yang diduduki lebih dulu sejak Perang Jagaraga. Catatan kolonial menyebut pasukan Belanda membawa penerjemah bernama Ida Bagus Djelantik dari Singaraja.',
          'Komunitas ini awalnya menempati kawasan kodam dan kantor wali kota. Setelah Puputan Badung, Belanda memindahkan mereka ke barat, ke Jalan Sulawesi, Jalan Gajah Mada, dan Jalan Kartini. Mereka menetap dan berdagang kain hingga obat-obatan hingga sekarang.',
        ],
      },
      {
        media: foto(
          'gajah-mada',
          'Foto udara hitam putih Jalan Gajah Mada, dengan deretan atap bangunan di sepanjang jalan dan permukiman yang rimbun.',
          'Potret Jalan Gajah Mada pada 1949. (Koleksi Tropen Museum via Wikimedia)',
          700,
          485,
        ),
        paragraf: [
          'Ciri bangunannya sangat khas. Dua lantai, lantai atas untuk tempat tinggal dan lantai bawah untuk berdagang dengan loteng segitiga di bagian atas. Sekarang tidak semua bangunan asli bertahan. Sebagian direhabilitasi dan diseragamkan dengan ornamen Bali agar selaras dengan identitas kota, dan hal itu tercatat pada prasasti di kawasan Kumbasari.',
        ],
      },
    ],
  },
  {
    id: 'dilema',
    label: 'Dilema',
    judul: 'Ruko tua di bantaran',
    segmen: [
      {
        media: foto(
          'jalan-sulawesi',
          'Deretan ruko dua lantai berpilar bata di Jalan Sulawesi yang ramai sepeda motor, dengan kain dipajang di depan toko.',
          'Fasad ruko di Jalan Sulawesi. Fotonya diambil pada 5 Oktober 2026. (IDN Times/Irma Yudistirani)',
        ),
        paragraf: [
          'Ruko tua di Jalan Gajah Mada dan Sulawesi berdiri jauh sebelum ada aturan seberapa dekat bangunan boleh bersanding dengan sungai. Kawasan ini berstatus objek diduga cagar budaya (ODCB), bukan cagar budaya resmi.',
          'Cagar budaya ditetapkan kepala daerah berdasarkan rekomendasi tim ahli. Sementara, ODCB adalah warisan budaya yang memenuhi kriteria serupa tetapi belum melalui penetapan. Menurut Dewa, selama masa pengkajian, ODCB tetap wajib dilindungi seperti cagar budaya resmi.',
        ],
      },
      {
        media: foto(
          'belakang-sulawesi',
          'Bagian belakang ruko berdiri tepat di atas dinding bantaran Tukad Badung, dengan jalan setapak bermural di seberang sungai.',
          'Bagian belakang ruko di Jalan Sulawesi yang berdiri di bantaran Tukad Badung. Foto diambil pada 5 Oktober 2026. (IDN Times/Irma Yudistirani)',
        ),
        paragraf: [
          '“Kayak belum punya KTP untuk ditetapkan status sebagai cagar budaya,” kata Dewa.',
          'Ketentuan itu diperkuat oleh Undang-Undang Nomor 11 Tahun 2010 Tentang Cagar Budaya dan Peraturan Pemerintah Nomor 1 Tahun 2022. Persoalannya, bangunan di kawasan ini dimiliki perorangan atau komunal. Pemerintah tidak bisa memaksa pendataan atau penetapan status tanpa persetujuan pemilik.',
        ],
      },
    ],
  },
  {
    id: 'zonasi',
    label: 'Zonasi',
    judul: 'Belum pernah ada kajian risiko bencana',
    segmen: [
      {
        media: FOTO_GAJAH_MADA_KINI,
        paragraf: [
          '“Setahu saya, belum pernah sama sekali. Zonasi belum pernah.” Dewa menjawab lantang soal kajian risiko bencana di kawasan cagar budaya maupun ODCB.',
          'Menurut kaidah pelestarian, sebelum penetapan seharusnya ada zonasi (zona inti, penyangga, pengembangan, penunjang) yang menjadi dasar mitigasi bencana, lalu dituangkan dalam peraturan daerah agar melibatkan seluruh perangkat daerah, termasuk satuan polisi pamong praja (satpol PP).',
          '“Mitigasi kebencanaan untuk objek cagar budaya maupun objek diduga cagar budaya itu belum ada sampai sekarang,” katanya lagi.',
          'Bali, kata Dewa, lebih banyak menetapkan pura sebagai cagar budaya. Pura masih hidup sebagai _living monument_, dan warga mengamankannya sendiri lewat _mekemit_ (penjagaan) serta pemasangan _closed circuit television_ (CCTV).',
        ],
      },
    ],
  },
  {
    id: 'heritage',
    label: 'Heritage',
    judul: 'Dirobohkan atau dipindahkan',
    segmen: [
      {
        media: FOTO_GAJAH_MADA_KINI,
        paragraf: [
          'Pada 2010, Denpasar resmi bergabung dalam Jaringan Kota Pusaka Indonesia (JKPI), dan ditetapkan sebagai Kota Pusaka karena nilai historis serta warisan budaya.',
          'Denpasar pun bergabung dalam _Organization of World Heritage Cities_ (OWHC) pada 2013. Itulah mengapa kawasan Jalan Gajah Mada, Jalan Sulawesi, dan sekitarnya disebut sebagai “Heritage Gajah Mada Denpasar”.',
          'UU Cagar Budaya mensyaratkan beberapa proses sebelum bangunan cagar budaya atau ODCB dirobohkan, meliputi studi kelayakan, kajian teknis arkeologi, opsi konsolidasi struktur, atau relokasi bangunan (bukan relokasi penghuninya).',
          'Dewa menilai bangunan yang sudah memakan sempadan sungai seharusnya bisa direlokasi berdasarkan kajian. Ia membandingkan dengan candi kuno di Jawa Tengah yang kerap terdampak banjir dan dipindahkan berdasarkan kajian.',
          '“Ketika itu dihilangkan, masihkah layak _heritage city_ itu? _Heritage_ yang mana?” katanya.',
          'Dewa berpendapat, inti dari seluruh persoalan ini bukan lagi soal bangunan tua, melainkan implementasi tata kelola. Alih fungsi lahan masih terjadi di Denpasar.',
          '“Dulunya sawah, sekarang menjadi bangunan, beton. Kan peresapan air tidak ada,” lanjutnya.',
          'Di sisi sungai, Prof Eryani berpendapat bangunan yang melanggar sempadan harus dibongkar, dengan syarat prosedurnya benar, yakni ada pemberitahuan dan surat peringatan lebih dulu. Ia menyarankan penegakan aturan melibatkan desa adat, karena warga Bali cenderung lebih segan pada sanksi adat.',
        ],
        kutipanPenutup:
          '“Lebih baik dirobohkan sesuai aturan daripada air yang merobohkan, karena kalau air, itu jadinya bencana,” ujar Prof Eryani.',
      },
    ],
  },
];
