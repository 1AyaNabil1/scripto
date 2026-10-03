import { useId, useState, type SyntheticEvent } from 'react';
import { LINE_TYPES, MOODS, SHOTS, type LineType, type Mood, type Scene, type Shot } from '../lib/types';
import { MOOD_INFO, SHOT_LABELS } from '../lib/vocabulary';
import type { EditableSceneFields } from '../state/board';

interface Props {
  scene: Scene;
  onSave: (changes: Partial<EditableSceneFields>) => void;
  onCancel: () => void;
}

function splitNames(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/[,،]/)
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function SceneEditor({ scene, onSave, onCancel }: Props) {
  const id = useId();
  const [title, setTitle] = useState(scene.title);
  const [description, setDescription] = useState(scene.description);
  const [characters, setCharacters] = useState(scene.characters.join(', '));
  const [setting, setSetting] = useState(scene.setting);
  const [mood, setMood] = useState<Mood>(scene.mood);
  const [intensity, setIntensity] = useState(scene.intensity);
  const [shot, setShot] = useState<Shot>(scene.shot);
  const [lineType, setLineType] = useState<LineType>(scene.lineType);
  const [speaker, setSpeaker] = useState(scene.speaker);
  const [line, setLine] = useState(scene.line);
  const [visualPrompt, setVisualPrompt] = useState(scene.visualPrompt);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedSpeaker = speaker.trim();
    const type: LineType = lineType === 'dialogue' && trimmedSpeaker ? 'dialogue' : 'narration';
    onSave({
      title: title.trim() || scene.title,
      description: description.trim(),
      characters: splitNames(characters),
      setting: setting.trim(),
      mood,
      intensity: Math.min(5, Math.max(1, Math.round(intensity))),
      shot,
      lineType: type,
      speaker: type === 'dialogue' ? trimmedSpeaker : '',
      line: line.trim(),
      visualPrompt: visualPrompt.trim(),
    });
  };

  return (
    <form className="scene-editor" onSubmit={submit} aria-label={`Edit scene: ${scene.title}`}>
      <div className="field">
        <label htmlFor={`${id}-title`}>Title</label>
        <input id={`${id}-title`} dir="auto" value={title} maxLength={120} onChange={(e) => { setTitle(e.target.value); }} required />
      </div>
      <div className="field">
        <label htmlFor={`${id}-desc`}>Description</label>
        <textarea id={`${id}-desc`} dir="auto" rows={3} maxLength={800} value={description} onChange={(e) => { setDescription(e.target.value); }} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-shot`}>Camera shot</label>
          <select id={`${id}-shot`} value={shot} onChange={(e) => { setShot(e.target.value as Shot); }}>
            {SHOTS.map((s) => (
              <option key={s} value={s}>
                {SHOT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-mood`}>Mood</label>
          <select id={`${id}-mood`} value={mood} onChange={(e) => { setMood(e.target.value as Mood); }}>
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {MOOD_INFO[m].label}
              </option>
            ))}
          </select>
        </div>
        <div className="field narrow">
          <label htmlFor={`${id}-intensity`}>Intensity</label>
          <select id={`${id}-intensity`} value={intensity} onChange={(e) => { setIntensity(Number(e.target.value)); }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-chars`}>Characters (comma separated)</label>
          <input id={`${id}-chars`} dir="auto" value={characters} onChange={(e) => { setCharacters(e.target.value); }} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-setting`}>Setting</label>
          <input id={`${id}-setting`} dir="auto" value={setting} maxLength={240} onChange={(e) => { setSetting(e.target.value); }} />
        </div>
      </div>
      <div className="field-row">
        <div className="field narrow">
          <label htmlFor={`${id}-type`}>Line type</label>
          <select id={`${id}-type`} value={lineType} onChange={(e) => { setLineType(e.target.value as LineType); }}>
            {LINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'dialogue' ? 'Dialogue' : 'Narration'}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-speaker`}>Speaker</label>
          <input
            id={`${id}-speaker`}
            dir="auto"
            value={speaker}
            maxLength={80}
            disabled={lineType === 'narration'}
            onChange={(e) => { setSpeaker(e.target.value); }}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${id}-line`}>{lineType === 'dialogue' ? 'Dialogue' : 'Narration'}</label>
        <textarea id={`${id}-line`} dir="auto" rows={2} maxLength={400} value={line} onChange={(e) => { setLine(e.target.value); }} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-visual`}>Image prompt (English works best)</label>
        <textarea
          id={`${id}-visual`}
          dir="auto"
          rows={3}
          maxLength={1000}
          value={visualPrompt}
          onChange={(e) => { setVisualPrompt(e.target.value); }}
          aria-describedby={`${id}-visual-help`}
        />
        <p id={`${id}-visual-help`} className="help">
          Used with the description, setting and mood when this frame is generated.
        </p>
      </div>
      <div className="editor-actions">
        <button type="button" className="button ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button primary">
          Save scene
        </button>
      </div>
    </form>
  );
}
