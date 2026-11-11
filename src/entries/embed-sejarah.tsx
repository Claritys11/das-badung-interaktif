import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Sejarah } from '../components/sejarah/Sejarah';
import { sejarah, sejarahTeks } from '../content/sejarah';
import './embed.css';

// Halaman standalone untuk <iframe>: scroll dokumen biasa di dalam iframe (panel media sticky).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <Sejarah bab={sejarah} teks={sejarahTeks} />
    </main>
  </StrictMode>,
);
