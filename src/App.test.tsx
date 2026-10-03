import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onTestFinished } from 'vitest';
import App from './App';
import { STORAGE_KEYS } from './lib/settings';
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
} from './test/fetchMocks';

const STORY =
  'Lina folds a paper boat on a rainy morning and sets it on the gutter stream. She runs after it through the town until it reaches the sea.';

function useKey(key = TEST_KEY) {
  window.localStorage.setItem(STORAGE_KEYS.apiKey, key);
}

function setSettings(settings: Record<string, unknown>) {
  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function stubFetch(fetchMock: ReturnType<typeof mockFetch>) {
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('demo mode (no API key)', () => {
  it('invites the visitor to try a demo and makes no network requests', () => {
    const fetchMock = stubFetch(mockFetch());
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /turn a story into a storyboard/i })).toBeInTheDocument();
    expect(screen.getByText('Demo mode')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add api key to generate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /the clockmaker of lantern street/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens the English demo with placeholder frames, scene text and the mood chart', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(mockFetch());
    render(<App />);
    await user.click(screen.getByRole('button', { name: /the clockmaker of lantern street/i }));

    const scenes = screen.getByRole('list', { name: 'Scenes' });
    expect(within(scenes).getAllByRole('article')).toHaveLength(6);
    expect(screen.getAllByRole('img', { name: /^placeholder frame for scene/i })).toHaveLength(6);
    expect(screen.getByRole('heading', { name: 'A silent music box' })).toBeInTheDocument();
    expect(screen.getByText(/It hasn’t made a sound since she died/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Emotional arc' })).toBeInTheDocument();
    // Frame generation needs a key, so the buttons are disabled with an explanation.
    const generate = screen.getByRole('button', { name: 'Generate frame for scene 1' });
    expect(generate).toBeDisabled();
    expect(generate).toHaveAttribute('title', expect.stringMatching(/add your gemini api key/i));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders the Arabic demo right to left', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /رسالة في زجاجة/ }));
    const scenes = screen.getByRole('list', { name: 'Scenes' });
    expect(scenes).toHaveAttribute('dir', 'rtl');
    const title = screen.getByRole('heading', { level: 2, name: 'رسالة في زجاجة' });
    expect(title.closest('[lang]')).toHaveAttribute('lang', 'ar');
    expect(screen.getByRole('heading', { name: 'بطاقة من جزيرة' })).toBeInTheDocument();
  });

  it('remembers the storyboard across reloads', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: /the clockmaker of lantern street/i }));
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEYS.storyboard)).toContain('Lantern Street');
    });
    unmount();
    render(<App />);
    expect(screen.getByRole('heading', { level: 2, name: 'The Clockmaker of Lantern Street' })).toBeInTheDocument();
  });
});

describe('settings dialog', () => {
  it('explains key privacy, saves the key locally and forgets it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(within(dialog).getByText(/only in this browser/)).toBeInTheDocument();
    expect(within(dialog).getByText(/only to Google’s Gemini API/)).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Paste your key'), TEST_KEY);
    await user.click(within(dialog).getByRole('button', { name: 'Save key' }));
    expect(window.localStorage.getItem(STORAGE_KEYS.apiKey)).toBe(TEST_KEY);
    expect(within(dialog).getByText('••••••••t123')).toBeInTheDocument();
    expect(screen.getByText('Key saved')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /forget key/i }));
    expect(window.localStorage.getItem(STORAGE_KEYS.apiKey)).toBeNull();
    expect(screen.getByText('Demo mode')).toBeInTheDocument();
  });

  it('rejects text that is clearly not a key', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    await user.type(within(dialog).getByLabelText('Paste your key'), 'hello');
    await user.click(within(dialog).getByRole('button', { name: 'Save key' }));
    expect(within(dialog).getByText(/does not look like a Gemini API key/)).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.apiKey)).toBeNull();
  });

  it('saves model settings', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    const textModel = within(dialog).getByLabelText(/text model/i);
    await user.clear(textModel);
    await user.type(textModel, 'gemini-3.5-flash-lite');
    await user.selectOptions(within(dialog).getByLabelText('Thinking level'), 'minimal');
    await user.click(within(dialog).getByLabelText(/generate an image for each scene/i));
    await user.click(within(dialog).getByRole('button', { name: 'Save settings' }));
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.settings) ?? '{}');
    expect(saved).toMatchObject({ textModel: 'gemini-3.5-flash-lite', thinkingLevel: 'minimal', generateImages: false });
  });

  it('refuses invalid model IDs', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    const textModel = within(dialog).getByLabelText(/text model/i);
    await user.clear(textModel);
    await user.type(textModel, 'not a model');
    await user.click(within(dialog).getByRole('button', { name: 'Save settings' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/letters, numbers, dots and dashes/);
    expect(window.localStorage.getItem(STORAGE_KEYS.settings)).toBeNull();
  });
});

