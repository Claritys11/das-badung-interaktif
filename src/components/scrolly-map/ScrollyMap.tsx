import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import type { KontenTitik, Step } from '../../content/types';
import type { petaTeks as defaultTeks } from '../../content/story';
import { initialStoryState, resolveView, storyReducer, type PointLike } from './storyState';
import { PointDetail } from './PointDetail';
import { Legend } from './Legend';
import { StoryNav } from './StoryNav';
import { IconReset } from '../icons';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../../styles/tokens.css';
import './scrolly-map.css';

export interface ScrollyMapProps {
  steps: Step[];
  titik: Record<string, KontenTitik>;
  teks: typeof defaultTeks;
  /** API key MapTiler. Default: VITE_MAPTILER_KEY. */
  apiKey?: string;
  /** Folder GeoJSON hasil `pnpm data`. Default: "<base>/data/". Untuk Framer: URL absolut hosting. */
  dataBaseUrl?: string;
  /**
   * "page": step dipicu scroll halaman (source code / Framer).
   * "internal": komponen setinggi layar dengan scroll sendiri + tombol navigasi (versi iframe).
   */
  scrollMode?: 'page' | 'internal';
  /** Terrain 3D MapTiler (opsional, default mati). */
  terrain3d?: boolean;
  /** Tampilkan angka kamera di pojok peta — untuk redaksi saat menyusun step baru. */
  debug?: boolean;
  className?: string;
}

const NARROW_QUERY = '(max-width: 767px)';

// MapLibre (~290 KB gzip) dimuat terpisah & baru ketika peta mendekati layar — tidak membebani
// pemuatan awal artikel.
const MapView = lazy(() => import('./MapView').then((m) => ({ default: m.MapView })));

