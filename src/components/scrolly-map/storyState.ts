import type { Camera, LayerId, Step } from '../../content/types';

// State cerita peta. Kamera & layer TIDAK disimpan di sini — keduanya diturunkan dari
// state lewat resolveView(), sehingga scroll maju/mundur selalu menghasilkan tampilan
// yang sama untuk step yang sama (tidak ada perubahan inkremental yang bisa "tertinggal").
export interface StoryState {
  activeStep: number;
  selectedPointId: string | null;
  /** Naik setiap kali user minta reset → memaksa kamera diterapkan ulang walau state lain sama. */
  resetToken: number;
}

export type StoryAction =
  { type: 'enterStep'; index: number } | { type: 'selectPoint'; id: string } | { type: 'clearSelection' } | { type: 'reset' };

export const initialStoryState: StoryState = { activeStep: 0, selectedPointId: null, resetToken: 0 };

export function storyReducer(state: StoryState, action: StoryAction): StoryState {
  switch (action.type) {
    case 'enterStep':
      if (action.index === state.activeStep) return state;
      // Keputusan desain: begitu step berganti, detail titik ditutup. Cerita selalu menang,
      // supaya teks di kolom kiri dan isi peta tidak pernah saling bertentangan.
      // Selama step belum berganti (scroll kecil saat membaca detail), detail tetap terbuka.
      return { ...state, activeStep: action.index, selectedPointId: null };
    case 'selectPoint':
      return { ...state, selectedPointId: action.id };
    case 'clearSelection':
      return state.selectedPointId === null ? state : { ...state, selectedPointId: null };
    case 'reset':
      return { ...state, selectedPointId: null, resetToken: state.resetToken + 1 };
  }
}

export interface PointLike {
  id: string;
  coordinates: [number, number];
}

export interface View {
  camera: Camera;
  layers: LayerId[];
  titikInteraktif: boolean;
}

export const POINT_ZOOM = 15.5;

export function resolveView(state: StoryState, steps: Step[], points: Map<string, PointLike>, isNarrow = false): View {
  const step = steps[Math.min(Math.max(state.activeStep, 0), steps.length - 1)];
  const base: Camera = { pitch: 0, bearing: 0, ...step.camera, ...(isNarrow ? step.cameraMobile : undefined) };
  const point = state.selectedPointId ? points.get(state.selectedPointId) : undefined;
  const camera: Camera = point
    ? { center: point.coordinates, zoom: Math.max(POINT_ZOOM - (isNarrow ? 0.5 : 0), base.zoom), pitch: 0, bearing: base.bearing }
    : base;
  // Titik yang sedang dipilih selalu terlihat walau step aktif tidak menampilkan layer banjir.
  const layers: LayerId[] = point && !step.layers.includes('banjir') ? [...step.layers, 'banjir'] : step.layers;
  return { camera, layers, titikInteraktif: Boolean(step.titikInteraktif) };
}
