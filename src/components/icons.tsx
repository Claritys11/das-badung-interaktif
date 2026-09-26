// Ikon SVG kecil tanpa dependensi.
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export const IconPrev = () => (
  <svg {...base}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
export const IconNext = () => (
  <svg {...base}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);
export const IconPlay = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);
export const IconPause = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);
export const IconClose = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconReset = () => (
  <svg {...base}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);
export const IconUp = () => (
  <svg {...base}>
    <path d="M18 15l-6-6-6 6" />
  </svg>
);
export const IconDown = () => (
  <svg {...base}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
