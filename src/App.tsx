import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { DemoPicker } from './components/DemoPicker';
import { Icon } from './components/Icon';
import { ImportButton } from './components/ImportButton';
import { Notice } from './components/Notice';
import { SettingsDialog } from './components/SettingsDialog';
import { StoryForm } from './components/StoryForm';
import { StoryboardView, type Layout } from './components/StoryboardView';
import { loadDemo } from './demo/samples';
import { isScriptoError, ScriptoError, toFriendlyError, type FriendlyError } from './lib/errors';
import { renderStoryboardPng } from './lib/exportImage';
import { downloadBlob, fileNameFor, MAX_IMPORT_BYTES, parseStoryboardFile, serializeStoryboard } from './lib/files';
import { generateFrames, generateStoryboard, validateStoryInput } from './lib/generate';
import { loadDraft, loadStoryboardLocally, saveDraft, saveStoryboardLocally } from './lib/persist';
import {
  forgetApiKey,
  loadApiKey,
  loadSettings,
  sanitizeSettings,
  saveApiKey,
  saveSettings,
  type Settings,
} from './lib/settings';
import { DEFAULT_STYLE_ID } from './lib/styles';
import type { SceneCountChoice, Storyboard } from './lib/types';
import { boardReducer, type BoardState, type EditableSceneFields } from './state/board';
import { useTheme } from './state/theme';

type Busy = 'writing' | 'drawing' | null;

interface Notes {
  title: string;
  items: string[];
}

const THEME_LABEL = { system: 'system', light: 'light', dark: 'dark' } as const;

function isAbort(error: unknown): boolean {
  return isScriptoError(error) && error.kind === 'aborted';
}

