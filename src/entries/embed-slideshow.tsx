import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Slideshow } from '../components/slideshow/Slideshow';
import { slides, slideshowTeks } from '../content/slides';
import './embed.css';

// Halaman standalone untuk <iframe>. Parameter URL: ?autoplay=0, ?interval=4000
const q = new URLSearchParams(location.search);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="das-embed das-embed--slideshow">
      <Slideshow
        slides={slides}
        kredit={slideshowTeks.kredit}
        keterangan={slideshowTeks.keterangan}
        autoplay={q.get('autoplay') !== '0'}
        intervalMs={Number(q.get('interval')) || 3000}
      />
    </main>
  </StrictMode>,
);
