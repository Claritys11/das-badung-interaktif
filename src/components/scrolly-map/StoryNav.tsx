import type { Step } from '../../content/types';
import { IconDown, IconUp } from '../icons';

interface Props {
  steps: Step[];
  /** Indeks step aktif; -1 = pembaca masih di konten pembuka (intro). */
  active: number;
  onGo: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  labels: { sebelumnya: string; berikutnya: string };
}

/** Navigasi step untuk mode iframe (scroll internal): tombol + titik progres. */
export function StoryNav({ steps, active, onGo, onPrev, onNext, prevDisabled, nextDisabled, labels }: Props) {
  return (
    <nav className="das-sm__nav" aria-label="Navigasi cerita peta">
      <button type="button" className="das-iconbtn" onClick={onPrev} disabled={prevDisabled} aria-label={labels.sebelumnya}>
        <IconUp />
      </button>
      <ol className="das-sm__dots">
        {steps.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={i === active ? 'is-active' : undefined}
              aria-current={i === active ? 'step' : undefined}
              aria-label={`Bagian ${i + 1} dari ${steps.length}`}
              onClick={() => onGo(i)}
            />
          </li>
        ))}
      </ol>
      <button type="button" className="das-iconbtn" onClick={onNext} disabled={nextDisabled} aria-label={labels.berikutnya}>
        <IconDown />
      </button>
    </nav>
  );
}
