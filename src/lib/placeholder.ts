/**
 * Placeholder storyboard frames, drawn as SVG.
 *
 * Used whenever there is no generated image: demo mode, images turned off,
 * or a failed frame. Each frame has a mood-based gradient and a simple
 * schematic of the camera shot, so the storyboard still reads as a sequence.
 */
import type { Mood, Scene, Shot } from './types';
import { MOOD_INFO, SHOT_LABELS } from './vocabulary';

export const FRAME_WIDTH = 1600;
export const FRAME_HEIGHT = 900;

const INK = '#ffffff';
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;',
  );
}

/** Head-and-torso figure; `h` is the visible height from the top of the head. */
function bust(cx: number, top: number, h: number, opacity = 0.85): string {
  const r = h * 0.17;
  const neckY = top + r * 2.1;
  const w = h * 0.62;
  return `<g fill="${INK}" opacity="${opacity}">
    <circle cx="${cx}" cy="${top + r}" r="${r}"/>
    <path d="M${cx - w / 2} ${top + h} C${cx - w / 2} ${neckY + h * 0.08} ${cx - w * 0.28} ${neckY} ${cx} ${neckY} C${cx + w * 0.28} ${neckY} ${cx + w / 2} ${neckY + h * 0.08} ${cx + w / 2} ${top + h} Z"/>
  </g>`;
}

/** Full standing figure with feet on `baseY`. */
function standing(cx: number, baseY: number, h: number, opacity = 0.85): string {
  const r = h * 0.09;
  const top = baseY - h;
  const shoulderY = top + r * 2.3;
  const hipY = top + h * 0.56;
  const sw = h * 0.27;
  return `<g fill="${INK}" opacity="${opacity}">
    <circle cx="${cx}" cy="${top + r}" r="${r}"/>
    <path d="M${cx - sw / 2} ${hipY} L${cx - sw / 2} ${shoulderY + r * 0.6} Q${cx - sw / 2} ${shoulderY} ${cx - sw / 4} ${shoulderY} L${cx + sw / 4} ${shoulderY} Q${cx + sw / 2} ${shoulderY} ${cx + sw / 2} ${shoulderY + r * 0.6} L${cx + sw / 2} ${hipY} Z"/>
    <rect x="${cx - sw / 2}" y="${hipY - 1}" width="${sw * 0.42}" height="${baseY - hipY}" rx="${sw * 0.12}"/>
    <rect x="${cx + sw * 0.08}" y="${hipY - 1}" width="${sw * 0.42}" height="${baseY - hipY}" rx="${sw * 0.12}"/>
  </g>`;
}

function horizon(y: number): string {
  return `<line x1="0" y1="${y}" x2="${FRAME_WIDTH}" y2="${y}" stroke="${INK}" stroke-width="3" opacity="0.45"/>`;
}

function perspective(vx: number, vy: number, count = 9): string {
  const lines: string[] = [];
  for (let i = 0; i <= count; i++) {
    const x = (FRAME_WIDTH / count) * i;
    const y = vy < 0 ? FRAME_HEIGHT : 0;
    lines.push(`<line x1="${x}" y1="${y}" x2="${vx}" y2="${vy}"/>`);
  }
  return `<g stroke="${INK}" stroke-width="2" opacity="0.22">${lines.join('')}</g>`;
}

