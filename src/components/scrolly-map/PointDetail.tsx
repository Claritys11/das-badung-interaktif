import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { KontenTitik } from '../../content/types';
import { IconClose } from '../icons';

interface Props {
  konten: KontenTitik;
  variant: 'panel' | 'sheet';
  labels: { tutup: string; badgeKmz: string; badgePlaceholder: string };
  onClose: () => void;
}

/** Penjelasan khusus satu titik banjir: panel di kolom kiri (desktop) atau bottom sheet (mobile). */
export function PointDetail({ konten, variant, labels, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Fokus pindah ke judul supaya pembaca layar langsung membaca penjelasan titik.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [konten]);

  const offset = variant === 'sheet' ? { y: 24 } : { x: -16 };
  return (
    <motion.aside
      className={`das-sm__detail das-sm__detail--${variant}`}
      aria-labelledby="das-sm-detail-title"
      initial={reduceMotion ? false : { opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={reduceMotion ? { opacity: 0, transition: { type: false } } : { opacity: 0, ...offset, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="das-sm__detail-head">
        <h3 id="das-sm-detail-title" ref={headingRef} tabIndex={-1}>
          {konten.judul}
        </h3>
        <button type="button" className="das-iconbtn das-sm__detail-close" onClick={onClose} aria-label={labels.tutup}>
          <IconClose />
        </button>
      </div>
      <p className={konten.sumber === 'placeholder' ? 'is-placeholder' : undefined}>{konten.deskripsi}</p>
      <p className={`das-sm__badge das-sm__badge--${konten.sumber}`}>
        {konten.sumber === 'kmz' ? labels.badgeKmz : labels.badgePlaceholder}
      </p>
    </motion.aside>
  );
}
