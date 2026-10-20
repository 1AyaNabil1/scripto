import type { Storyboard } from '../lib/types';
import type { FrameStatus } from '../state/board';
import { Frame } from './Frame';

interface Props {
  storyboard: Storyboard;
  frames: Record<string, FrameStatus>;
}

const HOLES_PER_FRAME = 20;

/** The board as one horizontal strip of film: sprocket holes on both edges, edge print under each frame. */
export function FilmStrip({ storyboard, frames }: Props) {
  const rtl = storyboard.direction === 'rtl';
  const holes = Array.from({ length: storyboard.scenes.length * HOLES_PER_FRAME + 4 }, (_, i) => i);
  const sprockets = (
    <div className="sprockets" aria-hidden="true">
      {holes.map((i) => (
        <span key={i} />
      ))}
    </div>
  );
  return (
    <div className="filmstrip-scroll" role="region" aria-label="Film strip" tabIndex={0}>
      <div className="filmstrip" dir={rtl ? 'rtl' : 'ltr'}>
        {sprockets}
        <ol className="film-frames" aria-label="Scenes">
          {storyboard.scenes.map((scene, i) => (
            <li key={scene.id}>
              <Frame scene={scene} index={i} status={frames[scene.id]} bare />
              <span className="edge-print" dir="auto">
                <span lang="en" dir="ltr">
                  ▸ {String(i + 1).padStart(2, '0')}
                </span>{' '}
                <span className="edge-title">{scene.title}</span>{' '}
                <span className="edge-code" lang="en" dir="ltr" aria-hidden="true">
                  SCRIPTO {String(i + 1).padStart(2, '0')}A
                </span>
              </span>
            </li>
          ))}
        </ol>
        {sprockets}
      </div>
    </div>
  );
}
