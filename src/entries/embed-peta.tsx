import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ScrollyMap } from '../components/scrolly-map/ScrollyMap';
import { story, petaTeks } from '../content/story';
import { titikBanjir } from '../content/titik-banjir';
import './embed.css';

// Halaman standalone untuk <iframe> — scroll internal + tombol navigasi (opsi C).
// Parameter URL: ?terrain=1 (terrain 3D), ?debug (angka kamera).
const q = new URLSearchParams(location.search);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <ScrollyMap
        steps={story}
        titik={titikBanjir}
        teks={petaTeks}
        scrollMode="internal"
        terrain3d={q.get('terrain') === '1'}
        debug={q.has('debug')}
      />
    </main>
  </StrictMode>,
);
