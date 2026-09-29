// Timeline banjir Denpasar, September 2025. Dibuat dari raw/timeline/*.xlsx oleh `pnpm timeline`
// (sekali saja — file ini bebas diedit redaksi). Teks peristiwa = teks asli dari Excel.
// `waktu` diekstrak otomatis dari frasa "pukul HH.MM" (hanya label; teks tidak diubah).
// `gambar` opsional: isi dengan foto asli + kredit (jangan foto stok).
import type { HariTimeline } from './types';

export const timelineTeks = {
  judul: '[Judul timeline — diisi redaksi]',
  pengantar: '[Pengantar singkat timeline banjir Denpasar, 10–19 September 2025 — diisi redaksi]',
  lihatSemua: 'Lihat semua peristiwa',
  peristiwa: 'peristiwa',
  lainnya: 'peristiwa lainnya',
  tutup: 'Tutup',
  hariSebelumnya: 'Hari sebelumnya',
  hariBerikutnya: 'Hari berikutnya',
  sumber: '[Sumber timeline — diisi redaksi]',
};

export const timeline: HariTimeline[] = [
  {
    tanggal: '2025-09-10',
    label: 'Rabu, 10 September 2025',
    judul: '[Judul hari Rabu, 10 September 2025 — diisi redaksi]',
    // gambar: { src: '/timeline/2025-09-10.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },
    peristiwa: [
      { teks: "Instalasi Pengolahan Air (IPA) Waribang menghentikan produksi sejak pukul 03.10 Wita", waktu: '03.10' },
      { teks: "Pedagang siomai dan jamu, Rahma, menyaksikan air sudah setinggi lehernya pada pukul 03.30 Wita", waktu: '03.30' },
      { teks: "Rumah Riski, warga di Jalan Kertapura, tergenang air dengan ketinggian selutut orang dewasa pada pukul 05.00 Wita", waktu: '05.00' },
      { teks: "Pemilik Toko Armana Batik, Harman Assegaf, mendengar suara \"Terrt, terrt, terrt” sekitar pukul 05.15 Wita dan “bruk, bruk bruk” 15 menit kemudian. Ketinggian di Jalan Sulawesi saat itu 80cm", waktu: '05.15' },
      { teks: "Banjir dilaporkan terjadi di Perumahan Alas Arum, Banjar Perang, Desa Lukluk, Kecamatan Mengwi; sekitar Jalan Raya Kapal; Desa Sading; Desa Sempidi; Lingkungan Umagunung; dan Griya Anyar Simpang Siur" },
      { teks: "Banjir dilaporkan setinggi 1,5m di Jalan Pulau Buru" },
      { teks: "Banjir di Jalan Pulau Biak" },
      { teks: "Banjir sepinggang orang dewasa di Jalan Pulau Misol" },
      { teks: "BBMKG Wilayah III Denpasar melaporkan hujan disertai petir selama dua hari sejak 9 September 2025 akibat gelombang Ekuatorial Rosby aktif, dan kelembapan udara tinggi yang mendorong awan konvektif. Curah hujan di tujuh wilayah Bali mencapai kategori lebat hingga ekstrem" },
      { teks: "Tapping Poltabes SPAM Penet dan Reservoar Buduk - SPAM Penet juga menghentikan produksi sejak pukul 08.00 Wita karena terendam banjir", waktu: '08.00' },
      { teks: "Polsek Denpasar Timur mendirikan posko bencana di Banjar Tohpati, Kelurahan Kesiman Kertalangu, Kecamatan Denpasar Timur" },
      { teks: "Pukul 11.00 Wita, petugas mengevakuasi 2 balita, 2 lansia, dan 3 orang dewasa di Jalan Pulau Misol", waktu: '11.00' },
      { teks: "Pukul 11.59 Wita, Basarnas mengevakuasi 53 orang dewasa, 17 anak-anak, dan 11 balita di Jalan Pura Demak. Mereka kewalahan karena minim personel dan rubber boat untuk menjangkau seluruh area banjir", waktu: '11.59' },
      { teks: "Petugas mengevakuasi 2 orang dewasa dan 1 anak-anak di Kampung Jawa, Jalan Ahmad Yani, Kecamatan Denpasar Utara" },
      { teks: "Petugas mengevakuasi warga yang memerlukan penanganan medis di perumahan daerah jalan Wiraraja, Desa Ubung Kaja, Kecamatan Denpasar Utara" },
      { teks: "Petugas mengevakuasi nenek bersama tiga cucu yang terjebak banjir Jalan Griya Anyar Nomor 87, Banjar Kajeng, Kelurahan Pemogan" },
      { teks: "Pemprov Bali akan mencairkan anggaran Belanja Tidak Terduga (BTT) untuk menangani dampak banjir melalui skema sharing dengan Pemkot Denpasar. Ada santunan Rp15 juta bagi korban meninggal" },
      { teks: "Pemerintah Kota (Pemkot) Denpasar akan mengalokasikan anggaran Belanja Tidak terduga (BTT) sebesar Rp18 miliar" },
      { teks: "Pemerintah Provinsi (Pemprov) Bali menetapkan Status Tanggap Darurat Bencana melalui SK Nomor 810/04-G/HK/2025 yang berlaku dari tanggal 10–17 September 2025" },
      { teks: "Pemerintah Kota (Pemkot) Denpasar menetapkan status tanggap darurat pada periode yang sama" },
      { teks: "Pemkot Denpasar mendirikan posko terpadu di Kantor Wali Kota Denpasar" },
    ],
  },
  {
    tanggal: '2025-09-11',
    label: 'Kamis, 11 September 2025',
    judul: '[Judul hari Kamis, 11 September 2025 — diisi redaksi]',
    // gambar: { src: '/timeline/2025-09-11.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },
    peristiwa: [
      { teks: "Penemuan empat jenazah korban banjir di rawa Muara Waduk Tukad Badung pada pukul 07.59 Wita", waktu: '07.59' },
      { teks: "Kepala Badan Nasional Penanggulangan Bencana (BNPB), Letjen TNI Suharyanto, meninjau Posko Tohpati. Ia meminta warga terdampak tidak meributkan masalah perbaikan rumah rusak akibat banjir karena menyesuaikan pendataan kerusakan ringan, sedang, dan berat" },
      { teks: "Pendataan kondisi bangunan pascabanjir ini jadi tugasnya kepala desa setempat. Rumah dalam kondisi rusak ringan diberi bantuan sekitar Rp15 juta, rusak sedang sekitar Rp30 juta, dan rusak berat akan diganti dalam bentuk bangunan rumah baru" },
      { teks: "Dua puluh enam dari 52 orang yang mengungsi di Posko Tohpati telah kembali ke rumah. Mereka adalah warga nonpermanen yang mengekos dan mengontrak" },
      { teks: "Wakil Wali Kota (Wawali) Denpasar, I Kadek Agus Arya Wibawa, menyatakan kendaraan di parkir basement Pasar Badung dan Graha Yowana Suci tidak mendapatkan ganti rugi karena tak ada regulasinya." },
    ],
  },
  {
    tanggal: '2025-09-12',
    label: 'Jumat, 12 September 2025',
    judul: '[Judul hari Jumat, 12 September 2025 — diisi redaksi]',
    // gambar: { src: '/timeline/2025-09-12.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },
    peristiwa: [
      { teks: "Penyedotan air di parkir basement Pasar Badung karena akan dikunjungi Wakil Presiden Gibran Rakabuming. Sejumlah kendaraan dikeluarkan dengan cara mendorongnya beramai-ramai" },
      { teks: "Akses jalan di Gang Pudak, Banjar Dakdakan, Kelurahan Peguyangan ditutup, tidak bisa dilalui kendaraan. Banyak rumah yang hanyut" },
      { teks: "Empat puluh delapan dari 75 orang mengungsi ke Posko Siaga Bencana Kelurahan Peguyangan, Bale Banjar Dakdakan. Mereka warga nonpermanen yang mengekos dan mengontrak tanah untuk ditinggali" },
      { teks: "Menteri Sosial Republik Indonesia, Saifullah Yusuf alias Gus Ipul, mengunjungi Posko Siaga Bencana Kelurahan Peguyangan sekitar pukul 15.11 Wita. Kemensos membantu logistik di masa tanggap darurat. Besaran bantuan untuk penanggulangan bencana banjir bandang di Bali senilai lebih dari Rp2 miliar", waktu: '15.11' },
      { teks: "Menteri Hak Asasi Manusia Republik Indonesia, Natalius Pigai, sampai di lokasi Posko Siaga Bencana Peguyangan sekitar pukul 15.10 Wita untuk mendampingi Gus Ipul", waktu: '15.10' },
    ],
  },
  {
    tanggal: '2025-09-13',
    label: 'Sabtu, 13 September 2025',
    judul: '[Judul hari Sabtu, 13 September 2025 — diisi redaksi]',
    // gambar: { src: '/timeline/2025-09-13.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },
    peristiwa: [
      { teks: "Presiden Prabowo Subianto mendatangi warga terdampak di Gang IV Jalan Gajah Mada pukul 13.05 Wita. Tiga puluh lima menit kemudian, ia meninggalkan area tersebut", waktu: '13.05' },
    ],
  },
  {
    tanggal: '2025-09-15',
    label: 'Senin, 15 September 2025',
    judul: '[Judul hari Senin, 15 September 2025 — diisi redaksi]',
    // gambar: { src: '/timeline/2025-09-15.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },
    peristiwa: [
      { teks: "Seratus delapan puluh tujuh orang masih berada di Posko Cokroaminoto Dauh Puri Kaja, Posko Jalan Sutomo Gang Suar, dan Balai Masyarakat Pemaksa Jero Batur Sri" },
      { teks: "Jenazah korban banjir, Suandi (60), ditemukan di pinggiran sungai Jalan Kertanegara Gang Batu Medapit, Banjar Pohgading, Desa Ubung Kaja, Kecamatan Denpasar Utara sekitar pukul 09.00 Wita", waktu: '09.00' },
      { teks: "Wakil Gubernur Bali, I Nyoman Giri Prasta, menyatakan pemerintah akan berkoordinasi dengan kabupaten/kota untuk menghentikan alih fungsi lahan, memeriksa sawah dilindungi serta DAS. Penertiban bangunan liar, penanaman tanaman bambu, perawatan jalur air, serta pendataan curah hujan akan dilakukan untuk memperbaiki kapasitas drainase dan mencegah banjir" },
      { teks: "Pemprov Bali masih memiliki anggaran BTT sekitar Rp40 miliar" },
    ],
  },
  {
    tanggal: '2025-09-16',
    label: 'Selasa, 16 September 2025',
    judul: '[Judul hari Selasa, 16 September 2025 — diisi redaksi]',
    // gambar: { src: '/timeline/2025-09-16.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },
    peristiwa: [
      { teks: "Denpasar kembali diguyur hujan sedang hinggat lebat. Sejumlah titik tergenang air di antaranya DI Panjaitan, Renon, Monang-Maning, Jalan Gajah Mada, dan Pasar Kreneng" },
      { teks: "Agung Ketut Srinadi (57) merugi hingga Rp100 juta setelah barang dagangan peralatan sembahyang di empat toko Pasar Kumbasari terdampak banjir. Bah sampai naik ke Lantai Dua Pasar Kumbasari, terparah selama 43 tahun berjualan di sana" },
      { teks: "Pemkot Denpasar menurunkan status Tanggap Darurat Bencana menjadi Status Transisi Darurat ke Pemulihan selama tiga bulan, mulai 17 September hingga 17 Desember 2025" },
    ],
  },
  {
    tanggal: '2025-09-17',
    label: 'Rabu, 17 September 2025',
    judul: '[Judul hari Rabu, 17 September 2025 — diisi redaksi]',
    // gambar: { src: '/timeline/2025-09-17.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },
    peristiwa: [
      { teks: "Secara teknis, Pemkot Denpasar memberikan stimulus penguatan ekonomi bantuan untuk pelaku usaha dan UMKM terdampak banjir di Kota Denpasar dari APBD" },
    ],
  },
  {
    tanggal: '2025-09-18',
    label: 'Kamis, 18 September 2025',
    judul: '[Judul hari Kamis, 18 September 2025 — diisi redaksi]',
    // gambar: { src: '/timeline/2025-09-18.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },
    peristiwa: [
      { teks: "Gubernur Bali, Wayan Koster, menyerahkan bantuan perbaikan Rp2.714.000.000 untuk pedagang di Pasar Badung dan Pasar Kumbasari. Masing-masing Rp720 juta untuk 72 kios yang dimiliki oleh 42 orang (Rp10 juta per kios), Rp740 juta untuk 148 los yang dimiliki 51 orang (Rp5 juta per los), Rp1.254.000.000 untuk 418 dagangan di pelataran yang dimiliki 280 orang (Rp3 juta per dagangan)" },
      { teks: "Ahli waris korban meninggal menerima bantuan Rp15 juta dari bantuan Pemerintah Pusat, Rp15 juta dari bantuan Pemprov Bali, dan Rp15 juta dari Pemkot Denpasar" },
      { teks: "Viral Pemprov Bali melakukan penggalangan donasi banjir bagi ASN maupun PPPK dengan nominal yang sudah ditentukan" },
      { teks: "Sekda Bali, Dewa Made Indra, penggalangan donasi bersifat gotong royong sukarela. Besaran nominal hanya sebagai pedoman, boleh lebih atau rendah, sesuai nominal, atau tidak menyumbang sama sekali. Total donasi yang terkumpul sebesar Rp2.534.820.000. Cara ini dinilai lebih cepat, karena APBD melewati banyak persyaratan, prosedur, dan mekanisme pengelolaan keuangan negara" },
    ],
  },
  {
    tanggal: '2025-09-19',
    label: 'Jumat, 19 September 2025',
    judul: '[Judul hari Jumat, 19 September 2025 — diisi redaksi]',
    // gambar: { src: '/timeline/2025-09-19.webp', alt: '[Deskripsi foto — diisi redaksi]', kredit: '[Kredit — diisi redaksi]' },
    peristiwa: [
      { teks: "Operasi pencarian korban banjir resmi dihentikan sesuai peraturan. Empat orang korban hilang. Pemerintah fokus pada pemantauan kesehatan korban" },
    ],
  },
];
