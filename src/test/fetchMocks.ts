import { vi, type Mock } from 'vitest';

export const TEST_KEY = 'AIzaSyTestTestTestTestTestTestTest123';

/** A tiny valid PNG (1×1) as base64. */
export const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function textInteraction(text: string, status = 'completed') {
  return {
    id: 'v1_test',
    object: 'interaction',
    model: 'gemini-3.8-flash',
    status,
    steps: [
      { type: 'thought', signature: 'abc' },
      { type: 'model_output', content: [{ type: 'text', text }] },
    ],
  };
}

export function imageInteraction(data = PNG_BASE64, mimeType = 'image/png') {
  return {
    id: 'v1_image',
    status: 'completed',
    steps: [
      {
        type: 'model_output',
        content: [
          { type: 'text', text: 'Here is your frame.' },
          { type: 'image', mime_type: mimeType, data },
        ],
      },
    ],
  };
}

export function googleError(code: number, status: string, message: string, reason?: string) {
  return [
    {
      error: {
        code,
        message,
        status,
        details: reason ? [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason }] : [],
      },
    },
  ];
}

type Reply = Response | Error | (() => Response | Promise<Response>);

/** fetch mock that answers each call with the next reply in order. */
export function mockFetch(...replies: Reply[]): Mock<typeof fetch> {
  const queue = [...replies];
  return vi.fn<typeof fetch>(async () => {
    const next = queue.shift();
    if (!next) throw new Error('mockFetch: no more replies queued');
    if (next instanceof Error) throw next;
    return typeof next === 'function' ? next() : next;
  });
}

/** Parses the JSON body of the nth fetch call. */
export function requestBody(fetchMock: Mock<typeof fetch>, call = 0): Record<string, unknown> {
  const init = fetchMock.mock.calls[call]?.[1];
  return JSON.parse(init?.body as string) as Record<string, unknown>;
}

export function storyboardJson(sceneCount = 3) {
  return {
    title: 'The Paper Boat',
    logline: 'A girl follows her paper boat to the sea.',
    language: 'en',
    characters: [{ name: 'Lina', appearance: 'a ten-year-old girl with a yellow raincoat and black braids' }],
    scenes: Array.from({ length: sceneCount }, (_, i) => ({
      title: `Moment ${i + 1}`,
      description: `Lina does thing number ${i + 1}.`,
      setting: 'A rainy street',
      characters: ['Lina'],
      mood: i === sceneCount - 1 ? 'joyful' : 'hopeful',
      intensity: i + 1,
      shot: i === 0 ? 'establishing' : 'close-up',
      lineType: i === 1 ? 'dialogue' : 'narration',
      speaker: i === 1 ? 'Lina' : '',
      line: `Line ${i + 1}`,
      visualPrompt: `Lina in the rain, frame ${i + 1}.`,
    })),
  };
}
