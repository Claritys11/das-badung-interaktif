import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { BabDisabilitas, BlokDisabilitas, disabilitasTeks as defaultTeks } from '../../content/disabilitas';
import { TeksInline } from '../TeksInline';
import '../../styles/tokens.css';
import './disabilitas.css';

export interface DisabilitasProps {
  bab: BabDisabilitas[];
  teks: typeof defaultTeks;
  /** Folder gambar hasil `pnpm disabilitas`. Default: "<base>/disabilitas/". Untuk Framer: URL absolut hosting. */
  assetBaseUrl?: string;
  className?: string;
}

/** Visual "disabilitas & bencana": bab (foto opsional) dengan pilihan langkah, daftar centang, dan tab kelompok. */
export function Disabilitas({ bab, teks, assetBaseUrl = `${import.meta.env.BASE_URL}disabilitas/`, className }: DisabilitasProps) {
  return (
    <section className={`das-root das-ds ${className ?? ''}`} aria-label={teks.labelBagian}>
      {bab.map((b) => (
        <article key={b.id} className="das-ds__bab" aria-labelledby={`das-ds-${b.id}`}>
          {b.gambar && <Gambar g={b.gambar} base={assetBaseUrl} />}
          <div className="das-ds__isi">
            <p className="das-ds__label">{b.label}</p>
            <h2 id={`das-ds-${b.id}`}>{b.judul}</h2>
            <Blok blok={b.blok} teks={teks} />
          </div>
        </article>
      ))}
    </section>
  );
}

function Gambar({ g, base }: { g: NonNullable<BabDisabilitas['gambar']>; base: string }) {
  return (
    <picture className="das-ds__gambar">
      <source type="image/avif" srcSet={srcSet(base, g.file, 'avif')} sizes="(max-width: 1020px) 100vw, 980px" />
      <img
        src={`${base}${g.file}-1050.webp`}
        srcSet={srcSet(base, g.file, 'webp')}
        sizes="(max-width: 1020px) 100vw, 980px"
        width={1050}
        height={585}
        alt={g.alt}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

const srcSet = (base: string, file: string, ext: string) => `${base}${file}-640.${ext} 640w, ${base}${file}-1050.${ext} 1050w`;

function Blok({ blok, teks }: { blok: BlokDisabilitas[]; teks: typeof defaultTeks }) {
  return (
    <>
      {blok.map((b, i) => {
        switch (b.jenis) {
          case 'paragraf':
            return (
              <p key={i} className="das-ds__p">
                <TeksInline teks={b.teks} />
              </p>
            );
          case 'percakapan':
            return (
              <dl key={i} className="das-ds__chat">
                {b.baris.map((r, j) => (
                  <div key={j} className={j % 2 ? 'is-kanan' : undefined}>
                    <dt>{r.pembicara}</dt>
                    <dd>{r.teks}</dd>
                  </div>
                ))}
              </dl>
            );
          case 'pilihan':
            return <Pilihan key={i} blok={b} teks={teks} />;
          case 'ceklis':
            return <Ceklis key={i} blok={b} teks={teks} />;
          case 'tab':
            return <Tab key={i} blok={b} teks={teks} />;
        }
      })}
    </>
  );
}

type Of<J extends BlokDisabilitas['jenis']> = Extract<BlokDisabilitas, { jenis: J }>;

/** Pembaca memilih satu langkah → akibatnya tampil di bawah. Pilihan bisa diganti untuk membandingkan. */
function Pilihan({ blok, teks }: { blok: Of<'pilihan'>; teks: typeof defaultTeks }) {
  const [dipilih, setDipilih] = useState<string | null>(null);
  const id = useId();
  const aktif = blok.opsi.find((o) => o.id === dipilih);
  return (
    <div className="das-ds__pilihan">
      <p className="das-ds__petunjuk">{blok.petunjuk}</p>
      <p className="das-ds__tanya" id={`${id}-tanya`}>
        {blok.pertanyaan}
      </p>
      <div className="das-ds__opsi" role="group" aria-labelledby={`${id}-tanya`}>
        {blok.opsi.map((o) => (
          <button key={o.id} type="button" aria-pressed={dipilih === o.id} aria-controls={`${id}-akibat`} onClick={() => setDipilih(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      <div id={`${id}-akibat`} className="das-ds__akibat" aria-live="polite">
        {aktif && (
          <div key={aktif.id} className="das-ds__akibat-isi">
            <Blok blok={aktif.akibat} teks={teks} />
            <p className="das-ds__catatan">{teks.pilihUlang}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Daftar centang pribadi pembaca (state lokal saja; tidak disimpan/dikirim). */
function Ceklis({ blok, teks }: { blok: Of<'ceklis'>; teks: typeof defaultTeks }) {
  const [centang, setCentang] = useState<boolean[]>(() => blok.item.map(() => false));
  const id = useId();
  const n = centang.filter(Boolean).length;
  return (
    <fieldset className="das-ds__ceklis">
      <legend className="das-ds__petunjuk">{blok.petunjuk}</legend>
      <ul>
        {blok.item.map((item, i) => (
          <li key={item}>
            <label>
              <input
                type="checkbox"
                checked={centang[i]}
                onChange={(e) => setCentang((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
              />
              <span className="das-ds__kotak" aria-hidden="true" />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="das-ds__progres" aria-hidden="true">
        <i style={{ width: `${(n / blok.item.length) * 100}%` }} />
      </div>
      <p id={`${id}-progres`} className="das-ds__progres-teks" aria-live="polite">
        {teks.progresCeklis.replace('{n}', String(n)).replace('{total}', String(blok.item.length))}
      </p>
    </fieldset>
  );
}

/** Tab ARIA: panah kiri/kanan/Home/End berpindah kelompok. Awalnya belum ada yang dipilih. */
function Tab({ blok, teks }: { blok: Of<'tab'>; teks: typeof defaultTeks }) {
  const [aktif, setAktif] = useState<string | null>(null);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const indeks = blok.opsi.findIndex((o) => o.id === aktif);

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const last = blok.opsi.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setAktif(blok.opsi[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="das-ds__tab">
      <p className="das-ds__petunjuk" id={`${id}-petunjuk`}>
        {blok.petunjuk}
      </p>
      <div className="das-ds__tablist" role="tablist" aria-labelledby={`${id}-petunjuk`}>
        {blok.opsi.map((o, i) => (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${o.id}`}
            aria-selected={aktif === o.id}
            aria-controls={`${id}-panel`}
            tabIndex={aktif === o.id || (indeks < 0 && i === 0) ? 0 : -1}
            onClick={() => setAktif(o.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {indeks >= 0 && (
        <div key={aktif} id={`${id}-panel`} className="das-ds__panel" role="tabpanel" aria-labelledby={`${id}-tab-${aktif}`} tabIndex={0}>
          <Blok blok={blok.opsi[indeks].isi} teks={teks} />
        </div>
      )}
    </div>
  );
}
