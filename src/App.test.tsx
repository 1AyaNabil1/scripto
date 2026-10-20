import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onTestFinished } from 'vitest';
import App from './App';
import { createSiteHost } from './host/site';
import { hostImpl as zibbyHost } from './host/zibby';
import type { HostImpl } from './host/types';
import type { AiBackend } from './lib/backend';
import { ScriptoError } from './lib/errors';
import { STORAGE_KEYS } from './lib/settings';
import { jsonResponse, mockFetch, PNG_BASE64, requestBody, storyboardJson } from './test/fetchMocks';

const STORY =
  'Lina folds a paper boat on a rainy morning and sets it on the gutter stream. She runs after it through the town until it reaches the sea.';

/** The free site with a scene writer; each test stubs fetch for it. */
const API = 'https://scripto-api.test';
const siteImpl = () => createSiteHost(API);

function writerAnswer(text = JSON.stringify(storyboardJson(3))) {
  return jsonResponse({ text });
}

function writerRefusal(kind: string, status: number, retryAfter?: number) {
  return jsonResponse({ error: retryAfter === undefined ? { kind } : { kind, retryAfter } }, status);
}

function setSettings(settings: Record<string, unknown>) {
  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function stubFetch(fetchMock: ReturnType<typeof mockFetch>) {
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const tab = (name: string) => screen.getByRole('button', { name });

async function openDemo(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole('button', { name }));
}

async function writeStory(user: ReturnType<typeof userEvent.setup>, scenes = '3 scenes') {
  await user.type(screen.getByLabelText('Your story'), STORY);
  await user.click(screen.getByRole('button', { name: scenes }));
  await user.click(screen.getByRole('button', { name: /make storyboard/i }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('first visit', () => {
  it('opens on the Story tab with samples and makes no network requests', () => {
    const fetchMock = stubFetch(mockFetch());
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Your story. Every frame.' })).toBeInTheDocument();
    expect(tab('Story')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTitle(/scenes are free here/i)).toHaveTextContent('Free');
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Draw frames' })).not.toBeInTheDocument();
    expect(screen.getByText(/Google Gemini’s free tier, which may use what you send/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /the clockmaker of lantern street/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /the last lighthouse/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /share yours here/i })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'AyaNexus' })).toHaveAttribute('href', 'https://ayanabil.vercel.app');
    expect(screen.getByRole('link', { name: 'Source on GitHub' })).toHaveAttribute('href', 'https://github.com/1AyaNabil1/scripto');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fills the story box from a "Try" chip', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Museum robot' }));
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your story').value).toContain('cleaning robot');
  });

  it('says so when this copy has no scene writer, without asking for a key', async () => {
    const fetchMock = stubFetch(mockFetch());
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Your story'), STORY);
    await user.click(screen.getByRole('button', { name: /make storyboard/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Scenes are offline here');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an empty board with samples before anything is made', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab('Script'));
    expect(screen.getByRole('heading', { level: 1, name: 'No board yet.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /write a story/i }));
    expect(tab('Story')).toHaveAttribute('aria-current', 'page');
  });
});

describe('sample boards', () => {
  it('open on the Board tab with placeholder frames, lines and the arc', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(mockFetch());
    render(<App />);
    await openDemo(user, /the clockmaker of lantern street/i);

    expect(tab('Board')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { level: 1, name: 'The Clockmaker of Lantern Street' })).toBeInTheDocument();
    const scenes = screen.getByRole('list', { name: 'Scenes' });
    expect(within(scenes).getAllByRole('article')).toHaveLength(6);
    expect(screen.getAllByRole('img', { name: /^placeholder frame for scene/i })).toHaveLength(6);
    expect(screen.getByRole('heading', { name: 'A silent music box' })).toBeInTheDocument();
    expect(screen.getByText(/It hasn’t made a sound since she died/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /emotional arc across 6 scenes.*peaking at scene 5/i })).toBeInTheDocument();
    // Frames are not drawn on the free site, so there is nothing to draw them with.
    expect(screen.queryByRole('button', { name: 'Generate frame for scene 1' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^draw/i })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('read as a screenplay, an arc and a cast', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openDemo(user, /the clockmaker of lantern street/i);

    await user.click(tab('Script'));
    expect(screen.getByRole('heading', { level: 1, name: 'THE CLOCKMAKER OF LANTERN STREET' })).toBeInTheDocument();
    expect(screen.getByText('EXT. LANTERN MARKET — NIGHT')).toBeInTheDocument();
    expect(screen.getAllByText('NARRATOR (V.O.)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('NOOR').length).toBeGreaterThan(0);

    await user.click(tab('Arc'));
    expect(screen.getByRole('heading', { level: 1, name: 'Quiet to peak.' })).toBeInTheDocument();
    const moods = screen.getByRole('list', { name: 'Mood of each scene' });
    expect(within(moods).getAllByRole('listitem')).toHaveLength(6);
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(7);

    await user.click(tab('Cast'));
    expect(screen.getByRole('heading', { level: 1, name: 'Two faces, every frame.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Noor' })).toBeInTheDocument();
    expect(screen.getByLabelText('In 2 scenes')).toBeInTheDocument();
  });

  it('switch to a horizontal film strip', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openDemo(user, /the clockmaker of lantern street/i);
    await user.click(screen.getByRole('button', { name: 'Film strip' }));
    const strip = screen.getByRole('region', { name: 'Film strip' });
    expect(within(strip).getAllByRole('listitem')).toHaveLength(6);
    expect(strip).toHaveTextContent('SCRIPTO 01A');
    expect(screen.getByRole('button', { name: 'Film strip' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('lay the Arabic sample out right to left', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openDemo(user, /رسالة في زجاجة/);
    expect(screen.getByRole('list', { name: 'Scenes' })).toHaveAttribute('dir', 'rtl');
    const title = screen.getByRole('heading', { level: 1, name: 'رسالة في زجاجة' });
    expect(title.closest('[lang]')).toHaveAttribute('lang', 'ar');
    await user.click(tab('Script'));
    expect(screen.getAllByText('الراوي').length).toBeGreaterThan(0);
    expect(screen.getByText('خارجي. قارب الصيد — غروب')).toBeInTheDocument();
  });

  it('are remembered across reloads', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await openDemo(user, /the clockmaker of lantern street/i);
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEYS.storyboard)).toContain('Lantern Street');
    });
    unmount();
    render(<App />);
    await user.click(tab('Board'));
    expect(screen.getByRole('heading', { level: 1, name: 'The Clockmaker of Lantern Street' })).toBeInTheDocument();
  });
});

describe('making a storyboard on the free site', () => {
  it('sends only the story, the count and the look, and keeps sketches', async () => {
    setSettings({ generateImages: true }); // left over from the old own-key version: ignored here
    const fetchMock = stubFetch(mockFetch(writerAnswer()));
    const user = userEvent.setup();
    render(<App impl={siteImpl()} />);
    await writeStory(user);

    expect(await screen.findByRole('heading', { level: 1, name: 'The Paper Boat' })).toBeInTheDocument();
    expect(tab('Board')).toHaveAttribute('aria-current', 'page');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API}/api/storyboard`);
    expect(requestBody(fetchMock)).toEqual({ story: STORY, sceneCount: 3, styleId: 'sketch' });
    expect(JSON.stringify(init?.headers)).not.toMatch(/key/i);
    expect(screen.getAllByRole('img', { name: /^placeholder frame/i })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /^draw/i })).not.toBeInTheDocument();
  });

  it('explains when the shared free quota is used up', async () => {
    stubFetch(mockFetch(writerRefusal('quota', 429)));
    const user = userEvent.setup();
    render(<App impl={siteImpl()} />);
    await writeStory(user);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Quota reached');
    expect(alert).toHaveTextContent(/free Google quota that every visitor shares/);
  });

  it('asks a visitor who made several in a row to wait a minute', async () => {
    stubFetch(mockFetch(writerRefusal('rate', 429, 40)));
    const user = userEvent.setup();
    render(<App impl={siteImpl()} />);
    await writeStory(user);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('One moment');
    expect(alert).toHaveTextContent(/Wait a minute/);
  });

  it('explains why it cannot write scenes in the EU, the UK or Switzerland', async () => {
    stubFetch(mockFetch(writerRefusal('region', 451)));
    const user = userEvent.setup();
    render(<App impl={siteImpl()} />);
    await writeStory(user);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Not available where you are');
    expect(alert).toHaveTextContent(/EU, the UK or Switzerland/);
  });

  it('handles malformed model output without crashing', async () => {
    stubFetch(mockFetch(writerAnswer('Sorry, here is a poem instead.')));
    const user = userEvent.setup();
    render(<App impl={siteImpl()} />);
    await writeStory(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read the storyboard');
  });

  it('says when the scene writer cannot be reached', async () => {
    stubFetch(mockFetch(new TypeError('Failed to fetch')));
    const user = userEvent.setup();
    render(<App impl={siteImpl()} />);
    await writeStory(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not reach Scripto’s scene writer/);
  });

  it('asks for a longer story before calling the scene writer', async () => {
    const fetchMock = stubFetch(mockFetch());
    const user = userEvent.setup();
    render(<App impl={siteImpl()} />);
    await user.type(screen.getByLabelText('Your story'), 'Too short.');
    expect(screen.getByRole('button', { name: /make storyboard/i })).toBeDisabled();
    expect(screen.getByText(/at least 40 characters/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('editing and exporting', () => {
  it('edits a scene’s heading, title and shot', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openDemo(user, /the clockmaker of lantern street/i);
    await user.click(screen.getByRole('button', { name: 'Edit scene 2' }));
    const form = screen.getByRole('form', { name: /edit scene: a silent music box/i });
    const title = within(form).getByLabelText('Title');
    await user.clear(title);
    await user.type(title, 'The box arrives');
    const heading = within(form).getByLabelText('Scene heading');
    await user.clear(heading);
    await user.type(heading, 'INT. STALL — RAIN');
    await user.selectOptions(within(form).getByLabelText('Camera shot'), 'low-angle');
    await user.click(within(form).getByRole('button', { name: 'Save scene' }));

    expect(screen.getByRole('heading', { name: 'The box arrives' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Placeholder frame for scene 2: low angle, mysterious mood' })).toBeInTheDocument();
    await user.click(tab('Script'));
    expect(screen.getByText('INT. STALL — RAIN')).toBeInTheDocument();
  });

  it('exports JSON, clears after a second click, and opens the file again', async () => {
    const created: Blob[] = [];
    const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return 'blob:test';
    });
    URL.revokeObjectURL = vi.fn();
    onTestFinished(() => {
      URL.createObjectURL = original.create;
      URL.revokeObjectURL = original.revoke;
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<App />);
    await openDemo(user, /the clockmaker of lantern street/i);
    await user.click(screen.getByRole('button', { name: 'Export as JSON' }));

    expect(click).toHaveBeenCalled();
    const json = await created[0]!.text();
    expect(JSON.parse(json)).toMatchObject({
      format: 'scripto-storyboard',
      storyboard: { title: 'The Clockmaker of Lantern Street' },
    });

    await user.click(screen.getByRole('button', { name: 'Clear storyboard' }));
    expect(screen.getByRole('list', { name: 'Scenes' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /confirm: clear this storyboard/i }));
    expect(screen.queryByRole('list', { name: 'Scenes' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'No board yet.' })).toBeInTheDocument();

    const file = new File([json], 'board.json', { type: 'application/json' });
    await user.upload(screen.getByTestId('import-input'), file);
    expect(await screen.findByRole('heading', { level: 1, name: 'The Clockmaker of Lantern Street' })).toBeInTheDocument();
  });

  it('rejects a file that is not a storyboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab('Board'));
    const file = new File(['{"hello": "world"}'], 'other.json', { type: 'application/json' });
    await user.upload(screen.getByTestId('import-input'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent(/does not contain any usable scenes/);
  });
});

describe('on Zibby', () => {
  function zibbyImpl(overrides: Partial<HostImpl> = {}): HostImpl {
    return {
      ...zibbyHost,
      Status: () => <span className="pill">184 cr</span>,
      useQuote: (action) => (action === 'frame' ? 9 : 6),
      useComped: () => false,
      topUp: vi.fn(),
      signIn: vi.fn(),
      ...overrides,
    };
  }

  function zibbyBackend(options: { storyboardError?: ScriptoError } = {}) {
    const acks: (boolean | undefined)[] = [];
    const backend: AiBackend = {
      kind: 'zibby',
      writeStoryboard: vi.fn(async (call) => {
        acks.push(call.capAck);
        if (options.storyboardError && !call.capAck) throw options.storyboardError;
        call.onCharge?.({ known: true, credits: 7, comped: false, requestId: 'r-text' });
        return { text: JSON.stringify(storyboardJson(3)) };
      }),
      drawFrame: vi.fn(async (call) => {
        call.onCharge?.({ known: true, credits: 10, comped: false, requestId: 'r-frame' });
        return { image: { data: PNG_BASE64, mimeType: 'image/png' }, text: '' };
      }),
    };
    return { backend, acks };
  }

  it('needs no key, quotes the run and shows the exact charge after it', async () => {
    const { backend } = zibbyBackend();
    const user = userEvent.setup();
    render(<App impl={zibbyImpl()} backend={backend} />);
    expect(screen.getByText('184 cr')).toBeInTheDocument();
    expect(screen.getByText(/New Zibby accounts get 200 free credits/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Your story'), STORY);
    await user.click(screen.getByRole('button', { name: '3 scenes' }));
    expect(screen.getByRole('button', { name: /make storyboard/i })).toHaveTextContent('~33 cr');
    await user.click(screen.getByRole('button', { name: /make storyboard/i }));

    expect(await screen.findByRole('heading', { level: 1, name: 'The Paper Boat' })).toBeInTheDocument();
    expect(await screen.findByText('Charged 37 credits.')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /^frame for scene/i })).toHaveLength(3);
  });

  it('saves frame switches and models from the Settings drawer', async () => {
    const { backend } = zibbyBackend();
    const user = userEvent.setup();
    render(<App impl={zibbyImpl()} backend={backend} />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('switch', { name: /draw frames after the scenes/i }));
    await user.selectOptions(within(dialog).getByLabelText('Scenes'), 'claude-opus-5');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.settings) ?? '{}')).toMatchObject({
      generateImages: false,
      textModel: 'claude-opus-5',
    });
  });

  it('asks before going past the spending cap, then resends with the cap acknowledged', async () => {
    const { backend, acks } = zibbyBackend({
      storyboardError: new ScriptoError('cap', 'Scripto has spent 40 credits in a short time. Continue?'),
    });
    const user = userEvent.setup();
    render(<App impl={zibbyImpl()} backend={backend} />);
    await user.type(screen.getByLabelText('Your story'), STORY);
    await user.click(screen.getByRole('button', { name: /make storyboard/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Keep going?');
    await user.click(within(alert).getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'The Paper Boat' })).toBeInTheDocument();
    expect(acks).toEqual([false, true]);
  });

  it('offers a top-up when credits run out', async () => {
    const impl = zibbyImpl();
    const { backend } = zibbyBackend({ storyboardError: new ScriptoError('credits', 'You are out of credits.') });
    const user = userEvent.setup();
    render(<App impl={impl} backend={backend} />);
    await user.type(screen.getByLabelText('Your story'), STORY);
    await user.click(screen.getByRole('button', { name: /make storyboard/i }));
    await user.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Top up credits' }));
    expect(impl.topUp).toHaveBeenCalled();
  });

  it('shows no prices to a visitor whose runs are on Zibby', () => {
    const { backend } = zibbyBackend();
    render(<App impl={zibbyImpl({ useComped: () => true })} backend={backend} />);
    expect(screen.getByRole('button', { name: /make storyboard/i })).not.toHaveTextContent(/cr/);
  });
});
