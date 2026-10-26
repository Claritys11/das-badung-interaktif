import type { ExpressionSpecification, GeoJSONSourceSpecification, LayerSpecification, Map as MLMap } from 'maplibre-gl';
import type { DataWilayah, LayerId } from '../../content/types';

// Palet data. Topografi mengikuti warna asli di KMZ; titik banjir = merah IDN.
// Choropleth = satu hue, terang → gelap (sequential): merah untuk dampak per kabupaten/kota,
// biru untuk jumlah titik banjir per DAS (supaya titik merah tetap menonjol di atasnya).
export const COLORS = {
  accent: '#ED2127',
  river: '#8FD8FF',
  riverCasing: '#0B3A55',
  topo: ['#EEF0C0', '#DBDB4B', '#B8B82A', '#949412', '#737300'],
  dampak: ['#FEE5D9', '#FCAE91', '#FB6A4A', '#DE2D26', '#A50F15'],
  das: ['#DEEBF7', '#9ECAE1', '#4292C6', '#2171B5', '#08519C'],
};

export const TOPO_LEGEND = [
  { label: '0–50', color: COLORS.topo[0] },
  { label: '50–100', color: COLORS.topo[1] },
  { label: '100–500', color: COLORS.topo[2] },
  { label: '500–1.000', color: COLORS.topo[3] },
  { label: '> 1.000', color: COLORS.topo[4] },
];

const FONT_BOLD = ['Noto Sans Bold'];
const TRANSPARENT = 'rgba(0,0,0,0)';

/** Warna isi untuk satu nilai (skala akar: nilai kecil tetap beda dari nol, nilai besar tidak mendominasi).
 *  Dipakai peta DAN batang di kartu, supaya kartu berfungsi sebagai legenda. */
export function warnaDampak(v: number, max: number) {
  const ramp = COLORS.dampak;
  const t = max > 0 ? Math.sqrt(v / max) : 0;
  return ramp[Math.min(ramp.length - 1, Math.max(1, Math.round(t * (ramp.length - 1))))];
}

type Paint = { layer: string; prop: string; on: unknown };

// Tiap LayerId → layer MapLibre + nilai opacity saat tampil. Saat disembunyikan opacity → 0
// (dengan transisi), supaya muncul/hilangnya layer terasa halus seperti di Kontinentalist.
// Isi & label kabupaten diatur terpisah (hanya tampil bila step punya dataWilayah).
const OPACITY: Record<LayerId, Paint[]> = {
  kabupaten: [{ layer: 'kab-line', prop: 'line-opacity', on: 0.9 }],
  topografi: [
    { layer: 'topo-fill', prop: 'fill-opacity', on: 0.62 },
    { layer: 'topo-line', prop: 'line-opacity', on: 0.45 },
  ],
  das: [
    { layer: 'das-fill', prop: 'fill-opacity', on: 0.55 },
    { layer: 'das-line', prop: 'line-opacity', on: 0.95 },
    { layer: 'das-label', prop: 'text-opacity', on: 1 },
  ],
  sungai: [
    { layer: 'sungai-casing', prop: 'line-opacity', on: 0.9 },
    { layer: 'sungai-line', prop: 'line-opacity', on: 1 },
  ],
  banjir: [
    { layer: 'banjir-halo', prop: 'circle-opacity', on: 1 },
    { layer: 'banjir-circle', prop: 'circle-opacity', on: 1 },
    { layer: 'banjir-circle', prop: 'circle-stroke-opacity', on: 1 },
  ],
};

export const LAYER_IDS = Object.keys(OPACITY) as LayerId[];
export const CLICKABLE_LAYER = 'banjir-circle';

