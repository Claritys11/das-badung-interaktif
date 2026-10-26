import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react';
import type { banjirTeks as defaultTeks } from '../../content/banjir';
import { FloodFx, FX_TOTAL_S } from './FloodFx';
import { StageCard } from './StageCard';
import '../../styles/tokens.css';
import './flood-transition.css';

export interface FloodTransitionProps {
  teks: typeof defaultTeks;
  /** Folder hasil `pnpm banjir`. Default: "<base>/banjir/". Untuk Framer: URL absolut hosting. */
  assetBaseUrl?: string;
  /** Getar fisik perangkat (Vibration API, Android) saat meluap. Default mati. */
  haptic?: boolean;
  className?: string;
}

export type FloodPhase = 'sebelum' | 'sesudah';

const WIDTHS = [640, 1024, 1485];
const srcSet = (base: string, file: string, ext: string) => WIDTHS.map((w) => `${base}${file}-${w}.${ext} ${w}w`).join(', ');

// Getaran saat meluap: simpangan yang meluruh dalam ±0,8 detik (tanpa kedip terang).
const SHAKE = {
  x: [0, -16, 14, -12, 10, -8, 6, -3, 1, 0],
  y: [0, 5, -6, 4, -5, 3, -2, 1, 0, 0],
  rotate: [0, -0.5, 0.45, -0.35, 0.3, -0.2, 0.12, -0.05, 0, 0],
};
const SHAKE_S = 0.8;

/**
 * Transisi data banjir yang mengikuti scroll. Section = (jumlah tahap + 1) × tinggi layar; panggung
 * sticky. Tiap satu layar scroll = satu tahap (kartu data, intensitas hujan, tinggi muka air).
 * Tahap "meluap" memicu getar + air bah LAYAR PENUH sekali (hanya saat maju), lalu foto sesudah.
 */
