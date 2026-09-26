import type { Step } from '../../content/types';
import { IconDown, IconUp } from '../icons';

interface Props {
  steps: Step[];
  active: number;
  onGo: (index: number) => void;
  labels: { sebelumnya: string; berikutnya: string };
}

/** Navigasi step untuk mode iframe (scroll internal): tombol + titik progres. */
export function StoryNav({ steps, active, onGo, labels }: Props) {
  return (
    <nav className="das-sm__nav" aria-label="Navigasi cerita peta">
      <button type="button" className="das-iconbtn" onClick={() => onGo(active - 1)} disabled={active === 0} aria-label={labels.sebelumnya}>
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
      <button
        type="button"
        className="das-iconbtn"
        onClick={() => onGo(active + 1)}
        disabled={active === steps.length - 1}
        aria-label={labels.berikutnya}
      >
        <IconDown />
      </button>
    </nav>
  );
}
