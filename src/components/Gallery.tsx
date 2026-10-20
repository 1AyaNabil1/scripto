import { coverFor } from '../demo/covers';
import { DEMO_ENTRIES } from '../demo/samples';
import { placeholderDataUrl } from '../lib/placeholder';
import { getStyle } from '../lib/styles';
import { Icon } from './Icon';
import { pad2 } from './text';

const SHARE_URL = 'https://github.com/1AyaNabil1/scripto/issues/new?title=Gallery%3A%20';

interface Props {
  onPick: (demoId: string) => void;
  /** Leave out the "share yours" card (the empty board shows a short gallery). */
  compact?: boolean;
}

/** "Made with Scripto": the bundled boards, opened in one click. */
export function Gallery({ onPick, compact = false }: Props) {
  return (
    <ul className={`gallery${compact ? ' compact' : ''}`}>
      {DEMO_ENTRIES.map((demo) => (
        <li key={demo.id}>
          <button
            type="button"
            className="gallery-card"
            onClick={() => {
              onPick(demo.id);
            }}
          >
            <span className="cover">
              <img
                src={coverFor(demo.id) ?? placeholderDataUrl(demo.cover, 0, { labels: false })}
                alt=""
                width={1600}
                height={900}
                loading="lazy"
              />
              <span className="viewfinder" aria-hidden="true" />
              <span className="cover-lang" aria-hidden="true">
                {demo.language.toUpperCase()}
              </span>
              <span className="cover-count" aria-hidden="true">
                {pad2(demo.sceneCount)} frames
              </span>
            </span>
            <span className="gallery-meta">
              <span className="gallery-title" dir={demo.direction} lang={demo.language}>
                {demo.label}
              </span>
              <span className="gallery-style">{getStyle(demo.styleId).label}</span>
            </span>
            <span className="gallery-by">by @ayanabil</span>
          </button>
        </li>
      ))}
      {!compact && (
        <li>
          <a className="gallery-share" href={SHARE_URL} target="_blank" rel="noreferrer noopener">
            <span className="share-plus" aria-hidden="true">
              <Icon name="plus" />
            </span>
            Share yours here
          </a>
        </li>
      )}
    </ul>
  );
}
