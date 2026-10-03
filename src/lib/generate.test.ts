import {
  googleError,
  imageInteraction,
  jsonResponse,
  mockFetch,
  PNG_BASE64,
  requestBody,
  storyboardJson,
  TEST_KEY,
  textInteraction,
} from '../test/fetchMocks';
import { ScriptoError } from './errors';
import { generateFrame, generateFrames, generateStoryboard, validateStoryInput } from './generate';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import type { Storyboard } from './types';

const STORY =
  'Lina folds a paper boat on a rainy morning and sets it on the gutter stream. She runs after it through the town, past the baker and the bridge, until it reaches the sea.';

const settings: Settings = { ...DEFAULT_SETTINGS };

async function failure(promise: Promise<unknown>): Promise<ScriptoError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ScriptoError) return error;
    throw error;
  }
  throw new Error('expected the promise to reject');
}

async function makeStoryboard(sceneCount = 3): Promise<Storyboard> {
  const fetchMock = mockFetch(jsonResponse(textInteraction(JSON.stringify(storyboardJson(sceneCount)))));
  const { storyboard } = await generateStoryboard({
    story: STORY,
    sceneCount,
    styleId: 'sketch',
    settings,
    apiKey: TEST_KEY,
    fetchImpl: fetchMock,
  });
  return storyboard;
}

describe('validateStoryInput', () => {
  it('rejects stories that are too short or too long', () => {
    expect(() => {
      validateStoryInput('Too short.');
    }).toThrow(expect.objectContaining({ kind: 'input' }) as Error);
    expect(() => {
      validateStoryInput('x'.repeat(20000));
    }).toThrow(/under 12,000 characters/);
    expect(() => {
      validateStoryInput(STORY);
    }).not.toThrow();
  });
});

