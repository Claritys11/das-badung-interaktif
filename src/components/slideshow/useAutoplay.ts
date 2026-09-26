import { useEffect, useRef, useState } from 'react';

/** Timer autoplay; di-reset setiap `key` berubah (mis. saat user pindah slide manual). */
export function useAutoplay(running: boolean, intervalMs: number, onTick: () => void, key: unknown) {
  const tick = useRef(onTick);
  tick.current = onTick;
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => tick.current(), intervalMs);
    return () => window.clearTimeout(id);
  }, [running, intervalMs, key]);
}

/** true jika elemen sedang terlihat di viewport (autoplay berhenti saat di luar layar). */
export function useInView<T extends Element>(ref: React.RefObject<T | null>, threshold = 0.25) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

export function usePageVisible() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const on = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return visible;
}
