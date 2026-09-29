import { useEffect, useRef, useState } from 'react';
import type { HariTimeline } from '../../content/types';
import type { timelineTeks as defaultTeks } from '../../content/timeline';
import { DayDialog } from './DayDialog';
import '../../styles/tokens.css';
import './timeline.css';

export interface TimelineProps {
  hari: HariTimeline[];
  teks: typeof defaultTeks;
  /** Jumlah peristiwa yang dicuplik di kartu aktif (kartu lain hanya 1). */
  cuplikan?: number;
  className?: string;
}

/**
 * Timeline per tanggal. Kartu yang paling dekat dengan 1/3 tinggi layar menjadi "aktif" dan membuka
 * cuplikan peristiwanya (pola komponen release-time-line). Klik kartu → pop-up berisi semua peristiwa
 * pada tanggal itu.
 */
export function Timeline({ hari, teks, cuplikan = 3, className }: TimelineProps) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const markers = useRef<(HTMLElement | null)[]>([]);

  // Kartu aktif = penanda terdekat ke 1/3 tinggi layar. Dihitung saat scroll (fase capture → juga
  // menangkap scroll di dalam iframe/container), bukan loop rAF terus-menerus.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const target = window.innerHeight / 3;
      let best = 0;
      let bestDist = Infinity;
      markers.current.forEach((el, i) => {
        if (!el) return;
        const dist = Math.abs(el.getBoundingClientRect().top - target);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
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
  }, [hari.length]);

  return (
    <section className={`das-root das-tl ${className ?? ''}`} aria-labelledby="das-tl-judul">
      <header className="das-tl__header">
        <h2 id="das-tl-judul">{teks.judul}</h2>
        <p>{teks.pengantar}</p>
      </header>

      <ol className="das-tl__list">
        {hari.map((h, i) => {
          const isActive = i === active;
          const n = h.peristiwa.length;
          const shown = h.peristiwa.slice(0, isActive ? cuplikan : 1);
          const hidden = n - shown.length;
          return (
            <li key={h.tanggal} className={`das-tl__day${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'step' : undefined}>
              <div
                className="das-tl__meta"
                ref={(el) => {
                  markers.current[i] = el;
                }}
              >
                <time dateTime={h.tanggal} className="das-tl__date">
                  {h.label}
                </time>
                <p className="das-tl__count">
                  {n} {teks.peristiwa}
                </p>
                {/* Satu garis = satu peristiwa: kepadatan kejadian per hari terlihat sekilas. */}
                <span className="das-tl__tally" aria-hidden="true">
                  {h.peristiwa.map((_, k) => (
                    <i key={k} />
                  ))}
                </span>
              </div>

              <article className="das-tl__card">
                {h.gambar && (
                  <figure className="das-tl__figure">
                    <img src={h.gambar.src} alt={h.gambar.alt} loading="lazy" decoding="async" />
                    <figcaption>{h.gambar.kredit}</figcaption>
                  </figure>
                )}
                <h3 className="das-tl__title">{h.judul}</h3>
                <ul className="das-tl__teaser">
                  {shown.map((p, k) => (
                    <li key={k}>
                      {p.waktu && <span className="das-tl__time">{p.waktu}</span>}
                      <span className="das-tl__text">{p.teks}</span>
                    </li>
                  ))}
                </ul>
                <div className="das-tl__foot">
                  {hidden > 0 && (
                    <span className="das-tl__more">
                      +{hidden} {teks.lainnya}
                    </span>
                  )}
                  {/* Tombol "stretched": seluruh kartu dapat diklik, tetap satu target fokus. */}
                  <button type="button" className="das-tl__open" onClick={() => setOpen(i)} aria-haspopup="dialog">
                    {teks.lihatSemua}
                    <span className="das-visually-hidden">: {h.label}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M9 6l6 6-6 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      <p className="das-tl__source">{teks.sumber}</p>

      <DayDialog hari={hari} index={open} teks={teks} onNavigate={setOpen} onClose={() => setOpen(null)} />
    </section>
  );
}
