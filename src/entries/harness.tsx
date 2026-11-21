import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Slideshow } from '../components/slideshow/Slideshow';
import { ScrollyMap } from '../components/scrolly-map/ScrollyMap';
import { FloodTransition } from '../components/flood-transition/FloodTransition';
import { Timeline } from '../components/timeline/Timeline';
import { Disabilitas } from '../components/disabilitas/Disabilitas';
import { disabilitas, disabilitasTeks } from '../content/disabilitas';
import { Sejarah } from '../components/sejarah/Sejarah';
import { sejarah, sejarahTeks } from '../content/sejarah';
import { Kesiapan } from '../components/kesiapan/Kesiapan';
import { kesiapan, kesiapanTeks } from '../content/kesiapan';
import { timeline } from '../content/timeline';
import { timelineTeks } from '../content/timeline-teks';
import { banjirTeks } from '../content/banjir';
import { slides, slideshowTeks } from '../content/slides';
import { story, petaTeks } from '../content/story';
import './harness.css';

// Dev harness: meniru artikel IDN Times (Insidenesia) dengan teks dummy panjang di atas/bawah
// komponen untuk menguji sticky & scroll. Parameter: ?tema=hijau, ?terrain=1, ?debug
const q = new URLSearchParams(location.search);
if (q.get('tema') === 'hijau') document.documentElement.style.setProperty('--das-bg', '#DAEBC6');

const Dummy = ({ n }: { n: number }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <p key={i}>
        [Teks dummy artikel {i + 1}] Paragraf ini hanya pengisi untuk menguji perilaku scroll dan sticky di dalam halaman artikel.
        Panjangnya dibuat menyerupai paragraf berita pada umumnya supaya jarak antarkomponen terasa realistis ketika halaman digulir ke atas
        maupun ke bawah.
      </p>
    ))}
  </>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <header className="hx-header">
      <p className="hx-kicker">Dev harness · bukan halaman produksi</p>
      <h1>[Judul artikel DAS Badung — diisi redaksi]</h1>
      <nav>
        Halaman iframe: <a href="./embed/slideshow.html">slideshow</a> · <a href="./embed/peta.html">peta</a> ·{' '}
        <a href="./embed/timeline.html">timeline</a> · <a href="./embed/disabilitas.html">disabilitas</a> ·{' '}
        <a href="./embed/sejarah.html">sejarah</a> · <a href="./embed/kesiapan.html">kesiapan</a> ·{' '}
        <a href="?tema=hijau">tema hijau</a> · <a href="?debug">debug kamera</a>
      </nav>
    </header>
    <article className="hx-article">
      <Dummy n={4} />
      <h2>Apa yang terjadi pada 9—10 September 2025</h2>
      <Dummy n={2} />
    </article>
    <Timeline hari={timeline} teks={timelineTeks} />
    <article className="hx-article">
      <h2>Mengapa Denpasar paling parah</h2>
      <Dummy n={3} />
    </article>
    <ScrollyMap steps={story} teks={petaTeks} scrollMode="page" terrain3d={q.get('terrain') === '1'} debug={q.has('debug')} />
    <article className="hx-article hx-lead">
      {banjirTeks.pengantar.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </article>
    <FloodTransition teks={banjirTeks} />
    <article className="hx-article">
      <h2>Peringatan di DAS Badung sudah tertulis sejak 2023</h2>
      <Dummy n={2} />
      <h2>Sungai penuh sedimen dan sampah</h2>
      <Dummy n={2} />
    </article>
    <div className="hx-wide">
      <Slideshow slides={slides} judul={slideshowTeks.judul} kredit={slideshowTeks.kredit} keterangan={slideshowTeks.keterangan} />
    </div>
    <Sejarah bab={sejarah} teks={sejarahTeks} />
    <article className="hx-article">
      <h2>Menyelamatkan disabilitas bukan berdasarkan asumsi</h2>
      <Dummy n={3} />
    </article>
    <Disabilitas bab={disabilitas} teks={disabilitasTeks} />
    <article className="hx-article">
      <h2>Kesiapan menghadapi bencana</h2>
      <Dummy n={2} />
    </article>
    <Kesiapan kelompok={kesiapan} teks={kesiapanTeks} />
  </StrictMode>,
);
