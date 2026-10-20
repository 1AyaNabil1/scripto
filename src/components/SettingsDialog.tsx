import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';
import type { Host } from '../lib/host';
import {
  defaultSettings,
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
import { ZIBBY_IMAGE_MODELS, ZIBBY_TEXT_MODELS } from '../lib/zibbyPayloads';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  host: Host;
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

const KEY_STEPS = [
  <>
    Open{' '}
    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer noopener">
      aistudio.google.com/apikey
    </a>{' '}
    and sign in with Google
  </>,
  <>Create API key, then pick or make a project</>,
  <>
    Set up billing on that project for frames <span className="muted">· the free tier draws scenes only · about $0.07 a frame</span>
  </>,
  <>Optional: limit the key to the Gemini API and add a $5 budget alert</>,
  <>Paste it below</>,
];

function Switch(props: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      className="switch-row"
      onClick={() => {
        props.onChange(!props.checked);
      }}
    >
      <span>{props.label}</span>
      <span className="switch" aria-hidden="true" />
    </button>
  );
}

export function SettingsDialog({ open, onClose, host, apiKey, settings, onSaveKey, onForgetKey, onSaveSettings }: Props) {
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
      if (host === 'byok' && !apiKey) keyInputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, settings, apiKey, host]);

  const apply = (changes: Partial<Settings>) => {
    const next = { ...settings, ...changes };
    setDraft((current) => ({ ...current, ...changes }));
    onSaveSettings(next);
  };

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

  const submitModels = (event: SyntheticEvent<HTMLFormElement>) => {
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

  const zibbyText = ZIBBY_TEXT_MODELS.find((m) => m.id === settings.textModel);

  return (
    <dialog ref={dialogRef} className="drawer" aria-labelledby={`${id}-title`} onClose={onClose} onCancel={onClose}>
      <div className="drawer-head">
        <h2 id={`${id}-title`}>Settings</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings">
          <Icon name="close" />
        </button>
      </div>

      {host === 'byok' ? (
        <>
          <div className="drawer-hero">
            <span className="label-mono violet">
              Your API key
            </span>
            <span className="two-tone small">
              Two minutes, <span className="bright">once.</span>
            </span>
          </div>
          <ol className="key-steps">
            {KEY_STEPS.map((step, i) => (
              <li key={i}>
                <span className="mono-num violet">{String(i + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <form className="drawer-section key-form" onSubmit={submitKey}>
            <label htmlFor={`${id}-key-input`} className="visually-hidden">
              Your API key
            </label>
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
                placeholder={apiKey ? maskApiKey(apiKey) : 'AIza…'}
              />
              <button
                type="button"
                className="button ghost small"
                onClick={() => {
                  setShowKey((v) => !v);
                }}
                aria-pressed={showKey}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
              <button type="submit" className="button primary small" disabled={!keyDraft.trim()}>
                Save key
              </button>
            </div>
            <p className="hint">
              <Icon name="lock" size={12} /> Stays in this browser. Sent only to Google.
            </p>
            {keyMessage && (
              <p className="hint strong" role="status">
                {keyMessage}
              </p>
            )}
            {apiKey && (
              <div className="key-saved">
                <span>
                  <Icon name="check" size={12} /> Saved: <code>{maskApiKey(apiKey)}</code>
                </span>
                <button type="button" className="text-link danger-text" onClick={onForgetKey}>
                  Forget key
                </button>
              </div>
            )}
          </form>
        </>
      ) : (
        <div className="drawer-hero">
          <span className="label-mono violet">
            On Zibby
          </span>
          <span className="two-tone small">
            No key. <span className="bright">Credits.</span>
          </span>
          <span className="hint">Each run shows an estimate first and its exact charge after.</span>
        </div>
      )}

      <section className="drawer-section" aria-label="Frames">
        <Switch
          label="Draw frames after the scenes"
          checked={settings.generateImages}
          onChange={(value) => {
            apply({ generateImages: value });
          }}
        />
        <Switch
          label="Match every frame to the first"
          checked={settings.useStyleReference}
          onChange={(value) => {
            apply({ useStyleReference: value });
          }}
        />
      </section>

      {host === 'zibby' ? (
        <section className="drawer-section fields" aria-label="Models">
          <div className="field">
            <label htmlFor={`${id}-z-text`}>Scenes</label>
            <select
              id={`${id}-z-text`}
              value={settings.textModel}
              onChange={(e) => {
                apply({ textModel: e.target.value });
              }}
            >
              {ZIBBY_TEXT_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="hint">{zibbyText?.note}</p>
          </div>
          {!settings.textModel.startsWith('claude-haiku-4') && (
            <div className="field">
              <label htmlFor={`${id}-z-think`}>Thinking</label>
              <select
                id={`${id}-z-think`}
                value={settings.thinkingLevel}
                onChange={(e) => {
                  apply({ thinkingLevel: e.target.value as ThinkingLevel });
                }}
              >
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <option key={level} value={level}>
                    {THINKING_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor={`${id}-z-image`}>Frames</label>
            <select
              id={`${id}-z-image`}
              value={settings.imageModel}
              onChange={(e) => {
                apply({ imageModel: e.target.value });
              }}
            >
              {ZIBBY_IMAGE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </section>
      ) : (
        <details className="drawer-section models">
          <summary>Models</summary>
          <form className="fields" onSubmit={submitModels}>
            <div className="field">
              <label htmlFor={`${id}-text-model`}>Text model</label>
              <input
                id={`${id}-text-model`}
                list={`${id}-text-models`}
                value={draft.textModel}
                onChange={(e) => {
                  update('textModel', e.target.value);
                }}
                spellCheck={false}
                autoCapitalize="off"
              />
              <datalist id={`${id}-text-models`}>
                {TEXT_MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.note}
                  </option>
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor={`${id}-thinking`}>Thinking level</label>
              <select
                id={`${id}-thinking`}
                value={draft.thinkingLevel}
                onChange={(e) => {
                  update('thinkingLevel', e.target.value as ThinkingLevel);
                }}
              >
                {THINKING_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {THINKING_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
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
              />
              <datalist id={`${id}-image-models`}>
                {IMAGE_MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.note}
                  </option>
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor={`${id}-size`}>Image size</label>
              <select
                id={`${id}-size`}
                value={draft.imageSize}
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
            {modelError && (
              <p className="hint error" role="alert">
                {modelError}
              </p>
            )}
            <div className="drawer-actions">
              <button
                type="button"
                className="button ghost small"
                onClick={() => {
                  setDraft(defaultSettings(host));
                  setSaved(false);
                }}
              >
                Reset
              </button>
              <span className="spacer" />
              {saved && (
                <span className="hint" role="status">
                  <Icon name="check" size={12} /> Saved
                </span>
              )}
              <button type="submit" className="button primary small">
                Save models
              </button>
            </div>
          </form>
        </details>
      )}
    </dialog>
  );
}
