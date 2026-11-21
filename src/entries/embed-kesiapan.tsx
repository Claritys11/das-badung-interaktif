import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Kesiapan } from '../components/kesiapan/Kesiapan';
import { kesiapan, kesiapanTeks } from '../content/kesiapan';
import './embed.css';

// Halaman standalone untuk <iframe>: scroll dokumen biasa di dalam iframe.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <Kesiapan kelompok={kesiapan} teks={kesiapanTeks} />
    </main>
  </StrictMode>,
);
