import { ZibbyAiError, type ZibbyRequest, type ZibbyStreamOptions } from '@zibby-run/app-kit';
import { PNG_BASE64, storyboardJson } from '../test/fetchMocks';
import type { Charge } from './backend';
import { ScriptoError } from './errors';
import { defaultSettings } from './settings';
import { getStyle } from './styles';
import { createZibbyBackend, errorFromZibby } from './zibby';

type Outcome = Awaited<ReturnType<NonNullable<Parameters<typeof createZibbyBackend>[0]>['stream'] & {}>>;

function result(overrides: Partial<Outcome> = {}): Outcome {
  return {
    text: '',
    model: null,
    stopReason: 'end_turn',
    images: [],
    terminal: { charged_cr: 7, balance_cr: 193 },
    chargeKnown: true,
    requestId: 'req_1',
    ...overrides,
  };
}

function recorder(outcome: Outcome | Error) {
  const calls: { request: ZibbyRequest; options: ZibbyStreamOptions | undefined }[] = [];
  const stream = vi.fn(async (request: ZibbyRequest, options?: ZibbyStreamOptions) => {
    calls.push({ request, options });
    if (outcome instanceof Error) throw outcome;
    return outcome;
  });
  return { stream, calls };
}

const settings = defaultSettings('zibby');
const style = getStyle('sketch');

describe('Zibby backend', () => {
  it('asks Claude for the storyboard with structured output and reports the charge', async () => {
    const { stream, calls } = recorder(result({ text: JSON.stringify(storyboardJson(3)) }));
    const charges: Charge[] = [];
    const backend = createZibbyBackend({ stream });
    const { text } = await backend.writeStoryboard({
      story: 'A story',
      sceneCount: 3,
      style,
      settings,
      onCharge: (c) => charges.push(c),
    });

    expect(JSON.parse(text)).toMatchObject({ title: 'The Paper Boat' });
    const { request } = calls[0]!;
    expect(request).toMatchObject({ action: 'storyboard', provider: 'anthropic', model: 'claude-sonnet-5' });
    expect(request.payload).toMatchObject({
      model: 'claude-sonnet-5',
      max_tokens: 16000,
      output_config: { effort: 'low', format: { type: 'json_schema' } },
    });
    expect(JSON.stringify(request.payload)).not.toMatch(/"(minimum|maximum|minItems|maxItems)"/);
    expect(charges).toEqual([{ known: true, credits: 7, comped: false, requestId: 'req_1' }]);
  });

  it('never offers a paid retry for an answer cut at the output ceiling', async () => {
    const { stream } = recorder(result({ text: '{"title":', stopReason: 'max_tokens' }));
    const error = await createZibbyBackend({ stream })
      .writeStoryboard({ story: 'A story', sceneCount: 3, style, settings })
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ kind: 'incomplete', requestId: 'req_1' });
  });

  it('draws a frame with the Gemini image model in the OpenAI format, sending the style reference', async () => {
    const { stream, calls } = recorder(result({ images: [`data:image/png;base64,${PNG_BASE64}`] }));
    const { image } = await createZibbyBackend({ stream }).drawFrame({
      prompt: 'Frame 1',
      settings,
      reference: { mimeType: 'image/jpeg', data: 'AAAA' },
      capAck: true,
    });
    expect(image).toEqual({ mimeType: 'image/png', data: PNG_BASE64 });
    const { request, options } = calls[0]!;
    expect(request).toMatchObject({ action: 'frame', provider: 'openai', model: 'google/gemini-3.1-flash-image' });
    expect(request.payload).toMatchObject({
      modalities: ['image', 'text'],
      image_config: { aspect_ratio: '16:9' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Frame 1' },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,AAAA' } },
          ],
        },
      ],
    });
    expect(options).toMatchObject({ capAck: true });
  });

  it('reports a run without a charge frame as "charge unknown"', async () => {
    const { stream } = recorder(result({ terminal: null, chargeKnown: false, text: '{}' }));
    const charges: Charge[] = [];
    await createZibbyBackend({ stream }).writeStoryboard({
      story: 'A story',
      sceneCount: 3,
      style,
      settings,
      onCharge: (c) => charges.push(c),
    });
    expect(charges[0]).toMatchObject({ known: false, requestId: 'req_1' });
  });

  it('leaves out effort for Haiku 4.5, which does not accept it', async () => {
    const { stream, calls } = recorder(result({ text: '{}' }));
    await createZibbyBackend({ stream }).writeStoryboard({
      story: 'A story',
      sceneCount: 3,
      style,
      settings: { ...settings, textModel: 'claude-haiku-4-5-20251001' },
    });
    expect(calls[0]!.request.payload.output_config).not.toHaveProperty('effort');
  });
});

describe('errorFromZibby', () => {
  it.each([
    ['insufficient_credits', 'credits'],
    ['session_cap_reached', 'cap'],
    ['unauthenticated', 'signed-out'],
    ['locked', 'locked'],
    ['rate_limited', 'quota'],
    ['unknown_model', 'model-not-found'],
    ['payload_too_large', 'bad-request'],
    ['network', 'network'],
    ['malformed_stream', 'server'],
  ] as const)('maps %s to %s', (code, kind) => {
    const error = errorFromZibby(new ZibbyAiError(code, 'x', { requestId: 'req_9', details: { spent_cr: 40 } }), 'text');
    expect(error).toBeInstanceOf(ScriptoError);
    expect(error.kind).toBe(kind);
    expect(error.requestId).toBe('req_9');
  });

  it('treats an abort as a cancel', () => {
    expect(errorFromZibby(new DOMException('stop', 'AbortError'), 'image').kind).toBe('aborted');
  });

  it('asks a comped visitor about the cap without mentioning money', () => {
    const error = errorFromZibby(new ZibbyAiError('session_cap_reached', 'x', { details: { comped: true } }), 'text');
    expect(error.message).not.toMatch(/credit/i);
  });
});
