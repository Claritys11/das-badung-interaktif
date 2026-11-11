// Entry bundle untuk Framer Code Component (pnpm build → dist/framer/das-badung.js + style.css).
// React di-externalize (memakai React milik Framer). Key MapTiler TIDAK ikut di bundle: wajib lewat prop.
export { Slideshow } from './components/slideshow/Slideshow';
export { ScrollyMap } from './components/scrolly-map/ScrollyMap';
export { FloodTransition } from './components/flood-transition/FloodTransition';
export { banjirTeks } from './content/banjir';
export { Timeline } from './components/timeline/Timeline';
export { timeline } from './content/timeline';
export { timelineTeks } from './content/timeline-teks';
export { slides, slideshowTeks } from './content/slides';
export { story, petaTeks } from './content/story';
export { Disabilitas } from './components/disabilitas/Disabilitas';
export { disabilitas, disabilitasTeks } from './content/disabilitas';
export { Sejarah } from './components/sejarah/Sejarah';
export { sejarah, sejarahTeks } from './content/sejarah';
