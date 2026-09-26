import type { ExpressionSpecification, GeoJSONSourceSpecification, LayerSpecification, Map as MLMap } from 'maplibre-gl';
import type { LayerId } from '../../content/types';

// Palet data. Topografi & DAS mengikuti warna asli di KMZ; titik banjir = merah IDN.
export const COLORS = {
  accent: '#ED2127',
  river: '#8FD8FF',
  riverCasing: '#0B3A55',
  topo: ['#EEF0C0', '#DBDB4B', '#B8B82A', '#949412', '#737300'],
};

export const TOPO_LEGEND = [
  { label: '0–50', color: COLORS.topo[0] },
  { label: '50–100', color: COLORS.topo[1] },
  { label: '100–500', color: COLORS.topo[2] },
  { label: '500–1.000', color: COLORS.topo[3] },
  { label: '> 1.000', color: COLORS.topo[4] },
];

type Paint = { layer: string; prop: string; on: unknown };

// Tiap LayerId → layer MapLibre + nilai opacity saat tampil. Saat disembunyikan opacity → 0
// (dengan transisi), supaya muncul/hilangnya layer terasa halus seperti di Kontinentalist.
const OPACITY: Record<LayerId, Paint[]> = {
  topografi: [
    { layer: 'topo-fill', prop: 'fill-opacity', on: 0.62 },
    { layer: 'topo-line', prop: 'line-opacity', on: 0.45 },
  ],
  das: [
    { layer: 'das-fill', prop: 'fill-opacity', on: 0.3 },
    { layer: 'das-line', prop: 'line-opacity', on: 0.95 },
  ],
  sungai: [
    { layer: 'sungai-casing', prop: 'line-opacity', on: 0.55 },
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
  map.addSource('das', src('das.geojson'));
  map.addSource('sungai', src('sungai.geojson'));
  map.addSource('topografi', src('topografi.geojson'));
  map.addSource('banjir', { type: 'geojson', data: banjirData, promoteId: 'id' });

  // Layer data diletakkan di bawah label gaya "hybrid" agar nama tempat tetap terbaca.
  const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
  const below: LayerSpecification[] = [
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
    { id: 'das-fill', type: 'fill', source: 'das', paint: { 'fill-color': ['get', 'warna'], 'fill-opacity': 0 } },
    {
      id: 'das-line',
      type: 'line',
      source: 'das',
      paint: { 'line-color': '#FFFFFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 13, 2.5], 'line-opacity': 0 },
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
        9,
        ['case', selected, 7, 3.5],
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
}

/** Set opacity layer sesuai daftar yang tampil. `durationMs` 0 = tanpa animasi (reduced motion). */
export function applyLayerVisibility(map: MLMap, visible: LayerId[], durationMs: number) {
  for (const id of LAYER_IDS) {
    const show = visible.includes(id);
    for (const { layer, prop, on } of OPACITY[id]) {
      if (!map.getLayer(layer)) continue;
      // Nama properti dinamis → cast: MapLibre menerima "<prop>-transition" untuk setiap properti paint.
      const set = map.setPaintProperty.bind(map) as (layer: string, name: string, value: unknown) => void;
      set(layer, `${prop}-transition`, { duration: durationMs, delay: 0 });
      set(layer, prop, show ? on : 0);
    }
  }
}
