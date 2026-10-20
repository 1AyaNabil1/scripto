import { validateSample } from '@zibby-run/app-kit/publish';
import { toClaudeSchema, buildStoryboardSchema } from './schema';
import { getStyle } from './styles';
import { buildClaudeStoryboardPayload, buildZibbySample, ZIBBY_TEXT_MODELS } from './zibbyPayloads';

describe('Zibby request bodies', () => {
  it('drops the JSON Schema keywords Claude does not support and keeps the rest', () => {
    const schema = toClaudeSchema(buildStoryboardSchema(5)) as {
      properties: { scenes: { minItems?: number; items: { properties: Record<string, Record<string, unknown>>; required: string[] } } };
    };
    expect(schema.properties.scenes.minItems).toBeUndefined();
    expect(schema.properties.scenes.items.properties.intensity).toEqual({
      type: 'integer',
      description: expect.any(String),
    });
    expect(schema.properties.scenes.items.properties.mood!.enum).toContain('joyful');
    expect(schema.properties.scenes.items.required).toContain('slugline');
  });

  it('is the same bytes every time, so a cap-acknowledged retry is byte-identical', () => {
    const params = { story: 'A story about a kite.', sceneCount: 4 as const, style: getStyle('noir'), model: 'claude-sonnet-5', thinkingLevel: 'medium' as const };
    expect(JSON.stringify(buildClaudeStoryboardPayload(params))).toBe(JSON.stringify(buildClaudeStoryboardPayload(params)));
  });

  it('builds a sample manifest the kit accepts', () => {
    const sample = buildZibbySample(getStyle('sketch'));
    expect(validateSample(sample)).toEqual([]);
    expect(sample.requests.map((r) => [r.action, r.provider])).toEqual([
      ['storyboard', 'anthropic'],
      ['frame', 'openai'],
    ]);
  });

  it('only offers Claude ids for scenes, which ride the anthropic format', () => {
    for (const option of ZIBBY_TEXT_MODELS) expect(option.id).toMatch(/^claude-/);
  });
});
