// Framer Code Component — Slideshow perubahan wilayah DAS Badung.
// Cara pakai: di Framer → Assets → Code → New File, tempel isi file ini, lalu ganti HOST
// dengan domain tempat folder dist/ di-hosting (mis. https://das-badung.pages.dev).
import { addPropertyControls, ControlType, useIsStaticRenderer } from 'framer';
import { useEffect } from 'react';
// @ts-ignore — modul URL, di-resolve oleh Framer saat runtime.
import { Slideshow, slides, slideshowTeks } from 'https://HOST/framer/das-badung.js';

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
export default function DasSlideshow(props: { autoplay: boolean; interval: number; background: string }) {
  useStylesheet(`${HOST}/framer/das-badung.css`);
  const isStatic = useIsStaticRenderer();
  return (
    <div style={{ width: '100%', ['--das-bg' as string]: props.background }}>
      <Slideshow
        slides={slides}
        assetBaseUrl={`${HOST}/citra/`}
        kredit={slideshowTeks.kredit}
        keterangan={slideshowTeks.keterangan}
        // Di canvas Framer: diam (tidak autoplay) supaya editor tetap ringan.
        autoplay={props.autoplay && !isStatic}
        intervalMs={props.interval}
      />
    </div>
  );
}

DasSlideshow.defaultProps = { autoplay: true, interval: 3000, background: '#FAFAFA' };

addPropertyControls(DasSlideshow, {
  autoplay: { type: ControlType.Boolean, title: 'Autoplay' },
  interval: { type: ControlType.Number, title: 'Interval (ms)', min: 1500, max: 10000, step: 500 },
  background: { type: ControlType.Color, title: 'Latar' },
});
