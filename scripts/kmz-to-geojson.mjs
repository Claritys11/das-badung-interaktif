// Konversi KMZ → GeoJSON statis (build time). Jalankan: pnpm data
// Input : raw/kmz/*.kmz        Output: public/data/*.geojson
// Juga mencetak rekap titik banjir per kabupaten/kota, DAS & kelas ketinggian untuk dicocokkan
// dengan angka di teks redaksi (src/content/story.ts).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { kml } from '@tmcw/togeojson';
import simplify from '@turf/simplify';
import bbox from '@turf/bbox';
import area from '@turf/area';
import lineChunk from '@turf/line-chunk';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import polylabel from 'polylabel';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KMZ_DIR = path.join(root, 'raw/kmz');
const OUT_DIR = path.join(root, 'public/data');

async function readKmz(file) {
  const zip = await JSZip.loadAsync(await readFile(path.join(KMZ_DIR, file)));
  const docName = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith('.kml'));
  if (!docName) throw new Error(`${file}: tidak ada .kml di dalam KMZ`);
  const xml = await zip.file(docName).async('string');
  return kml(new DOMParser().parseFromString(xml, 'text/xml'));
}

// Bulatkan koordinat (6 desimal ≈ 11 cm) untuk memangkas ukuran file.
function roundCoords(c, k = 1e6) {
  return typeof c[0] === 'number' ? c.slice(0, 2).map((v) => Math.round(v * k) / k) : c.map((x) => roundCoords(x, k));
}
function clean(fc, desimal = 6) {
  for (const f of fc.features) f.geometry.coordinates = roundCoords(f.geometry.coordinates, 10 ** desimal);
  return fc;
}
const fc = (features) => ({ type: 'FeatureCollection', features });

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7F]/g, '') // buang aksara non-Latin (mis. aksara Bali) & zero-width
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
const text = (s) =>
  (s ?? '')
    .toString()
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/[​]/g, '')
    .trim();