describe('generateStoryboard', () => {
  it('sends the story with the configured model and builds a storyboard', async () => {
    const fetchMock = mockFetch(jsonResponse(textInteraction(JSON.stringify(storyboardJson(3)))));
    const { storyboard, warnings } = await generateStoryboard({
      story: STORY,
      sceneCount: 3,
      styleId: 'watercolor',
      settings: { ...settings, textModel: 'gemini-3.5-flash-lite' },
      apiKey: TEST_KEY,
      fetchImpl: fetchMock,
    });

    const body = requestBody(fetchMock);
    expect(body.model).toBe('gemini-3.5-flash-lite');
    expect(body.store).toBe(false);
    expect(body.generation_config).toEqual({ thinking_level: 'low' });
    expect(String(body.input)).toContain('Lina folds a paper boat');

    expect(warnings).toEqual([]);
    expect(storyboard).toMatchObject({
      version: 1,
      title: 'The Paper Boat',
      styleId: 'watercolor',
      direction: 'ltr',
      source: 'gemini',
      story: STORY,
    });
    expect(storyboard.scenes).toHaveLength(3);
  });

  it('sets right-to-left direction for Arabic stories', async () => {
    const arabic = 'في صباح ممطر صنعت لينا قاربًا من الورق ووضعته في مجرى الماء، ثم ركضت خلفه عبر المدينة حتى وصل إلى البحر.';
    const fetchMock = mockFetch(
      jsonResponse(textInteraction(JSON.stringify({ ...storyboardJson(3), language: 'ar' }))),
    );
    const { storyboard } = await generateStoryboard({
      story: arabic,
      sceneCount: 3,
      styleId: 'sketch',
      settings,
      apiKey: TEST_KEY,
      fetchImpl: fetchMock,
    });
    expect(storyboard.direction).toBe('rtl');
    expect(storyboard.language).toBe('ar');
  });

  it('handles malformed model output with a parse error', async () => {
    const fetchMock = mockFetch(jsonResponse(textInteraction('I could not do that, sorry!')));
    const error = await failure(
      generateStoryboard({ story: STORY, sceneCount: 3, styleId: 'sketch', settings, apiKey: TEST_KEY, fetchImpl: fetchMock }),
    );
    expect(error.kind).toBe('parse');
  });

  it('handles an empty answer', async () => {
    const fetchMock = mockFetch(jsonResponse({ status: 'completed', steps: [] }));
    const error = await failure(
      generateStoryboard({ story: STORY, sceneCount: 3, styleId: 'sketch', settings, apiKey: TEST_KEY, fetchImpl: fetchMock }),
    );
    expect(error.kind).toBe('bad-response');
    expect(error.message).toMatch(/safety filters/);
  });

  it('passes API errors through', async () => {
    const fetchMock = mockFetch(jsonResponse(googleError(404, 'NOT_FOUND', 'not found'), 404));
    const error = await failure(
      generateStoryboard({ story: STORY, sceneCount: 3, styleId: 'sketch', settings, apiKey: TEST_KEY, fetchImpl: fetchMock }),
    );
    expect(error.kind).toBe('model-not-found');
  });

  it('does not call the API for invalid input', async () => {
    const fetchMock = mockFetch();
    await failure(
      generateStoryboard({ story: 'short', sceneCount: 3, styleId: 'sketch', settings, apiKey: TEST_KEY, fetchImpl: fetchMock }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('generateFrame', () => {
  it('requests a 16:9 image with the image model and returns a data URL', async () => {
    const storyboard = await makeStoryboard();
    const fetchMock = mockFetch(jsonResponse(imageInteraction()));
    const image = await generateFrame({
      storyboard,
      sceneId: storyboard.scenes[0]!.id,
      settings,
      apiKey: TEST_KEY,
      fetchImpl: fetchMock,
    });
    const body = requestBody(fetchMock);
    expect(body.model).toBe('gemini-3.1-flash-image');
    expect(body.response_format).toEqual({ type: 'image', aspect_ratio: '16:9', image_size: '1K' });
    expect(image.src).toBe(`data:image/png;base64,${PNG_BASE64}`);
    expect(image.model).toBe('gemini-3.1-flash-image');
  });

  it('explains when the model answers with text instead of an image', async () => {
    const storyboard = await makeStoryboard();
    const fetchMock = mockFetch(jsonResponse(textInteraction('I can’t draw that.')));
    const error = await failure(
      generateFrame({ storyboard, sceneId: storyboard.scenes[0]!.id, settings, apiKey: TEST_KEY, fetchImpl: fetchMock }),
    );
    expect(error.kind).toBe('no-image');
    expect(error.detail).toBe('I can’t draw that.');
  });
});

describe('generateFrames', () => {
  it('makes the first frame alone, then sends it as a style reference', async () => {
    const storyboard = await makeStoryboard(3);
    const fetchMock = mockFetch(
      jsonResponse(imageInteraction()),
      jsonResponse(imageInteraction()),
      jsonResponse(imageInteraction()),
    );
    const done: string[] = [];
    const result = await generateFrames({
      storyboard,
      sceneIds: storyboard.scenes.map((s) => s.id),
      settings,
      apiKey: TEST_KEY,
      fetchImpl: fetchMock,
      onDone: (id) => done.push(id),
    });
    expect(result).toEqual({ done: 3, failed: 0, skipped: 0 });
    expect(done[0]).toBe(storyboard.scenes[0]!.id);
    const first = requestBody(fetchMock, 0).input as unknown[];
    const second = requestBody(fetchMock, 1).input as unknown[];
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
    expect(second[1]).toEqual({ type: 'image', mime_type: 'image/png', data: PNG_BASE64 });
  });

  it('sends no reference when the setting is off', async () => {
    const storyboard = await makeStoryboard(2);
    const fetchMock = mockFetch(jsonResponse(imageInteraction()), jsonResponse(imageInteraction()));
    await generateFrames({
      storyboard,
      sceneIds: storyboard.scenes.map((s) => s.id),
      settings: { ...settings, useStyleReference: false },
      apiKey: TEST_KEY,
      fetchImpl: fetchMock,
    });
    expect(requestBody(fetchMock, 1).input).toHaveLength(1);
  });

  it('stops after a fatal error and reports the skipped frames', async () => {
    const storyboard = await makeStoryboard(4);
    const fetchMock = mockFetch(jsonResponse(googleError(429, 'RESOURCE_EXHAUSTED', 'limit: 0'), 429));
    const skipped: string[] = [];
    const errors: string[] = [];
    const result = await generateFrames({
      storyboard,
      sceneIds: storyboard.scenes.map((s) => s.id),
      settings,
      apiKey: TEST_KEY,
      fetchImpl: fetchMock,
      concurrency: 1,
      onSkip: (id) => skipped.push(id),
      onError: (id) => errors.push(id),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.failed).toBe(1);
    expect(result.skipped).toBe(3);
    expect(skipped).toHaveLength(3);
    expect((result.fatal as ScriptoError).kind).toBe('quota');
  });

  it('keeps going after a non-fatal error on one frame', async () => {
    const storyboard = await makeStoryboard(3);
    const fetchMock = mockFetch(
      jsonResponse(imageInteraction()),
      jsonResponse(textInteraction('no image')),
      jsonResponse(imageInteraction()),
    );
    const result = await generateFrames({
      storyboard,
      sceneIds: storyboard.scenes.map((s) => s.id),
      settings,
      apiKey: TEST_KEY,
      fetchImpl: fetchMock,
      concurrency: 1,
    });
    expect(result).toEqual({ done: 2, failed: 1, skipped: 0 });
  });

  it('reuses an existing frame as the reference when regenerating one scene', async () => {
    const storyboard = await makeStoryboard(2);
    storyboard.scenes[0]!.image = {
      src: `data:image/jpeg;base64,${PNG_BASE64}`,
      mimeType: 'image/jpeg',
      model: 'x',
      createdAt: '',
    };
    const fetchMock = mockFetch(jsonResponse(imageInteraction()));
    await generateFrames({
      storyboard,
      sceneIds: [storyboard.scenes[1]!.id],
      settings,
      apiKey: TEST_KEY,
      fetchImpl: fetchMock,
    });
    const input = requestBody(fetchMock).input as { mime_type?: string }[];
    expect(input[1]?.mime_type).toBe('image/jpeg');
  });
});
