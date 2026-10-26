import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Step } from '../../content/types';
import type { petaTeks as defaultTeks } from '../../content/story';
import { initialStoryState, resolveView, storyReducer, type PointLike } from './storyState';
import { StepCard } from './StepCard';
import { Legend } from './Legend';
import { StoryNav } from './StoryNav';
import { IconReset } from '../icons';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../../styles/tokens.css';
import './scrolly-map.css';

export interface ScrollyMapProps {
  steps: Step[];
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
  /**
   * Konten pembuka selebar penuh sebelum peta (mis. <FloodTransition />). Di mode "internal" ikut
   * di dalam scroll iframe yang sama; elemen [data-nav-stop] di dalamnya menjadi titik henti tombol navigasi.
   */
  intro?: ReactNode;
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
  teks,
  apiKey = import.meta.env.VITE_MAPTILER_KEY ?? '',
  dataBaseUrl = `${import.meta.env.BASE_URL}data/`,
  scrollMode = 'page',
  terrain3d = false,
  debug = false,
  intro,
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
  const introRef = useRef<HTMLDivElement>(null);
  // Mode internal: posisi relatif terhadap titik henti (intro + step) — untuk tombol & titik progres.
  const [navPos, setNavPos] = useState({ inIntro: Boolean(intro), atStart: true, atEnd: false });

  // Data titik banjir: di-fetch sekali (dibutuhkan untuk daftar titik & popup nama).
  useEffect(() => {
    let alive = true;
    fetch(`${dataBaseUrl}titik-banjir.geojson`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GeoJSON.FeatureCollection>;
      })
      .then((fc) => {
        if (!alive) return;
        setBanjir(fc);
      })
      .catch(() => alive && setMapError('data'));
    return () => {
      alive = false;
    };
  }, [dataBaseUrl]);

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

  // Titik henti navigasi (urutan DOM): [data-nav-stop] di intro, lalu tiap step peta.
  const navStops = useCallback((): HTMLElement[] => {
    const root = rootRef.current;
    if (!root) return [];
    return [...root.querySelectorAll<HTMLElement>('[data-nav-stop], .das-sm__step')];
  }, []);
  // Jarak (px) sebuah titik henti dari posisi berhentinya (atas container + scroll-margin-top).
  const stopOffset = useCallback(
    (el: HTMLElement) => {
      const rootTop = scrollMode === 'internal' && rootRef.current ? rootRef.current.getBoundingClientRect().top : 0;
      return el.getBoundingClientRect().top - rootTop - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
    },
    [scrollMode],
  );

  useEffect(() => {
    if (scrollMode !== 'internal') return;
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const stops = navStops();
      const steps = stops.filter((el) => el.classList.contains('das-sm__step'));
      setNavPos({
        inIntro: Boolean(introRef.current) && steps.length > 0 && stopOffset(steps[0]) > root.clientHeight / 2,
        atStart: stops.every((el) => stopOffset(el) >= -4),
        atEnd: stops.every((el) => stopOffset(el) <= 4),
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    root.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [scrollMode, navStops, stopOffset]);

  // Tombol Sebelumnya/Berikutnya. "Posisi sekarang" = titik henti terakhir yang sudah melewati tengah
  // layar (sama dengan cara step aktif ditentukan). Berikutnya → titik henti sesudahnya. Sebelumnya →
  // kembali ke awal titik henti sekarang bila sudah digulir melewatinya, kalau tidak ke titik sebelumnya.
  // Selama scroll navigasi masih berjalan, klik berikutnya dihitung dari target yang sedang dituju
  // (kalau dari posisi tengah-jalan, klik cepat kedua akan menargetkan titik yang sama lagi).
  const navTarget = useRef<HTMLElement | null>(null);
  const goRelative = useCallback(
    (dir: 1 | -1) => {
      const stops = navStops();
      const inFlight = navTarget.current ? stops.indexOf(navTarget.current) : -1;
      let target: HTMLElement | undefined;
      if (inFlight >= 0) {
        target = stops[inFlight + dir];
      } else {
        const half = (scrollMode === 'internal' && rootRef.current ? rootRef.current.clientHeight : window.innerHeight) / 2;
        let cur = -1;
        stops.forEach((el, i) => {
          if (stopOffset(el) <= half) cur = i;
        });
        if (dir > 0) target = stops[cur + 1];
        else if (cur >= 0 && stopOffset(stops[cur]) < -4) target = stops[cur];
        else target = stops[cur - 1];
      }
      if (!target) return;
      navTarget.current = target;
      const root = rootRef.current;
      let timer = 0;
      const finish = () => {
        if (navTarget.current === target) navTarget.current = null;
        window.clearTimeout(timer);
        root?.removeEventListener('scrollend', onScrollEnd);
      };
      // scrollend juga ditembakkan saat scroll sebelumnya diinterupsi → abaikan kalau belum sampai.
      const onScrollEnd = () => Math.abs(stopOffset(target)) <= 4 && finish();
      root?.addEventListener('scrollend', onScrollEnd);
      timer = window.setTimeout(finish, 2000); // fallback untuk browser tanpa event scrollend
      const stepIndex = stepRefs.current.indexOf(target);
      if (stepIndex >= 0) goToStep(stepIndex);
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    },
    [navStops, stopOffset, goToStep, reduceMotion, scrollMode],
  );

  const selected = state.selectedPointId ? points.get(state.selectedPointId) : undefined;
  const activeStep = steps[state.activeStep];
  const showReset = Boolean(selected) || userMoved;
  const sortedPoints = useMemo(() => [...points.values()].sort((a, b) => a.nama.localeCompare(b.nama, 'id')), [points]);

  const errorText = mapError
    ? { nokey: teks.tanpaKey, webgl: teks.tanpaWebgl, data: teks.gagalData, load: teks.gagalMuat }[mapError]
    : null;

  return (
    <section ref={rootRef} className={`das-root das-sm das-sm--${scrollMode} ${className ?? ''}`} aria-label="Peta interaktif DAS Badung">
      {intro && (
        <div ref={introRef} className="das-sm__intro">
          {intro}
        </div>
      )}
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
              <StepCard
                step={step}
                titik={step.daftarTitik ? sortedPoints : undefined}
                selectedPointId={state.selectedPointId}
                onSelectPoint={(id) => {
                  if (state.activeStep !== i) dispatch({ type: 'enterStep', index: i });
                  dispatch({ type: 'selectPoint', id, fly: true });
                }}
                teks={teks}
                akhir={i === steps.length - 1 && scrollMode === 'internal'}
              />
            </li>
          ))}
        </ol>

        {scrollMode === 'internal' && (
          <StoryNav
            steps={steps}
            active={navPos.inIntro ? -1 : state.activeStep}
            onGo={goToStep}
            onPrev={() => goRelative(-1)}
            onNext={() => goRelative(1)}
            prevDisabled={navPos.atStart}
            nextDisabled={navPos.atEnd}
            labels={{ sebelumnya: teks.sebelumnya, berikutnya: teks.berikutnya }}
          />
        )}
      </div>
    </section>
  );
}
