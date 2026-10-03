import type { Scene } from './types';

/** "Speaker: “line”" for dialogue (with «» for right-to-left text), the bare line for narration. */
export function formatLine(scene: Pick<Scene, 'lineType' | 'speaker' | 'line'>, rtl: boolean): string {
  if (scene.lineType !== 'dialogue' || !scene.speaker) return scene.line;
  const quoted = /^["“«]/.test(scene.line) ? scene.line : rtl ? `«${scene.line}»` : `“${scene.line}”`;
  return `${scene.speaker}: ${quoted}`;
}
