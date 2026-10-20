import { arcPath, arcPoints, arcSummary, peakIndex } from '../lib/arc';
import type { Scene } from '../lib/types';
import { MOOD_INFO } from '../lib/vocabulary';

interface Props {
  scenes: readonly Pick<Scene, 'id' | 'title' | 'mood' | 'intensity'>[];
  rtl: boolean;
  /** "mini" sits in the board header; "full" fills the Arc tab. */
  size?: 'mini' | 'full';
}

/** The emotional arc as one violet line, with a dot per scene in its mood's colour. */
export function ArcLine({ scenes, rtl, size = 'full' }: Props) {
  const points = arcPoints(scenes, rtl);
  const peak = peakIndex(scenes);
  return (
    <div className={`arc-line ${size}`} role="img" aria-label={arcSummary(scenes)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {size === 'full' && (
          <path className="arc-grid" d="M0 10H100M0 30H100M0 50H100M0 70H100M0 90H100" vectorEffect="non-scaling-stroke" />
        )}
        {size === 'mini' && <path className="arc-base" d="M0 100H100" vectorEffect="non-scaling-stroke" />}
        <path className="arc-path" d={arcPath(points)} vectorEffect="non-scaling-stroke" />
      </svg>
      {scenes.map((scene, i) => {
        const point = points[i];
        if (!point) return null;
        return (
          <span
            key={scene.id}
            className={`arc-dot${i === peak ? ' is-peak' : ''}`}
            style={{ left: `${point.x}%`, top: `${point.y}%`, background: MOOD_INFO[scene.mood].accent }}
            title={`${String(i + 1).padStart(2, '0')} · ${scene.title} · ${MOOD_INFO[scene.mood].label} · ${scene.intensity}/5`}
            aria-hidden="true"
          />
        );
      })}
      {size === 'full' &&
        scenes.map((scene, i) => {
          const point = points[i];
          return point ? (
            <span key={`x-${scene.id}`} className="arc-x" style={{ left: `${point.x}%` }} aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
          ) : null;
        })}
      {size === 'full' && points[peak] && (
        <span className="arc-peak" style={{ left: `${points[peak].x}%`, top: `${points[peak].y}%` }} aria-hidden="true">
          Peak
        </span>
      )}
    </div>
  );
}
