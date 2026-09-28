// Framer Code Component — Transisi foto sebelum → sesudah banjir (getar + air bah), dipasang tepat
// SEBELUM komponen peta. Cara pakai: Assets → Code → New File, tempel isi file ini, ganti HOST.
// Agar panggung foto bisa "sticky", matikan "Clip content" pada frame pembungkus.
import { addPropertyControls, ControlType, useIsStaticRenderer } from 'framer';
import { useEffect } from 'react';
// @ts-ignore — modul URL, di-resolve oleh Framer saat runtime.
import { FloodTransition, banjirTeks } from 'https://HOST/framer/das-badung.js';

const HOST = 'https://HOST';

function useStylesheet(href: string) {
  useEffect(() => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function DasFloodTransition(props: { haptic: boolean }) {
  useStylesheet(`${HOST}/framer/das-badung.css`);
  // Canvas editor Framer: tampilkan foto sebelum saja (tanpa efek/scroll).
  if (useIsStaticRenderer()) {
    return <img src={`${HOST}/banjir/sebelum-1024.webp`} alt="" style={{ width: '100%', display: 'block' }} />;
  }
  return <FloodTransition teks={banjirTeks} assetBaseUrl={`${HOST}/banjir/`} haptic={props.haptic} />;
}

DasFloodTransition.defaultProps = { haptic: false };

addPropertyControls(DasFloodTransition, {
  haptic: { type: ControlType.Boolean, title: 'Getar HP (Android)' },
});
