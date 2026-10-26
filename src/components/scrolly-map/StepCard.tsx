import type { Step } from '../../content/types';
import type { petaTeks as defaultTeks } from '../../content/story';
import { TeksInline } from '../TeksInline';
import { warnaDampak } from './layers';

interface Props {
  step: Step;
  /** Daftar titik banjir (urut nama) — hanya untuk step dengan `daftarTitik`. */
  titik?: { id: string; nama: string }[];
  selectedPointId: string | null;
  onSelectPoint: (id: string) => void;
  teks: typeof defaultTeks;
  /** Step terakhir di mode iframe → ajakan lanjut membaca. */
  akhir: boolean;
}

/** Isi satu step cerita peta: judul, paragraf, lalu data pendukung (batang per wilayah / tabel / daftar titik). */
export function StepCard({ step, titik, selectedPointId, onSelectPoint, teks, akhir }: Props) {
  const data = step.dataWilayah;
  const max = data ? Math.max(...data.baris.map((b) => b.nilai)) : 0;
  return (
    <div className="das-sm__stepcard">
      {step.judul && <h3>{step.judul}</h3>}
      {step.teks.map((p, j) => (
        <p key={j}>
          <TeksInline teks={p} />
        </p>
      ))}

      {data && (
        // Warna batang = warna wilayah di peta, jadi daftar ini sekaligus legenda choropleth.
        <figure className="das-sm__bars">
          <figcaption>{data.judul}</figcaption>
          <ul>
            {data.baris.map((b) => (
              <li key={b.kode}>
                <span className="das-sm__bars-label">{b.label}</span>
                <span className="das-sm__bars-track" aria-hidden="true">
                  <i style={{ width: `${(b.nilai / max) * 100}%`, background: warnaDampak(b.nilai, max) }} />
                </span>
                <span className="das-sm__bars-val">
                  {b.nilai.toLocaleString('id-ID')} <span>{data.satuan}</span>
                </span>
              </li>
            ))}
          </ul>
        </figure>
      )}

      {step.tabel && (
        <table className="das-sm__table">
          <thead>
            <tr>
              {step.tabel.kolom.map((k) => (
                <th key={k} scope="col">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {step.tabel.baris.map((r, i) => (
              <tr key={r[0]} className={step.tabel?.sorot?.includes(i) ? 'is-sorot' : undefined}>
                {r.map((c, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {c}
                    </th>
                  ) : (
                    <td key={j}>{c}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {titik && titik.length > 0 && (
        <details className="das-sm__pointlist">
          <summary>{teks.daftarTitik.replace('{n}', String(titik.length))}</summary>
          <ul>
            {titik.map((p) => (
              <li key={p.id}>
                <button type="button" aria-pressed={selectedPointId === p.id} onClick={() => onSelectPoint(p.id)}>
                  {p.nama}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {step.keterangan && (
        <p className="das-sm__source">
          <TeksInline teks={step.keterangan} />
        </p>
      )}
      {akhir && <p className="das-sm__end">{teks.lanjutMembaca}</p>}
    </div>
  );
}
