import { useEffect, useRef, useState } from 'react';
import {
  AttributionControl,
  GPUInitializationError,
  Map as MLMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type MapGeoJSONFeature,
} from 'maplibre-gl';
// maplibre-gl v6 (ESM) memakai worker terpisah. `?worker&url` → Vite membundel worker beserta
// dependensinya menjadi satu file (tanpa ini: "Worker failed to load" dan tile vektor tidak muncul).
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);
import type { View } from './storyState';
import { addDataLayers, applyLayerVisibility, CLICKABLE_LAYER } from './layers';

// Batas geser/zoom: Pulau Bali (+ sedikit ruang supaya tampilan pulau utuh muat di layar sempit).
const BALI_BOUNDS: [number, number, number, number] = [114.2, -9.3, 115.95, -7.6];

export interface MapViewProps {
  apiKey: string;
  view: View;
  /** Naik setiap reset → kamera diterapkan ulang walau view sama. */
  resetToken: number;
  selectedPointId: string | null;
  banjirData: GeoJSON.FeatureCollection | null;
  dataBaseUrl: string;
  reduceMotion: boolean;
  isNarrow: boolean;
  terrain3d?: boolean;
  /** true di mode halaman: zoom peta butuh Ctrl/⌘ + scroll, supaya scroll artikel tidak "tersangkut". */
  cooperativeGestures?: boolean;
  debug?: boolean;
  onPointClick: (id: string) => void;
  /** Dipanggil saat user menggeser/zoom peta sendiri (tombol reset jadi relevan). */
  onUserMove: () => void;
  onError: (kind: 'webgl' | 'load') => void;
}

export function MapView(props: MapViewProps) {
  const { apiKey, view, resetToken, selectedPointId, banjirData, dataBaseUrl, reduceMotion, isNarrow, terrain3d, cooperativeGestures, debug } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [debugText, setDebugText] = useState('');
  // Callback terbaru tanpa membuat ulang peta.
  const cb = useRef(props);
  cb.current = props;

  // 1. Buat peta sekali.
  useEffect(() => {
    if (!containerRef.current || !banjirData) return;
    let map: MLMap;
    try {
      map = new MLMap({
        container: containerRef.current,
        style: `https://api.maptiler.com/maps/hybrid/style.json?key=${encodeURIComponent(apiKey)}`,
        center: view.camera.center,
        zoom: view.camera.zoom,
        pitch: view.camera.pitch ?? 0,
        bearing: view.camera.bearing ?? 0,
        maxBounds: BALI_BOUNDS,
        maxPitch: 60,
        attributionControl: false,
        cooperativeGestures: Boolean(cooperativeGestures),
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch (e) {
      cb.current.onError(e instanceof GPUInitializationError ? 'webgl' : 'load');
      return;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new AttributionControl({ compact: isNarrow }), 'bottom-right');

    map.on('load', () => {
      addDataLayers(map, dataBaseUrl, banjirData);
      if (terrain3d) {
        map.addSource('terrain', { type: 'raster-dem', url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${encodeURIComponent(apiKey)}` });
        map.setTerrain({ source: 'terrain', exaggeration: 1.4 });
      }
      // Atribusi compact tampil terbuka saat load; di layar sempit dilipat (tetap bisa dibuka lewat ikon ⓘ).
      if (isNarrow) containerRef.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
      setReady(true);
    });
    map.on('error', (e) => {
      // Error tile sesekali (jaringan) tidak fatal; gagal memuat style = fatal.
      if (!map.isStyleLoaded() && /style|401|403/i.test(String(e.error?.message))) cb.current.onError('load');
    });

    // Interaksi titik banjir.
    const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 12, className: 'das-sm__tooltip' });
    let hoverId: string | null = null;
    const setHover = (id: string | null) => {
      if (hoverId) map.setFeatureState({ source: 'banjir', id: hoverId }, { hover: false });
      hoverId = id;
      if (id) map.setFeatureState({ source: 'banjir', id }, { hover: true });
    };
    const interactive = () => cb.current.view.titikInteraktif && cb.current.view.layers.includes('banjir');
    map.on('mousemove', CLICKABLE_LAYER, (e) => {
      if (!interactive()) return;
      const f = e.features?.[0] as MapGeoJSONFeature | undefined;
      if (!f) return;
      map.getCanvas().style.cursor = 'pointer';
      setHover(String(f.id));
      popup
        .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
        .setText(String(f.properties.nama))
        .addTo(map);
    });
    map.on('mouseleave', CLICKABLE_LAYER, () => {
      map.getCanvas().style.cursor = '';
      setHover(null);
      popup.remove();
    });
    map.on('click', (e) => {
      if (!interactive()) return;
      // Area klik diperbesar (± 10px) supaya titik kecil mudah disentuh di layar sentuh.
      const pad = 10;
      const hits = map.queryRenderedFeatures(
        [
          [e.point.x - pad, e.point.y - pad],
          [e.point.x + pad, e.point.y + pad],
        ],
        { layers: [CLICKABLE_LAYER] },
      );
      if (hits.length) {
        popup.remove();
        cb.current.onPointClick(String(hits[0].id));
      }
    });
    map.on('dragstart', () => cb.current.onUserMove());
    map.on('zoomstart', (e) => {
      if ((e as { originalEvent?: Event }).originalEvent) cb.current.onUserMove();
    });
    if (debug) {
      const show = () => {
        const c = map.getCenter();
        setDebugText(
          `center: [${c.lng.toFixed(4)}, ${c.lat.toFixed(4)}], zoom: ${map.getZoom().toFixed(2)}, pitch: ${map.getPitch().toFixed(0)}, bearing: ${map.getBearing().toFixed(0)}`,
        );
      };
      map.on('moveend', show);
      show();
    }

    return () => {
      popup.remove();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // Peta hanya dibuat ulang bila sumber/konfigurasi dasarnya berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, banjirData, dataBaseUrl, terrain3d, cooperativeGestures, debug]);

  // 2. Kamera mengikuti view (dan resetToken).
  const cameraKey = JSON.stringify(view.camera);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const { center, zoom, pitch = 0, bearing = 0 } = view.camera;
    const opts = { center, zoom, pitch, bearing };
    if (reduceMotion) map.jumpTo(opts);
    else map.flyTo({ ...opts, speed: 0.9, curve: 1.3, essential: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraKey, resetToken, ready, reduceMotion]);

  // 3. Layer tampil/sembunyi.
  const layersKey = view.layers.join(',');
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applyLayerVisibility(map, view.layers, reduceMotion ? 0 : 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layersKey, ready, reduceMotion]);

  // 4. Sorotan titik terpilih.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedPointId) return;
    map.setFeatureState({ source: 'banjir', id: selectedPointId }, { selected: true });
    return () => {
      if (map.getSource('banjir')) map.setFeatureState({ source: 'banjir', id: selectedPointId }, { selected: false });
    };
  }, [selectedPointId, ready]);

  // 5. Ukuran container berubah (mis. rotasi layar) → resize.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <div ref={containerRef} className="das-sm__map" data-ready={ready || undefined} />
      <a className="das-sm__maptiler" href="https://www.maptiler.com" target="_blank" rel="noopener noreferrer">
        <img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler" width={67} height={20} />
      </a>
      {debug && debugText && <output className="das-sm__debug">{debugText}</output>}
    </>
  );
}
