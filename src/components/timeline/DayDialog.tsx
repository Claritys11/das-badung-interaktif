import { useEffect, useRef } from 'react';
import type { HariTimeline } from '../../content/types';
import type { timelineTeks as defaultTeks } from '../../content/timeline';
import { IconClose, IconNext, IconPrev } from '../icons';

interface Props {
  hari: HariTimeline[];
  /** Indeks hari yang dibuka; null = tertutup. */
  index: number | null;
  teks: typeof defaultTeks;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

/**
 * Pop-up semua peristiwa pada satu tanggal. Memakai <dialog> bawaan browser (showModal): fokus
 * terkunci di dalam dialog, Esc menutup, fokus kembali ke tombol pemicu, lapisan di atas segalanya.
 */
export function DayDialog({ hari, index, teks, onNavigate, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const h = index === null ? null : hari[index];

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (index !== null && !dlg.open) {
      dlg.showModal();
      document.documentElement.classList.add('das-tl-lock'); // kunci scroll halaman di belakang
    } else if (index === null && dlg.open) {
      dlg.close();
    }
  }, [index]);

  // Ganti hari (tombol sebelumnya/berikutnya) → daftar kembali ke atas.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => () => document.documentElement.classList.remove('das-tl-lock'), []);

  return (
    <dialog
      ref={ref}
      className="das-root das-tl-dialog"
      aria-labelledby="das-tl-dialog-title"
      onClose={() => {
        document.documentElement.classList.remove('das-tl-lock');
        onClose();
      }}
      // Klik di latar (di luar kotak dialog) menutup.
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
    >
      {h && index !== null && (
        <div className="das-tl-dialog__box">
          <header className="das-tl-dialog__head">
            <div>
              <time dateTime={h.tanggal} className="das-tl-dialog__date">
                {h.label}
              </time>
              <h3 id="das-tl-dialog-title">{h.judul}</h3>
              <p className="das-tl-dialog__count">
                {h.peristiwa.length} {teks.peristiwa}
              </p>
            </div>
            <button type="button" className="das-iconbtn" onClick={() => ref.current?.close()} aria-label={teks.tutup}>
              <IconClose />
            </button>
          </header>

          <div ref={bodyRef} className="das-tl-dialog__body">
            {h.gambar && (
              <figure className="das-tl__figure">
                <img src={h.gambar.src} alt={h.gambar.alt} decoding="async" />
                <figcaption>{h.gambar.kredit}</figcaption>
              </figure>
            )}
            <ol className="das-tl-dialog__events">
              {h.peristiwa.map((p, k) => (
                <li key={k}>
                  <span className={`das-tl__time${p.waktu ? '' : ' is-empty'}`}>{p.waktu ?? ''}</span>
                  <p>{p.teks}</p>
                </li>
              ))}
            </ol>
          </div>

          <footer className="das-tl-dialog__foot">
            <button type="button" className="das-tl-dialog__nav" onClick={() => onNavigate(index - 1)} disabled={index === 0}>
              <IconPrev />
              {teks.hariSebelumnya}
            </button>
            <button type="button" className="das-tl-dialog__nav" onClick={() => onNavigate(index + 1)} disabled={index === hari.length - 1}>
              {teks.hariBerikutnya}
              <IconNext />
            </button>
          </footer>
        </div>
      )}
    </dialog>
  );
}