export function addDataLayers(map: MLMap, dataBaseUrl: string, banjirData: GeoJSON.FeatureCollection) {
  const src = (file: string): GeoJSONSourceSpecification => ({ type: 'geojson', data: `${dataBaseUrl}${file}` });
  map.addSource('kabupaten', src('kabupaten.geojson'));
  map.addSource('kabupaten-label', src('kabupaten-label.geojson'));
  map.addSource('das', src('das.geojson'));
  map.addSource('das-label', src('das-label.geojson'));
  map.addSource('sungai', src('sungai.geojson'));
  map.addSource('topografi', src('topografi.geojson'));
  map.addSource('banjir', { type: 'geojson', data: banjirData, promoteId: 'id' });

  const byZoom = (a: number, b: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], 8, a, 13, b];
  // DAS diwarnai menurut jumlah titik banjir di dalamnya (properti `titik`, dihitung `pnpm data`; maks 40 = DAS Badung).
  const dasT: ExpressionSpecification = ['sqrt', ['/', ['get', 'titik'], 40]];

  // Layer data diletakkan di bawah label gaya "hybrid" agar nama tempat tetap terbaca.
  const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
  const below: LayerSpecification[] = [
    { id: 'kab-fill', type: 'fill', source: 'kabupaten', paint: { 'fill-color': TRANSPARENT, 'fill-opacity': 0 } },
    {
      id: 'topo-fill',
      type: 'fill',
      source: 'topografi',
      paint: {
        'fill-color': [
          'match',
          ['get', 'kelas'],
          1,
          COLORS.topo[0],
          2,
          COLORS.topo[1],
          3,
          COLORS.topo[2],
          4,
          COLORS.topo[3],
          COLORS.topo[4],
        ],
        'fill-opacity': 0,
      },
    },
    { id: 'topo-line', type: 'line', source: 'topografi', paint: { 'line-color': '#FFFFFF', 'line-width': 0.6, 'line-opacity': 0 } },
    {
      id: 'das-fill',
      type: 'fill',
      source: 'das',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          dasT,
          0,
          COLORS.das[0],
          0.3,
          COLORS.das[1],
          0.55,
          COLORS.das[2],
          0.8,
          COLORS.das[3],
          1,
          COLORS.das[4],
        ],
        'fill-opacity': 0,
      },
    },
    { id: 'das-line', type: 'line', source: 'das', paint: { 'line-color': '#FFFFFF', 'line-width': byZoom(1, 2.5), 'line-opacity': 0 } },
    {
      id: 'das-sorot',
      type: 'line',
      source: 'das',
      filter: ['==', ['get', 'nama'], ''],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-width': byZoom(2.5, 4.5), 'line-opacity': 0 },
    },
    {
      id: 'kab-line',
      type: 'line',
      source: 'kabupaten',
      paint: { 'line-color': '#FFFFFF', 'line-width': byZoom(1, 2), 'line-opacity': 0 },
    },
    {
      id: 'kab-sorot',
      type: 'line',
      source: 'kabupaten',
      filter: ['==', ['get', 'singkat'], ''],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-width': byZoom(2.5, 4.5), 'line-opacity': 0 },
    },
    {
      id: 'sungai-casing',
      type: 'line',
      source: 'sungai',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': COLORS.riverCasing,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          ['+', ['*', ['get', 'lebar'], 0.5], 1.5],
          15,
          ['+', ['*', ['get', 'lebar'], 1.4], 3],
        ],
        'line-opacity': 0,
      },
    },
    {
      id: 'sungai-line',
      type: 'line',
      source: 'sungai',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': COLORS.river,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, ['*', ['get', 'lebar'], 0.5], 15, ['*', ['get', 'lebar'], 1.4]],
        'line-opacity': 0,
      },
    },
  ];
  for (const layer of below) map.addLayer(layer, firstSymbol);

  // Label wilayah & DAS di atas label peta dasar.
  const labelPaint = { 'text-color': '#FFFFFF', 'text-halo-color': 'rgba(0,0,0,0.75)', 'text-halo-width': 1.6, 'text-opacity': 0 };
  map.addLayer({
    id: 'kab-label',
    type: 'symbol',
    source: 'kabupaten-label',
    layout: {
      'text-field': ['get', 'singkat'],
      'text-font': FONT_BOLD,
      'text-size': ['interpolate', ['linear'], ['zoom'], 7.5, 11, 9, 14],
      'text-line-height': 1.25,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: labelPaint,
  });
  map.addLayer({
    id: 'das-label',
    type: 'symbol',
    source: 'das-label',
    layout: {
      'text-field': ['concat', 'DAS ', ['get', 'nama']],
      'text-font': FONT_BOLD,
      'text-size': ['interpolate', ['linear'], ['zoom'], 9, 11, 12, 14],
      // DAS kecil berdempetan di hilir → label yang bertabrakan disembunyikan; DAS dengan titik banjir terbanyak didahulukan.
      'symbol-sort-key': ['-', ['get', 'titik']],
      'text-padding': 4,
    },
    paint: labelPaint,
  });

  const selected: ExpressionSpecification = ['boolean', ['feature-state', 'selected'], false];
  const hovered: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];
  const fasilitas: ExpressionSpecification = ['==', ['get', 'ikon'], 'fasilitas-air'];
  // Titik banjir selalu di paling atas (di atas label).
  map.addLayer({
    id: 'banjir-halo',
    type: 'circle',
    source: 'banjir',
    paint: {
      'circle-color': COLORS.accent,
      'circle-radius': ['case', selected, 22, hovered, 14, 0],
      'circle-opacity': 0,
      'circle-blur': 0.4,
      'circle-radius-transition': { duration: 250 },
    },
  });
  map.addLayer({
    id: CLICKABLE_LAYER,
    type: 'circle',
    source: 'banjir',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        ['case', selected, 6, 3],
        12,
        ['case', selected, 10, 6],
        16,
        ['case', selected, 13, 9],
      ],
      'circle-color': ['case', fasilitas, '#FFFFFF', COLORS.accent],
      'circle-stroke-color': ['case', fasilitas, COLORS.accent, '#FFFFFF'],
      'circle-stroke-width': ['case', fasilitas, 3, 1.5],
      'circle-opacity': 0,
      'circle-stroke-opacity': 0,
    },
  });
  // Label DAS & wilayah paling atas: di hilir titik banjir rapat dan bisa menutupi nama DAS.
  map.moveLayer('kab-label');
  map.moveLayer('das-label');
}

