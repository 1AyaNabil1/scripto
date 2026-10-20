import { Gallery } from './Gallery';
import { Icon } from './Icon';

interface Props {
  what: string;
  onGoStory: () => void;
  onPickDemo: (id: string) => void;
  onImport?: ((file: File) => void) | undefined;
}

/** Board, Script, Arc and Cast before there is a storyboard. */
export function EmptyBoard({ what, onGoStory, onPickDemo, onImport }: Props) {
  return (
    <section className="tab-page empty-page" aria-label={what}>
      <h1 className="two-tone">
        No board <span className="bright">yet.</span>
      </h1>
      <div className="empty-actions">
        <button type="button" className="button primary" onClick={onGoStory}>
          <Icon name="sparkle" /> Write a story
        </button>
        {onImport && (
          <label className="button">
            <Icon name="upload" /> Open JSON
            <input
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              data-testid="import-input"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) onImport(file);
              }}
            />
          </label>
        )}
      </div>
      <p className="label-mono">Or open one of these</p>
      <Gallery onPick={onPickDemo} compact />
    </section>
  );
}
