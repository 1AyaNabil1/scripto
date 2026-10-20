/**
 * Scripto on Zibby: every model call goes through the platform's same-origin
 * `/api/ai` proxy with the visitor's app token, and is paid in their Zibby
 * credits. Scripto holds no key and sees no secret.
 *
 * Scenes come from Claude with JSON Schema structured output; frames from a
 * Gemini image model in the OpenAI request format (CONTRACT.md §2).
 */
import { publishBalance, streamZibbyAi, ZibbyAiError, type ZibbyRequest } from '@zibby-run/app-kit';
import type { AiBackend, CallContext, Charge } from './backend';
import { ScriptoError, type RequestPurpose } from './errors';
import { fromDataUrl } from './gemini';
import { buildClaudeStoryboardPayload, buildZibbyImagePayload, ZIBBY_ACTIONS } from './zibbyPayloads';

type Stream = typeof streamZibbyAi;

/** Turns a refusal from the proxy into words a visitor can act on. */
export function errorFromZibby(error: unknown, purpose: RequestPurpose): ScriptoError {
  if (error instanceof ScriptoError) return error;
  // A cancelled fetch rejects with a DOMException, which is not an Error everywhere.
  if (typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError') {
    return new ScriptoError('aborted', 'Generation was cancelled.', { cause: error });
  }
  if (!(error instanceof ZibbyAiError)) {
    return new ScriptoError('network', 'Could not reach the AI service. Check your connection and try again.', {
      cause: error,
    });
  }
  const opts = { requestId: error.requestId, cause: error, ...(error.status ? { status: error.status } : {}) };
  const what = purpose === 'image' ? 'frames' : 'scenes';
  switch (error.code) {
    case 'insufficient_credits':
      return new ScriptoError('credits', `You are out of credits for these ${what}. Top up on Zibby to keep going.`, opts);
    case 'session_cap_reached':
      return new ScriptoError(
        'cap',
        error.details.comped === true
          ? 'Scripto has run a lot in a short time. Continue?'
          : `Scripto has spent ${String(error.details.spent_cr ?? 'a lot of')} credits in a short time. Continue?`,
        opts,
      );
    case 'unauthenticated':
      return new ScriptoError('signed-out', 'Sign in to Zibby to make storyboards.', opts);
    case 'locked':
      return new ScriptoError('locked', 'Your Zibby account is on hold. Check your Zibby account.', opts);
    case 'rate_limited':
      return new ScriptoError('quota', 'Too many runs at once. Wait a minute and try again.', opts);
    case 'unknown_model':
      return new ScriptoError('model-not-found', 'Zibby does not offer that model right now. Pick another in Settings.', opts);
    case 'payload_too_large':
      return new ScriptoError(
        'bad-request',
        'The style reference frame is too large to send. Turn off “match the first frame” in Settings and try again.',
        opts,
      );
    case 'network':
      return new ScriptoError('network', 'The connection to the AI service dropped. Nothing more will run until you try again.', opts);
    default:
      return new ScriptoError('server', 'The AI service had a problem. Please try again in a moment.', opts);
  }
}

function chargeOf(result: Awaited<ReturnType<Stream>>): Charge {
  return {
    known: result.chargeKnown,
    credits: result.terminal?.charged_cr ?? 0,
    comped: result.terminal?.comped === true,
    requestId: result.requestId,
  };
}

/** One run, with the charge reported (and the shell's balance updated) as soon as it is known. */
async function runOnce(stream: Stream, request: ZibbyRequest, call: CallContext, purpose: RequestPurpose) {
  let result: Awaited<ReturnType<Stream>>;
  try {
    result = await stream(request, { ...(call.signal ? { signal: call.signal } : {}), ...(call.capAck ? { capAck: true } : {}) });
  } catch (error) {
    throw errorFromZibby(error, purpose);
  }
  const charge = chargeOf(result);
  if (result.terminal) publishBalance(result.terminal.balance_cr);
  call.onCharge?.(charge);
  return { result, charge };
}

export function createZibbyBackend(options: { stream?: Stream } = {}): AiBackend {
  const stream = options.stream ?? streamZibbyAi;
  return {
    kind: 'zibby',
    async writeStoryboard(call) {
      const model = call.settings.textModel;
      const { result } = await runOnce(
        stream,
        {
          action: ZIBBY_ACTIONS.storyboard,
          provider: 'anthropic',
          model,
          payload: buildClaudeStoryboardPayload({
            story: call.story,
            sceneCount: call.sceneCount,
            style: call.style,
            model,
            thinkingLevel: call.settings.thinkingLevel,
          }),
        },
        call,
        'text',
      );
      // An answer cut at the output ceiling would be cut the same way again: never offer a paid retry (§2).
      if (result.stopReason === 'max_tokens') {
        throw new ScriptoError('incomplete', 'The storyboard was cut short. Try a shorter story or fewer scenes.', {
          requestId: result.requestId,
        });
      }
      if (result.stopReason === 'refusal') {
        throw new ScriptoError('blocked', 'The model declined this story. Try rewording it.', { requestId: result.requestId });
      }
      return { text: result.text };
    },
    async drawFrame(call) {
      const model = call.settings.imageModel;
      const { result } = await runOnce(
        stream,
        {
          action: ZIBBY_ACTIONS.frame,
          provider: 'openai',
          model,
          payload: buildZibbyImagePayload({ prompt: call.prompt, model, reference: call.reference }),
        },
        call,
        'image',
      );
      const last = result.images.at(-1);
      return { image: last ? fromDataUrl(last) : undefined, text: result.text };
    },
  };
}
