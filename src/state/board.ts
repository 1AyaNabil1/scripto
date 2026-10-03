import type { FriendlyError } from '../lib/errors';
import { resolveDirection } from '../lib/direction';
import type { Scene, SceneImage, Storyboard } from '../lib/types';

export type FrameStatus =
  | { state: 'loading' }
  | { state: 'error'; error: FriendlyError };

export interface BoardState {
  storyboard: Storyboard | null;
  /** Transient per-frame status; frames without an entry show their image or a placeholder. */
  frames: Record<string, FrameStatus>;
}

export type EditableSceneFields = Omit<Scene, 'id' | 'image'>;

export type BoardAction =
  | { type: 'load'; storyboard: Storyboard }
  | { type: 'clear' }
  | { type: 'update-meta'; changes: Partial<Pick<Storyboard, 'title' | 'logline'>> }
  | { type: 'update-scene'; sceneId: string; changes: Partial<EditableSceneFields> }
  | { type: 'frame-loading'; sceneId: string }
  | { type: 'frame-done'; sceneId: string; image: SceneImage }
  | { type: 'frame-error'; sceneId: string; error: FriendlyError }
  | { type: 'frame-idle'; sceneId: string }
  | { type: 'remove-image'; sceneId: string };

export const initialBoardState: BoardState = { storyboard: null, frames: {} };

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record;
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));
}

function mapScene(storyboard: Storyboard, sceneId: string, fn: (scene: Scene) => Scene): Storyboard {
  const index = storyboard.scenes.findIndex((scene) => scene.id === sceneId);
  const scene = storyboard.scenes[index];
  if (!scene) return storyboard;
  const scenes = [...storyboard.scenes];
  scenes[index] = fn(scene);
  return { ...storyboard, scenes };
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'load':
      return { storyboard: action.storyboard, frames: {} };
    case 'clear':
      return initialBoardState;
    default:
      break;
  }

  const board = state.storyboard;
  if (!board) return state;

  switch (action.type) {
    case 'update-meta':
      return { ...state, storyboard: { ...board, ...action.changes } };
    case 'update-scene': {
      const storyboard = mapScene(board, action.sceneId, (scene) => ({ ...scene, ...action.changes }));
      const sample = storyboard.scenes.map((s) => `${s.description} ${s.line}`).join(' ');
      return {
        ...state,
        storyboard: { ...storyboard, direction: resolveDirection(sample, storyboard.language) },
      };
    }
    case 'frame-loading':
      return { ...state, frames: { ...state.frames, [action.sceneId]: { state: 'loading' } } };
    case 'frame-done':
      return {
        storyboard: mapScene(board, action.sceneId, (scene) => ({ ...scene, image: action.image })),
        frames: withoutKey(state.frames, action.sceneId),
      };
    case 'frame-error':
      return { ...state, frames: { ...state.frames, [action.sceneId]: { state: 'error', error: action.error } } };
    case 'frame-idle':
      return { ...state, frames: withoutKey(state.frames, action.sceneId) };
    case 'remove-image':
      return {
        storyboard: mapScene(board, action.sceneId, (scene) => {
          const copy = { ...scene };
          delete copy.image;
          return copy;
        }),
        frames: withoutKey(state.frames, action.sceneId),
      };
  }
}
