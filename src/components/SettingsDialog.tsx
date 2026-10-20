import { useEffect, useId, useRef } from 'react';
import type { Settings, ThinkingLevel } from '../lib/settings';
import { ZIBBY_IMAGE_MODELS, ZIBBY_TEXT_MODELS } from '../lib/zibbyPayloads';
import { Icon } from './Icon';

/** Scripto on Zibby's settings drawer. The free site has nothing to set, so it has none. */
interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
}

const THINKING_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: 'Low (recommended)',
  medium: 'Medium',
  high: 'High',
};

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

export function SettingsDialog({ open, onClose, settings, onSaveSettings }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const apply = (changes: Partial<Settings>) => {
    onSaveSettings({ ...settings, ...changes });
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

      <div className="drawer-hero">
        <span className="label-mono violet">On Zibby</span>
        <span className="two-tone small">
          No key. <span className="bright">Credits.</span>
        </span>
        <span className="hint">Each run shows an estimate first and its exact charge after.</span>
      </div>

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
    </dialog>
  );
}
