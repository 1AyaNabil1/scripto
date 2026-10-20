import { getStyle } from '../lib/styles';
import type { Storyboard } from '../lib/types';
import type { EditableSceneFields, FrameStatus } from '../state/board';
import { ArcLine } from './ArcLine';
import { Dock, type Layout } from './Dock';
import { FilmStrip } from './FilmStrip';
import { SceneCard } from './SceneCard';
import { peakIndex } from '../lib/arc';
import { boardLang, pad2, splitTitle } from './text';

interface Props {
  storyboard: Storyboard;
  frames: Record<string, FrameStatus>;
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
  /** False on the free site: no draw buttons, the sketches stay. */
  drawsFrames: boolean;
  canGenerate: boolean;
  generateHint: string;
  /** Credits per frame on Zibby, for the dock's estimate; null elsewhere or for comped visitors. */
  frameQuote: number | null;
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

export function BoardTab(props: Props) {
  const { storyboard } = props;
  const rtl = storyboard.direction === 'rtl';
  const lang = boardLang(storyboard);
  const missing = storyboard.scenes.filter((s) => !s.image).length;
  const drawQuote = props.frameQuote !== null && missing > 0 ? `~${missing * props.frameQuote} cr` : null;
  const [lead, tail] = splitTitle(storyboard.title, rtl);
  const peak = peakIndex(storyboard.scenes);
  const eyebrow = [
    storyboard.source === 'demo' ? 'Sample' : null,
    `${pad2(storyboard.scenes.length)} scenes`,
    getStyle(storyboard.styleId).label,
    lang?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="tab-page board-page" aria-labelledby="board-title" id="storyboard">
      <div className="board-head">
        <div className="board-heading" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
          <p className="label-mono violet" lang="en" dir="ltr">
            {eyebrow}
          </p>
          <h1 id="board-title" className="board-title" dir="auto">
            {lead}
            {tail && ' '}
            {tail && <span className="muted">{tail}</span>}
          </h1>
          {storyboard.logline && (
            <p className="logline" dir="auto">
              {storyboard.logline}
            </p>
          )}
          {storyboard.story && (
            <details className="original-story">
              <summary lang="en">Original story</summary>
              <p dir="auto">{storyboard.story}</p>
              <button
                type="button"
                className="text-link"
                lang="en"
                onClick={() => {
                  props.onUseStory(storyboard.story ?? '');
                }}
              >
                Copy into the story box
              </button>
            </details>
          )}
        </div>
        <div className="panel arc-card">
          <div className="arc-card-head" aria-hidden="true">
            <span>Arc</span>
            {peak >= 0 && <span className="violet">Peak {pad2(peak + 1)}</span>}
          </div>
          <ArcLine scenes={storyboard.scenes} rtl={rtl} size="mini" />
          <div className="arc-card-axis" aria-hidden="true" dir={rtl ? 'rtl' : 'ltr'}>
            {storyboard.scenes.map((scene, i) => (
              <span key={scene.id}>{pad2(i + 1)}</span>
            ))}
          </div>
        </div>
      </div>

      {props.layout === 'grid' ? (
        <ol className="scene-grid" dir={rtl ? 'rtl' : 'ltr'} aria-label="Scenes">
          {storyboard.scenes.map((scene, i) => (
            <li key={scene.id}>
              <SceneCard
                scene={scene}
                index={i}
                rtl={rtl}
                lang={lang}
                status={props.frames[scene.id]}
                drawsFrames={props.drawsFrames}
                canGenerate={props.canGenerate}
                generateHint={props.generateHint}
                onGenerate={props.onGenerateFrame}
                onRemoveImage={props.onRemoveImage}
                onSave={props.onSaveScene}
              />
            </li>
          ))}
        </ol>
      ) : (
        <FilmStrip storyboard={storyboard} frames={props.frames} />
      )}

      <Dock
        layout={props.layout}
        onLayoutChange={props.onLayoutChange}
        missing={missing}
        total={storyboard.scenes.length}
        drawsFrames={props.drawsFrames}
        canGenerate={props.canGenerate}
        generateHint={props.generateHint}
        quote={drawQuote}
        busy={props.busy}
        exporting={props.exporting}
        onDraw={props.onGenerateAll}
        onExportPng={props.onExportPng}
        onExportPdf={props.onExportPdf}
        onExportJson={props.onExportJson}
        onImport={props.onImport}
        onClear={props.onClear}
      />
    </section>
  );
}
