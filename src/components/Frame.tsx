import { useMemo, type ReactNode } from 'react';
import { placeholderAlt, placeholderDataUrl } from '../lib/placeholder';
import type { Scene } from '../lib/types';
import { MOOD_INFO, SHOT_LABELS } from '../lib/vocabulary';
import type { FrameStatus } from '../state/board';

interface Props {
  scene: Pick<Scene, 'mood' | 'shot' | 'intensity' | 'visualPrompt' | 'description' | 'image'>;
  index: number;
  status?: FrameStatus | undefined;
  /** Buttons shown in the frame's top corner. */
  actions?: ReactNode;
  /** Leave out the number, shot and intensity labels (film strip, thumbnails). */
  bare?: boolean;
}

/** One 16:9 frame inside viewfinder corners: the generated image, or a placeholder drawn from the scene's mood and shot. */
export function Frame({ scene, index, status, actions, bare = false }: Props) {
  const placeholder = useMemo(
    () => placeholderDataUrl({ mood: scene.mood, shot: scene.shot, intensity: scene.intensity }, index, { labels: false }),
    [scene.mood, scene.shot, scene.intensity, index],
  );
  const image = scene.image;
  const alt = image
    ? `Frame for scene ${index + 1}: ${scene.visualPrompt || scene.description}`
    : placeholderAlt(scene, index);
  const intensity = Math.min(5, Math.max(1, Math.round(scene.intensity)));

  return (
    <figure className={`frame${status?.state === 'loading' ? ' is-loading' : ''}${image ? '' : ' is-placeholder'}`}>
      <img src={image?.src ?? placeholder} alt={alt} width={1600} height={900} loading="lazy" decoding="async" />
      <span className="viewfinder" aria-hidden="true" />
      {!bare && (
        <>
          <span className="frame-num" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="frame-shot" aria-hidden="true">
            {SHOT_LABELS[scene.shot]}
          </span>
          <span className="frame-dots" title={`Intensity ${intensity} of 5`} aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={n <= intensity ? 'on' : ''} />
            ))}
          </span>
        </>
      )}
      {bare && <span className="frame-mood" style={{ background: MOOD_INFO[scene.mood].accent }} aria-hidden="true" />}
      {actions && <span className="frame-actions">{actions}</span>}
      {status?.state === 'loading' && (
        <span className="frame-overlay">
          <span className="spinner" aria-hidden="true" />
          Drawing…
        </span>
      )}
      {status?.state === 'error' && (
        <span className="frame-error" role="note">
          <strong>{status.error.title}.</strong> {status.error.message}
        </span>
      )}
    </figure>
  );
}
