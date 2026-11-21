// Framer Code Component — Daftar langkah kesiapan menghadapi bencana (penutup artikel).
// Cara pakai: Assets → Code → New File, tempel isi file ini, ganti HOST.
import { addPropertyControls, ControlType } from 'framer';
import { useEffect } from 'react';
// @ts-ignore — modul URL, di-resolve oleh Framer saat runtime.
import { Kesiapan, kesiapan, kesiapanTeks } from 'https://HOST/framer/das-badung.js';

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
export default function DasKesiapan(props: { background: string }) {
  useStylesheet(`${HOST}/framer/das-badung.css`);
  return (
    <div style={{ width: '100%', ['--das-bg' as string]: props.background }}>
      <Kesiapan kelompok={kesiapan} teks={kesiapanTeks} />
    </div>
  );
}

DasKesiapan.defaultProps = { background: '#FAF7EE' };

addPropertyControls(DasKesiapan, {
  background: { type: ControlType.Color, title: 'Latar' },
});
