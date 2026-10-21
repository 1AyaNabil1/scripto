import { useId, type SyntheticEvent } from 'react';
import { TRY_STORIES } from '../demo/tries';
import { VISUAL_STYLES } from '../lib/styles';
import { MAX_SCENES, MAX_STORY_CHARS, MIN_SCENES, MIN_STORY_CHARS, type SceneCountChoice } from '../lib/types';
import { Gallery } from './Gallery';
import { Icon } from './Icon';

export interface FirstTry {
  title: [string, string];
  line: string;
  /** A link out (to Scripto on Zibby), or null for none. */
  href: string | null;
  cta: string;
}

interface Props {
  story: string;
  onStoryChange: (story: string) => void;
  styleId: string;
  onStyleChange: (id: string) => void;
  sceneCount: SceneCountChoice;
  onSceneCountChange: (count: SceneCountChoice) => void;
  /** Null where frames are not drawn (the free site): the switch is left out. */
  drawFrames: boolean | null;
  onToggleFrames: () => void;
  busy: boolean;
  /** "~60 cr" on Zibby. */
  makeChip: string | null;
  /** A line under the button about where the story goes. */
  makeNote: string | null;
  firstTry: FirstTry;
  onGenerate: () => void;
  onCancel: () => void;
  onPickDemo: (id: string) => void;
  /** False on Zibby, where no link may leave the app's frame. */
  linksOut: boolean;
}

const COUNTS: SceneCountChoice[] = ['auto', ...Array.from({ length: MAX_SCENES - MIN_SCENES + 1 }, (_, i) => MIN_SCENES + i)];

const STEPS = [
  { icon: 'lines', title: 'Paste a story', note: 'any language' },
  { icon: 'cards', title: 'Scenes appear', note: 'shot · mood · line' },
  { icon: 'frame', title: 'Frames drawn', note: 'one look, every scene' },
  { icon: 'export', title: 'Export & share', note: 'PNG · PDF · JSON' },
] as const;

function StepArt({ kind }: { kind: (typeof STEPS)[number]['icon'] }) {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
      {kind === 'lines' && (
        <>
          <path className="step-ink" d="M10 14h26M10 21h22M10 28h26M10 35h12" />
          <rect className="step-violet-fill" x="24" y="31" width="8" height="8" />
        </>
      )}
      {kind === 'cards' && (
        <>
          <rect className="step-ink" x="8" y="9" width="32" height="8" rx="2" />
          <rect className="step-ink" x="8" y="20" width="32" height="8" rx="2" />
          <rect className="step-violet" x="8" y="31" width="32" height="8" rx="2" />
        </>
      )}
      {kind === 'frame' && (
        <>
          <path className="step-ink square" d="M8 16V9h7M33 9h7v7M8 32v7h7M33 39h7v-7" />
          <path className="step-violet-fill" d="M24 14C24.8 21 27 23.2 34 24 27 24.8 24.8 27 24 34 23.2 27 21 24.8 14 24 21 23.2 23.2 21 24 14Z" />
        </>
      )}
      {kind === 'export' && (
        <>
          <rect className="step-ink" x="6" y="12" width="36" height="24" rx="2" />
          <path className="step-ink dashed" d="M9 16h30M9 32h30" />
          <path className="step-violet" d="M24 19v8M20 24l4 4 4-4" />
        </>
      )}
    </svg>
  );
}

