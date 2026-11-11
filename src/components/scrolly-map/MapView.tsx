import { useEffect, useRef, useState } from 'react';
import {
  AttributionControl,
  GPUInitializationError,
  Map as MLMap,
  NavigationControl,
  Popup,
  type MapGeoJSONFeature,
} from 'maplibre-gl';
import { ensureWorker } from './maplibreWorker';
import type { View } from './storyState';
import { addDataLayers, applyLayerVisibility, CLICKABLE_LAYER, setRiverProgress } from './layers';

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
  const {
    apiKey,
    view,
    resetToken,
    selectedPointId,
    banjirData,
    dataBaseUrl,
    reduceMotion,
    isNarrow,
    terrain3d,
    cooperativeGestures,
    debug,
  } = props;
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
    let cancelled = false;
    let cleanup = () => {};
    ensureWorker()
      .then(() => {
        if (!cancelled) cleanup = init();
      })
      .catch(() => cb.current.onError('load'));
    return () => {
      cancelled = true;
      cleanup();
    };

    function init(): () => void {
      if (!containerRef.current || !banjirData) return () => {};
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
          cooperativeGestures: Boolean(cb.current.cooperativeGestures),
          dragRotate: false,
          pitchWithRotate: false,
        });
      } catch (e) {
        cb.current.onError(e instanceof GPUInitializationError ? 'webgl' : 'load');
        return () => {};
      }
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new AttributionControl({ compact: isNarrow }), 'bottom-right');

      let loaded = false;
      map.on('load', () => {
        loaded = true;
        addDataLayers(map, dataBaseUrl, banjirData);
        if (terrain3d) {
          map.addSource('terrain', {
            type: 'raster-dem',
            url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${encodeURIComponent(apiKey)}`,
          });
          map.setTerrain({ source: 'terrain', exaggeration: 1.4 });
        }
        // Atribusi compact tampil terbuka saat load; di layar sempit dilipat (tetap bisa dibuka lewat ikon ⓘ).
        if (isNarrow) containerRef.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
        setReady(true);
      });
      map.on('error', (e) => {
        // Error tile/sumber data (punya sourceId) tidak fatal. Error lain sebelum 'load' = style gagal
        // dimuat (key ditolak/origin tidak diizinkan, kuota habis, jaringan putus) → tampilkan pesan.
        if (!loaded && !(e as { sourceId?: string }).sourceId) cb.current.onError('load');
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
        if (!hits.length) return;
        // Beberapa titik bertumpuk di bawah jari (mis. 7 titik dalam 20px di sekitar Pasar Badung pada
        // zoom mobile) → jangan menebak: zoom ke kumpulan itu dulu, ketukan berikutnya memilih satu titik.
        if (hits.length > 1 && map.getZoom() < 14) {
          const lng = hits.map((f) => (f.geometry as GeoJSON.Point).coordinates[0]);
          const lat = hits.map((f) => (f.geometry as GeoJSON.Point).coordinates[1]);
          popup.remove();
          cb.current.onUserMove();
          map.fitBounds(
            [
              [Math.min(...lng), Math.min(...lat)],
              [Math.max(...lng), Math.max(...lat)],
            ],
            { padding: 60, maxZoom: 16, duration: cb.current.reduceMotion ? 0 : 900 },
          );
          return;
        }
        // Sisa ambiguitas kecil: pilih titik yang paling dekat ke kursor.
        const dist = (f: MapGeoJSONFeature) => {
          const p = map.project((f.geometry as GeoJSON.Point).coordinates as [number, number]);
          return (p.x - e.point.x) ** 2 + (p.y - e.point.y) ** 2;
        };
        const nearest = hits.reduce((a, b) => (dist(b) < dist(a) ? b : a));
        popup.remove();
        cb.current.onPointClick(String(nearest.id));
      });
      map.on('dragstart', () => cb.current.onUserMove());
      map.on('zoomstart', (e) => {
        if ((e as { originalEvent?: Event }).originalEvent) cb.current.onUserMove();
      });
      if (debug) {
        // Untuk test e2e & redaksi: akses peta dari console (window.__dasMap).
        (window as unknown as { __dasMap?: MLMap }).__dasMap = map;
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
    }
    // Peta hanya dibuat ulang bila sumber/konfigurasi dasarnya berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, banjirData, dataBaseUrl, terrain3d, debug]);

  // cooperativeGestures berubah saat melewati breakpoint mobile → cukup di-toggle, peta tidak dibangun ulang.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (cooperativeGestures) map.cooperativeGestures.enable();
    else map.cooperativeGestures.disable();
  }, [cooperativeGestures, ready]);

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

  // 3. Layer tampil/sembunyi (+ choropleth & sorotan wilayah).
  //    Selama sungai belum tumbuh penuh, opacity-nya dipegang efek 3b, bukan fade biasa.
  const riverProgress = useRef(1);
  const layersKey = JSON.stringify([view.layers, view.dataWilayah?.judul, view.sorotWilayah, view.sorotDas, view.sungaiMenjalar]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const sungaiMenjalar = view.sungaiMenjalar || riverProgress.current < 1;
    applyLayerVisibility(map, { ...view, sungaiMenjalar }, reduceMotion ? 0 : 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layersKey, ready, reduceMotion]);

  // 3b. Sungai "menjalar" dari hulu (utara) ke hilir (selatan) setiap kali step-nya dimasuki.
  //     Mulai sesudah kamera hampir tiba, supaya pembaca melihat garis tumbuh, bukan sudah jadi.
  //     Bila pembaca scroll ke step berikut sebelum selesai (sungai masih tampil), pertumbuhan
  //     dilanjutkan cepat dari posisi terakhir — bukan melompat ke penuh.
  const sungaiTampil = view.layers.includes('sungai');
  const menjalar = view.sungaiMenjalar && sungaiTampil;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !sungaiTampil) return;
    const from = menjalar ? 0 : riverProgress.current;
    if (reduceMotion || from >= 1) {
      if (menjalar || riverProgress.current < 1) setRiverProgress(map, 1);
      riverProgress.current = 1;
      return;
    }
    const delay = menjalar ? 900 : 0;
    const duration = menjalar ? 4200 : 1400 * (1 - from);
    let raf = 0;
    let start = 0;
    riverProgress.current = from;
    setRiverProgress(map, from);
    const tick = (now: number) => {
      start ||= now;
      const p = Math.min(1, Math.max(0, (now - start - delay) / duration));
      riverProgress.current = from + (1 - from) * (1 - Math.pow(1 - p, 2)); // ease-out: melambat di hilir
      setRiverProgress(map, riverProgress.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [menjalar, sungaiTampil, ready, reduceMotion]);

  // 4. Sorotan titik terpilih + nama tempatnya (popup tetap terbuka sampai pilihan berganti).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedPointId) return;
    map.setFeatureState({ source: 'banjir', id: selectedPointId }, { selected: true });
    const f = banjirData?.features.find((x) => String(x.properties?.id) === selectedPointId);
    const popup = f
      ? new Popup({ closeButton: false, closeOnClick: false, offset: 14, className: 'das-sm__tooltip das-sm__tooltip--selected' })
          .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
          .setText(String(f.properties?.nama))
          .addTo(map)
      : null;
    return () => {
      popup?.remove();
      if (map.getSource('banjir')) map.setFeatureState({ source: 'banjir', id: selectedPointId }, { selected: false });
    };
  }, [selectedPointId, ready, banjirData]);

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
