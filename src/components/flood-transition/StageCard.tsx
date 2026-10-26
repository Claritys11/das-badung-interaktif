import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { SegmenAngka, TahapBanjir, VizTahap } from '../../content/banjir';

const fmt = (n: number, desimal: number) => n.toLocaleString('id-ID', { minimumFractionDigits: desimal, maximumFractionDigits: desimal });

/** Angka dihitung naik (ease-out) saat kartu muncul; reduced motion → langsung nilai akhir. */
function useCountUp(active: boolean, reduceMotion: boolean, durMs = 1100) {
  const [t, setT] = useState(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      setT(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durMs);
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setT(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduceMotion, durMs]);
  return t;
}

function Angka({ segmen, t }: { segmen: SegmenAngka[]; t: number }) {
  return (
    <>
      {segmen.map((s, i) =>
        typeof s === 'string' ? <span key={i}>{s}</span> : <span key={i}>{fmt((s.dari ?? 0) + (s.n - (s.dari ?? 0)) * t, s.desimal)}</span>,
      )}
    </>
  );
}

function Viz({ viz, t }: { viz: VizTahap; t: number }) {
  if (viz.jenis === 'ambang') {
    const pct = (v: number) => `${(v / viz.maks) * 100}%`;
    const [a, b] = viz.rentang;
    return (
      <figure className="das-ft-card__viz" aria-label={`${viz.labelRentang}: ${fmt(a, 1)}–${fmt(b, 1)}; ${viz.labelAmbang}`}>
        <div className="das-ft-viz__track">
          {/* Rentang hujan tumbuh dari kiri saat kartu muncul. */}
          <span className="das-ft-viz__range" style={{ left: pct(a), width: `calc(${pct(b - a)} * ${t})` }} />
          <span className="das-ft-viz__lead" style={{ width: `calc(${pct(a)} * ${t})` }} />
          <span className="das-ft-viz__threshold" style={{ left: pct(viz.ambang) }} />
        </div>
        <div className="das-ft-viz__labels" aria-hidden="true">
          <span style={{ left: pct(viz.ambang) }}>{viz.labelAmbang}</span>
          <span style={{ left: pct((a + b) / 2) }}>{viz.labelRentang}</span>
        </div>
      </figure>
    );
  }
  const w = (v: number) => `${(v / viz.maks) * 100}%`;
  return (
    <figure className="das-ft-card__viz das-ft-viz--banding">
      <div className="das-ft-viz__row">
        <span className="das-ft-viz__name">{viz.labelDari}</span>
        <span className="das-ft-viz__bar">
          <i style={{ width: w(viz.dari) }} />
        </span>
        <span className="das-ft-viz__val">{fmt(viz.dari, viz.desimal)}</span>
      </div>
      <div className="das-ft-viz__row is-ke">
        <span className="das-ft-viz__name">{viz.labelKe}</span>
        <span className="das-ft-viz__bar">
          <i style={{ width: `calc(${w(viz.dari)} + (${w(viz.ke)} - ${w(viz.dari)}) * ${t})` }} />
        </span>
        <span className="das-ft-viz__val">{fmt(viz.ke, viz.desimal)}</span>
      </div>
    </figure>
  );
}

interface StageCardProps {
  tahap: TahapBanjir;
  sumber: string;
  judulIstilah: string;
  reduceMotion: boolean;
}

export function StageCard({ tahap, sumber, judulIstilah, reduceMotion }: StageCardProps) {
  const t = useCountUp(true, reduceMotion);
  return (
    <motion.article
      className={`das-ft-card${tahap.meluap ? ' is-meluap' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0, transition: { type: false } } : { opacity: 0, y: -10, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
    >
      <p className="das-ft-card__label">{tahap.label}</p>
      {tahap.angka && (
        <p className="das-ft-card__angka">
          {/* Angka animasi disembunyikan dari pembaca layar; nilai akhir dibacakan sekali. */}
          <span aria-hidden="true">
            <Angka segmen={tahap.angka} t={t} />
          </span>
          <span className="das-visually-hidden">
            <Angka segmen={tahap.angka} t={1} />
          </span>
          {tahap.satuan && <span className="das-ft-card__satuan"> {tahap.satuan}</span>}
        </p>
      )}
      <p className="das-ft-card__teks">{tahap.teks}</p>
      {tahap.viz && <Viz viz={tahap.viz} t={t} />}
      {tahap.istilah && (
        <section className="das-ft-card__istilah" aria-label={judulIstilah}>
          <p className="das-ft-card__istilah-judul">{judulIstilah}</p>
          <dl>
            {tahap.istilah.map((i) => (
              <div key={i.istilah}>
                <dt>{i.istilah}</dt>
                <dd>{i.arti}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <p className="das-ft-card__sumber">{sumber}</p>
    </motion.article>
  );
}