/** Chunk MapView gagal dimuat (jaringan putus / deploy baru mengganti file ber-hash) → pesan error, bukan layar kosong. */
class MapErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** true (dan tetap true) setelah elemen berada ≤ 1 layar dari viewport. */
function useNearViewport(ref: React.RefObject<Element | null>, enabled: boolean) {
  const [near, setNear] = useState(!enabled);
  useEffect(() => {
    if (!enabled || near || !ref.current || typeof IntersectionObserver === 'undefined') {
      if (typeof IntersectionObserver === 'undefined') setNear(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '100% 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, enabled, near]);
  return near;
}

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

export function ScrollyMap({
  steps,
  titik,
  teks,
  apiKey = import.meta.env.VITE_MAPTILER_KEY ?? '',
  dataBaseUrl = `${import.meta.env.BASE_URL}data/`,
  scrollMode = 'page',
  terrain3d = false,
  debug = false,
  className,
}: ScrollyMapProps) {
  const [state, dispatch] = useReducer(storyReducer, initialStoryState);
  const [banjir, setBanjir] = useState<GeoJSON.FeatureCollection | null>(null);
  const [mapError, setMapError] = useState<'nokey' | 'webgl' | 'load' | 'data' | null>(apiKey ? null : 'nokey');
  const [userMoved, setUserMoved] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const isNarrow = useMediaQuery(NARROW_QUERY);
  const rootRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  // Selama scroll programatik (tombol navigasi) step yang dilewati tidak diaktifkan satu per satu.
  const navLock = useRef(false);
  const mapNear = useNearViewport(rootRef, scrollMode === 'page');

  // Data titik banjir: di-fetch sekali, disaring berdasarkan `tampil` di file konten.
  useEffect(() => {
    let alive = true;
    fetch(`${dataBaseUrl}titik-banjir.geojson`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GeoJSON.FeatureCollection>;
      })
      .then((fc) => {
        if (!alive) return;
        setBanjir({ ...fc, features: fc.features.filter((f) => titik[String(f.properties?.id)]?.tampil !== false) });
      })
      .catch(() => alive && setMapError('data'));
    return () => {
      alive = false;
    };
  }, [dataBaseUrl, titik]);

  const points = useMemo(() => {
    const m = new Map<string, PointLike & { nama: string }>();
    for (const f of banjir?.features ?? []) {
      const id = String(f.properties?.id);
      m.set(id, { id, nama: String(f.properties?.nama), coordinates: (f.geometry as GeoJSON.Point).coordinates as [number, number] });
    }
    return m;
  }, [banjir]);

  const view = resolveView(state, steps, points, isNarrow);

  // Step aktif = step yang melewati garis pemicu (tengah layar di desktop, bawah peta di mobile).
  useEffect(() => {
    const root = scrollMode === 'internal' ? rootRef.current : null;
    const rootMargin = isNarrow ? '-72% 0px -22% 0px' : '-48% 0px -48% 0px';
    const io = new IntersectionObserver(
      (entries) => {
        if (navLock.current) return;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = stepRefs.current.indexOf(e.target as HTMLElement);
          if (i >= 0) dispatch({ type: 'enterStep', index: i });
        }
      },
      { root, rootMargin, threshold: 0 },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [scrollMode, isNarrow, steps.length]);

  // Setiap step baru / reset → kamera kembali ke cerita, tombol reset disembunyikan.
  useEffect(() => setUserMoved(false), [state.activeStep, state.resetToken, state.selectedPointId]);

  const goToStep = useCallback(
    (i: number) => {
      const index = Math.min(Math.max(i, 0), steps.length - 1);
      const scroller: HTMLElement | Window = scrollMode === 'internal' && rootRef.current ? rootRef.current : window;
      navLock.current = true;
      let timer = 0;
      const release = () => {
        navLock.current = false;
        window.clearTimeout(timer);
        scroller.removeEventListener('scrollend', release);
      };
      scroller.addEventListener('scrollend', release);
      timer = window.setTimeout(release, 1500); // fallback untuk browser tanpa event scrollend
      dispatch({ type: 'enterStep', index });
      // block 'start' + scroll-margin-top (CSS) → step berhenti tepat di area teks (di mobile: di bawah peta).
      stepRefs.current[index]?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    },
    [steps.length, reduceMotion, scrollMode],
  );

  const selected = state.selectedPointId ? points.get(state.selectedPointId) : undefined;
  const selectedKonten: KontenTitik | undefined = selected
    ? (titik[selected.id] ?? {
        judul: selected.nama,
        deskripsi: `[Penjelasan titik ${selected.nama} — diisi redaksi]`,
        sumber: 'placeholder',
        tampil: true,
      })
    : undefined;
  const activeStep = steps[state.activeStep];
  const showReset = Boolean(selected) || userMoved;
  const detailLabels = { tutup: teks.tutupDetail, badgeKmz: teks.badgeKmz, badgePlaceholder: teks.badgePlaceholder };
  const sortedPoints = useMemo(() => [...points.values()].sort((a, b) => a.nama.localeCompare(b.nama, 'id')), [points]);

  const errorText = mapError
    ? { nokey: teks.tanpaKey, webgl: teks.tanpaWebgl, data: teks.gagalData, load: teks.gagalMuat }[mapError]
    : null;

  return (
    <section
      ref={rootRef}
      className={`das-root das-sm das-sm--${scrollMode} ${selected ? 'has-detail' : ''} ${className ?? ''}`}
      aria-label="Peta interaktif DAS Badung"
    >
      <div className="das-sm__mapcol">
        <div className="das-sm__sticky">
          {errorText ? (
            <div className="das-sm__error" role="alert">
              {errorText}
            </div>
          ) : !mapNear ? null : (
            <MapErrorBoundary onError={() => setMapError('load')}>
              <Suspense fallback={null}>
                <MapView
                  apiKey={apiKey}
                  view={view}
                  resetToken={state.resetToken}
                  selectedPointId={state.selectedPointId}
                  banjirData={banjir}
                  dataBaseUrl={dataBaseUrl}
                  reduceMotion={reduceMotion}
                  isNarrow={isNarrow}
                  terrain3d={terrain3d}
                  cooperativeGestures={scrollMode === 'page' && !isNarrow}
                  debug={debug}
                  onPointClick={(id) => dispatch({ type: 'selectPoint', id })}
                  onUserMove={() => setUserMoved(true)}
                  onError={setMapError}
                />
              </Suspense>
            </MapErrorBoundary>
          )}
          {showReset && !errorText && (
            <button type="button" className="das-sm__reset" onClick={() => dispatch({ type: 'reset' })}>
              <IconReset />
              {teks.resetPeta}
            </button>
          )}
          {activeStep?.legenda && !errorText && (
            <Legend
              kind={activeStep.legenda}
              labels={{ topografi: teks.legendaTopografi, banjir: teks.legendaBanjir, fasilitasAir: teks.legendaFasilitasAir }}
            />
          )}
        </div>
      </div>

      <div className="das-sm__textcol">
        {!isNarrow && (
          <div className="das-sm__detail-slot">
            <AnimatePresence>
              {selectedKonten && (
                <PointDetail
                  key={state.selectedPointId}
                  konten={selectedKonten}
                  variant="panel"
                  labels={detailLabels}
                  onClose={() => dispatch({ type: 'clearSelection' })}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        <ol className="das-sm__steps">
          {steps.map((step, i) => (
            <li
              key={step.id}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className={`das-sm__step${i === state.activeStep ? ' is-active' : ''}`}
              data-step={step.id}
            >
              <div className="das-sm__stepcard">
                <p className="das-sm__stepnum" aria-hidden="true">
                  {i + 1}
                </p>
                <h3>{step.judul}</h3>
                {step.teks.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
                {step.titikInteraktif && step.legenda === 'banjir' && sortedPoints.length > 0 && (
                  <details className="das-sm__pointlist">
                    <summary>Daftar {sortedPoints.length} titik banjir</summary>
                    <ul>
                      {sortedPoints.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            aria-pressed={state.selectedPointId === p.id}
                            onClick={() => {
                              if (state.activeStep !== i) dispatch({ type: 'enterStep', index: i });
                              dispatch({ type: 'selectPoint', id: p.id });
                            }}
                          >
                            {p.nama}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {i === steps.length - 1 && <p className="das-sm__source">{teks.sumberData}</p>}
                {i === steps.length - 1 && scrollMode === 'internal' && <p className="das-sm__end">{teks.lanjutMembaca}</p>}
              </div>
            </li>
          ))}
        </ol>

        {scrollMode === 'internal' && (
          <StoryNav
            steps={steps}
            active={state.activeStep}
            onGo={goToStep}
            labels={{ sebelumnya: teks.sebelumnya, berikutnya: teks.berikutnya }}
          />
        )}
      </div>

      {isNarrow && (
        <AnimatePresence>
          {selectedKonten && (
            <PointDetail
              key={state.selectedPointId}
              konten={selectedKonten}
              variant="sheet"
              labels={detailLabels}
              onClose={() => dispatch({ type: 'clearSelection' })}
            />
          )}
        </AnimatePresence>
      )}
    </section>
  );
}
