import { useId, useState } from 'react';
import type { Scene } from '../lib/types';
import { MOOD_INFO } from '../lib/vocabulary';
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
  drawsFrames: boolean;
  canGenerate: boolean;
  generateHint: string;
  onGenerate: (sceneId: string) => void;
  onRemoveImage: (sceneId: string) => void;
  onSave: (sceneId: string, changes: Partial<EditableSceneFields>) => void;
}

/** The voice under a line: the speaker, or "narration". */
function voiceOf(scene: Pick<Scene, 'lineType' | 'speaker'>, rtl: boolean): string {
  if (scene.lineType === 'dialogue' && scene.speaker) return scene.speaker;
  return rtl ? 'الراوي' : 'Narration';
}

export function SceneCard(props: Props) {
  const { scene, index, rtl, lang, status } = props;
  const [editing, setEditing] = useState(false);
  const id = useId();
  const loading = status?.state === 'loading';
  const mood = MOOD_INFO[scene.mood];
  const quoteOpen = rtl ? '«' : '“';
  const quoteClose = rtl ? '»' : '”';
  const said = /^["“«]/.test(scene.line) ? scene.line : `${quoteOpen}${scene.line}${quoteClose}`;

  const actions = (
    <>
      <button
        type="button"
        className="frame-button"
        onClick={() => {
          setEditing(true);
        }}
        aria-label={`Edit scene ${index + 1}`}
        title="Edit"
      >
        <Icon name="edit" size={12} />
      </button>
      {props.drawsFrames && (
        <button
          type="button"
          className="frame-button"
          onClick={() => {
            props.onGenerate(scene.id);
          }}
          disabled={!props.canGenerate || loading}
          aria-label={`${scene.image ? 'Regenerate' : 'Generate'} frame for scene ${index + 1}`}
          title={props.canGenerate ? (scene.image ? 'Redraw' : 'Draw') : props.generateHint}
        >
          <Icon name={scene.image ? 'refresh' : 'image'} size={12} />
        </button>
      )}
    </>
  );

  return (
    <article className="scene-card" aria-labelledby={`${id}-title`}>
      <Frame scene={scene} index={index} status={status} actions={editing ? undefined : actions} />
      <div className="scene-body" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
        {editing ? (
          <SceneEditor
            scene={scene}
            onCancel={() => {
              setEditing(false);
            }}
            onRemoveImage={
              scene.image
                ? () => {
                    props.onRemoveImage(scene.id);
                  }
                : undefined
            }
            onSave={(changes) => {
              props.onSave(scene.id, changes);
              setEditing(false);
            }}
          />
        ) : (
          <>
            <div className="scene-head">
              <h3 id={`${id}-title`} className="scene-title" dir="auto">
                {scene.title}
              </h3>
              <span className="mood-tag" lang="en" dir="ltr">
                <span className="mood-dot" style={{ background: mood.accent }} aria-hidden="true" />
                {mood.label}
              </span>
            </div>
            {scene.line && (
              <p className="scene-line" dir="auto">
                <span className="quote">{said}</span>
                <span className="voice"> — {voiceOf(scene, rtl)}</span>
              </p>
            )}
            {scene.description && (
              <p className="scene-description" dir="auto">
                {scene.description}
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
