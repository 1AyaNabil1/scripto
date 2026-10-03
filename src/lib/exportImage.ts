/**
 * Renders the storyboard into a single PNG with the Canvas API (no
 * third-party libraries). Text is wrapped and laid out right to left for
 * RTL storyboards.
 */
import { ScriptoError } from './errors';
import { formatLine } from './format';
import { placeholderDataUrl } from './placeholder';
import type { Storyboard } from './types';
import { MOOD_INFO, SHOT_LABELS } from './vocabulary';

export type Measure = (text: string) => number;

/** Greedy word wrap; very long words are broken by character. */
export function wrapText(text: string, maxWidth: number, measure: Measure): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (measure(word) <= maxWidth) {
        current = word;
        continue;
      }
      // Break an overlong word.
      let piece = '';
      for (const char of word) {
        if (measure(piece + char) > maxWidth && piece) {
          lines.push(piece);
          piece = char;
        } else {
          piece += char;
        }
      }
      current = piece;
    }
    if (current) lines.push(current);
  }
  return lines;
}

/** Keeps at most `max` lines, ending the last kept line with an ellipsis. */
export function clampLines(lines: string[], max: number, measure: Measure, maxWidth: number): string[] {
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  let last = kept[max - 1] ?? '';
  while (last && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
  kept[max - 1] = `${last.trimEnd()}…`;
  return kept;
}

export interface ExportLayout {
  columns: number;
  cellWidth: number;
  frameHeight: number;
  textHeight: number;
  gap: number;
  margin: number;
  headerHeight: number;
  width: number;
  height: number;
}

export function computeLayout(sceneCount: number): ExportLayout {
  const columns = sceneCount <= 4 ? 2 : 3;
  const rows = Math.max(1, Math.ceil(sceneCount / columns));
  const cellWidth = 560;
  const frameHeight = Math.round((cellWidth * 9) / 16);
  const textHeight = 250;
  const gap = 32;
  const margin = 56;
  const headerHeight = 150;
  const width = margin * 2 + columns * cellWidth + (columns - 1) * gap;
  const height = margin + headerHeight + rows * (frameHeight + textHeight) + (rows - 1) * gap + margin;
  return { columns, cellWidth, frameHeight, textHeight, gap, margin, headerHeight, width, height };
}

const FONT_STACK =
  "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', 'Noto Sans Arabic', 'Geeza Pro', Tahoma, sans-serif";

const COLORS = {
  page: '#faf9f6',
  card: '#ffffff',
  border: '#dedcd5',
  ink: '#1c1b19',
  ink2: '#55534e',
  muted: '#77756f',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error('image failed to load'));
    };
    image.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (image.naturalWidth - sw) / 2;
  const sy = (image.naturalHeight - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export async function renderStoryboardPng(storyboard: Storyboard): Promise<Blob> {
  const layout = computeLayout(storyboard.scenes.length);
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ScriptoError('input', 'Your browser cannot draw the PNG export. Try the PDF export instead.');

  const rtl = storyboard.direction === 'rtl';
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'top';

  ctx.fillStyle = COLORS.page;
  ctx.fillRect(0, 0, layout.width, layout.height);

  const textX = (x: number, w: number) => (rtl ? x + w : x);
  const fullWidth = layout.width - layout.margin * 2;

  // Header
  ctx.fillStyle = COLORS.ink;
  ctx.font = `700 44px ${FONT_STACK}`;
  ctx.fillText(storyboard.title, textX(layout.margin, fullWidth), layout.margin, fullWidth);
  if (storyboard.logline) {
    ctx.fillStyle = COLORS.ink2;
    ctx.font = `400 24px ${FONT_STACK}`;
    const measure: Measure = (t) => ctx.measureText(t).width;
    const lines = clampLines(wrapText(storyboard.logline, fullWidth, measure), 2, measure, fullWidth);
    lines.forEach((line, i) => {
      ctx.fillText(line, textX(layout.margin, fullWidth), layout.margin + 62 + i * 32, fullWidth);
    });
  }

  const images = await Promise.all(
    storyboard.scenes.map((scene, i) =>
      loadImage(scene.image?.src ?? placeholderDataUrl(scene, i)).catch(() => loadImage(placeholderDataUrl(scene, i))),
    ),
  );

  storyboard.scenes.forEach((scene, i) => {
    const col = i % layout.columns;
    const row = Math.floor(i / layout.columns);
    const visualCol = rtl ? layout.columns - 1 - col : col;
    const x = layout.margin + visualCol * (layout.cellWidth + layout.gap);
    const y = layout.margin + layout.headerHeight + row * (layout.frameHeight + layout.textHeight + layout.gap);
    const w = layout.cellWidth;

    // Card
    ctx.fillStyle = COLORS.card;
    roundedRect(ctx, x, y, w, layout.frameHeight + layout.textHeight, 14);
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Frame
    ctx.save();
    roundedRect(ctx, x, y, w, layout.frameHeight, 14);
    ctx.clip();
    const image = images[i];
    if (image) drawCover(ctx, image, x, y, w, layout.frameHeight);
    ctx.restore();

    const pad = 20;
    const innerW = w - pad * 2;
    const tx = textX(x + pad, innerW);
    let ty = y + layout.frameHeight + 16;

    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 24px ${FONT_STACK}`;
    const number = String(i + 1).padStart(2, '0');
    ctx.fillText(`${number} · ${scene.title}`, tx, ty, innerW);
    ty += 34;

    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 16px ${FONT_STACK}`;
    ctx.fillText(
      `${SHOT_LABELS[scene.shot]} · ${MOOD_INFO[scene.mood].label} · ${scene.intensity}/5`,
      tx,
      ty,
      innerW,
    );
    ty += 28;

    ctx.fillStyle = COLORS.ink2;
    ctx.font = `400 18px ${FONT_STACK}`;
    const measure: Measure = (t) => ctx.measureText(t).width;
    for (const line of clampLines(wrapText(scene.description, innerW, measure), 4, measure, innerW)) {
      ctx.fillText(line, tx, ty, innerW);
      ty += 25;
    }
    ty += 6;

    if (scene.line) {
      ctx.fillStyle = COLORS.ink;
      ctx.font = `italic 400 18px ${FONT_STACK}`;
      const said = formatLine(scene, rtl);
      const remaining = Math.max(1, Math.floor((y + layout.frameHeight + layout.textHeight - 14 - ty) / 25));
      for (const line of clampLines(wrapText(said, innerW, measure), Math.min(3, remaining), measure, innerW)) {
        ctx.fillText(line, tx, ty, innerW);
        ty += 25;
      }
    }
  });

  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new ScriptoError('input', 'The PNG could not be created. Try the PDF export instead.'));
      }, 'image/png');
    } catch (cause) {
      reject(
        new ScriptoError('input', 'Your browser blocked the PNG export. Try the PDF export instead.', { cause }),
      );
    }
  });
}
