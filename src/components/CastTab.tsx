import type { Storyboard } from '../lib/types';
import { boardLang, countWord, pad2 } from './text';

/** Every recurring character, how they are drawn, and the scenes they appear in. */
export function CastTab({ storyboard }: { storyboard: Storyboard }) {
  const rtl = storyboard.direction === 'rtl';
  const lang = boardLang(storyboard);
  const cast = storyboard.characters;
  return (
    <section className="tab-page cast-page" aria-labelledby="cast-title">
      <h1 id="cast-title" className="two-tone">
        {countWord(cast.length)} {cast.length === 1 ? 'face' : 'faces'}, <span className="bright">every frame.</span>
      </h1>
      <ul className="cast-list">
        {cast.map((person) => {
          const key = person.name.trim().toLowerCase();
          const scenes = storyboard.scenes
            .map((scene, i) => ({ scene, i }))
            .filter(({ scene }) => scene.characters.some((name) => name.trim().toLowerCase() === key));
          return (
            <li key={person.name} className="panel cast-card">
              <span className="avatar" aria-hidden="true">
                {Array.from(person.name.trim())[0] ?? '?'}
              </span>
              <div className="cast-body">
                <div className="cast-head">
                  <h2 dir="auto" lang={lang}>
                    {person.name}
                  </h2>
                  <span className="cast-scenes" aria-label={`In ${scenes.length} scene${scenes.length === 1 ? '' : 's'}`} dir={rtl ? 'rtl' : 'ltr'}>
                    {scenes.map(({ scene, i }) => (
                      <span key={scene.id} className="chip-mono" aria-hidden="true">
                        {pad2(i + 1)}
                      </span>
                    ))}
                  </span>
                </div>
                <p className="cast-look" lang="en" dir="ltr">
                  {person.appearance}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
