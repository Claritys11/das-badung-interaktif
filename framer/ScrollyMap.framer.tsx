// Framer Code Component — Scrollytelling peta DAS Badung (scroll halaman penuh).
// Cara pakai: di Framer → Assets → Code → New File, tempel isi file ini, ganti HOST, lalu isi
// property "MapTiler key" dengan key milik client (dibatasi allowed origins ke domain situs).
// PENTING: agar peta bisa "sticky", tidak boleh ada parent dengan overflow: hidden/clip
// (di Framer: matikan "Clip content" pada frame/section yang membungkus komponen ini).
import { addPropertyControls, ControlType, useIsStaticRenderer } from 'framer';
import { useEffect } from 'react';
// @ts-ignore — modul URL, di-resolve oleh Framer saat runtime.
import { ScrollyMap, story, petaTeks, titikBanjir } from 'https://HOST/framer/das-badung.js';

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
export default function DasScrollyMap(props: { apiKey: string; terrain3d: boolean; background: string }) {
  useStylesheet(`${HOST}/framer/das-badung.css`);
  // Canvas editor Framer: tampilkan placeholder statis, bukan peta WebGL.
  if (useIsStaticRenderer()) {
    return (
      <div style={{ padding: 32, background: '#1d2420', color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
        Peta scrollytelling DAS Badung — pratinjau hanya tampil di situs (Preview/Publish).
      </div>
    );
  }
  return (
    <div style={{ width: '100%', ['--das-bg' as string]: props.background }}>
      <ScrollyMap
        steps={story}
        titik={titikBanjir}
        teks={petaTeks}
        apiKey={props.apiKey}
        dataBaseUrl={`${HOST}/data/`}
        scrollMode="page"
        terrain3d={props.terrain3d}
      />
    </div>
  );
}

DasScrollyMap.defaultProps = { apiKey: '', terrain3d: false, background: '#FAFAFA' };

addPropertyControls(DasScrollyMap, {
  apiKey: { type: ControlType.String, title: 'MapTiler key' },
  terrain3d: { type: ControlType.Boolean, title: 'Terrain 3D' },
  background: { type: ControlType.Color, title: 'Latar' },
});
