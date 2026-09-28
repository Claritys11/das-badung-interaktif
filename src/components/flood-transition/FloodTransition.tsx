import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'motion/react';
import type { banjirTeks as defaultTeks } from '../../content/banjir';
import { FloodFx, FX_TOTAL_S } from './FloodFx';
import '../../styles/tokens.css';
import './flood-transition.css';

export interface FloodTransitionProps {
  teks: typeof defaultTeks;
  /** Folder hasil `pnpm banjir`. Default: "<base>/banjir/". Untuk Framer: URL absolut hosting. */
  assetBaseUrl?: string;
  /** Getar fisik perangkat (Vibration API, Android) saat transisi. Default mati. */
  haptic?: boolean;
  className?: string;
}

export type FloodPhase = 'sebelum' | 'sesudah';

const WIDTHS = [640, 1024, 1485];
const srcSet = (base: string, file: string, ext: string) => WIDTHS.map((w) => `${base}${file}-${w}.${ext} ${w}w`).join(', ');

// Getaran: simpangan acak-terasa yang meluruh dalam ±0,8 detik (tanpa kedip terang — aman untuk
// pembaca yang peka cahaya). Foto sesudah muncul di tengah getaran.
const SHAKE = {
  x: [0, -16, 14, -12, 10, -8, 6, -3, 1, 0],
  y: [0, 5, -6, 4, -5, 3, -2, 1, 0, 0],
  rotate: [0, -0.5, 0.45, -0.35, 0.3, -0.2, 0.12, -0.05, 0, 0],
};
const SHAKE_S = 0.8;

export function FloodTransition({
  teks,
  assetBaseUrl = `${import.meta.env.BASE_URL}banjir/`,
  haptic = false,
  className,
}: FloodTransitionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<FloodPhase>('sebelum');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const stage = useAnimationControls();
  const first = useRef(true);
  // Seed efek air bah; null = tidak ada efek yang sedang berjalan.
  const [fxSeed, setFxSeed] = useState<number | null>(null);

  // Fase = posisi sentinel terhadap garis tengah layar. Dihitung dari event scroll (fase capture →
  // ikut menangkap scroll container internal di iframe) + rAF. Tidak memakai IntersectionObserver:
  // lompatan scroll (tombol navigasi, tombol End) bisa melewati sentinel tanpa memicu callback IO.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      setPhase(el.getBoundingClientRect().top <= window.innerHeight / 2 ? 'sesudah' : 'sebelum');
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
    };
  }, []);

  // Getar hanya saat masuk ke "sesudah" (bukan saat scroll balik, bukan saat halaman dibuka di tengah).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (phase !== 'sesudah' || reduceMotion) {
      setFxSeed(null); // scroll balik: hentikan efek, tanpa getar
      return;
    }
    void stage.start({ ...SHAKE, transition: { duration: SHAKE_S, ease: 'easeOut' } });
    setFxSeed(Date.now());
    const t = window.setTimeout(() => setFxSeed(null), (FX_TOTAL_S + 0.3) * 1000);
    if (haptic) {
      try {
        navigator.vibrate?.([70, 40, 90, 40, 60]);
      } catch {
        /* Vibration API tidak tersedia / diblokir (iframe lintas-origin) — abaikan. */
      }
    }
    return () => window.clearTimeout(t);
  }, [phase, reduceMotion, haptic, stage]);

  const after = phase === 'sesudah';
  const current = after ? teks.sesudah : teks.sebelum;
  const fade = reduceMotion
    ? { type: false as const }
    : after
      ? // Foto sesudah muncul saat air hampir di puncak (tertutup air) → kerusakan terlihat ketika air surut.
        { duration: 0.35, delay: 0.45, ease: [0.4, 0, 0.2, 1] as const }
      : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <section className={`das-root das-ft ${className ?? ''}`} aria-label={teks.label} data-phase={phase}>
      {/* Titik henti navigasi tombol (mode iframe): awal (foto sebelum) & setelah transisi. */}
      <div className="das-ft__stop das-ft__stop--sebelum" data-nav-stop="banjir-sebelum" aria-hidden="true" />
      <div className="das-ft__stop das-ft__stop--sesudah" data-nav-stop="banjir-sesudah" aria-hidden="true" />
      <div ref={sentinelRef} className="das-ft__sentinel" aria-hidden="true" />

      <div className="das-ft__sticky">
        <motion.div className="das-ft__stage" animate={stage}>
          {/* Bingkai = area foto yang sebenarnya (ukuran "contain" dihitung CSS) → efek air/tanah
              selalu berada di atas foto, tidak meluber ke latar kosong di layar HP portrait. */}
          <div className="das-ft__frame">
            <Photo base={assetBaseUrl} file={teks.sebelum.file} alt={teks.sebelum.alt} hidden={after} />
            <motion.div className="das-ft__after" initial={false} animate={{ opacity: after ? 1 : 0 }} transition={fade}>
              <Photo base={assetBaseUrl} file={teks.sesudah.file} alt={teks.sesudah.alt} hidden={!after} />
            </motion.div>
            {fxSeed !== null && <FloodFx key={fxSeed} seed={fxSeed} />}
          </div>
        </motion.div>

        <p className={`das-ft__tag das-ft__tag--${phase}`} aria-live="polite">
          {current.penanda}
        </p>
        {!after && (
          <p className="das-ft__hint" aria-hidden="true">
            {teks.petunjukScroll}
          </p>
        )}

        <p className="das-ft__caption">
          {current.keterangan} <span className="das-ft__credit">{current.kredit}</span>
        </p>
      </div>
    </section>
  );
}

function Photo({ base, file, alt, hidden }: { base: string; file: string; alt: string; hidden: boolean }) {
  return (
    <picture className="das-ft__photo">
      <source type="image/avif" srcSet={srcSet(base, file, 'avif')} sizes="100vw" />
      <source type="image/webp" srcSet={srcSet(base, file, 'webp')} sizes="100vw" />
      <img
        src={`${base}${file}-1024.webp`}
        alt={alt}
        aria-hidden={hidden || undefined}
        width={1485}
        height={892}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
