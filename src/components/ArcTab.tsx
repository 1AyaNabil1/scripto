import { useId } from 'react';
import { moodCounts } from '../lib/arc';
import type { Storyboard } from '../lib/types';
import { MOOD_INFO, SHOT_LABELS } from '../lib/vocabulary';
import { ArcLine } from './ArcLine';
import { boardLang, pad2 } from './text';

/** The emotional arc at full size, the mood of every scene, and the same data as a table. */
export function ArcTab({ storyboard }: { storyboard: Storyboard }) {
  const id = useId();
  const rtl = storyboard.direction === 'rtl';
  const lang = boardLang(storyboard);
  const counts = moodCounts(storyboard.scenes);
  return (
    <section className="tab-page arc-page" aria-labelledby={`${id}-title`}>
      <div className="panel arc-panel">
        <div className="section-head">
          <h1 id={`${id}-title`} className="two-tone medium">
            Quiet to <span className="bright">peak.</span>
          </h1>
          <span className="label-mono">Intensity 1–5</span>
        </div>
        <ArcLine scenes={storyboard.scenes} rtl={rtl} size="full" />
      </div>
      <div className="panel mood-panel">
        <h2 className="label-mono">Moods</h2>
        <ol className="mood-rows" aria-label="Mood of each scene">
          {storyboard.scenes.map((scene, i) => (
            <li key={scene.id}>
              <span className="mono-num">{pad2(i + 1)}</span>
              <span className="mood-dot" style={{ background: MOOD_INFO[scene.mood].accent }} aria-hidden="true" />
              <span className="mood-name">{MOOD_INFO[scene.mood].label}</span>
              <span className="visually-hidden">, intensity {scene.intensity} of 5</span>
              <span className="bars" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={n <= scene.intensity ? 'on' : ''} />
                ))}
              </span>
            </li>
          ))}
        </ol>
        <p className="mood-mix">
          {counts.map(({ mood, count }) => `${MOOD_INFO[mood].label} ${count}`).join(' · ')}
        </p>
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
              {storyboard.scenes.map((scene, i) => (
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
