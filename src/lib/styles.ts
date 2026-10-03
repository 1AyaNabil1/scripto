/** Visual style presets. The same style text goes into every frame prompt. */
export interface VisualStyle {
  id: string;
  label: string;
  /** Short description shown in the picker. */
  hint: string;
  /** Style instructions appended to each image prompt. */
  prompt: string;
}

export const VISUAL_STYLES: readonly VisualStyle[] = [
  {
    id: 'sketch',
    label: 'Storyboard sketch',
    hint: 'Pencil and grey marker, like a classic film storyboard',
    prompt:
      'Classic film storyboard drawing: loose graphite pencil lines with grey marker shading on off-white paper, clear silhouettes, minimal detail, monochrome.',
  },
  {
    id: 'cinematic',
    label: 'Cinematic still',
    hint: 'Moody, film-lit colour frames',
    prompt:
      'Cinematic film still: anamorphic look, motivated lighting, rich but natural colour grading, shallow depth of field, subtle film grain.',
  },
  {
    id: 'watercolor',
    label: 'Watercolour',
    hint: 'Soft washes and visible paper texture',
    prompt:
      "Hand-painted watercolour illustration: soft washes, gentle bleeding edges, visible paper texture, limited harmonious palette, children's picture-book quality.",
  },
  {
    id: 'anime',
    label: 'Anime',
    hint: 'Clean line art and painted backgrounds',
    prompt:
      'Hand-drawn anime film style: clean confident line art, cel shading, lush painted backgrounds, expressive characters.',
  },
  {
    id: 'comic',
    label: 'Graphic novel',
    hint: 'Bold inks and flat colour',
    prompt:
      'Graphic novel panel art: bold black ink outlines, dramatic spotted blacks, flat colours with halftone texture.',
  },
  {
    id: 'noir',
    label: 'Noir',
    hint: 'High-contrast black and white',
    prompt:
      'Film noir: high-contrast black and white, hard shadows, venetian-blind light, deep blacks, 1940s cinematography.',
  },
];

export const DEFAULT_STYLE_ID = 'sketch';

export function getStyle(id: string | undefined): VisualStyle {
  const found = VISUAL_STYLES.find((s) => s.id === id);
  if (found) return found;
  const fallback = VISUAL_STYLES.find((s) => s.id === DEFAULT_STYLE_ID);
  if (!fallback) throw new Error('Default style missing');
  return fallback;
}
