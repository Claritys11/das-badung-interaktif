// Framer Code Component — Timeline banjir Denpasar (kartu per tanggal + pop-up semua peristiwa).
// Cara pakai: Assets → Code → New File, tempel isi file ini, ganti HOST.
import { addPropertyControls, ControlType } from 'framer';
import { useEffect } from 'react';
// @ts-ignore — modul URL, di-resolve oleh Framer saat runtime.
import { Timeline, timeline, timelineTeks } from 'https://HOST/framer/das-badung.js';

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
export default function DasTimeline(props: { background: string }) {
  useStylesheet(`${HOST}/framer/das-badung.css`);
  return (
    <div style={{ width: '100%', ['--das-bg' as string]: props.background }}>
      <Timeline hari={timeline} teks={timelineTeks} />
    </div>
  );
}

DasTimeline.defaultProps = { background: '#FAFAFA' };

addPropertyControls(DasTimeline, {
  background: { type: ControlType.Color, title: 'Latar' },
});
