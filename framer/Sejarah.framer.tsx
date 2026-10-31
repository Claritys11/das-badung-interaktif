// Framer Code Component — Sejarah Tata Ruang Kota Pusaka (video pembuka, peta lama, foto).
// Cara pakai: Assets → Code → New File, tempel isi file ini, ganti HOST, isi property MapTiler key.
// PENTING: panel media sticky; matikan "Clip content" pada frame yang membungkus komponen ini.
import { addPropertyControls, ControlType } from 'framer';
import { useEffect } from 'react';
// @ts-ignore — modul URL, di-resolve oleh Framer saat runtime.
import { Sejarah, sejarah, sejarahTeks } from 'https://HOST/framer/das-badung.js';

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
export default function DasSejarah(props: { apiKey: string; background: string }) {
  useStylesheet(`${HOST}/framer/das-badung.css`);
  return (
    <div style={{ width: '100%', ['--das-bg' as string]: props.background }}>
      <Sejarah bab={sejarah} teks={sejarahTeks} apiKey={props.apiKey} assetBaseUrl={`${HOST}/sejarah/`} />
    </div>
  );
}

DasSejarah.defaultProps = { apiKey: '', background: '#FAF7EE' };

addPropertyControls(DasSejarah, {
  apiKey: { type: ControlType.String, title: 'MapTiler key' },
  background: { type: ControlType.Color, title: 'Latar' },
});
