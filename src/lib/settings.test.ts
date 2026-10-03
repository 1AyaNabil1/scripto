import {
  DEFAULT_SETTINGS,
  forgetApiKey,
  isValidModelId,
  loadApiKey,
  loadSettings,
  looksLikeApiKey,
  maskApiKey,
  sanitizeSettings,
  saveApiKey,
  saveSettings,
  STORAGE_KEYS,
} from './settings';

const KEY = 'AIzaSyExampleExampleExample1234';

describe('settings storage', () => {
  it('falls back to defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips saved settings', () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      textModel: 'gemini-3.5-flash-lite',
      thinkingLevel: 'minimal' as const,
      generateImages: false,
    };
    expect(saveSettings(custom)).toBe(true);
    expect(loadSettings()).toEqual(custom);
  });

  it('never writes the API key into the settings entry', () => {
    saveApiKey(KEY);
    saveSettings({ ...DEFAULT_SETTINGS, apiKey: KEY } as never);
    expect(window.localStorage.getItem(STORAGE_KEYS.settings)).not.toContain(KEY);
  });

  it('ignores corrupted JSON', () => {
    window.localStorage.setItem(STORAGE_KEYS.settings, '{not json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('replaces invalid values field by field', () => {
    const result = sanitizeSettings({
      textModel: 'bad model id with spaces',
      imageModel: 'gemini-3-pro-image',
      thinkingLevel: 'extreme',
      generateImages: 'yes',
      imageSize: '8K',
      useStyleReference: false,
    });
    expect(result).toEqual({
      ...DEFAULT_SETTINGS,
      imageModel: 'gemini-3-pro-image',
      useStyleReference: false,
    });
  });

  it('copes with storage being unavailable', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(DEFAULT_SETTINGS, null)).toBe(false);
    expect(loadApiKey(null)).toBe('');
    expect(() => {
      forgetApiKey(null);
    }).not.toThrow();
  });

  it('reports failure when storage throws (quota or privacy mode)', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    } as unknown as Storage;
    expect(saveApiKey(KEY, broken)).toBe(false);
    expect(loadApiKey(broken)).toBe('');
    expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS);
    expect(() => {
      forgetApiKey(broken);
    }).not.toThrow();
  });
});

describe('API key storage', () => {
  it('stores the trimmed key under its own entry', () => {
    expect(saveApiKey(`  ${KEY}\n`)).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEYS.apiKey)).toBe(KEY);
    expect(loadApiKey()).toBe(KEY);
  });

  it('forgets only the key and keeps other settings', () => {
    saveApiKey(KEY);
    saveSettings({ ...DEFAULT_SETTINGS, textModel: 'gemini-3.1-flash-lite' });
    forgetApiKey();
    expect(loadApiKey()).toBe('');
    expect(window.localStorage.getItem(STORAGE_KEYS.apiKey)).toBeNull();
    expect(loadSettings().textModel).toBe('gemini-3.1-flash-lite');
  });

  it('removes the entry when an empty key is saved', () => {
    saveApiKey(KEY);
    saveApiKey('   ');
    expect(window.localStorage.getItem(STORAGE_KEYS.apiKey)).toBeNull();
  });

  it('checks the rough shape of a key without validating it remotely', () => {
    expect(looksLikeApiKey(KEY)).toBe(true);
    expect(looksLikeApiKey('short')).toBe(false);
    expect(looksLikeApiKey('has spaces in the middle of it ok')).toBe(false);
  });

  it('masks all but the last four characters', () => {
    expect(maskApiKey(KEY)).toBe('••••••••1234');
    expect(maskApiKey('')).toBe('');
  });
});

describe('isValidModelId', () => {
  it('accepts documented model IDs', () => {
    for (const id of ['gemini-3.8-flash', 'gemini-3.1-flash-image', 'gemini-3.1-pro-preview']) {
      expect(isValidModelId(id)).toBe(true);
    }
  });

  it('rejects anything that could change the request URL or body', () => {
    for (const id of ['', 'a', '../models', 'gemini 3', 'gemini?x=1', 'x'.repeat(200), 7]) {
      expect(isValidModelId(id)).toBe(false);
    }
  });
});

describe('defaults', () => {
  it('starts with images off, since Gemini image models need a paid-tier key', () => {
    expect(DEFAULT_SETTINGS.generateImages).toBe(false);
  });
});
