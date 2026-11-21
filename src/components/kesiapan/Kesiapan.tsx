import type { KelompokKesiapan, kesiapanTeks as defaultTeks } from '../../content/kesiapan';
import { Ceklis } from '../disabilitas/Ceklis';
import '../../styles/tokens.css';
import './kesiapan.css';

export interface KesiapanProps {
  kelompok: KelompokKesiapan[];
  teks: typeof defaultTeks;
  className?: string;
}

/** Penutup artikel: langkah kesiapan menghadapi bencana, dipecah per tema supaya tidak menjadi satu daftar panjang. */
export function Kesiapan({ kelompok, teks, className }: KesiapanProps) {
  return (
    <section className={`das-root das-ks ${className ?? ''}`} aria-label={teks.labelBagian}>
      <div className="das-ks__kelompok">
        {kelompok.map((k) => (
          <Ceklis key={k.id} petunjuk={k.judul} item={k.item} progres={teks.progresCeklis} />
        ))}
      </div>
    </section>
  );
}
