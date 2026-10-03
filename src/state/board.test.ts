import { loadDemo } from '../demo/samples';
import { boardReducer, initialBoardState, type BoardState } from './board';

function loaded(id = 'clockmaker'): BoardState {
  return boardReducer(initialBoardState, { type: 'load', storyboard: loadDemo(id)! });
}

const image = { src: 'data:image/png;base64,AAAA', mimeType: 'image/png', model: 'm', createdAt: 'now' };

describe('boardReducer', () => {
  it('loads and clears storyboards', () => {
    const state = loaded();
    expect(state.storyboard?.scenes).toHaveLength(6);
    expect(boardReducer(state, { type: 'clear' })).toBe(initialBoardState);
  });

  it('ignores scene actions when there is no storyboard', () => {
    expect(boardReducer(initialBoardState, { type: 'frame-loading', sceneId: 'x' })).toBe(initialBoardState);
  });

  it('updates one scene and leaves the others untouched', () => {
    const state = loaded();
    const [first, second] = state.storyboard!.scenes;
    const next = boardReducer(state, { type: 'update-scene', sceneId: second!.id, changes: { title: 'New' } });
    expect(next.storyboard!.scenes[1]!.title).toBe('New');
    expect(next.storyboard!.scenes[0]).toBe(first);
  });

  it('recomputes text direction when scene text changes', () => {
    const state = loaded();
    let next = state;
    for (const scene of state.storyboard!.scenes) {
      next = boardReducer(next, {
        type: 'update-scene',
        sceneId: scene.id,
        changes: { description: 'وصف المشهد باللغة العربية هنا', line: 'سطر عربي طويل نسبيًا' },
      });
    }
    expect(next.storyboard!.direction).toBe('rtl');
  });

  it('tracks frame status through loading, done and error', () => {
    const state = loaded();
    const id = state.storyboard!.scenes[0]!.id;
    let next = boardReducer(state, { type: 'frame-loading', sceneId: id });
    expect(next.frames[id]).toEqual({ state: 'loading' });
    next = boardReducer(next, { type: 'frame-done', sceneId: id, image });
    expect(next.frames[id]).toBeUndefined();
    expect(next.storyboard!.scenes[0]!.image).toEqual(image);
    next = boardReducer(next, { type: 'frame-error', sceneId: id, error: { title: 'T', message: 'M' } });
    expect(next.frames[id]).toMatchObject({ state: 'error' });
    next = boardReducer(next, { type: 'frame-idle', sceneId: id });
    expect(next.frames[id]).toBeUndefined();
  });

  it('removes an image to go back to the placeholder', () => {
    const state = loaded();
    const id = state.storyboard!.scenes[2]!.id;
    const withImage = boardReducer(state, { type: 'frame-done', sceneId: id, image });
    const next = boardReducer(withImage, { type: 'remove-image', sceneId: id });
    expect(next.storyboard!.scenes[2]).not.toHaveProperty('image');
  });

  it('returns the same storyboard for unknown scene IDs', () => {
    const state = loaded();
    const next = boardReducer(state, { type: 'frame-done', sceneId: 'missing', image });
    expect(next.storyboard).toBe(state.storyboard);
  });
});
