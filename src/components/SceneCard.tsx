import { useId, useState } from 'react';
import { formatLine } from '../lib/format';
import type { Scene } from '../lib/types';
import { MOOD_INFO, SHOT_LABELS } from '../lib/vocabulary';
import type { EditableSceneFields, FrameStatus } from '../state/board';
import { Frame } from './Frame';
import { Icon } from './Icon';
import { SceneEditor } from './SceneEditor';

interface Props {
  scene: Scene;
  index: number;
  rtl: boolean;
  lang: string | undefined;
  status: FrameStatus | undefined;
  canGenerate: boolean;
  generateHint: string;
  onGenerate: (sceneId: string) => void;
  onRemoveImage: (sceneId: string) => void;
  onSave: (sceneId: string, changes: Partial<EditableSceneFields>) => void;
}

export function SceneCard({ scene, index, rtl, lang, status, canGenerate, generateHint, onGenerate, onRemoveImage, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const id = useId();
  const number = String(index + 1).padStart(2, '0');
  const loading = status?.state === 'loading';
  const mood = MOOD_INFO[scene.mood];

  return (
    <article className="scene-card" aria-labelledby={`${id}-title`}>
      <Frame scene={scene} index={index} status={status} />
      <div className="scene-body" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
        {editing ? (
          <SceneEditor
            scene={scene}
            onCancel={() => {
              setEditing(false);
            }}
            onSave={(changes) => {
              onSave(scene.id, changes);
              setEditing(false);
            }}
          />
        ) : (
          <>
            <p className="eyebrow" lang="en" dir="ltr">
              Scene {number}
            </p>
            <h3 id={`${id}-title`} className="scene-title" dir="auto">
              {scene.title}
            </h3>
            <ul className="chips" aria-label="Shot and mood" lang="en">
              <li className="chip" dir="ltr">
                {SHOT_LABELS[scene.shot]}
              </li>
              <li className="chip" dir="ltr">
                <span className={`swatch mood-${scene.mood}`} aria-hidden="true" />
                {mood.label}
              </li>
              <li className="chip" dir="ltr" title="Emotional intensity">
                Intensity {scene.intensity}/5
              </li>
            </ul>
            {scene.description && (
              <p className="scene-description" dir="auto">
                {scene.description}
              </p>
            )}
            <dl className="scene-meta">
              {scene.characters.length > 0 && (
                <div>
                  <dt lang="en" dir="ltr">
                    Characters:
                  </dt>
                  <dd dir="auto">{scene.characters.join(rtl ? '، ' : ', ')}</dd>
                </div>
              )}
              {scene.setting && (
                <div>
                  <dt lang="en" dir="ltr">
                    Setting:
                  </dt>
                  <dd dir="auto">{scene.setting}</dd>
                </div>
              )}
            </dl>
            {scene.line && (
              <blockquote className={`scene-line ${scene.lineType}`} dir="auto">
                {scene.lineType === 'narration' && (
                  <span className="line-label" lang="en">
                    Narration
                  </span>
                )}
                {formatLine(scene, rtl)}
              </blockquote>
            )}
          </>
        )}
      </div>
      {!editing && (
        <div className="scene-actions" lang="en" dir="ltr">
          <button
            type="button"
            className="button small ghost"
            onClick={() => {
              setEditing(true);
            }}
            aria-label={`Edit scene ${index + 1}`}
          >
            <Icon name="edit" size={16} /> Edit
          </button>
          <button
            type="button"
            className="button small ghost"
            onClick={() => {
              onGenerate(scene.id);
            }}
            disabled={!canGenerate || loading}
            title={canGenerate ? undefined : generateHint}
            aria-label={`${scene.image ? 'Regenerate' : 'Generate'} frame for scene ${index + 1}`}
          >
            <Icon name={scene.image ? 'refresh' : 'image'} size={16} /> {scene.image ? 'Regenerate' : 'Generate'} frame
          </button>
          {scene.image && (
            <button
              type="button"
              className="button small ghost"
              onClick={() => {
                onRemoveImage(scene.id);
              }}
              disabled={loading}
              aria-label={`Use placeholder for scene ${index + 1}`}
            >
              <Icon name="trash" size={16} /> Placeholder
            </button>
          )}
        </div>
      )}
    </article>
  );
}
