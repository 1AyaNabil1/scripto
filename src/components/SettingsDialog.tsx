import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';
import {
  DEFAULT_SETTINGS,
  IMAGE_MODEL_OPTIONS,
  IMAGE_SIZES,
  isValidModelId,
  looksLikeApiKey,
  maskApiKey,
  TEXT_MODEL_OPTIONS,
  THINKING_LEVELS,
  type ImageSize,
  type Settings,
  type ThinkingLevel,
} from '../lib/settings';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  settings: Settings;
  onSaveKey: (key: string) => void;
  onForgetKey: () => void;
  onSaveSettings: (settings: Settings) => void;
}

const THINKING_LABELS: Record<ThinkingLevel, string> = {
  default: 'Model default',
  minimal: 'Minimal',
  low: 'Low (recommended)',
  medium: 'Medium',
  high: 'High',
};

export function SettingsDialog({ open, onClose, apiKey, settings, onSaveKey, onForgetKey, onSaveSettings }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const [keyDraft, setKeyDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');
  const [draft, setDraft] = useState<Settings>(settings);
  const [modelError, setModelError] = useState('');
  const [saved, setSaved] = useState(false);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setDraft(settings);
      setKeyDraft('');
      setKeyMessage('');
      setModelError('');
      setSaved(false);
      setShowKey(false);
      dialog.showModal();
      if (!apiKey) keyInputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, settings, apiKey]);

  const submitKey = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const key = keyDraft.trim();
    if (!looksLikeApiKey(key)) {
      setKeyMessage('That does not look like a Gemini API key. Copy the whole key from Google AI Studio.');
      return;
    }
    onSaveKey(key);
    setKeyDraft('');
    setShowKey(false);
    setKeyMessage('Key saved in this browser.');
  };

  const forget = () => {
    onForgetKey();
    setKeyDraft('');
    setKeyMessage('Key removed from this browser.');
  };

  const submitSettings = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidModelId(draft.textModel) || !isValidModelId(draft.imageModel)) {
      setModelError('Model IDs look like "gemini-3.8-flash": letters, numbers, dots and dashes only.');
      return;
    }
    setModelError('');
    onSaveSettings({ ...draft, textModel: draft.textModel.trim(), imageModel: draft.imageModel.trim() });
    setSaved(true);
  };

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="dialog-header">
        <h2 id={`${id}-title`}>Settings</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings">
          <Icon name="close" />
        </button>
      </div>

      <section className="dialog-section" aria-labelledby={`${id}-key`}>
        <h3 id={`${id}-key`}>
          <Icon name="key" /> Gemini API key
        </h3>
        <p className="privacy-note">
          <Icon name="lock" size={16} />
          <span>
            Scripto has no server. Your key is stored <strong>only in this browser</strong> (localStorage) and is sent{' '}
            <strong>only to Google’s Gemini API</strong> at generativelanguage.googleapis.com when you generate. It is
            never logged or sent anywhere else.
          </span>
        </p>
        <p className="key-status" role="status">
          {apiKey ? (
            <>
              <Icon name="check" size={16} /> A key is saved: <code>{maskApiKey(apiKey)}</code>
            </>
          ) : (
            'No key saved. Demo mode works without one.'
          )}
        </p>
        <form className="key-form" onSubmit={submitKey}>
          <label htmlFor={`${id}-key-input`}>{apiKey ? 'Replace key' : 'Paste your key'}</label>
          <div className="key-row">
            <input
              ref={keyInputRef}
              id={`${id}-key-input`}
              type={showKey ? 'text' : 'password'}
              value={keyDraft}
              onChange={(e) => {
                setKeyDraft(e.target.value);
              }}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
              placeholder="AIza…"
              aria-describedby={`${id}-key-help`}
            />
            <button
              type="button"
              className="button ghost"
              onClick={() => {
                setShowKey((v) => !v);
              }}
              aria-pressed={showKey}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button type="submit" className="button primary" disabled={!keyDraft.trim()}>
              Save key
            </button>
          </div>
          <p id={`${id}-key-help`} className="help">
            Create a key in{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer noopener">
              Google AI Studio
            </a>
            . Use a key restricted to the Gemini API, set a budget alert, and forget the key when you use a shared
            computer.
          </p>
          {keyMessage && (
            <p className="help strong" role="status">
              {keyMessage}
            </p>
          )}
        </form>
        <button type="button" className="button danger" onClick={forget} disabled={!apiKey}>
          <Icon name="trash" /> Forget key
        </button>
        <details className="fine-print">
          <summary>What Google receives</summary>
          <p>
            Your story (for scenes) and each scene’s description (for frames), along with your key. Requests are sent
            with <code>store: false</code>, so Google does not keep them for later retrieval in your project. Google’s
            terms still apply: on the free tier, Google may use prompts and responses to improve its products. Scripto
            itself has no analytics, cookies or trackers.
          </p>
        </details>
      </section>

      <form className="dialog-section" onSubmit={submitSettings} aria-labelledby={`${id}-models`}>
        <h3 id={`${id}-models`}>
          <Icon name="sparkle" /> Models
        </h3>
        <div className="field">
          <label htmlFor={`${id}-text-model`}>Text model (writes the scenes)</label>
          <input
            id={`${id}-text-model`}
            list={`${id}-text-models`}
            value={draft.textModel}
            onChange={(e) => {
              update('textModel', e.target.value);
            }}
            spellCheck={false}
            autoCapitalize="off"
            aria-describedby={`${id}-text-model-help`}
          />
          <datalist id={`${id}-text-models`}>
            {TEXT_MODEL_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.note}
              </option>
            ))}
          </datalist>
          <p id={`${id}-text-model-help`} className="help">
            {TEXT_MODEL_OPTIONS.find((o) => o.id === draft.textModel)?.note ??
              'Any Gemini model ID that supports structured JSON output.'}
          </p>
        </div>

        <div className="field">
          <label htmlFor={`${id}-thinking`}>Thinking level</label>
          <select
            id={`${id}-thinking`}
            value={draft.thinkingLevel}
            onChange={(e) => {
              update('thinkingLevel', e.target.value as ThinkingLevel);
            }}
            aria-describedby={`${id}-thinking-help`}
          >
            {THINKING_LEVELS.map((level) => (
              <option key={level} value={level}>
                {THINKING_LABELS[level]}
              </option>
            ))}
          </select>
          <p id={`${id}-thinking-help`} className="help">
            Less thinking is faster and cheaper. gemini-3.8-flash accepts low, medium and high; the Flash-Lite models
            also accept minimal.
          </p>
        </div>

        <fieldset className="field">
          <legend>Frames</legend>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.generateImages}
              onChange={(e) => {
                update('generateImages', e.target.checked);
              }}
            />
            Generate an image for each scene
          </label>
          <p className="help">
            Gemini image models need a paid-tier key: about US$0.03 to US$0.13 per frame depending on the model, at
            Google’s October 2026 list prices. With images off, Scripto draws placeholder frames.
          </p>
        </fieldset>

        <div className="field">
          <label htmlFor={`${id}-image-model`}>Image model</label>
          <input
            id={`${id}-image-model`}
            list={`${id}-image-models`}
            value={draft.imageModel}
            onChange={(e) => {
              update('imageModel', e.target.value);
            }}
            spellCheck={false}
            autoCapitalize="off"
            disabled={!draft.generateImages}
            aria-describedby={`${id}-image-model-help`}
          />
          <datalist id={`${id}-image-models`}>
            {IMAGE_MODEL_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.note}
              </option>
            ))}
          </datalist>
          <p id={`${id}-image-model-help`} className="help">
            {IMAGE_MODEL_OPTIONS.find((o) => o.id === draft.imageModel)?.note ??
              'Any Gemini model that can output images.'}
          </p>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor={`${id}-size`}>Image size</label>
            <select
              id={`${id}-size`}
              value={draft.imageSize}
              disabled={!draft.generateImages}
              onChange={(e) => {
                update('imageSize', e.target.value as ImageSize);
              }}
            >
              {IMAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <label className="check field">
            <input
              type="checkbox"
              checked={draft.useStyleReference}
              disabled={!draft.generateImages}
              onChange={(e) => {
                update('useStyleReference', e.target.checked);
              }}
            />
            Match every frame to the first one’s style
          </label>
        </div>

        {modelError && (
          <p className="help error" role="alert">
            {modelError}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button ghost"
            onClick={() => {
              setDraft({ ...DEFAULT_SETTINGS });
              setSaved(false);
            }}
          >
            Reset to defaults
          </button>
          <span className="spacer" />
          {saved && (
            <span className="saved" role="status">
              <Icon name="check" size={16} /> Saved
            </span>
          )}
          <button type="submit" className="button primary">
            Save settings
          </button>
        </div>
      </form>
    </dialog>
  );
}
