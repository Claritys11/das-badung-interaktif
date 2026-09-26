import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Slideshow } from '../components/slideshow/Slideshow';
import { ScrollyMap } from '../components/scrolly-map/ScrollyMap';
import { slides, slideshowTeks } from '../content/slides';
import { story, petaTeks } from '../content/story';
import { titikBanjir } from '../content/titik-banjir';
import './harness.css';

// Dev harness: meniru artikel IDN Times (Insidenesia) dengan teks dummy panjang di atas/bawah
// komponen untuk menguji sticky & scroll. Parameter: ?tema=hijau, ?terrain=1, ?debug
const q = new URLSearchParams(location.search);
if (q.get('tema') === 'hijau') document.documentElement.style.setProperty('--das-bg', '#DAEBC6');

const Dummy = ({ n }: { n: number }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <p key={i}>
        [Teks dummy artikel {i + 1}] Paragraf ini hanya pengisi untuk menguji perilaku scroll dan sticky di dalam halaman artikel. Panjangnya
        dibuat menyerupai paragraf berita pada umumnya supaya jarak antarkomponen terasa realistis ketika halaman digulir ke atas maupun ke
        bawah.
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
        <a href="?tema=hijau">tema hijau</a> · <a href="?debug">debug kamera</a>
      </nav>
    </header>
    <article className="hx-article">
      <Dummy n={6} />
      <h2>Perubahan wilayah dari tahun ke tahun</h2>
      <Dummy n={2} />
    </article>
    <div className="hx-wide">
      <Slideshow slides={slides} judul={slideshowTeks.judul} kredit={slideshowTeks.kredit} keterangan={slideshowTeks.keterangan} />
    </div>
    <article className="hx-article">
      <Dummy n={5} />
    </article>
    <ScrollyMap steps={story} titik={titikBanjir} teks={petaTeks} scrollMode="page" terrain3d={q.get('terrain') === '1'} debug={q.has('debug')} />
    <article className="hx-article">
      <h2>Setelah peta</h2>
      <Dummy n={8} />
    </article>
  </StrictMode>,
);
