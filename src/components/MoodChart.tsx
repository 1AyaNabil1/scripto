import { useId, useState } from 'react';
import { moodCounts, peakIndex } from '../lib/arc';
import type { Scene } from '../lib/types';
import { MOOD_INFO, SHOT_LABELS } from '../lib/vocabulary';

interface Props {
  scenes: readonly Scene[];
  rtl: boolean;
  lang: string | undefined;
}

/**
 * The emotional arc: one column per scene, height = intensity (1–5), in a
 * single colour. Mood is named in the tooltip, the mood list and the table,
 * never carried by colour alone.
 */
export function MoodChart({ scenes, rtl, lang }: Props) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const peak = peakIndex(scenes);
  const counts = moodCounts(scenes);
  const summary = `Emotional arc across ${scenes.length} scenes. Intensity runs ${scenes
    .map((s) => s.intensity)
    .join(', ')} out of 5${peak >= 0 ? `, peaking at scene ${peak + 1}` : ''}.`;

  return (
    <section className="mood-panel" aria-labelledby={`${id}-title`}>
      <div className="mood-chart">
        <div className="panel-heading">
          <h3 id={`${id}-title`}>Emotional arc</h3>
          <p className="help">Intensity of each scene, from 1 (quiet) to 5 (peak)</p>
        </div>
        <div className="arc" dir={rtl ? 'rtl' : 'ltr'}>
          <div className="arc-axis" aria-hidden="true">
            {[5, 4, 3, 2, 1].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <ol className="arc-plot" aria-label={summary}>
            {scenes.map((scene, i) => {
              const mood = MOOD_INFO[scene.mood].label;
              const label = `Scene ${i + 1}, ${scene.title}: intensity ${scene.intensity} of 5, ${mood.toLowerCase()}`;
              return (
                <li
                  key={scene.id}
                  className="arc-col"
                  tabIndex={0}
                  aria-label={label}
                  onPointerEnter={() => {
                    setActive(i);
                  }}
                  onPointerLeave={() => {
                    setActive((current) => (current === i ? null : current));
                  }}
                  onFocus={() => {
                    setActive(i);
                  }}
                  onBlur={() => {
                    setActive((current) => (current === i ? null : current));
                  }}
                >
                  <span className={`arc-bar level-${scene.intensity}${active === i ? ' is-active' : ''}`}>
                    {i === peak && (
                      <span className="arc-peak" aria-hidden="true">
                        Peak
                      </span>
                    )}
                  </span>
                  <span className="arc-x" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {active === i && (
                    <span
                      className={`arc-tooltip level-${scene.intensity}`}
                      dir="ltr"
                      role="presentation"
                      aria-hidden="true"
                    >
                      <strong>{scene.intensity}/5</strong>
                      <span>
                        Scene {String(i + 1).padStart(2, '0')} · {mood}
                      </span>
                      <span className="arc-tooltip-title" dir="auto" lang={lang}>
                        {scene.title}
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="mood-mix">
        <h3>Moods</h3>
        <ul>
          {counts.map(({ mood, count }) => (
            <li key={mood}>
              <span className={`swatch mood-${mood}`} aria-hidden="true" />
              <span>{MOOD_INFO[mood].label}</span>
              <span className="count">
                {count} {count === 1 ? 'scene' : 'scenes'}
              </span>
            </li>
          ))}
        </ul>
        <details className="table-view">
          <summary>Show as a table</summary>
          <table>
            <caption className="visually-hidden">Scenes with shot, mood and intensity</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Scene</th>
                <th scope="col">Shot</th>
                <th scope="col">Mood</th>
                <th scope="col">Intensity</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene, i) => (
                <tr key={scene.id}>
                  <td>{i + 1}</td>
                  <td dir="auto" lang={lang}>
                    {scene.title}
                  </td>
                  <td>{SHOT_LABELS[scene.shot]}</td>
                  <td>{MOOD_INFO[scene.mood].label}</td>
                  <td>{scene.intensity}/5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}
