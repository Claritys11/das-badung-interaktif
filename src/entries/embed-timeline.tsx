import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Timeline } from '../components/timeline/Timeline';
import { timeline, timelineTeks } from '../content/timeline';
import './embed.css';

// Halaman standalone untuk <iframe>: timeline dengan scroll dokumen biasa di dalam iframe.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <Timeline hari={timeline} teks={timelineTeks} />
    </main>
  </StrictMode>,
);
