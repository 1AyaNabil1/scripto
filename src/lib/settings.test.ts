import {
  DEFAULT_SETTINGS,
  defaultSettings,
  forgetLegacyKey,
  isValidModelId,
  LEGACY_KEY_ENTRY,
  loadSettings,
  sanitizeSettings,
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

  it('never writes a key into the settings entry', () => {
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
    expect(() => {
      forgetLegacyKey(null);
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
    expect(saveSettings(DEFAULT_SETTINGS, broken)).toBe(false);
    expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS);
    expect(() => {
      forgetLegacyKey(broken);
    }).not.toThrow();
  });
});

describe('a key left by the old own-key version', () => {
  it('is removed, and settings and storyboards stay', () => {
    window.localStorage.setItem(LEGACY_KEY_ENTRY, KEY);
    saveSettings({ ...DEFAULT_SETTINGS, textModel: 'gemini-3.1-flash-lite' });
    window.localStorage.setItem(STORAGE_KEYS.storyboard, '{}');
    forgetLegacyKey();
    expect(window.localStorage.getItem(LEGACY_KEY_ENTRY)).toBeNull();
    expect(loadSettings().textModel).toBe('gemini-3.1-flash-lite');
    expect(window.localStorage.getItem(STORAGE_KEYS.storyboard)).toBe('{}');
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

describe('Zibby settings', () => {
  it('start with frames on and the platform models', () => {
    expect(defaultSettings('zibby')).toMatchObject({
      generateImages: true,
      textModel: 'claude-sonnet-5',
      imageModel: 'google/gemini-3.1-flash-image',
    });
  });

  it('only keep models from the Zibby catalogue', () => {
    const clean = sanitizeSettings({ textModel: 'gemini-3.8-flash', imageModel: 'google/gemini-2.5-flash-image' }, 'zibby');
    expect(clean.textModel).toBe('claude-sonnet-5');
    expect(clean.imageModel).toBe('google/gemini-2.5-flash-image');
  });
});
