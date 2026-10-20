import { placeholderDataUrl } from '../lib/placeholder';
import type { Storyboard } from '../lib/types';
import { MOOD_INFO } from '../lib/vocabulary';
import { boardLang, pad2 } from './text';

/** The storyboard read as a screenplay: headings, action, then the line under its speaker. */
export function ScriptTab({ storyboard }: { storyboard: Storyboard }) {
  const rtl = storyboard.direction === 'rtl';
  const lang = boardLang(storyboard);
  return (
    <section className="tab-page script-page" aria-labelledby="script-title">
      <article className="screenplay" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
        <header className="screenplay-title">
          <h1 id="script-title" dir="auto">
            {storyboard.title.toLocaleUpperCase()}
          </h1>
          <p lang="en" dir="ltr">
            a storyboard by Scripto
          </p>
        </header>
        <p className="fade">
          <span lang="en" dir="ltr">
            FADE IN:
          </span>
        </p>
        <ol className="screenplay-scenes">
          {storyboard.scenes.map((scene, i) => (
            <li key={scene.id} className="screenplay-scene">
              <span className="screenplay-num" lang="en">
                {pad2(i + 1)}
              </span>
              <div className="screenplay-body">
                <p className="slugline" dir="auto">
                  {scene.slugline || scene.setting.toLocaleUpperCase()}
                </p>
                {scene.description && (
                  <p className="action" dir="auto">
                    {scene.description}
                  </p>
                )}
                {scene.line && (
                  <div className="dialogue">
                    <p className="cue" dir="auto">
                      {scene.lineType === 'dialogue' && scene.speaker
                        ? scene.speaker.toLocaleUpperCase()
                        : rtl
                          ? 'الراوي'
                          : 'NARRATOR (V.O.)'}
                    </p>
                    <p dir="auto">{scene.line}</p>
                  </div>
                )}
              </div>
              <span className="screenplay-thumb" style={{ borderBottomColor: MOOD_INFO[scene.mood].accent }} aria-hidden="true">
                <img src={scene.image?.src ?? placeholderDataUrl(scene, i, { labels: false })} alt="" width={160} height={90} loading="lazy" />
              </span>
            </li>
          ))}
        </ol>
        <p className="fade end">
          <span lang="en" dir="ltr">
            FADE OUT.
          </span>
        </p>
      </article>
    </section>
  );
}
