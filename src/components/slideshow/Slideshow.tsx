import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Slide } from '../../content/types';
import { IconNext, IconPause, IconPlay, IconPrev } from '../icons';
import { useAutoplay, useInView, usePageVisible } from './useAutoplay';
import '../../styles/tokens.css';
import './slideshow.css';

export interface SlideshowProps {
  slides: Slide[];
  /** Folder hasil `pnpm images`. Default: "<base>/citra/". Untuk Framer: URL absolut hosting. */
  assetBaseUrl?: string;
  judul?: string;
  kredit?: string;
  keterangan?: string;
  autoplay?: boolean;
  intervalMs?: number;
  /** Durasi crossfade (detik). */
  fadeSeconds?: number;
  className?: string;
}

const WIDTHS = [640, 1024, 1485];
const SIZES = '(max-width: 720px) 100vw, min(100vw, 1120px)';
const SWIPE_PX = 40;

const srcSet = (base: string, file: string, ext: string) => WIDTHS.map((w) => `${base}${file}-${w}.${ext} ${w}w`).join(', ');

// Posisi tiap slide di penggaris waktu (0..1), proporsional terhadap tanggal sebenarnya.
function timelinePositions(slides: Slide[]) {
  const t = slides.map((s) => {
    const [y, m = '6'] = s.tanggal.split('-');
    return Number(y) + (Number(m) - 1) / 12;
  });
  const min = Math.min(...t);
  const span = Math.max(...t) - min || 1;
  return t.map((v) => (v - min) / span);
}

export function Slideshow({
  slides,
  assetBaseUrl = `${import.meta.env.BASE_URL}citra/`,
  judul,
  kredit,
  keterangan,
  autoplay = true,
  intervalMs = 3000,
  fadeSeconds = 0.9,
  className,
}: SlideshowProps) {
  const reduceMotion = useReducedMotion() ?? false;
  // `prev` = slide lama yang tetap tampil penuh di bawah selama slide baru fade-in di atasnya
  // (crossfade tanpa "kedip" gelap). Dilepas setelah animasi selesai.
  const [{ index, prev: prevIndex }, setPos] = useState<{ index: number; prev: number | null }>({ index: 0, prev: null });
  const [playing, setPlaying] = useState(autoplay);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const rootRef = useRef<HTMLElement>(null);
  const inView = useInView(rootRef);
  const pageVisible = usePageVisible();
  const positions = useMemo(() => timelinePositions(slides), [slides]);

  // prefers-reduced-motion: autoplay mati (user tetap bisa menyalakannya sendiri).
  useEffect(() => {
    if (reduceMotion) setPlaying(false);
  }, [reduceMotion]);

  const running = playing && !hovered && !focused && inView && pageVisible && slides.length > 1;

  // Menekan Play secara eksplisit selalu menang atas jeda-karena-fokus/hover.
  const togglePlay = () => {
    if (!playing) {
      setFocused(false);
      setHovered(false);
    }
    setPlaying(!playing);
  };

  const goTo = useCallback(
    (i: number) => {
      const n = slides.length;
      const next = ((i % n) + n) % n;
      setPos((cur) => (cur.index === next ? cur : { index: next, prev: cur.index }));
    },
    [slides.length],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useAutoplay(running, intervalMs, next, index);

  // Format yang dipilih browser untuk <picture> pertama (avif/webp) — dipakai untuk preload,
  // supaya slide berikutnya tidak diunduh dua kali dalam dua format.
  const [format, setFormat] = useState<'avif' | 'webp' | null>(null);

  // Preload slide berikutnya. Image() dengan srcset+sizes → browser tetap memilih lebar yang pas.
  useEffect(() => {
    if (!format || slides.length < 2) return;
    const s = slides[(index + 1) % slides.length];
    const img = new Image();
    img.decoding = 'async';
    img.sizes = SIZES;
    img.srcset = srcSet(assetBaseUrl, s.file, format);
  }, [index, slides, assetBaseUrl, format]);

  const markLoaded = (img: HTMLImageElement, file: string) => {
    if (!format) setFormat(/\.avif(\?|$)/.test(img.currentSrc) ? 'avif' : 'webp');
    setLoaded((s) => (s.has(file) ? s : new Set(s).add(file)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(slides.length - 1);
    } else if ((e.key === ' ' || e.key === 'Spacebar') && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      togglePlay();
    }
  };

  // Swipe (pointer events): geser horizontal > 40px = pindah slide.
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  };

  // Penggaris waktu: pilih slide terdekat dari posisi pointer.
  const rulerRef = useRef<HTMLDivElement>(null);
  const pickFromRuler = (clientX: number) => {
    const r = rulerRef.current?.querySelector('.das-ss__track')?.getBoundingClientRect();
    if (!r) return;
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    let best = 0;
    positions.forEach((v, i) => {
      if (Math.abs(v - p) < Math.abs(positions[best] - p)) best = i;
    });
    goTo(best);
  };

  const slide = slides[index];
  const fade = reduceMotion ? 0 : fadeSeconds;
  const isLoaded = loaded.has(slide.file);

  return (
    <section
      ref={rootRef}
      className={`das-root das-ss ${className ?? ''}`}
      aria-roledescription="carousel"
      aria-label={judul ?? 'Citra satelit dari tahun ke tahun'}
      // Jeda saat hover hanya untuk mouse (sentuhan memicu mouseenter tanpa mouseleave).
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
      // Jeda saat fokus hanya untuk fokus keyboard; klik mouse/sentuh pada tombol tidak menjeda.
      onFocus={(e) => (e.target as Element).matches(':focus-visible') && setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
    >
      {judul && <h3 className="das-ss__title">{judul}</h3>}

      <div
        className="das-ss__frame"
        tabIndex={0}
        aria-label="Citra satelit. Gunakan panah kiri/kanan untuk berpindah tahun, spasi untuk putar/jeda."
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
      >
        {prevIndex !== null && (
          <SlidePicture
            // Key terpisah dari slide aktif: layer bawah selalu elemen baru yang buram penuh. (Memakai ulang
            // node slide aktif akan membawa opacity setengah-fade saat navigasi cepat.) Gambarnya sudah
            // ada di cache memori, jadi decoding "sync" menggambarnya di frame yang sama — tanpa kedip.
            key={`prev-${prevIndex}`}
            slide={slides[prevIndex]}
            base={assetBaseUrl}
            eager
            decodeSync
            style={{ zIndex: 1 }}
          />
        )}
        <SlidePicture
          key={`cur-${index}`}
          slide={slide}
          base={assetBaseUrl}
          eager={index === 0}
          style={{ zIndex: 2 }}
          variants={slideVariants}
          custom={fade}
          initial={prevIndex === null ? 'in' : 'out'}
          // Slide pertama (tanpa slide lama di bawahnya) langsung tampil penuh — tidak memudar menunggu load.
          animate={isLoaded || prevIndex === null ? 'in' : 'out'}
          onAnimationComplete={() => {
            if (isLoaded) setPos((cur) => (cur.prev === null ? cur : { ...cur, prev: null }));
          }}
          onImgLoad={(img) => markLoaded(img, slide.file)}
        />

        <p className="das-ss__year" aria-live={running ? 'off' : 'polite'} aria-atomic="true">
          {slide.label}
        </p>
      </div>

      <div className="das-ss__controls">
        <div className="das-ss__buttons">
          <button type="button" className="das-iconbtn" onClick={prev} aria-label="Citra sebelumnya">
            <IconPrev />
          </button>
          <button
            type="button"
            className="das-iconbtn das-ss__play"
            onClick={togglePlay}
            aria-label={playing ? 'Jeda slideshow' : 'Putar slideshow'}
            aria-pressed={playing}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <button type="button" className="das-iconbtn" onClick={next} aria-label="Citra berikutnya">
            <IconNext />
          </button>
        </div>

        <div
          ref={rulerRef}
          className="das-ss__ruler"
          role="slider"
          tabIndex={0}
          aria-label="Pilih tahun citra"
          aria-valuemin={1}
          aria-valuemax={slides.length}
          aria-valuenow={index + 1}
          aria-valuetext={slide.label}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pickFromRuler(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) pickFromRuler(e.clientX);
          }}
        >
          <div className="das-ss__track" aria-hidden="true">
            {slides.map((s, i) => (
              <span
                key={s.file}
                className={`das-ss__tick${i === index ? ' is-active' : ''}${i < index ? ' is-past' : ''}`}
                style={{ left: `${positions[i] * 100}%` }}
              />
            ))}
          </div>
          <div className="das-ss__rulerlabels" aria-hidden="true">
            <span style={{ left: 0 }}>{slides[0].tanggal.slice(0, 4)}</span>
            <span style={{ left: '100%' }}>{slides[slides.length - 1].tanggal.slice(0, 4)}</span>
          </div>
        </div>
      </div>

      {(kredit || keterangan) && (
        <p className="das-ss__caption">
          {keterangan}
          {keterangan && kredit ? ' ' : ''}
          {kredit && <span className="das-ss__credit">{kredit}</span>}
        </p>
      )}
    </section>
  );
}

