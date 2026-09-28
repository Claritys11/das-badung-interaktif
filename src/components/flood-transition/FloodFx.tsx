import { useMemo } from 'react';
import { motion } from 'motion/react';

// Efek "air bah" di atas foto: gelombang air lumpur naik lalu surut, cipratan tanah, dan tetesan
// lumpur di "lensa". Dipasang ulang (key baru) setiap kali transisi maju ke foto sesudah.
// Hanya transform & opacity → ringan di HP. Tidak ada kedip terang (aman bagi pembaca peka cahaya).

export const FX_TOTAL_S = 1.9;

// PRNG kecil ber-seed → pola cipratan berbeda tiap pemicu, tapi stabil selama render.
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const MUD = ['#5b4126', '#6e5030', '#7d5d38', '#4a3520', '#8a6b42'];

// Satu periode gelombang (lebar 200 unit) diulang 4× → lapisan 800 unit, digeser -50% berulang.
// `crest` = garis puncak saja (untuk buih), `body` = puncak + ditutup ke dasar (untuk isi air).
function wavePath(amp: number, base: number) {
  let crest = `M0 ${base}`;
  for (let i = 0; i < 4; i++) {
    const x = i * 200;
    crest += ` C${x + 50} ${base - amp} ${x + 50} ${base - amp} ${x + 100} ${base} S${x + 150} ${base + amp} ${x + 200} ${base}`;
  }
  return { crest, body: `${crest} L800 400 L0 400 Z` };
}

export function FloodFx({ seed }: { seed: number }) {
  const { blobs, drops } = useMemo(() => {
    const r = rng(seed);
    const blobs = Array.from({ length: 34 }, (_, i) => {
      // Sebagian besar butir kecil–sedang, beberapa gumpalan tanah besar.
      const size = i % 7 === 0 ? 18 + r() * 12 : 5 + r() * 13;
      const rise = 45 + r() * 40; // % tinggi panggung — terlempar melewati permukaan air (puncak ±54%)
      return {
        left: 4 + r() * 92,
        size,
        rise,
        drift: (r() - 0.5) * 18,
        delay: 0.08 + r() * 0.35,
        dur: 0.85 + r() * 0.5,
        color: MUD[Math.floor(r() * MUD.length)],
        squash: 0.7 + r() * 0.5,
      };
    });
    const drops = Array.from({ length: 7 }, () => ({
      left: 6 + r() * 88,
      top: 6 + r() * 55,
      size: 14 + r() * 26,
      slide: 8 + r() * 22,
      delay: 0.45 + r() * 0.35,
    }));
    return { blobs, drops };
  }, [seed]);

  return (
    <div className="das-ft__fx" aria-hidden="true">
      {/* Rona lumpur di atas foto, memudar setelah air surut. */}
      <motion.div
        className="das-ft__fx-tint"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0.35, 0] }}
        transition={{ duration: FX_TOTAL_S, times: [0, 0.3, 0.6, 1], ease: 'easeInOut' }}
      />

      {/* Dua lapis gelombang: naik cepat, bertahan sebentar, surut ke bawah. */}
      {[
        { cls: 'back', peak: '34%', amp: 22, base: 40, loop: 1.1, delay: 0 },
        { cls: 'front', peak: '46%', amp: 16, base: 36, loop: 0.8, delay: 0.06 },
      ].map((w) => (
        <motion.div
          key={w.cls}
          className={`das-ft__wave das-ft__wave--${w.cls}`}
          initial={{ y: '100%' }}
          animate={{ y: ['100%', w.peak, w.peak, '105%'] }}
          transition={{ duration: FX_TOTAL_S - 0.2, times: [0, 0.32, 0.5, 1], ease: ['easeOut', 'linear', 'easeIn'], delay: w.delay }}
        >
          <motion.svg
            className="das-ft__wave-svg"
            viewBox="0 0 800 400"
            preserveAspectRatio="none"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: w.loop, ease: 'linear', repeat: Infinity }}
          >
            <defs>
              {/* Air keruh: lebih terang & kekuningan di permukaan, cokelat pekat di dasar. */}
              <linearGradient id={`das-ft-water-${w.cls}-${seed}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={w.cls === 'front' ? '#a3814f' : '#86673d'} stopOpacity={w.cls === 'front' ? 0.92 : 0.8} />
                <stop offset="0.35" stopColor={w.cls === 'front' ? '#7c5d36' : '#654a2b'} stopOpacity="0.9" />
                <stop offset="1" stopColor="#3f2d18" stopOpacity="0.96" />
              </linearGradient>
            </defs>
            <path d={wavePath(w.amp, w.base).body} fill={`url(#das-ft-water-${w.cls}-${seed})`} />
            <path d={wavePath(w.amp, w.base).crest} className="das-ft__wave-foam" />
          </motion.svg>
        </motion.div>
      ))}

      {/* Cipratan tanah: terlempar dari bawah lalu jatuh (lintasan parabola). */}
      {/* Tiap butir berada di "lajur" setinggi panggung; lajur yang digeser, jadi persen translateY
          = persen tinggi panggung (bukan ukuran butir). */}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="das-ft__mud-lane"
          style={{ left: `${b.left}%`, width: b.size }}
          initial={{ y: '0%', x: 0, opacity: 0 }}
          animate={{
            y: ['0%', `-${b.rise}%`, `-${b.rise * 0.8}%`, '8%'],
            x: [0, b.drift * 0.6, b.drift, b.drift * 1.2],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: b.dur, delay: b.delay, times: [0, 0.35, 0.55, 1], ease: ['easeOut', 'easeIn', 'easeIn'] }}
        >
          <span className="das-ft__mud" style={{ width: b.size, height: b.size * b.squash, background: b.color }} />
        </motion.div>
      ))}

      {/* Tetesan lumpur di "lensa": menempel, meluncur turun, memudar. */}
      {drops.map((d, i) => (
        <motion.span
          key={`d${i}`}
          className="das-ft__drop"
          style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size * 1.25 }}
          initial={{ opacity: 0, y: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.85, 0.7, 0], y: [0, 0, d.slide, d.slide * 2.2], scale: [0.6, 1, 1, 0.95] }}
          transition={{ duration: 1.5, delay: d.delay, times: [0, 0.12, 0.6, 1], ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
