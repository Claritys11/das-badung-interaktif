import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Disabilitas } from '../components/disabilitas/Disabilitas';
import { disabilitas, disabilitasTeks } from '../content/disabilitas';
import './embed.css';

// Halaman standalone untuk <iframe>: visual disabilitas dengan scroll dokumen biasa di dalam iframe.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <Disabilitas bab={disabilitas} teks={disabilitasTeks} />
    </main>
  </StrictMode>,
);