// Nama properti dinamis → cast: MapLibre menerima "<prop>-transition" untuk setiap properti paint.
function setPaint(map: MLMap, layer: string, name: string, value: unknown) {
  (map.setPaintProperty.bind(map) as (layer: string, name: string, value: unknown) => void)(layer, name, value);
}

export interface LayerState {
  layers: LayerId[];
  dataWilayah?: DataWilayah;
  sorotWilayah?: string;
  sorotDas?: string;
  /** Sungai tampil bertahap lewat setRiverProgress, bukan fade biasa. */
  sungaiMenjalar?: boolean;
}

/** Set opacity layer sesuai state step. `durationMs` 0 = tanpa animasi (reduced motion). */
export function applyLayerVisibility(map: MLMap, state: LayerState, durationMs: number) {
  const { layers: visible, dataWilayah, sorotWilayah, sorotDas, sungaiMenjalar } = state;
  const fade = (layer: string, prop: string, value: unknown) => {
    if (!map.getLayer(layer)) return;
    setPaint(map, layer, `${prop}-transition`, { duration: durationMs, delay: 0 });
    setPaint(map, layer, prop, value);
  };
  for (const id of LAYER_IDS) {
    const show = visible.includes(id);
    if (id === 'sungai' && show && sungaiMenjalar) continue; // diatur setRiverProgress
    for (const { layer, prop, on } of OPACITY[id]) fade(layer, prop, show ? on : 0);
  }

  // Label peta dasar disembunyikan saat label data sendiri tampil (choropleth / DAS), supaya tidak bertumpuk.
  setBaseLabelsVisible(map, !(dataWilayah && visible.includes('kabupaten')) && !visible.includes('das'), durationMs);

  if (sorotDas) map.setFilter('das-sorot', ['==', ['get', 'nama'], sorotDas]);
  fade('das-sorot', 'line-opacity', sorotDas ? 1 : 0);

  // Choropleth kabupaten/kota + label "Nama\nangka satuan".
  if (!map.getLayer('kab-fill')) return;
  const choropleth = visible.includes('kabupaten') && dataWilayah;
  if (dataWilayah) {
    const max = Math.max(...dataWilayah.baris.map((b) => b.nilai));
    const color: unknown[] = ['match', ['get', 'singkat']];
    const label: unknown[] = ['match', ['get', 'singkat']];
    for (const b of dataWilayah.baris) {
      color.push(b.kode, warnaDampak(b.nilai, max));
      label.push(b.kode, `${b.kode}\n${b.nilai.toLocaleString('id-ID')} ${dataWilayah.satuan}`);
    }
    map.setPaintProperty('kab-fill', 'fill-color', [...color, TRANSPARENT] as ExpressionSpecification);
    map.setLayoutProperty('kab-label', 'text-field', [...label, ['get', 'singkat']] as ExpressionSpecification);
  }
  fade('kab-fill', 'fill-opacity', choropleth ? 0.78 : 0);
  fade('kab-label', 'text-opacity', choropleth ? 1 : 0);
  if (sorotWilayah) map.setFilter('kab-sorot', ['==', ['get', 'singkat'], sorotWilayah]);
  fade('kab-sorot', 'line-opacity', visible.includes('kabupaten') && sorotWilayah ? 1 : 0);
}

// Layer simbol milik gaya peta dasar (bukan layer data kita) + text-opacity aslinya.
const baseLabels = new WeakMap<MLMap, { id: string; opacity: unknown }[]>();
const OWN_SYMBOLS = new Set(['kab-label', 'das-label']);

function setBaseLabelsVisible(map: MLMap, show: boolean, durationMs: number) {
  let list = baseLabels.get(map);
  if (!list) {
    list = map
      .getStyle()
      .layers.filter((l) => l.type === 'symbol' && !OWN_SYMBOLS.has(l.id))
      .map((l) => ({ id: l.id, opacity: map.getPaintProperty(l.id, 'text-opacity') ?? 1 }));
    baseLabels.set(map, list);
  }
  for (const { id, opacity } of list) {
    setPaint(map, id, 'text-opacity-transition', { duration: durationMs, delay: 0 });
    setPaint(map, id, 'text-opacity', show ? opacity : 0);
    setPaint(map, id, 'icon-opacity', show ? 1 : 0);
  }
}

/**
 * Animasi "menjalar": potongan sungai dengan `ord` (0 = paling utara … 1 = paling selatan) ≤ progres
 * ditampilkan. Dipanggil per frame; hanya ekspresi opacity yang berganti, data tidak di-tile ulang.
 */
export function setRiverProgress(map: MLMap, progress: number) {
  for (const { layer, prop, on } of OPACITY.sungai) {
    if (!map.getLayer(layer)) continue;
    setPaint(map, layer, `${prop}-transition`, { duration: 0, delay: 0 });
    setPaint(map, layer, prop, progress >= 1 ? on : ['case', ['<=', ['get', 'ord'], progress], on, 0]);
  }
}