export function FloodTransition({
  teks,
  assetBaseUrl = `${import.meta.env.BASE_URL}banjir/`,
  haptic = false,
  className,
}: FloodTransitionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const tahapan = teks.tahapan;
  const climax = Math.max(
    0,
    tahapan.findIndex((t) => t.meluap),
  );
  const [stage, setStage] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const shake = useAnimationControls();
  const prevStage = useRef<number | null>(null);
  // Seed efek air bah; null = tidak ada efek yang sedang berjalan.
  const [fxSeed, setFxSeed] = useState<number | null>(null);

  // Tahap = berapa layar sudah digulir di dalam section (dihitung dari event scroll fase capture →
  // ikut menangkap scroll container internal di iframe). Titik tengah layar sebagai patokan.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const s = Math.floor((-el.getBoundingClientRect().top + vh * 0.5) / vh);
      setStage(Math.min(Math.max(s, 0), tahapan.length - 1));
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
  }, [tahapan.length]);

  // Klimaks hanya saat MELINTASI tahap meluap ke depan (bukan saat scroll balik / halaman dibuka di tengah).
  useEffect(() => {
    const prev = prevStage.current;
    prevStage.current = stage;
    if (prev === null) return;
    if (stage < climax) {
      setFxSeed(null);
      return;
    }
    if (!(prev < climax && stage >= climax) || reduceMotion) return;
    void shake.start({ ...SHAKE, transition: { duration: SHAKE_S, ease: 'easeOut' } });
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
  }, [stage, climax, reduceMotion, haptic, shake]);

  const after = stage >= climax;
  const phase: FloodPhase = after ? 'sesudah' : 'sebelum';
  const tahap = tahapan[stage];
  const current = after ? teks.sesudah : teks.sebelum;
  const fade = reduceMotion
    ? { type: false as const }
    : after
      ? // Foto sesudah muncul saat air bah hampir di puncak (tertutup air) → kerusakan terlihat ketika surut.
        { duration: 0.35, delay: 0.45, ease: [0.4, 0, 0.2, 1] as const }
      : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };
  const slow = reduceMotion ? { type: false as const } : { duration: 1.2, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <section
      ref={sectionRef}
      className={`das-root das-ft ${className ?? ''}`}
      style={{ height: `${(tahapan.length + 1) * 100}vh` }}
      aria-label={teks.label}
      data-phase={phase}
      data-stage={tahap.id}
    >
      {/* Titik henti navigasi tombol (mode iframe): satu per tahap. */}
      {tahapan.map((t, i) => (
        <div key={t.id} className="das-ft__stop" style={{ top: `${i * 100}vh` }} data-nav-stop={`banjir-${t.id}`} aria-hidden="true" />
      ))}

      <motion.div className="das-ft__sticky" animate={shake}>
        <div className="das-ft__stage">
          <div className="das-ft__frame">
            {/* Foto sebelum ikut memudar: foto sesudah (4:3) lebih sempit dari foto sebelum (5:3),
                jadi tepi foto sebelum akan terlihat di samping kalau tidak disembunyikan. */}
            <motion.div className="das-ft__before" initial={false} animate={{ opacity: after ? 0 : 1 }} transition={fade}>
              <Photo base={assetBaseUrl} file={teks.sebelum.file} alt={teks.sebelum.alt} hidden={after} w={1485} h={892} />
            </motion.div>
            <motion.div className="das-ft__after" initial={false} animate={{ opacity: after ? 1 : 0 }} transition={fade}>
              <Photo base={assetBaseUrl} file={teks.sesudah.file} alt={teks.sesudah.alt} hidden={!after} w={1600} h={1200} />
            </motion.div>
          </div>
        </div>

        {/* ---- Lapisan layar penuh (di atas foto & latar) ---- */}
        {/* Langit menggelap mengikuti intensitas hujan. */}
        <motion.div
          className="das-ft__storm"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: tahap.hujan * 0.45 }}
          transition={slow}
        />
        {/* Hujan: dua lapis garis (dekat & jauh). Kecepatan via CSS; intensitas = opacity. */}
        <motion.div
          className="das-ft__rain das-ft__rain--far"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: tahap.hujan * 0.7 }}
          transition={slow}
        />
        <motion.div
          className="das-ft__rain das-ft__rain--near"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: tahap.hujan }}
          transition={slow}
        />
        {/* Muka air naik bertahap (limpasan → debit), sebelum meluap. */}
        <motion.div
          className="das-ft__level"
          aria-hidden="true"
          initial={false}
          // Saat air 0, sembunyikan sepenuhnya (puncak gelombang tidak mengintip di dasar layar).
          animate={{ y: `${(1 - tahap.air) * 100}%`, opacity: tahap.air > 0 ? 1 : 0 }}
          transition={reduceMotion ? { type: false } : { duration: 1.6, ease: [0.3, 0, 0.2, 1] }}
        />
        {/* Klimaks: air bah, cipratan tanah, tetes lumpur — menutup seluruh layar. */}
        {fxSeed !== null && <FloodFx key={fxSeed} seed={fxSeed} />}

        <p className={`das-ft__tag das-ft__tag--${phase}`} aria-live="polite">
          {current.penanda}
        </p>

        <div className="das-ft__cardslot" aria-live="polite">
          <AnimatePresence mode="wait">
            <StageCard key={tahap.id} tahap={tahap} sumber={teks.sumberData} judulIstilah={teks.judulIstilah} reduceMotion={reduceMotion} />
          </AnimatePresence>
        </div>

        {stage === 0 && (
          <p className="das-ft__hint" aria-hidden="true">
            {teks.petunjukScroll}
          </p>
        )}

        <p className="das-ft__caption">
          {current.keterangan} <span className="das-ft__credit">{current.kredit}</span>
        </p>
      </motion.div>
    </section>
  );
}

// Foto asli dengan rasio masing-masing (sebelum 5:3, sesudah 4:3), utuh ("contain") di tengah panggung.
function Photo({ base, file, alt, hidden, w, h }: { base: string; file: string; alt: string; hidden: boolean; w: number; h: number }) {
  return (
    <picture className="das-ft__photo">
      <source type="image/avif" srcSet={srcSet(base, file, 'avif')} sizes="100vw" />
      <source type="image/webp" srcSet={srcSet(base, file, 'webp')} sizes="100vw" />
      <img
        src={`${base}${file}-1024.webp`}
        alt={alt}
        aria-hidden={hidden || undefined}
        width={w}
        height={h}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
