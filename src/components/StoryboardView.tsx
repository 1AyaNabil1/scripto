import { useId } from 'react';
import { getStyle } from '../lib/styles';
import type { Storyboard } from '../lib/types';
import type { EditableSceneFields, FrameStatus } from '../state/board';
import { Icon } from './Icon';
import { ImportButton } from './ImportButton';
import { MoodChart } from './MoodChart';
import { SceneCard } from './SceneCard';

export type Layout = 'grid' | 'strip';

interface Props {
  storyboard: Storyboard;
  frames: Record<string, FrameStatus>;
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
  canGenerate: boolean;
  generateHint: string;
  busy: boolean;
  exporting: boolean;
  onGenerateAll: () => void;
  onGenerateFrame: (sceneId: string) => void;
  onRemoveImage: (sceneId: string) => void;
  onSaveScene: (sceneId: string, changes: Partial<EditableSceneFields>) => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
  onUseStory: (story: string) => void;
}

const SOURCE_LABEL: Record<Storyboard['source'], string> = {
  demo: 'Demo',
  gemini: 'Generated with Gemini',
  import: 'Imported',
};

export function StoryboardView(props: Props) {
  const { storyboard } = props;
  const id = useId();
  const rtl = storyboard.direction === 'rtl';
  const lang = storyboard.language && storyboard.language !== 'und' ? storyboard.language : undefined;
  const missing = storyboard.scenes.filter((s) => !s.image).length;
  const imageCount = storyboard.scenes.length - missing;

  return (
    <section className="storyboard" aria-labelledby={`${id}-title`} id="storyboard">
      <header className="storyboard-header">
        <div className="storyboard-heading" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
          <p className="eyebrow" lang="en" dir="ltr">
            {SOURCE_LABEL[storyboard.source]} · {storyboard.scenes.length} scenes · {getStyle(storyboard.styleId).label}
            {rtl ? ' · right to left' : ''}
          </p>
          <h2 id={`${id}-title`} dir="auto">
            {storyboard.title}
          </h2>
          {storyboard.logline && (
            <p className="logline" dir="auto">
              {storyboard.logline}
            </p>
          )}
        </div>
        {storyboard.story && (
          <details className="original-story">
            <summary>Original story</summary>
            <p dir="auto" lang={lang}>
              {storyboard.story}
            </p>
            <button
              type="button"
              className="button small ghost"
              onClick={() => {
                props.onUseStory(storyboard.story ?? '');
              }}
            >
              Copy into the story box
            </button>
          </details>
        )}
        {storyboard.source === 'demo' && (
          <p className="help demo-note">
            This demo uses placeholder frames drawn from each scene’s mood and camera shot. Add your own Gemini key to
            generate real frames, or to make a storyboard from your own story.
          </p>
        )}
      </header>

      <div className="toolbar" role="group" aria-label="Storyboard actions">
        <div className="toolbar-group">
          <button
            type="button"
            className="button primary"
            onClick={props.onGenerateAll}
            disabled={!props.canGenerate || missing === 0}
            title={props.canGenerate ? undefined : props.generateHint}
          >
            <Icon name="image" />{' '}
            {missing === 0
              ? 'All frames generated'
              : imageCount === 0
                ? 'Generate frames'
                : `Generate ${missing} missing frame${missing === 1 ? '' : 's'}`}
          </button>
        </div>

        <fieldset className="segmented">
          <legend className="visually-hidden">Layout</legend>
          <label className={props.layout === 'grid' ? 'selected' : ''}>
            <input
              type="radio"
              name={`${id}-layout`}
              value="grid"
              checked={props.layout === 'grid'}
              onChange={() => {
                props.onLayoutChange('grid');
              }}
            />
            <Icon name="grid" size={16} /> Grid
          </label>
          <label className={props.layout === 'strip' ? 'selected' : ''}>
            <input
              type="radio"
              name={`${id}-layout`}
              value="strip"
              checked={props.layout === 'strip'}
              onChange={() => {
                props.onLayoutChange('strip');
              }}
            />
            <Icon name="strip" size={16} /> Strip
          </label>
        </fieldset>

        <div className="toolbar-group" role="group" aria-label="Export">
          <span className="toolbar-label">Export</span>
          <button
            type="button"
            className="button"
            onClick={props.onExportPng}
            disabled={props.exporting}
            aria-label="Export as PNG"
          >
            <Icon name="download" size={16} /> PNG
          </button>
          <button type="button" className="button" onClick={props.onExportPdf} aria-label="Export as PDF (print)">
            <Icon name="download" size={16} /> PDF
          </button>
          <button type="button" className="button" onClick={props.onExportJson} aria-label="Export as JSON">
            <Icon name="download" size={16} /> JSON
          </button>
        </div>

        <div className="toolbar-group">
          <ImportButton onImport={props.onImport} disabled={props.busy} />
          <button type="button" className="button ghost danger-text" onClick={props.onClear} disabled={props.busy}>
            <Icon name="trash" size={16} /> Clear
          </button>
        </div>
      </div>

      <MoodChart scenes={storyboard.scenes} rtl={rtl} lang={lang} />

      <ol className={`scenes ${props.layout}`} dir={rtl ? 'rtl' : 'ltr'} aria-label="Scenes">
        {storyboard.scenes.map((scene, i) => (
          <li key={scene.id}>
            <SceneCard
              scene={scene}
              index={i}
              rtl={rtl}
              lang={lang}
              status={props.frames[scene.id]}
              canGenerate={props.canGenerate}
              generateHint={props.generateHint}
              onGenerate={props.onGenerateFrame}
              onRemoveImage={props.onRemoveImage}
              onSave={props.onSaveScene}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