// Catatan: di motion, `duration: 0` TIDAK berarti instan (dianggap kosong → transisi default).
// Transisi instan harus ditulis `type: false`.
const INSTANT = { type: false } as const;
const slideVariants = {
  in: (fade: number) => ({ opacity: 1, transition: fade > 0 ? { duration: fade, ease: [0.4, 0, 0.2, 1] as const } : INSTANT }),
  out: { opacity: 0, transition: INSTANT },
};

type SlidePictureProps = {
  slide: Slide;
  base: string;
  eager?: boolean;
  decodeSync?: boolean;
  onImgLoad?: (img: HTMLImageElement) => void;
} & Omit<React.ComponentProps<typeof motion.picture>, 'children'>;

function SlidePicture({ slide, base, eager, decodeSync, onImgLoad, ...motionProps }: SlidePictureProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const onLoadRef = useRef(onImgLoad);
  onLoadRef.current = onImgLoad;
  // Gambar dari cache bisa sudah "complete" sebelum onLoad terpasang → cek sekali saat mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) onLoadRef.current?.(img);
  }, []);
  return (
    <motion.picture className="das-ss__slide" {...motionProps}>
      <source type="image/avif" srcSet={srcSet(base, slide.file, 'avif')} sizes={SIZES} />
      <source type="image/webp" srcSet={srcSet(base, slide.file, 'webp')} sizes={SIZES} />
      <img
        src={`${base}${slide.file}-1024.webp`}
        alt={slide.alt}
        width={1485}
        height={892}
        draggable={false}
        decoding={decodeSync ? 'sync' : 'async'}
        loading={eager ? 'eager' : 'lazy'}
        // @ts-expect-error — atribut HTML valid; tipe React 18 belum mengenalnya.
        fetchpriority={eager ? 'high' : 'auto'}
        ref={imgRef}
        onLoad={(e) => onLoadRef.current?.(e.currentTarget)}
      />
    </motion.picture>
  );
}
