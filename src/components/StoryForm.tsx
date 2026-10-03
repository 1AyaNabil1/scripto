import { useId, type SyntheticEvent } from 'react';
import type { Settings } from '../lib/settings';
import { VISUAL_STYLES } from '../lib/styles';
import { MAX_SCENES, MAX_STORY_CHARS, MIN_SCENES, MIN_STORY_CHARS, type SceneCountChoice } from '../lib/types';
import { Icon } from './Icon';

interface Props {
  story: string;
  onStoryChange: (story: string) => void;
  styleId: string;
  onStyleChange: (styleId: string) => void;
  sceneCount: SceneCountChoice;
  onSceneCountChange: (count: SceneCountChoice) => void;
  hasKey: boolean;
  settings: Settings;
  busy: boolean;
  onGenerate: () => void;
  onCancel: () => void;
  onOpenSettings: () => void;
}

const COUNTS: SceneCountChoice[] = [
  'auto',
  ...Array.from({ length: MAX_SCENES - MIN_SCENES + 1 }, (_, i) => MIN_SCENES + i),
];

export function StoryForm(props: Props) {
  const id = useId();
  const length = props.story.trim().length;
  const tooShort = length > 0 && length < MIN_STORY_CHARS;
  const style = VISUAL_STYLES.find((s) => s.id === props.styleId);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!props.hasKey) {
      props.onOpenSettings();
      return;
    }
    props.onGenerate();
  };

  return (
    <form className="story-form" onSubmit={submit} aria-describedby={`${id}-models`}>
      <div className="field">
        <div className="label-row">
          <label htmlFor={`${id}-story`}>Your story</label>
          <span className={`counter${length > MAX_STORY_CHARS ? ' over' : ''}`} aria-live="off">
            {props.story.length.toLocaleString()} / {MAX_STORY_CHARS.toLocaleString()}
          </span>
        </div>
        <textarea
          id={`${id}-story`}
          value={props.story}
          onChange={(e) => {
            props.onStoryChange(e.target.value);
          }}
          rows={8}
          dir="auto"
          maxLength={MAX_STORY_CHARS}
          placeholder="Paste a short story or plot. Any language works, including Arabic."
          aria-describedby={`${id}-story-help`}
          aria-invalid={tooShort || undefined}
          disabled={props.busy}
        />
        <p id={`${id}-story-help`} className="help">
          {tooShort
            ? `A bit more, please: at least ${MIN_STORY_CHARS} characters.`
            : 'A few paragraphs work best. Scripto splits them into scenes with shots, moods and lines.'}
        </p>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor={`${id}-style`}>Visual style</label>
          <select
            id={`${id}-style`}
            value={props.styleId}
            onChange={(e) => {
              props.onStyleChange(e.target.value);
            }}
            disabled={props.busy}
            aria-describedby={`${id}-style-help`}
          >
            {VISUAL_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p id={`${id}-style-help`} className="help">
            {style?.hint}
          </p>
        </div>

        <div className="field">
          <label htmlFor={`${id}-count`}>Scenes</label>
          <select
            id={`${id}-count`}
            value={String(props.sceneCount)}
            onChange={(e) => {
              const value = e.target.value;
              props.onSceneCountChange(value === 'auto' ? 'auto' : Number(value));
            }}
            disabled={props.busy}
          >
            {COUNTS.map((count) => (
              <option key={count} value={String(count)}>
                {count === 'auto' ? 'Auto (4–8)' : count}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          {props.busy ? (
            <button type="button" className="button" onClick={props.onCancel}>
              <Icon name="stop" /> Cancel
            </button>
          ) : (
            <button type="submit" className="button primary large" disabled={props.hasKey && length < MIN_STORY_CHARS}>
              {props.hasKey ? (
                <>
                  <Icon name="sparkle" /> Make storyboard
                </>
              ) : (
                <>
                  <Icon name="key" /> Add API key to generate
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <p id={`${id}-models`} className="help models-line">
        {props.hasKey ? (
          <>
            Scenes by <code>{props.settings.textModel}</code>
            {props.settings.generateImages ? (
              <>
                , frames by <code>{props.settings.imageModel}</code> (paid tier)
              </>
            ) : (
              ', placeholder frames (images are off)'
            )}
            .{' '}
          </>
        ) : (
          'No API key yet: try a demo below, or add your own Gemini key. '
        )}
        <button type="button" className="link-button" onClick={props.onOpenSettings}>
          {props.hasKey ? 'Change in Settings' : 'Open Settings'}
        </button>
      </p>
    </form>
  );
}