// Style id KMZ: "#poly-32C739-1000-178" / "#line-A1C2FA-4273-nodesc" / "#icon-1703-A52714"
const styleParts = (url) =>
  (url ?? '')
    .replace(/^#/, '')
    .replace(/-(normal|highlight)$/, '')
    .split('-');

async function write(name, data) {
  const json = JSON.stringify(data);
  await writeFile(path.join(OUT_DIR, name), json);
  return { name, features: data.features.length, kb: +(json.length / 1024).toFixed(1) };
}

// "YEH POH" → "Yeh Poh"
const titleCase = (s) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
// Nilai atribut dari deskripsi KMZ ("... <br> NAMA_DAS DAS BADUNG <br> ...").
const attr = (desc, key) =>
  text(desc?.value ?? desc)
    .match(new RegExp(`${key}\\s+([^<]+?)\\s*(?:<br>|$)`))?.[1]
    ?.trim() ?? null;
const angkaId = (s) => Number(String(s).replace(',', '.'));

/** Titik label di "kutub tak terjangkau" polygon terbesar (selalu di dalam polygon, beda dengan centroid). */
function labelPoint(geometry) {
  const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
  const largest = polys.reduce((a, b) => (area({ type: 'Polygon', coordinates: b }) > area({ type: 'Polygon', coordinates: a }) ? b : a));
  const [x, y] = polylabel(largest, 0.0005);
  return { type: 'Point', coordinates: [x, y] };
}
const asPolygonal = (g) =>
  g.type === 'GeometryCollection'
    ? { type: 'MultiPolygon', coordinates: g.geometries.filter((x) => x.type === 'Polygon').map((x) => x.coordinates) }
    : g;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const report = [];

  // 1. Titik banjir — 110 Point. Popup hanya menampilkan nama tempat.
  const banjir = await readKmz('Titik banjir.kmz');
  const used = new Set();
  const banjirFeatures = banjir.features.map((f, i) => {
    const nama = text(f.properties.name).replace(/\s+/g, ' ');
    let slug = `banjir-${slugify(nama)}`;
    while (used.has(slug)) slug += '-2';
    used.add(slug);
    const [, iconCode] = styleParts(f.properties.styleUrl);
    return {
      type: 'Feature',
      id: i + 1, // id numerik untuk feature-state MapLibre
      properties: { id: slug, nama, ikon: iconCode === '1703' ? 'fasilitas-air' : 'umum' },
      geometry: f.geometry,
    };
  });
  const inside = (pt, poly) => booleanPointInPolygon(pt, poly);
  const countIn = (poly) => banjirFeatures.filter((pt) => inside(pt, poly)).length;

  // 2. Batas kabupaten/kota — 7 wilayah (Buleleng & Bangli tidak ada di KMZ). Untuk choropleth korban & kerusakan.
  const kab = await readKmz('Batas Administrasi KabupatenKota (Area).kmz');
  const kabFeatures = kab.features.map((f, i) => {
    const asli = text(f.properties.name); // "Kab. Badung" / "Kota Denpasar"
    const geometry = asPolygonal(f.geometry);
    return {
      type: 'Feature',
      id: i + 1,
      properties: {
        id: `kab-${slugify(asli.replace(/^(Kab\.|Kota)\s*/, ''))}`,
        nama: asli.replace(/^Kab\.\s*/, 'Kabupaten '),
        singkat: asli.replace(/^(Kab\.|Kota)\s*/, ''),
      },
      geometry,
    };
  });
  const kabFc = clean(simplify(fc(kabFeatures), { tolerance: 0.0003, highQuality: true }));
  report.push(await write('kabupaten.geojson', kabFc));
  // Badung & Gianyar memanjang utara–selatan dan bersebelahan → label otomatis berdempetan di zoom pulau.
  // Geser ke bagian yang lebih lapang (dicek tetap di dalam wilayahnya).
  const LABEL_MANUAL = { Badung: [115.2, -8.36], Gianyar: [115.31, -8.55] };
  const kabLabels = kabFc.features.map((f) => {
    const manual = LABEL_MANUAL[f.properties.singkat];
    const geometry = manual ? { type: 'Point', coordinates: manual } : labelPoint(f.geometry);
    if (manual && !inside(geometry, f)) throw new Error(`Label manual ${f.properties.singkat} di luar wilayahnya`);
    return { type: 'Feature', properties: f.properties, geometry };
  });
  report.push(await write('kabupaten-label.geojson', clean(fc(kabLabels))));

  // 3. DAS — 8 polygon. Nama & luas dari atribut BWS Bali-Penida 2017 di deskripsi.
  const das = await readKmz('Daerah Aliran Sungai.kmz');
  const dasFeatures = das.features.map((f, i) => {
    const desc = f.properties.description;
    const nama = titleCase(attr(desc, 'NAMA_DAS').replace(/^DAS\s+/, ''));
    const geometry = asPolygonal(f.geometry);
    return {
      type: 'Feature',
      id: i + 1,
      properties: { id: `das-${slugify(nama)}`, nama, luasKm2: Math.round(angkaId(attr(desc, 'Area')) * 100) / 100, titik: 0 },
      geometry,
    };
  });
  for (const f of dasFeatures) f.properties.titik = countIn(f);
  const dasFc = clean(simplify(fc(dasFeatures), { tolerance: 0.00005, highQuality: true }));
  report.push(await write('das.geojson', dasFc));
  report.push(
    await write(
      'das-label.geojson',
      clean(fc(dasFc.features.map((f) => ({ type: 'Feature', properties: f.properties, geometry: labelPoint(f.geometry) })))),
    ),
  );

  // 4. Garis sungai — 76 LineString. Dipotong per ±150 m; `ord` 0 (paling utara) → 1 (paling selatan)
  //    dipakai animasi "menjalar" dari hulu (atas) ke hilir (bawah): potongan tampil saat ord ≤ progres.
  //    Angka di style id (mis. 4273) = lebar garis ×1000 di Google My Maps.
  const sungai = simplify(await readKmz('perlintasan sungai.kmz'), { tolerance: 0.00002, highQuality: true });
  const potongan = [];
  sungai.features.forEach((f) => {
    const [, , lebar] = styleParts(f.properties.styleUrl);
    for (const c of lineChunk(f, 0.15, { units: 'kilometers' }).features) {
      potongan.push({ lebar: Number(lebar) / 1000 || 1, geometry: c.geometry });
    }
  });
  const latMid = (g) => (g.coordinates[0][1] + g.coordinates.at(-1)[1]) / 2;
  const lats = potongan.map((p) => latMid(p.geometry));
  const [north, south] = [Math.max(...lats), Math.min(...lats)];
  const sungaiFeatures = potongan.map((p, i) => ({
    type: 'Feature',
    id: i + 1,
    properties: { lebar: p.lebar, ord: Math.round(((north - latMid(p.geometry)) / (north - south)) * 1000) / 1000 },
    geometry: p.geometry,
  }));
  // 5 desimal (≈ 1 m) cukup untuk garis sungai dan memangkas ukuran file.
  report.push(await write('sungai.geojson', clean(fc(sungaiFeatures), 5)));

  // 5. Topografi — 5 kelas ketinggian (vektor). Nama "Ketinggian 0-50 Meter", "Ketinggian >1000 Meter".
  const topo = await readKmz('Topografi.kmz');
  const topoFeatures = topo.features.map((f, i) => {
    const nama = text(f.properties.name);
    const m = nama.match(/(\d+)\s*-\s*(\d+)/);
    const lebihDari = nama.match(/>\s*(\d+)/);
    const minM = m ? Number(m[1]) : Number(lebihDari?.[1] ?? 0);
    const maxM = m ? Number(m[2]) : null;
    // Kelas pertama di KMZ berisi polygon + 1 garis tepi; buang geometri non-polygon.
    return {
      type: 'Feature',
      id: i + 1,
      properties: { id: `topo-${i + 1}`, nama, kelas: i + 1, minM, maxM },
      geometry: asPolygonal(f.geometry),
    };
  });
  report.push(await write('topografi.geojson', clean(simplify(fc(topoFeatures), { tolerance: 0.0004, highQuality: true }))));

  report.push(await write('titik-banjir.geojson', clean(fc(banjirFeatures))));
  console.table(report);

  // Rekap untuk dicocokkan dengan angka di teks redaksi.
  const denpasar = kabFeatures.find((f) => f.properties.singkat === 'Denpasar');
  const dpsPts = banjirFeatures.filter((pt) => inside(pt, denpasar));
  console.log(
    `titik banjir   : ${banjirFeatures.length} (${banjirFeatures.filter((f) => f.properties.ikon === 'fasilitas-air').length} fasilitas air)`,
  );
  console.log('per kab/kota   :', Object.fromEntries(kabFeatures.map((k) => [k.properties.singkat, countIn(k)])));
  console.log(
    'per DAS        :',
    Object.fromEntries(dasFeatures.map((d) => [d.properties.nama, d.properties.titik])),
    `di luar DAS: ${banjirFeatures.filter((pt) => !dasFeatures.some((d) => inside(pt, d))).length}`,
  );
  console.log(
    'Denpasar/topo  :',
    Object.fromEntries(topoFeatures.map((t) => [t.properties.nama, dpsPts.filter((pt) => inside(pt, t)).length])),
  );
  console.log('potongan sungai:', sungaiFeatures.length, 'dari', sungai.features.length, 'garis');
  console.log(
    'bbox titik     :',
    bbox(fc(banjirFeatures))
      .map((v) => v.toFixed(4))
      .join(', '),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
