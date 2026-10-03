import { useMemo } from 'react';
import { placeholderAlt, placeholderDataUrl } from '../lib/placeholder';
import type { Scene } from '../lib/types';
import type { FrameStatus } from '../state/board';

interface Props {
  scene: Scene;
  index: number;
  status: FrameStatus | undefined;
}

/** A storyboard frame: the generated image, or a placeholder drawn from the scene's mood and shot. */
export function Frame({ scene, index, status }: Props) {
  const placeholder = useMemo(
    () => placeholderDataUrl({ mood: scene.mood, shot: scene.shot, intensity: scene.intensity }, index),
    [scene.mood, scene.shot, scene.intensity, index],
  );
  const image = scene.image;
  const src = image?.src ?? placeholder;
  const alt = image
    ? `Frame for scene ${index + 1}: ${scene.visualPrompt || scene.description}`
    : placeholderAlt(scene, index);

  return (
    <figure className={`frame${status?.state === 'loading' ? ' is-loading' : ''}`}>
      <img src={src} alt={alt} width={1600} height={900} loading="lazy" decoding="async" />
      {status?.state === 'loading' && (
        <div className="frame-overlay">
          <span className="spinner" aria-hidden="true" />
          <span>Drawing frame…</span>
        </div>
      )}
      {status?.state === 'error' && (
        <div className="frame-error">
          <strong>{status.error.title}.</strong> {status.error.message}
        </div>
      )}
      {!image && status?.state !== 'loading' && <figcaption className="frame-tag">Placeholder</figcaption>}
    </figure>
  );
}
