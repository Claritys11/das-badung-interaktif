import { setWorkerUrl } from 'maplibre-gl';
// maplibre-gl v6 (ESM) memakai worker terpisah. `?worker&url` → Vite membundel worker beserta
// dependensinya menjadi satu file (tanpa ini: "Worker failed to load" dan tile vektor tidak muncul).
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Worker tidak bisa dibuat dari URL lintas-origin (kasus Framer: situs di framer.app, aset di
// hosting kita). Maka bila origin berbeda, skrip worker di-fetch lalu dijalankan dari blob: URL.
let workerReady: Promise<void> | null = null;
export function ensureWorker() {
  workerReady ??= (async () => {
    const abs = new URL(workerUrl, import.meta.url).href;
    if (new URL(abs).origin === location.origin) return setWorkerUrl(abs);
    const res = await fetch(abs);
    if (!res.ok) throw new Error(`Worker MapLibre: HTTP ${res.status}`);
    setWorkerUrl(URL.createObjectURL(new Blob([await res.blob()], { type: 'text/javascript' })));
  })().catch((e) => {
    workerReady = null; // gagal sementara (jaringan) → boleh dicoba lagi saat peta dipasang ulang
    throw e;
  });
  return workerReady;
}
