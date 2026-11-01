import { useState } from 'react';
import './disabilitas.css';

/** Daftar centang pribadi pembaca (state lokal saja; tidak disimpan/dikirim). `progres`: "{n} dari {total} …". */
export function Ceklis({ petunjuk, item, progres }: { petunjuk: string; item: string[]; progres: string }) {
  const [centang, setCentang] = useState<boolean[]>(() => item.map(() => false));
  const n = centang.filter(Boolean).length;
  return (
    <fieldset className="das-ds__ceklis">
      <legend className="das-ds__petunjuk">{petunjuk}</legend>
      <ul>
        {item.map((teks, i) => (
          <li key={teks}>
            <label>
              <input
                type="checkbox"
                checked={centang[i]}
                onChange={(e) => setCentang((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
              />
              <span className="das-ds__kotak" aria-hidden="true" />
              <span>{teks}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="das-ds__progres" aria-hidden="true">
        <i style={{ width: `${(n / item.length) * 100}%` }} />
      </div>
      <p className="das-ds__progres-teks" aria-live="polite">
        {progres.replace('{n}', String(n)).replace('{total}', String(item.length))}
      </p>
    </fieldset>
  );
}
