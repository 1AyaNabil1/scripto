import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Icon } from './Icon';

export type Layout = 'grid' | 'strip';

interface Props {
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
  missing: number;
  total: number;
  drawsFrames: boolean;
  canGenerate: boolean;
  generateHint: string;
  /** "~54 cr" on Zibby; nothing elsewhere. */
  quote: string | null;
  busy: boolean;
  exporting: boolean;
  onDraw: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
}

/** The floating action bar under a board: layout, draw, export, open, clear. */
export function Dock(props: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return undefined;
    const timer = setTimeout(() => {
      setConfirming(false);
    }, 4000);
    return () => {
      clearTimeout(timer);
    };
  }, [confirming]);

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) props.onImport(file);
  };

  const drawLabel =
    props.missing === 0 ? 'All drawn' : props.missing === props.total ? `Draw ${props.total}` : `Draw ${props.missing} more`;

  return (
    <div className="dock-wrap">
      <div className="dock" role="toolbar" aria-label="Board actions">
        <div className="dock-group" role="group" aria-label="Layout">
          <button
            type="button"
            className={`dock-button icon-only${props.layout === 'grid' ? ' is-active' : ''}`}
            aria-pressed={props.layout === 'grid'}
            aria-label="Grid"
            title="Grid"
            onClick={() => {
              props.onLayoutChange('grid');
            }}
          >
            <Icon name="grid" />
          </button>
          <button
            type="button"
            className={`dock-button icon-only${props.layout === 'strip' ? ' is-active' : ''}`}
            aria-pressed={props.layout === 'strip'}
            aria-label="Film strip"
            title="Film strip"
            onClick={() => {
              props.onLayoutChange('strip');
            }}
          >
            <Icon name="film" size={18} />
          </button>
        </div>
        {props.drawsFrames && (
          <>
            <span className="dock-sep" aria-hidden="true" />
            <button
              type="button"
              className="dock-button primary"
              onClick={props.onDraw}
              disabled={!props.canGenerate || props.missing === 0 || props.busy}
              title={props.canGenerate ? undefined : props.generateHint}
            >
              <Icon name="image" /> {drawLabel}
              {props.quote && props.missing > 0 && <span className="chip-mono">{props.quote}</span>}
            </button>
          </>
        )}
        <span className="dock-sep" aria-hidden="true" />
        <button
          type="button"
          className="dock-button mono"
          onClick={props.onExportPng}
          disabled={props.exporting}
          aria-label="Export as PNG"
        >
          PNG
        </button>
        <button type="button" className="dock-button mono" onClick={props.onExportPdf} aria-label="Export as PDF (print)">
          PDF
        </button>
        <button type="button" className="dock-button mono" onClick={props.onExportJson} aria-label="Export as JSON">
          JSON
        </button>
        <button
          type="button"
          className="dock-button icon-only"
          onClick={() => fileRef.current?.click()}
          disabled={props.busy}
          aria-label="Open a saved storyboard"
          title="Open JSON"
        >
          <Icon name="upload" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="import-input"
          onChange={pick}
        />
        {confirming ? (
          <button
            type="button"
            className="dock-button danger is-confirming"
            onClick={() => {
              setConfirming(false);
              props.onClear();
            }}
            aria-label="Confirm: clear this storyboard"
          >
            <Icon name="trash" /> Clear?
          </button>
        ) : (
          <button
            type="button"
            className="dock-button icon-only danger"
            onClick={() => {
              setConfirming(true);
            }}
            disabled={props.busy}
            aria-label="Clear storyboard"
            title="Clear"
          >
            <Icon name="trash" />
          </button>
        )}
      </div>
    </div>
  );
}
