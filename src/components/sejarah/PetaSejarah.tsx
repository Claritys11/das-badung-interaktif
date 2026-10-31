import { useEffect, useRef, useState } from 'react';
import { AttributionControl, Map as MLMap, Marker, NavigationControl, type GeoJSONSource } from 'maplibre-gl';
import { ensureWorker } from '../scrolly-map/maplibreWorker';
import { garisTapakDara, petaLama, titikKerajaan, titikSekarang } from '../../content/sejarah-peta';
import type { EraPeta, KameraSejarah } from '../../content/sejarah';

const TRANSISI = 700;
const GARIS_MS = 1400;
const KOSONG: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
const LAYER_LAMA = { '1915': 'sj-1915', '1930': 'sj-1930' } as const;
const BATAS: [number, number, number, number] = [115.15, -8.72, 115.28, -8.6];

export interface PetaSejarahProps {
  apiKey: string;
  assetBaseUrl: string;
  era: EraPeta;
  kamera: KameraSejarah;
  /** 0–1: ketebalan peta lama di atas citra satelit. */
  ketebalan: number;
  sempit: boolean;
  reduceMotion: boolean;
  label: string;
  /** Label titik pada peta 1915/1930, dikunci nama titik masa kerajaan. `_x_` = cetak miring. */
  labelBekas: Record<string, string>;
  labelKerajaan: Record<string, string>;
  onError: () => void;
}

/** Garis perempatan sepanjang progres p (0–1), tumbuh dari titik pusat keluar. */
function garisSampai(p: number): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: garisTapakDara.map(([a, b]) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [a, [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p]] },
    })),
  };
}

const denganGaris = (era: EraPeta) => era !== 'sekarang';
/** Di bawah zoom ini penanda saling menimpa dan menutup tulisan peta lama, jadi disembunyikan. */
const ZOOM_MIN_PENANDA = 15.5;

