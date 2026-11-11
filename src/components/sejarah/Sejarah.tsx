import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import type { BabSejarah, EraPeta, KameraSejarah, MediaSejarah, sejarahTeks as defaultTeks } from '../../content/sejarah';
import { petaLama } from '../../content/sejarah-peta';
import { TeksInline } from '../TeksInline';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../../styles/tokens.css';
import './sejarah.css';

const PetaSejarah = lazy(() => import('./PetaSejarah').then((m) => ({ default: m.PetaSejarah })));

export interface SejarahProps {
  bab: BabSejarah[];
  teks: typeof defaultTeks;
  /** API key MapTiler. Default: VITE_MAPTILER_KEY. */
  apiKey?: string;
  /** Folder hasil `pnpm sejarah`. Default: "<base>/sejarah/". Untuk Framer: URL absolut hosting. */
  assetBaseUrl?: string;
  className?: string;
}

const ERA: EraPeta[] = ['kerajaan', '1915', '1930', 'sekarang'];
const BATAS_SEMPIT = '(max-width: 959px)';
const WIDTHS = [640, 1050];

function useCocok(query: string) {
  const [cocok, setCocok] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const m = matchMedia(query);
    const on = () => setCocok(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return cocok;
}

/** true setelah elemen mendekati layar (sekali jalan): aset berat baru dimuat saat pembaca hampir sampai. */
function useDekat(jarak = '150% 0px') {
  const ref = useRef<HTMLDivElement>(null);
  const [dekat, setDekat] = useState(false);
  useEffect(() => {
    if (dekat || !ref.current) return;
    if (typeof IntersectionObserver === 'undefined') return setDekat(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setDekat(true), { rootMargin: jarak });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [dekat, jarak]);
  return [ref, dekat] as const;
}

/** Chunk peta gagal diunduh (jaringan) → tampilkan pesan, jangan menjatuhkan seluruh halaman. */
class BatasPeta extends Component<{ onError: () => void; children: ReactNode }, { gagal: boolean }> {
  state = { gagal: false };
  static getDerivedStateFromError() {
    return { gagal: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.gagal ? null : this.props.children;
  }
}

/* ---------- Pembuka: hanya gambar dulu, judul muncul saat di-scroll ---------- */
function Hero({ teks, base, reduceMotion }: { teks: typeof defaultTeks; base: string; reduceMotion: boolean }) {
  const [dekatRef, dekat] = useDekat();
  const ruang = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [jalan, setJalan] = useState(false);
  const inginJalan = useRef(!reduceMotion);
  useEffect(() => {
    inginJalan.current = !reduceMotion;
  }, [reduceMotion]);

  // Judul muncul mengikuti scroll: 0 (hanya gambar) → 1 (judul penuh), lewat variabel CSS --das-sj-judul.
  // Sengaja tanpa useTransform motion: animasi opasitasnya memudar lagi setelah rentang selesai.
  useEffect(() => {
    const el = ruang.current;
    if (!el || reduceMotion) return;
    let raf = 0;
    const hitung = () => {
      raf = 0;
      const jarak = el.offsetHeight - innerHeight;
      const p = jarak > 0 ? -el.getBoundingClientRect().top / jarak : 1;
      el.style.setProperty('--das-sj-judul', String(Math.min(1, Math.max(0, (p - 0.14) / 0.28))));
    };
    const jadwal = () => {
      raf ||= requestAnimationFrame(hitung);
    };
    hitung();
    addEventListener('scroll', jadwal, { passive: true, capture: true });
    addEventListener('resize', jadwal);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', jadwal, { capture: true });
      removeEventListener('resize', jadwal);
    };
  }, [reduceMotion]);

  // Video hanya berjalan selama terlihat, dan tidak otomatis bila pembaca memilih gerak dikurangi.
  useEffect(() => {
    const v = video.current;
    if (!v || !dekat || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && inginJalan.current) v.play().catch(() => setJalan(false));
      else if (!e.isIntersecting) v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [dekat]);

  const alih = () => {
    const v = video.current;
    if (!v) return;
    inginJalan.current = v.paused;
    if (v.paused) v.play().catch(() => setJalan(false));
    else v.pause();
  };

  const mp4 = `${base}${teks.heroVideo.mp4}`;
  const webm = `${base}${teks.heroVideo.webm}`;
  return (
    <div ref={ruang} className={`das-sj__hero ${reduceMotion ? 'is-diam' : ''}`}>
      <figure ref={dekatRef} className="das-sj__hero-panggung">
        {dekat && (
          <video
            ref={video}
            className="das-sj__hero-video"
            poster={`${base}${teks.heroVideo.poster}`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            onPlay={() => setJalan(true)}
            onPause={() => setJalan(false)}
          >
            <source src={webm} type="video/webm" />
            <source src={mp4} type="video/mp4" />
          </video>
        )}
        <div className="das-sj__hero-redup" />
        <figcaption className="das-sj__hero-teks">
          <h2>{teks.judul}</h2>
          <p>
            <TeksInline teks={teks.heroCaption} />
          </p>
        </figcaption>
        <button type="button" className="das-sj__hero-alih" onClick={alih} aria-label={jalan ? teks.jeda : teks.putar}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {jalan ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5l11 7-11 7z" />}
          </svg>
        </button>
      </figure>
    </div>
  );
}

/* ---------- Isi panel media ---------- */
const srcSet = (base: string, m: Extract<MediaSejarah, { jenis: 'foto' }>, ext: string) =>
  WIDTHS.filter((w) => w === 640 || m.lebar >= w)
    .map((w) => `${base}${m.file}-${w}.${ext} ${w}w`)
    .join(', ');

function Foto({ media, base, aktif }: { media: Extract<MediaSejarah, { jenis: 'foto' }>; base: string; aktif: boolean }) {
  const sizes = `(max-width: 959px) 100vw, 60vw`;
  const terbesar = media.lebar >= 1050 ? 1050 : 640;
  return (
    <picture className={`das-sj__foto ${aktif ? 'is-aktif' : ''}`} data-foto={media.file}>
      <source type="image/avif" srcSet={srcSet(base, media, 'avif')} sizes={sizes} />
      <img
        src={`${base}${media.file}-${terbesar}.webp`}
        srcSet={srcSet(base, media, 'webp')}
        sizes={sizes}
        width={media.lebar}
        height={media.tinggi}
        alt=""
        decoding="async"
      />
    </picture>
  );
}

/* ---------- Komponen utama ---------- */
export function Sejarah({
  bab,
  teks,
  apiKey = import.meta.env.VITE_MAPTILER_KEY ?? '',
  assetBaseUrl = `${import.meta.env.BASE_URL}sejarah/`,
  className,
}: SejarahProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const sempit = useCocok(BATAS_SEMPIT);

  // Daftar datar semua segmen, urut baca.
  const segmen = useMemo(
    () =>
      bab.flatMap((b) =>
        b.segmen.map((s, i) => ({
          ...s,
          kunci: `${b.id}-${i}`,
          // Caption ditampilkan di awal bab, dan tiap kali media berganti di dalam bab.
          tampilCaption: i === 0 || b.segmen[i - 1].media.id !== s.media.id,
        })),
      ),
    [bab],
  );
  const foto = useMemo(() => {
    const unik = new Map<string, Extract<MediaSejarah, { jenis: 'foto' }>>();
    for (const s of segmen) if (s.media.jenis === 'foto') unik.set(s.media.id, s.media);
    return [...unik.values()];
  }, [segmen]);

  const [aktif, setAktif] = useState(0);
  const elSegmen = useRef<(HTMLDivElement | null)[]>([]);
  const elPanel = useRef<HTMLDivElement>(null);

  // Garis baca: desktop di 62% tinggi layar; layar sempit di tengah ruang teks di bawah panel.
  const garisBaca = useCallback(() => {
    const t = innerHeight;
    if (!sempit) return t * 0.62;
    const b = elPanel.current?.getBoundingClientRect().height ?? 0;
    return b + (t - b) * 0.45;
  }, [sempit]);

  useEffect(() => {
    let raf = 0;
    const hitung = () => {
      raf = 0;
      const garis = garisBaca();
      let baru = 0;
      elSegmen.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= garis) baru = i;
      });
      setAktif(baru);
    };
    const jadwal = () => {
      raf ||= requestAnimationFrame(hitung);
    };
    hitung();
    addEventListener('scroll', jadwal, { passive: true, capture: true });
    addEventListener('resize', jadwal);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', jadwal, { capture: true });
      removeEventListener('resize', jadwal);
    };
  }, [garisBaca]);

  const media = segmen[aktif]?.media;
  // Peta tetap di era & kamera peta terakhir saat foto tampil, supaya tidak bergerak di balik foto.
  const terakhirPeta = useRef<{ era: EraPeta; kamera: KameraSejarah; alt: string } | null>(null);
  const seg = segmen[aktif];
  if (seg?.media.jenis === 'peta' && seg.kamera) terakhirPeta.current = { era: seg.media.era, kamera: seg.kamera, alt: seg.media.alt };
  const pertamaPeta = useMemo(() => {
    const s = segmen.find((x) => x.media.jenis === 'peta' && x.kamera)!;
    return { era: (s.media as Extract<MediaSejarah, { jenis: 'peta' }>).era, kamera: s.kamera!, alt: s.media.alt };
  }, [segmen]);
  const peta = terakhirPeta.current ?? pertamaPeta;

  const eraAktif = media?.jenis === 'peta' ? media.era : null;
  const adaPetaLama = eraAktif === '1915' || eraAktif === '1930';
  const [ketebalan, setKetebalan] = useState(100);
  useEffect(() => setKetebalan(100), [eraAktif]);

  const lompatKeEra = (era: EraPeta) => {
    const i = segmen.findIndex((s) => s.media.jenis === 'peta' && s.media.era === era);
    const el = elSegmen.current[i];
    if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - garisBaca() + 2;
    scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const [panelRef, panelDekat] = useDekat();
  const [gagalPeta, setGagalPeta] = useState(false);
  const tanpaKey = !apiKey;
  const pesanPeta = tanpaKey ? teks.tanpaKey : gagalPeta ? teks.gagalMuat : null;
  const petaLamaGambar = eraAktif === '1915' || eraAktif === '1930' ? petaLama[eraAktif] : null;

  let indeks = -1;
  return (
    <section className={`das-root das-sj ${className ?? ''}`} aria-label={teks.labelBagian}>
      <Hero teks={teks} base={assetBaseUrl} reduceMotion={reduceMotion} />

      <p className="das-sj__pembuka">
        <TeksInline teks={teks.pembuka} />
      </p>

      <div className="das-sj__badan">
        <div ref={elPanel} className="das-sj__panel">
          <div ref={panelRef} className="das-sj__panggung" data-jenis={media?.jenis}>
            {panelDekat && (
              <>
                {pesanPeta ? (
                  <div className="das-sj__pesan">
                    {petaLamaGambar && <img src={`${assetBaseUrl}${petaLamaGambar.file}`} alt="" />}
                    <p>{pesanPeta}</p>
                  </div>
                ) : (
                  <BatasPeta onError={() => setGagalPeta(true)}>
                    <Suspense fallback={null}>
                      <PetaSejarah
                        apiKey={apiKey}
                        assetBaseUrl={assetBaseUrl}
                        era={peta.era}
                        kamera={peta.kamera}
                        ketebalan={ketebalan / 100}
                        sempit={sempit}
                        reduceMotion={reduceMotion}
                        label={peta.alt}
                        labelBekas={teks.labelBekas}
                        labelKerajaan={teks.labelKerajaan}
                        onError={() => setGagalPeta(true)}
                      />
                    </Suspense>
                  </BatasPeta>
                )}
                {foto.map((m) => (
                  <Foto key={m.id} media={m} base={assetBaseUrl} aktif={media?.id === m.id} />
                ))}
              </>
            )}
            {eraAktif && !pesanPeta && (
              <div className="das-sj__kendali">
                <div className="das-sj__era" role="group" aria-label={teks.eraLabel}>
                  {ERA.map((e) => (
                    <button key={e} type="button" aria-current={e === eraAktif ? 'true' : undefined} onClick={() => lompatKeEra(e)}>
                      {teks.era[e]}
                    </button>
                  ))}
                </div>
                {adaPetaLama && (
                  <label className="das-sj__tebal">
                    <span>{teks.petaLama}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={ketebalan}
                      aria-label={teks.petaLamaLabel}
                      onChange={(e) => setKetebalan(Number(e.target.value))}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
          <p className="das-sj__caption" aria-hidden="true">
            {media && <TeksInline key={media.id} teks={media.caption} />}
          </p>
        </div>

        <div className="das-sj__teks">
          {bab.map((b) => (
            <article key={b.id} className="das-sj__bab" aria-labelledby={`das-sj-${b.id}`}>
              <header>
                <p className="das-sj__label">{b.label}</p>
                <h3 id={`das-sj-${b.id}`}>{b.judul}</h3>
              </header>
              {b.segmen.map((_, j) => {
                indeks += 1;
                const i = indeks;
                const s = segmen[i];
                return (
                  <div
                    key={s.kunci}
                    ref={(el) => {
                      elSegmen.current[i] = el;
                    }}
                    className="das-sj__segmen"
                    data-segmen={s.kunci}
                    data-aktif={i === aktif || undefined}
                  >
                    {s.tampilCaption && (
                      <p className="das-sj__caption-alir">
                        <span className="das-visually-hidden">{s.media.alt} </span>
                        <TeksInline teks={s.media.caption} />
                      </p>
                    )}
                    {s.paragraf.map((p, k) => (
                      <p key={`${j}-${k}`} className="das-sj__p">
                        <TeksInline teks={p} />
                      </p>
                    ))}
                    {s.kutipanPenutup && (
                      <p className="das-sj__penutup">
                        <TeksInline teks={s.kutipanPenutup} />
                      </p>
                    )}
                  </div>
                );
              })}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