describe('generating a storyboard', () => {
  it('builds the storyboard from the model’s JSON and keeps placeholders when images are off', async () => {
    useKey();
    setSettings({ generateImages: false });
    const fetchMock = stubFetch(mockFetch(jsonResponse(textInteraction(JSON.stringify(storyboardJson(3))))));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Your story'), STORY);
    await user.selectOptions(screen.getByLabelText('Scenes'), '3');
    await user.click(screen.getByRole('button', { name: /make storyboard/i }));

    expect(await screen.findByRole('heading', { level: 2, name: 'The Paper Boat' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = requestBody(fetchMock);
    expect(body).toMatchObject({ model: 'gemini-3.8-flash', store: false, generation_config: { thinking_level: 'low' } });
    expect(screen.getAllByRole('img', { name: /^placeholder frame/i })).toHaveLength(3);
  });

  it('draws a frame for every scene when images are on', async () => {
    useKey();
    const fetchMock = stubFetch(
      mockFetch(
        jsonResponse(textInteraction(JSON.stringify(storyboardJson(3)))),
        jsonResponse(imageInteraction()),
        jsonResponse(imageInteraction()),
        jsonResponse(imageInteraction()),
      ),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Your story'), STORY);
    await user.selectOptions(screen.getByLabelText('Scenes'), '3');
    await user.click(screen.getByRole('button', { name: /make storyboard/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('img', { name: /^frame for scene/i })).toHaveLength(3);
    });
    for (const img of screen.getAllByRole('img', { name: /^frame for scene/i })) {
      expect(img).toHaveAttribute('src', `data:image/png;base64,${PNG_BASE64}`);
    }
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(requestBody(fetchMock, 1)).toMatchObject({ model: 'gemini-3.1-flash-image', store: false });
    expect(screen.getByRole('button', { name: /all frames generated/i })).toBeDisabled();
  });

  it('shows a clear message when the key is rejected', async () => {
    useKey();
    stubFetch(
      mockFetch(
        jsonResponse(googleError(400, 'INVALID_ARGUMENT', 'API key not valid. Please pass a valid API key.', 'API_KEY_INVALID'), 400),
      ),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Your story'), STORY);
    await user.click(screen.getByRole('button', { name: /make storyboard/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('API key not accepted');
    expect(alert).not.toHaveTextContent(TEST_KEY);
  });

  it('handles malformed model output without crashing', async () => {
    useKey();
    stubFetch(mockFetch(jsonResponse(textInteraction('Sorry, here is a poem instead.'))));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Your story'), STORY);
    await user.click(screen.getByRole('button', { name: /make storyboard/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read the storyboard');
    expect(screen.queryByRole('list', { name: 'Scenes' })).not.toBeInTheDocument();
  });

  it('falls back to placeholders and explains when image generation hits a quota', async () => {
    useKey();
    stubFetch(
      mockFetch(
        jsonResponse(textInteraction(JSON.stringify(storyboardJson(3)))),
        jsonResponse(googleError(429, 'RESOURCE_EXHAUSTED', 'limit: 0'), 429),
      ),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Your story'), STORY);
    await user.selectOptions(screen.getByLabelText('Scenes'), '3');
    await user.click(screen.getByRole('button', { name: /make storyboard/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/paid-tier key/);
    expect(screen.getAllByRole('img', { name: /^placeholder frame/i })).toHaveLength(3);
  });

  it('asks for a longer story before calling the API', async () => {
    useKey();
    const fetchMock = stubFetch(mockFetch());
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Your story'), 'Too short.');
    expect(screen.getByRole('button', { name: /make storyboard/i })).toBeDisabled();
    expect(screen.getByText(/at least 40 characters/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('editing and exporting', () => {
  it('edits a scene’s text and shot', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /the clockmaker of lantern street/i }));
    await user.click(screen.getByRole('button', { name: 'Edit scene 2' }));
    const form = screen.getByRole('form', { name: /edit scene: a silent music box/i });
    const title = within(form).getByLabelText('Title');
    await user.clear(title);
    await user.type(title, 'The box arrives');
    await user.selectOptions(within(form).getByLabelText('Camera shot'), 'low-angle');
    await user.click(within(form).getByRole('button', { name: 'Save scene' }));

    expect(screen.getByRole('heading', { name: 'The box arrives' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Placeholder frame for scene 2: low angle, mysterious mood' })).toBeInTheDocument();
  });

  it('exports the storyboard as JSON and opens it again', async () => {
    const created: Blob[] = [];
    // jsdom has no object URLs; provide them for this test only.
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
    await user.click(screen.getByRole('button', { name: /the clockmaker of lantern street/i }));
    await user.click(screen.getByRole('button', { name: 'Export as JSON' }));

    expect(click).toHaveBeenCalled();
    const json = await created[0]!.text();
    expect(JSON.parse(json)).toMatchObject({ format: 'scripto-storyboard', storyboard: { title: 'The Clockmaker of Lantern Street' } });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByRole('list', { name: 'Scenes' })).not.toBeInTheDocument();

    const file = new File([json], 'board.json', { type: 'application/json' });
    await user.upload(screen.getByTestId('import-input'), file);
    expect(await screen.findByRole('heading', { level: 2, name: 'The Clockmaker of Lantern Street' })).toBeInTheDocument();
  });

  it('rejects a file that is not a storyboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    const file = new File(['{"hello": "world"}'], 'other.json', { type: 'application/json' });
    await user.upload(screen.getByTestId('import-input'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent(/does not contain any usable scenes/);
  });
});
