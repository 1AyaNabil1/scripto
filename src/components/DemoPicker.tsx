import { DEMO_ENTRIES } from '../demo/samples';

interface Props {
  onPick: (id: string) => void;
  compact?: boolean;
}

/** Buttons that load the bundled demo storyboards (no API key needed). */
export function DemoPicker({ onPick, compact = false }: Props) {
  return (
    <ul className={`demo-picker${compact ? ' compact' : ''}`}>
      {DEMO_ENTRIES.map((demo) => (
        <li key={demo.id}>
          <button
            type="button"
            className="demo-card"
            onClick={() => {
              onPick(demo.id);
            }}
          >
            <span className="demo-label" dir={demo.direction} lang={demo.language}>
              {demo.label}
            </span>
            <span className="demo-blurb">{demo.blurb}</span>
            <span className="demo-cta" aria-hidden="true">
              Open demo →
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