function scrollToId(id: string): void {
  const element = document.getElementById(id);
  if (element && typeof element.scrollIntoView === 'function') {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
}

/** `?demo=<id>` opens a demo directly (handy for sharing); otherwise restore the last storyboard. */
function initialBoard(): BoardState {
  const demoId = new URLSearchParams(window.location.search).get('demo');
  const demo = demoId ? loadDemo(demoId) : undefined;
  return { storyboard: demo ?? loadStoryboardLocally(), frames: {} };
}

export default function App() {
  const [theme, cycleTheme] = useTheme();
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [apiKey, setApiKey] = useState<string>(loadApiKey);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [board, dispatch] = useReducer(boardReducer, undefined, initialBoard);
  const [story, setStory] = useState<string>(loadDraft);
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);
  const [sceneCount, setSceneCount] = useState<SceneCountChoice>(6);
  const [layout, setLayout] = useState<Layout>('grid');
  const [busy, setBusy] = useState<Busy>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [notes, setNotes] = useState<Notes | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const storageWarned = useRef(false);

  const storyboard = board.storyboard;

  // Keep the storyboard between visits (debounced; images may be dropped if too large).
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = saveStoryboardLocally(storyboard);
      if (result === 'saved-without-images' && !storageWarned.current) {
        storageWarned.current = true;
        setNotes({
          title: 'Frames are not kept in this browser',
          items: ['The images are too large for browser storage. Export the storyboard as JSON to keep them.'],
        });
      }
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [storyboard]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft(story);
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [story]);

  // Stop any request in flight if the page goes away.
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  const runFrames = useCallback(
    async (target: Storyboard, sceneIds: string[], controller: AbortController) => {
      if (sceneIds.length === 0) return;
      setBusy('drawing');
      let finished = 0;
      const total = sceneIds.length;
      setProgress({ done: 0, total });
      announce(`Drawing ${total} frame${total === 1 ? '' : 's'}…`);
      const tick = () => {
        finished += 1;
        setProgress({ done: finished, total });
      };
      const result = await generateFrames({
        storyboard: target,
        sceneIds,
        settings,
        apiKey,
        signal: controller.signal,
        onStart: (sceneId) => {
          dispatch({ type: 'frame-loading', sceneId });
        },
        onDone: (sceneId, image) => {
          dispatch({ type: 'frame-done', sceneId, image });
          tick();
        },
        onError: (sceneId, err) => {
          if (isAbort(err)) dispatch({ type: 'frame-idle', sceneId });
          else dispatch({ type: 'frame-error', sceneId, error: toFriendlyError(err) });
          tick();
        },
        onSkip: (sceneId) => {
          dispatch({ type: 'frame-idle', sceneId });
        },
      });
      setProgress(null);
      if (result.fatal && !isAbort(result.fatal)) setError(toFriendlyError(result.fatal));
      if (controller.signal.aborted) announce('Stopped. Frames that finished were kept.');
      else announce(`${result.done} of ${total} frame${total === 1 ? '' : 's'} drawn.`);
    },
    [announce, apiKey, settings],
  );

  const startController = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  };

  const finish = (controller: AbortController) => {
    if (abortRef.current === controller) abortRef.current = null;
    setBusy(null);
    setProgress(null);
  };

  const handleGenerate = async () => {
    setError(null);
    setNotes(null);
    try {
      validateStoryInput(story);
    } catch (err) {
      setError(toFriendlyError(err));
      return;
    }
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }
    const controller = startController();
    setBusy('writing');
    announce('Writing scenes…');
    try {
      const result = await generateStoryboard({
        story,
        sceneCount,
        styleId,
        settings,
        apiKey,
        signal: controller.signal,
      });
      dispatch({ type: 'load', storyboard: result.storyboard });
      if (result.warnings.length > 0) {
        setNotes({ title: 'Scripto tidied up the model’s answer', items: result.warnings });
      }
      announce(`Storyboard ready: ${result.storyboard.scenes.length} scenes.`);
      requestAnimationFrame(() => {
        scrollToId('storyboard');
      });
      if (settings.generateImages) {
        await runFrames(
          result.storyboard,
          result.storyboard.scenes.map((s) => s.id),
          controller,
        );
      }
    } catch (err) {
      if (isAbort(err)) announce('Cancelled.');
      else setError(toFriendlyError(err));
    } finally {
      finish(controller);
    }
  };

  const generateFor = async (sceneIds: string[]) => {
    if (!storyboard || busy) return;
    setError(null);
    const controller = startController();
    try {
      await runFrames(storyboard, sceneIds, controller);
    } finally {
      finish(controller);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleDemo = (id: string) => {
    const demo = loadDemo(id);
    if (!demo) return;
    abortRef.current?.abort();
    setError(null);
    setNotes(null);
    dispatch({ type: 'load', storyboard: demo });
    announce(`Demo loaded: ${demo.title}, ${demo.scenes.length} scenes.`);
    requestAnimationFrame(() => {
      scrollToId('storyboard');
    });
  };

  const handleImport = async (file: File) => {
    setError(null);
    setNotes(null);
    try {
      if (file.size > MAX_IMPORT_BYTES) {
        throw new ScriptoError('input', 'This file is too large to import.');
      }
      const { storyboard: imported, warnings } = parseStoryboardFile(await file.text());
      abortRef.current?.abort();
      dispatch({ type: 'load', storyboard: imported });
      if (warnings.length > 0) setNotes({ title: 'Some parts of the file were adjusted', items: warnings });
      announce(`Opened ${imported.title}.`);
    } catch (err) {
      setError(toFriendlyError(err));
    }
  };

  const handleExportPng = async () => {
    if (!storyboard) return;
    setExporting(true);
    try {
      const blob = await renderStoryboardPng(storyboard);
      downloadBlob(blob, fileNameFor(storyboard, 'png'));
      announce('PNG downloaded.');
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    if (!storyboard) return;
    const previous = document.title;
    document.title = `${storyboard.title} · storyboard`;
    const restore = () => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    try {
      window.print();
    } catch {
      restore();
      setError({ title: 'Printing unavailable', message: 'Use your browser’s Print command and choose “Save as PDF”.' });
    }
  };

  const handleExportJson = () => {
    if (!storyboard) return;
    const blob = new Blob([serializeStoryboard(storyboard)], { type: 'application/json' });
    downloadBlob(blob, fileNameFor(storyboard, 'json'));
    announce('JSON downloaded.');
  };

  const handleClear = () => {
    if (!storyboard) return;
    const ok = window.confirm('Clear this storyboard? Export it first if you want to keep it.');
    if (!ok) return;
    abortRef.current?.abort();
    dispatch({ type: 'clear' });
    setNotes(null);
    announce('Storyboard cleared.');
  };

  const handleSaveScene = (sceneId: string, changes: Partial<EditableSceneFields>) => {
    dispatch({ type: 'update-scene', sceneId, changes });
    announce('Scene saved.');
  };

  const handleSaveKey = (key: string) => {
    const stored = saveApiKey(key);
    setApiKey(key);
    if (!stored) {
      setError({
        title: 'Key not stored',
        message: 'This browser blocked local storage, so the key will only last until you close this tab.',
      });
    }
  };

  const handleForgetKey = () => {
    forgetApiKey();
    setApiKey('');
    announce('API key removed from this browser.');
  };

  const handleSaveSettings = (next: Settings) => {
    saveSettings(next);
    setSettings(sanitizeSettings(next));
  };

  const canGenerate = Boolean(apiKey) && settings.generateImages && !busy;
  const generateHint = !apiKey
    ? 'Add your Gemini API key in Settings to generate frames.'
    : !settings.generateImages
      ? 'Image generation is turned off in Settings.'
      : 'Wait for the current generation to finish.';

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href={import.meta.env.BASE_URL}>
            <span className="brand-mark">
              <Icon name="logo" size={20} />
            </span>
            <span className="brand-name">Scripto</span>
            <span className="brand-tag">story to storyboard</span>
          </a>
          <div className="topbar-actions">
            <span className={`key-pill ${apiKey ? 'on' : 'off'}`}>{apiKey ? 'Key saved' : 'Demo mode'}</span>
            <button
              type="button"
              className="icon-button"
              onClick={cycleTheme}
              aria-label={`Theme: ${THEME_LABEL[theme]}. Change theme`}
              title={`Theme: ${THEME_LABEL[theme]}`}
            >
              <Icon name={theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'auto'} />
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                setSettingsOpen(true);
              }}
            >
              <Icon name="settings" /> Settings
            </button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="composer" id="composer" aria-labelledby="composer-title">
          <div className="composer-intro">
            <h1 id="composer-title">Turn a story into a storyboard</h1>
            <p className="lede">
              Paste a short story. Scripto splits it into scenes with camera shots, moods and lines of dialogue, then
              draws a frame for each one. It runs entirely in your browser with your own Gemini API key.
            </p>
          </div>
          <StoryForm
            story={story}
            onStoryChange={setStory}
            styleId={styleId}
            onStyleChange={setStyleId}
            sceneCount={sceneCount}
            onSceneCountChange={setSceneCount}
            hasKey={Boolean(apiKey)}
            settings={settings}
            busy={busy !== null}
            onGenerate={() => {
              void handleGenerate();
            }}
            onCancel={handleCancel}
            onOpenSettings={() => {
              setSettingsOpen(true);
            }}
          />
          {!apiKey && storyboard && (
            <div className="composer-demos">
              <p className="help">Demos:</p>
              <DemoPicker onPick={handleDemo} compact />
            </div>
          )}
        </section>

        <div className="status-area">
          {busy && (
            <div className="progress">
              <span className="spinner" aria-hidden="true" />
              <span>
                {busy === 'writing'
                  ? `Writing scenes with ${settings.textModel}…`
                  : progress
                    ? `Drawing frames: ${progress.done} of ${progress.total}`
                    : 'Drawing frames…'}
              </span>
              {busy === 'drawing' && progress && (
                <progress max={progress.total} value={progress.done} aria-label="Frames drawn" />
              )}
              <button type="button" className="button small" onClick={handleCancel}>
                <Icon name="stop" size={16} /> Stop
              </button>
            </div>
          )}
          {error && (
            <Notice
              tone="error"
              title={error.title}
              detail={error.detail}
              onDismiss={() => {
                setError(null);
              }}
            >
              <p>{error.message}</p>
            </Notice>
          )}
          {notes && (
            <Notice
              tone="warning"
              title={notes.title}
              onDismiss={() => {
                setNotes(null);
              }}
            >
              <ul>
                {notes.items.slice(0, 6).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Notice>
          )}
        </div>

        {storyboard ? (
          <StoryboardView
            storyboard={storyboard}
            frames={board.frames}
            layout={layout}
            onLayoutChange={setLayout}
            canGenerate={canGenerate}
            generateHint={generateHint}
            busy={busy !== null}
            exporting={exporting}
            onGenerateAll={() => {
              void generateFor(storyboard.scenes.filter((s) => !s.image).map((s) => s.id));
            }}
            onGenerateFrame={(sceneId) => {
              void generateFor([sceneId]);
            }}
            onRemoveImage={(sceneId) => {
              dispatch({ type: 'remove-image', sceneId });
            }}
            onSaveScene={handleSaveScene}
            onExportPng={() => {
              void handleExportPng();
            }}
            onExportPdf={handleExportPdf}
            onExportJson={handleExportJson}
            onImport={(file) => {
              void handleImport(file);
            }}
            onClear={handleClear}
            onUseStory={(text) => {
              setStory(text);
              scrollToId('composer');
            }}
          />
        ) : (
          <section className="empty" aria-labelledby="demos-title">
            <h2 id="demos-title">See it first: open a demo</h2>
            <p className="help">
              Two sample storyboards, one in English and one in Arabic, shown with placeholder frames. No API key
              needed.
            </p>
            <DemoPicker onPick={handleDemo} />
            <div className="empty-actions">
              <ImportButton
                onImport={(file) => {
                  void handleImport(file);
                }}
                label="Open a saved storyboard (JSON)"
              />
            </div>
            <ol className="how-it-works">
              <li>
                <strong>Write.</strong> Paste a story or plot in any language.
              </li>
              <li>
                <strong>Split.</strong> Gemini returns scenes as structured JSON, which Scripto checks and repairs.
              </li>
              <li>
                <strong>Draw.</strong> An image model draws one frame per scene in a consistent style.
              </li>
              <li>
                <strong>Refine.</strong> Edit scenes, redraw single frames, and export PNG, PDF or JSON.
              </li>
            </ol>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          <Icon name="lock" size={14} /> No server, no trackers. Your key stays in this browser and is only sent to
          Google’s Gemini API.
        </p>
        <p>
          <a href="https://github.com/1AyaNabil1/scripto" target="_blank" rel="noreferrer noopener">
            Source on GitHub
          </a>{' '}
          · MIT licence · Made by Aya Nabil
        </p>
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
        }}
        apiKey={apiKey}
        settings={settings}
        onSaveKey={handleSaveKey}
        onForgetKey={handleForgetKey}
        onSaveSettings={handleSaveSettings}
      />

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </>
  );
}