export function PetaSejarah({
  apiKey,
  assetBaseUrl,
  era,
  kamera,
  ketebalan,
  sempit,
  reduceMotion,
  label,
  labelBekas,
  labelKerajaan,
  onError,
}: PetaSejarahProps) {
  const wadah = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [siap, setSiap] = useState(false);
  const cb = useRef({ onError, kamera, sempit });
  cb.current = { onError, kamera, sempit };

  useEffect(() => {
    let batal = false;
    let bersihkan = () => {};
    ensureWorker()
      .then(() => {
        if (!batal) bersihkan = buat();
      })
      .catch(() => cb.current.onError());
    return () => {
      batal = true;
      bersihkan();
    };

    function buat() {
      if (!wadah.current) return () => {};
      const { kamera: k, sempit: s } = cb.current;
      let map: MLMap;
      try {
        map = new MLMap({
          container: wadah.current,
          style: `https://api.maptiler.com/maps/hybrid/style.json?key=${encodeURIComponent(apiKey)}`,
          center: k.center,
          zoom: s ? k.zoomSempit : k.zoom,
          maxBounds: BATAS,
          attributionControl: false,
          // Scroll artikel tidak boleh tersangkut di peta: zoom butuh Ctrl/⌘, geser di layar sentuh butuh dua jari.
          cooperativeGestures: true,
          dragRotate: false,
          pitchWithRotate: false,
        });
      } catch {
        cb.current.onError();
        return () => {};
      }
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      if (!s) map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new AttributionControl({ compact: s }), 'bottom-right');
      let muat = false;
      map.on('load', () => {
        muat = true;
        for (const tahun of ['1915', '1930'] as const) {
          map.addSource(LAYER_LAMA[tahun], {
            type: 'image',
            url: `${assetBaseUrl}${petaLama[tahun].file}`,
            coordinates: petaLama[tahun].sudut,
          });
          map.addLayer({
            id: LAYER_LAMA[tahun],
            type: 'raster',
            source: LAYER_LAMA[tahun],
            paint: { 'raster-opacity': 0, 'raster-opacity-transition': { duration: TRANSISI, delay: 0 }, 'raster-fade-duration': 0 },
          });
        }
        map.addSource('sj-garis', { type: 'geojson', data: KOSONG });
        map.addLayer({
          id: 'sj-garis-tepi',
          type: 'line',
          source: 'sj-garis',
          layout: { 'line-cap': 'round' },
          paint: { 'line-color': '#fff', 'line-width': 7, 'line-opacity': 0.9 },
        });
        map.addLayer({
          id: 'sj-garis',
          type: 'line',
          source: 'sj-garis',
          layout: { 'line-cap': 'round' },
          paint: { 'line-color': '#c8191f', 'line-width': 4 },
        });
        // Citra satelit & label jalan masa kini diatur per era.
        for (const l of map.getStyle().layers) {
          if (l.type === 'raster' && !l.id.startsWith('sj-')) {
            map.setPaintProperty(l.id, 'raster-saturation-transition', { duration: TRANSISI, delay: 0 });
          }
        }
        if (s) wadah.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
        setSiap(true);
      });
      map.on('error', (e) => {
        if (!muat && !(e as { sourceId?: string }).sourceId) cb.current.onError();
      });
      if (new URLSearchParams(location.search).has('debug') || import.meta.env.DEV)
        (window as unknown as { __sjMap?: MLMap }).__sjMap = map;
      return () => {
        mapRef.current = null;
        map.remove();
      };
    }
  }, [apiKey, assetBaseUrl]);

  // Era: peta lama, warna citra, label jalan modern.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !siap) return;
    for (const tahun of ['1915', '1930'] as const) {
      map.setPaintProperty(LAYER_LAMA[tahun], 'raster-opacity', era === tahun ? ketebalan : 0);
    }
    for (const l of map.getStyle().layers) {
      // Masa lalu: citra masa kini diredupkan supaya tidak terbaca sebagai pemandangan zaman itu.
      if (l.type === 'raster' && !l.id.startsWith('sj-')) map.setPaintProperty(l.id, 'raster-saturation', era === 'sekarang' ? 0 : -0.92);
      if (l.type === 'symbol') map.setLayoutProperty(l.id, 'visibility', era === 'sekarang' ? 'visible' : 'none');
    }
  }, [era, ketebalan, siap]);

  // Garis merah tumbuh dari perempatan saat masuk masa lalu.
  const adaGaris = denganGaris(era);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !siap) return;
    const sumber = map.getSource('sj-garis') as GeoJSONSource;
    if (!adaGaris) {
      sumber.setData(KOSONG);
      return;
    }
    if (reduceMotion) {
      sumber.setData(garisSampai(1));
      return;
    }
    let raf = 0;
    const mulai = performance.now();
    const langkah = (t: number) => {
      const p = Math.min(1, (t - mulai) / GARIS_MS);
      sumber.setData(garisSampai(1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [adaGaris, reduceMotion, siap]);

  // Kamera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !siap) return;
    const zoom = sempit ? kamera.zoomSempit : kamera.zoom;
    if (reduceMotion) map.jumpTo({ center: kamera.center, zoom });
    else map.easeTo({ center: kamera.center, zoom, duration: 1800, essential: true });
  }, [kamera, sempit, reduceMotion, siap]);

  const adaPenanda = (sempit ? kamera.zoomSempit + 0.8 : kamera.zoom) >= ZOOM_MIN_PENANDA;
  // Penanda nama tempat dari KMZ. Peta 1915/1930 memakai titik masa kerajaan dengan label bekas kawasannya.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !siap || !adaPenanda) return;
    const titik = era === 'sekarang' ? titikSekarang : titikKerajaan;
    const sisi = (lng: number, lat: number) => (lng > 115.2172 || (era === 'sekarang' && lat < -8.6565) ? 'kanan' : 'kiri');
    const penanda = titik.map(({ nama, lngLat }) => {
      const el = document.createElement('div');
      const teks = (era === 'kerajaan' ? labelKerajaan : era === 'sekarang' ? {} : labelBekas)[nama] ?? nama;
      el.className = `das-sj__penanda das-sj__penanda--${sisi(lngLat[0], lngLat[1])}`;
      const span = document.createElement('span');
      // Sisipkan <em> tanpa HTML mentah (penanda _x_ seperti TeksInline).
      teks.split(/_([^_]+)_/).forEach((bagian, i) => {
        if (!bagian) return;
        if (i % 2) {
          const em = document.createElement('em');
          em.textContent = bagian;
          span.append(em);
        } else span.append(bagian);
      });
      el.append(span);
      return new Marker({ element: el }).setLngLat(lngLat).addTo(map);
    });
    return () => penanda.forEach((m) => m.remove());
  }, [era, adaPenanda, labelBekas, labelKerajaan, siap]);

  // Mengikuti ukuran panel.
  useEffect(() => {
    const el = wadah.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <div ref={wadah} className="das-sj__peta" role="img" aria-label={label} data-ready={siap || undefined} />
      <a className="das-sj__maptiler" href="https://www.maptiler.com" target="_blank" rel="noopener noreferrer">
        <img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler" width={67} height={20} />
      </a>
    </>
  );
}