export function StoryTab(props: Props) {
  const id = useId();
  const length = props.story.trim().length;
  const tooShort = length > 0 && length < MIN_STORY_CHARS;

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    props.onGenerate();
  };

  return (
    <section className="tab-page story-page" aria-labelledby={`${id}-title`}>
      <div className="hero">
        <h1 id={`${id}-title`} className="two-tone">
          Your story. <span className="bright">Every frame.</span>
        </h1>
        <p className="tagline">Because sometimes, the right frame can light the stars inside you</p>
      </div>

      <form className="composer" onSubmit={submit}>
        <div className="panel writer">
          <div className="writer-tries">
            <span className="label-mono">Try</span>
            {TRY_STORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`chip-button${props.story === item.story ? ' is-active' : ''}`}
                lang={item.lang}
                onClick={() => {
                  props.onStoryChange(item.story);
                }}
                disabled={props.busy}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="writer-bar" aria-hidden="true">
            <span>FADE IN:</span>
            <span className={length > MAX_STORY_CHARS ? 'over' : ''}>
              {props.story.length.toLocaleString('en-US')} / {MAX_STORY_CHARS.toLocaleString('en-US')}
            </span>
          </div>
          <label htmlFor={`${id}-story`} className="visually-hidden">
            Your story
          </label>
          <textarea
            id={`${id}-story`}
            className="writer-text"
            value={props.story}
            onChange={(e) => {
              props.onStoryChange(e.target.value);
            }}
            rows={12}
            dir="auto"
            maxLength={MAX_STORY_CHARS}
            placeholder="Paste a short story — any language, Arabic too."
            aria-describedby={tooShort ? `${id}-short` : undefined}
            aria-invalid={tooShort || undefined}
            disabled={props.busy}
          />
          {tooShort && (
            <p id={`${id}-short`} className="writer-hint">
              A little more, please: at least {MIN_STORY_CHARS} characters.
            </p>
          )}
        </div>

        <div className="panel controls">
          <div className="first-try is-free">
            <span className="label-mono violet">
              First try
              <span className="badge">Free</span>
            </span>
            <span className="two-tone small">
              {props.firstTry.title[0]} <span className="bright">{props.firstTry.title[1]}</span>
            </span>
            <span className="first-try-line">{props.firstTry.line}</span>
            {props.firstTry.href && (
              <a className="text-link" href={props.firstTry.href} target="_blank" rel="noreferrer noopener">
                {props.firstTry.cta} <Icon name="external" size={12} />
              </a>
            )}
          </div>

          <div className="control" role="group" aria-labelledby={`${id}-look`}>
            <span id={`${id}-look`} className="label-mono">
              Look
            </span>
            <div className="looks">
              {VISUAL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`look${style.id === props.styleId ? ' is-active' : ''}`}
                  aria-pressed={style.id === props.styleId}
                  title={style.hint}
                  onClick={() => {
                    props.onStyleChange(style.id);
                  }}
                  disabled={props.busy}
                >
                  <span className={`swatch swatch-${style.id}`} aria-hidden="true" />
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div className="control" role="group" aria-labelledby={`${id}-scenes`}>
            <span id={`${id}-scenes`} className="label-mono">
              Scenes
            </span>
            <div className="segmented">
              {COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={count === props.sceneCount ? 'is-active' : ''}
                  aria-pressed={count === props.sceneCount}
                  aria-label={count === 'auto' ? 'Auto (4 to 8 scenes)' : `${count} scenes`}
                  onClick={() => {
                    props.onSceneCountChange(count);
                  }}
                  disabled={props.busy}
                >
                  {count === 'auto' ? 'Auto' : count}
                </button>
              ))}
            </div>
          </div>

          {props.drawFrames !== null && (
            <button
              type="button"
              role="switch"
              aria-checked={props.drawFrames}
              className="switch-row"
              onClick={props.onToggleFrames}
              disabled={props.busy}
            >
              <span>Draw frames</span>
              <span className="switch" aria-hidden="true" />
            </button>
          )}

          <div className="make">
            {props.busy ? (
              <button type="button" className="button wide" onClick={props.onCancel}>
                <Icon name="stop" /> Cancel
              </button>
            ) : (
              <button type="submit" className="button primary wide" disabled={length < MIN_STORY_CHARS}>
                <Icon name="sparkle" /> Make storyboard
                {props.makeChip && <span className="chip-mono">{props.makeChip}</span>}
              </button>
            )}
            {props.makeNote && <p className="make-note">{props.makeNote}</p>}
          </div>
        </div>
      </form>

      <div className="section">
        <div className="section-head">
          <h2 className="two-tone medium">
            Made with <span className="bright">Scripto.</span>
          </h2>
          <span className="label-mono">Open any board</span>
        </div>
        <Gallery onPick={props.onPickDemo} share={props.linksOut} />
      </div>

      <div className="section">
        <h2 className="two-tone medium">
          Four steps, <span className="bright">one minute.</span>
        </h2>
        <ol className="steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="panel step">
              <span className="step-art">
                <StepArt kind={step.icon} />
              </span>
              <span className="step-text">
                <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="step-title">{step.title}</span>
                <span className="step-note">{step.note}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