function shotSchematic(shot: Shot): string {
  switch (shot) {
    case 'establishing': {
      const buildings = [
        [120, 170],
        [230, 260],
        [330, 140],
        [470, 310],
        [600, 200],
        [1040, 240],
        [1160, 330],
        [1290, 180],
        [1400, 270],
      ]
        .map(
          ([x = 0, h = 0]) =>
            `<rect x="${x}" y="${640 - h}" width="${x > 1000 ? 110 : 95}" height="${h}" rx="4"/>`,
        )
        .join('');
      return `${horizon(640)}<g fill="${INK}" opacity="0.32">${buildings}</g>${standing(820, 700, 90)}`;
    }
    case 'wide':
      return `${horizon(640)}${standing(690, 760, 330)}${standing(900, 760, 300, 0.7)}`;
    case 'medium':
      return bust(800, 230, 680);
    case 'close-up':
      return bust(800, 120, 1100);
    case 'extreme-close-up':
      return `<g fill="none" stroke="${INK}" stroke-width="10" opacity="0.85">
        <path d="M330 450 Q800 130 1270 450 Q800 770 330 450 Z"/>
      </g>
      <circle cx="800" cy="450" r="150" fill="${INK}" opacity="0.55"/>
      <circle cx="800" cy="450" r="62" fill="${INK}" opacity="0.95"/>`;
    case 'over-the-shoulder':
      return `${bust(1030, 250, 600, 0.75)}
      <g fill="#000000" opacity="0.45">
        <circle cx="380" cy="430" r="210"/>
        <path d="M-60 900 C-40 690 130 610 380 610 C640 610 820 700 850 900 Z"/>
      </g>`;
    case 'point-of-view':
      return `${bust(800, 300, 520, 0.8)}
      <g fill="none" stroke="${INK}" stroke-width="3" opacity="0.6">
        <circle cx="800" cy="450" r="250"/>
        <line x1="800" y1="150" x2="800" y2="250"/><line x1="800" y1="650" x2="800" y2="750"/>
        <line x1="500" y1="450" x2="600" y2="450"/><line x1="1000" y1="450" x2="1100" y2="450"/>
      </g>
      <rect width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" fill="url(#pov)"/>`;
    case 'low-angle':
      return `${perspective(800, -500)}${standing(800, 960, 820)}`;
    case 'high-angle':
      return `${perspective(800, 1500)}<ellipse cx="800" cy="610" rx="120" ry="30" fill="#000000" opacity="0.25"/>${standing(800, 600, 240)}`;
    case 'aerial': {
      const trees = [
        [180, 160, 70],
        [330, 260, 55],
        [250, 690, 80],
        [1260, 180, 75],
        [1420, 340, 60],
        [1330, 700, 85],
      ]
        .map(([x = 0, y = 0, r = 0]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
        .join('');
      const people = [
        [760, 420],
        [820, 470],
        [870, 400],
      ]
        .map(([x = 0, y = 0]) => `<circle cx="${x}" cy="${y}" r="16"/>`)
        .join('');
      return `<rect x="600" y="0" width="400" height="${FRAME_HEIGHT}" fill="${INK}" opacity="0.18"/>
      <g fill="${INK}" opacity="0.35">${trees}</g>
      <g fill="${INK}" opacity="0.9">${people}</g>`;
    }
  }
}

function thirdsGrid(): string {
  const w = FRAME_WIDTH;
  const h = FRAME_HEIGHT;
  return `<g stroke="${INK}" stroke-width="2" opacity="0.14">
    <line x1="${w / 3}" y1="0" x2="${w / 3}" y2="${h}"/><line x1="${(2 * w) / 3}" y1="0" x2="${(2 * w) / 3}" y2="${h}"/>
    <line x1="0" y1="${h / 3}" x2="${w}" y2="${h / 3}"/><line x1="0" y1="${(2 * h) / 3}" x2="${w}" y2="${(2 * h) / 3}"/>
  </g>`;
}

function cropMarks(): string {
  const m = 48;
  const l = 70;
  const w = FRAME_WIDTH;
  const h = FRAME_HEIGHT;
  return `<g stroke="${INK}" stroke-width="5" fill="none" opacity="0.7" stroke-linecap="round">
    <path d="M${m} ${m + l} V${m} H${m + l}"/><path d="M${w - m - l} ${m} H${w - m} V${m + l}"/>
    <path d="M${m} ${h - m - l} V${h - m} H${m + l}"/><path d="M${w - m - l} ${h - m} H${w - m} V${h - m - l}"/>
  </g>`;
}

export interface PlaceholderInput {
  mood: Mood;
  shot: Shot;
  intensity: number;
}

/** Builds the SVG markup for a placeholder frame. */
export function placeholderSvg(scene: PlaceholderInput, index: number): string {
  const mood = MOOD_INFO[scene.mood];
  const [dark, light] = mood.gradient;
  const intensity = Math.min(5, Math.max(1, Math.round(scene.intensity)));
  // Move the light source across frames so a sequence does not look identical.
  const glowX = 20 + ((index * 23) % 60);
  const shot = escapeXml(SHOT_LABELS[scene.shot].toUpperCase());
  const moodText = escapeXml(mood.label.toUpperCase());
  const dots = '●'.repeat(intensity) + '○'.repeat(5 - intensity);
  const number = String(index + 1).padStart(2, '0');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FRAME_WIDTH} ${FRAME_HEIGHT}" width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="1" stop-color="${light}"/>
    </linearGradient>
    <radialGradient id="glow" cx="${glowX}%" cy="18%" r="65%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pov" cx="50%" cy="50%" r="75%">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.75"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.6" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" fill="url(#bg)"/>
  <rect width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" fill="url(#glow)"/>
  ${thirdsGrid()}
  ${shotSchematic(scene.shot)}
  <rect width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" fill="url(#shade)"/>
  ${cropMarks()}
  <g font-family="${FONT}" fill="${INK}">
    <rect x="96" y="86" width="${shot.length * 27 + 64}" height="72" rx="36" fill="#000000" opacity="0.38"/>
    <text x="128" y="134" font-size="40" font-weight="700" letter-spacing="3">${shot}</text>
    <text x="96" y="826" font-size="40" font-weight="600" letter-spacing="6" opacity="0.9">SCENE ${number}</text>
    <text x="${FRAME_WIDTH - 96}" y="826" font-size="40" font-weight="600" letter-spacing="4" text-anchor="end" opacity="0.9">${moodText}  ${dots}</text>
  </g>
</svg>`;
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function placeholderDataUrl(scene: PlaceholderInput, index: number): string {
  return svgToDataUrl(placeholderSvg(scene, index));
}

export function placeholderAlt(scene: Pick<Scene, 'mood' | 'shot'>, index: number): string {
  return `Placeholder frame for scene ${index + 1}: ${SHOT_LABELS[scene.shot].toLowerCase()}, ${MOOD_INFO[scene.mood].label.toLowerCase()} mood`;
}
