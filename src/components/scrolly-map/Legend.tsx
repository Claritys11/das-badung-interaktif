import { TOPO_LEGEND } from './layers';

interface Props {
  kind: 'topografi' | 'banjir';
  labels: { topografi: string; banjir: string; fasilitasAir: string };
}

export function Legend({ kind, labels }: Props) {
  if (kind === 'topografi') {
    return (
      <figure className="das-sm__legend" aria-label={labels.topografi}>
        <figcaption>{labels.topografi}</figcaption>
        <ol className="das-sm__legend-ramp">
          {TOPO_LEGEND.map((c) => (
            <li key={c.label}>
              <span style={{ background: c.color }} aria-hidden="true" />
              {c.label}
            </li>
          ))}
        </ol>
      </figure>
    );
  }
  return (
    <figure className="das-sm__legend">
      <ul className="das-sm__legend-points">
        <li>
          <span className="das-sm__dot" aria-hidden="true" />
          {labels.banjir}
        </li>
        <li>
          <span className="das-sm__dot das-sm__dot--ring" aria-hidden="true" />
          {labels.fasilitasAir}
        </li>
      </ul>
    </figure>
  );
}
