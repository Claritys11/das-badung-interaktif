import { describe, expect, it } from 'vitest';
import { initialStoryState, resolveView, storyReducer, POINT_ZOOM, type StoryState } from '../../src/components/scrolly-map/storyState';
import type { Step } from '../../src/content/types';

const steps: Step[] = [
  { id: 'a', judul: '', teks: [], camera: { center: [115, -8.4], zoom: 8 }, cameraMobile: { zoom: 7 }, layers: [] },
  { id: 'b', judul: '', teks: [], camera: { center: [115.2, -8.5], zoom: 10, pitch: 30 }, layers: ['das'] },
  { id: 'c', judul: '', teks: [], camera: { center: [115.21, -8.66], zoom: 12 }, layers: ['das', 'banjir'], titikInteraktif: true },
];
const points = new Map([['banjir-x', { id: 'banjir-x', coordinates: [115.22, -8.67] as [number, number] }]]);
const run = (...actions: Parameters<typeof storyReducer>[1][]) => actions.reduce(storyReducer, initialStoryState);

describe('storyReducer', () => {
  it('scroll maju lalu mundur mengembalikan tampilan yang identik', () => {
    const atB = run({ type: 'enterStep', index: 1 });
    const backToB = run({ type: 'enterStep', index: 1 }, { type: 'enterStep', index: 2 }, { type: 'enterStep', index: 1 });
    expect(resolveView(backToB, steps, points)).toEqual(resolveView(atB, steps, points));
    expect(resolveView(backToB, steps, points).layers).toEqual(['das']);
  });

  it('memilih titik men-zoom ke titik itu', () => {
    const s = run({ type: 'enterStep', index: 2 }, { type: 'selectPoint', id: 'banjir-x' });
    const v = resolveView(s, steps, points);
    expect(v.camera.center).toEqual([115.22, -8.67]);
    expect(v.camera.zoom).toBe(POINT_ZOOM);
  });

  it('detail tetap terbuka selama step tidak berganti', () => {
    const s = run({ type: 'enterStep', index: 2 }, { type: 'selectPoint', id: 'banjir-x' }, { type: 'enterStep', index: 2 });
    expect(s.selectedPointId).toBe('banjir-x');
  });

  it('ganti step saat detail terbuka → detail ditutup, kamera ke step baru', () => {
    const s = run({ type: 'enterStep', index: 2 }, { type: 'selectPoint', id: 'banjir-x' }, { type: 'enterStep', index: 1 });
    expect(s.selectedPointId).toBeNull();
    expect(resolveView(s, steps, points).camera.center).toEqual([115.2, -8.5]);
  });

  it('reset menutup detail dan menaikkan resetToken (kamera diterapkan ulang)', () => {
    const s = run({ type: 'enterStep', index: 2 }, { type: 'selectPoint', id: 'banjir-x' }, { type: 'reset' });
    expect(s.selectedPointId).toBeNull();
    expect(s.resetToken).toBe(1);
    expect(resolveView(s, steps, points).camera.zoom).toBe(12);
  });

  it('kamera mobile menimpa kamera desktop', () => {
    expect(resolveView(initialStoryState, steps, points, true).camera.zoom).toBe(7);
  });

  it('titik terpilih tetap tampil walau step tidak punya layer banjir', () => {
    const s: StoryState = { activeStep: 1, selectedPointId: 'banjir-x', resetToken: 0 };
    expect(resolveView(s, steps, points).layers).toContain('banjir');
  });

  it('enterStep ke step yang sama tidak membuat state baru', () => {
    expect(storyReducer(initialStoryState, { type: 'enterStep', index: 0 })).toBe(initialStoryState);
  });
});
