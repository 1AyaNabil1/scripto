import { hostImpl as defaultHostImpl } from '@host';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ArcTab } from './components/ArcTab';
import { Background } from './components/Background';
import { BoardTab } from './components/BoardTab';
import { CastTab } from './components/CastTab';
import type { Layout } from './components/Dock';
import { EmptyBoard } from './components/EmptyBoard';
import { Header } from './components/Header';
import type { TabId } from './components/tabs';
import { Icon } from './components/Icon';
import { Notice } from './components/Notice';
import { ScriptTab } from './components/ScriptTab';
import { SettingsDialog } from './components/SettingsDialog';
import { StoryTab, type FirstTry } from './components/StoryTab';
import { loadDemo } from './demo/samples';
import type { HostImpl } from './host/types';
import type { AiBackend, Charge } from './lib/backend';
import { isScriptoError, ScriptoError, toFriendlyError, type FriendlyError } from './lib/errors';
import { renderStoryboardPng } from './lib/exportImage';
import { downloadBlob, fileNameFor, MAX_IMPORT_BYTES, parseStoryboardFile, serializeStoryboard } from './lib/files';
import { generateFrames, generateStoryboard, validateStoryInput } from './lib/generate';
import { ZIBBY_APP_URL } from './lib/host';
import {
  loadDraft,
  loadStoryboardLocally,
  loadStoryboardWithFrames,
  saveDraft,
  saveStoryboardLocally,
  saveStoryboardWithFrames,
} from './lib/persist';
import {
  forgetApiKey,
  loadApiKey,
  loadSettings,
  safeStorage,
  sanitizeSettings,
  saveApiKey,
  saveSettings,
  type Settings,
} from './lib/settings';
import { DEFAULT_STYLE_ID } from './lib/styles';
import type { SceneCountChoice, Storyboard } from './lib/types';
import { boardReducer, type BoardState, type EditableSceneFields } from './state/board';

type Busy = 'writing' | 'drawing' | null;

interface Notes {
  title: string;
  items: string[];
}

/** Zibby's own words for a visitor whose runs are on Zibby. */
const COMPED_LINE = 'Comped: your runs are on Zibby';

interface RunCharges {
  credits: number;
  unknown: string[];
  comped: boolean;
  runs: number;
}

function isAbort(error: unknown): boolean {
  return isScriptoError(error) && error.kind === 'aborted';
}

function chargeLine(charges: RunCharges): string | null {
  if (charges.runs === 0) return null;
  if (charges.comped) return COMPED_LINE;
  if (charges.unknown.length > 0) {
    const known = charges.credits > 0 ? `Charged ${charges.credits} credits, ` : '';
    return `${known}charge unknown for ${charges.unknown.length} run${charges.unknown.length === 1 ? '' : 's'} (request id ${charges.unknown.join(', ')}).`;
  }
  return charges.credits === 0 ? 'Nothing was charged.' : `Charged ${charges.credits} credit${charges.credits === 1 ? '' : 's'}.`;
}

/** `?demo=<id>` opens a demo directly (handy for sharing); otherwise the last storyboard comes back. */
function initialBoard(): BoardState {
  const demoId = new URLSearchParams(window.location.search).get('demo');
  const demo = demoId ? loadDemo(demoId) : undefined;
  return { storyboard: demo ?? loadStoryboardLocally(), frames: {} };
}

interface AppProps {
  /** The host implementation; tests pass the Zibby one. */
  impl?: HostImpl;
  /** Overrides where model calls go (tests). */
  backend?: AiBackend;
}

export default function App({ impl = defaultHostImpl, backend: backendOverride }: AppProps) {
  const host = impl.host;
  const [settings, setSettings] = useState<Settings>(() => loadSettings(safeStorage(), host));
  const [apiKey, setApiKey] = useState<string>(() => (host === 'byok' ? loadApiKey() : ''));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [board, dispatch] = useReducer(boardReducer, undefined, initialBoard);
  const [tab, setTab] = useState<TabId>(() =>
    new URLSearchParams(window.location.search).has('demo') || (board.storyboard && board.storyboard.source !== 'demo')
      ? 'board'
      : 'story',
  );
  const [story, setStory] = useState<string>(loadDraft);
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);
  const [sceneCount, setSceneCount] = useState<SceneCountChoice>(6);
  const [layout, setLayout] = useState<Layout>('grid');
  const [busy, setBusy] = useState<Busy>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [notes, setNotes] = useState<Notes | null>(null);
  const [charge, setCharge] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const chargesRef = useRef<RunCharges>({ credits: 0, unknown: [], comped: false, runs: 0 });
  const storageWarned = useRef(false);

  const storyboard = board.storyboard;
  const storyboardRef = useRef(storyboard);
  const initialStoryboard = useRef(storyboard);
  useEffect(() => {
    storyboardRef.current = storyboard;
  }, [storyboard]);

  const backend = useMemo(() => backendOverride ?? impl.createBackend(apiKey), [backendOverride, impl, apiKey]);
  const storyQuote = impl.useQuote('storyboard');
  const frameQuote = impl.useQuote('frame');
  const comped = impl.useComped();
  const canRun = host === 'zibby' || Boolean(apiKey);

  // Frames are too big for localStorage, so the board with its frames comes back from IndexedDB.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('demo')) return undefined;
    let cancelled = false;
    void loadStoryboardWithFrames().then((saved) => {
      if (cancelled || !saved || storyboardRef.current !== initialStoryboard.current) return;
      dispatch({ type: 'load', storyboard: saved });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = saveStoryboardLocally(storyboard);
      void saveStoryboardWithFrames(storyboard).then((kept) => {
        if (!kept && result === 'saved-without-images' && !storageWarned.current) {
          storageWarned.current = true;
          setNotes({
            title: 'Frames are not kept in this browser',
            items: ['The images are too large for browser storage. Export the storyboard as JSON to keep them.'],
          });
        }
      });
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

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  const goTo = useCallback((next: TabId) => {
    setTab(next);
    // Each tab starts at the top, with the header and tabs in view.
    if (window.scrollY > 0) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }
  }, []);

  const beginCharges = () => {
    chargesRef.current = { credits: 0, unknown: [], comped: false, runs: 0 };
    setCharge(null);
  };
  const onCharge = useCallback((item: Charge) => {
    const c = chargesRef.current;
    c.runs += 1;
    if (item.comped) c.comped = true;
    if (item.known) c.credits += item.credits;
    else c.unknown.push(item.requestId ?? 'none');
  }, []);
  const endCharges = () => {
    setCharge(chargeLine(chargesRef.current));
  };

  const showError = (err: unknown, again?: () => void) => {
    if (isAbort(err)) {
      announce('Cancelled.');
      return;
    }
    const friendly = toFriendlyError(err);
    setRetry(() => (friendly.kind === 'cap' && again ? again : null));
    setError(friendly);
  };

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

  const missingFrames = () => (storyboardRef.current?.scenes ?? []).filter((s) => !s.image).map((s) => s.id);

  const runFrames = async (target: Storyboard, sceneIds: string[], controller: AbortController, capAck = false) => {
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
      backend,
      apiKey,
      signal: controller.signal,
      capAck,
      onCharge,
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
    if (result.fatal) {
      showError(result.fatal, () => {
        void generateFor(missingFrames(), true);
      });
    }
    if (controller.signal.aborted) announce('Stopped. Frames that finished were kept.');
    else announce(`${result.done} of ${total} frame${total === 1 ? '' : 's'} drawn.`);
  };

  const handleGenerate = async (capAck = false) => {
    setError(null);
    setNotes(null);
    setRetry(null);
    try {
      validateStoryInput(story);
    } catch (err) {
      setError(toFriendlyError(err));
      return;
    }
    if (!canRun) {
      setSettingsOpen(true);
      return;
    }
    const controller = startController();
    setBusy('writing');
    beginCharges();
    announce('Writing scenes…');
    try {
      const result = await generateStoryboard({
        story,
        sceneCount,
        styleId,
        settings,
        backend,
        apiKey,
        signal: controller.signal,
        capAck,
        onCharge,
      });
      dispatch({ type: 'load', storyboard: result.storyboard });
      if (result.warnings.length > 0) {
        setNotes({ title: 'Scripto tidied up the model’s answer', items: result.warnings });
      }
      announce(`Storyboard ready: ${result.storyboard.scenes.length} scenes.`);
      goTo('board');
      if (settings.generateImages) {
        await runFrames(
          result.storyboard,
          result.storyboard.scenes.map((s) => s.id),
          controller,
        );
      }
    } catch (err) {
      showError(err, () => {
        void handleGenerate(true);
      });
    } finally {
      finish(controller);
      endCharges();
    }
  };

  const generateFor = async (sceneIds: string[], capAck = false) => {
    const target = storyboardRef.current;
    if (!target || busy || sceneIds.length === 0) return;
    setError(null);
    setRetry(null);
    const controller = startController();
    beginCharges();
    try {
      await runFrames(target, sceneIds, controller, capAck);
    } finally {
      finish(controller);
      endCharges();
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
    setCharge(null);
    dispatch({ type: 'load', storyboard: demo });
    announce(`Opened ${demo.title}, ${demo.scenes.length} scenes.`);
    goTo('board');
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
      goTo('board');
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
    let opened = false;
    const onBefore = () => {
      opened = true;
    };
    const restore = () => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('beforeprint', onBefore, { once: true });
    window.addEventListener('afterprint', restore);
    document.title = `${storyboard.title} · storyboard`;
    try {
      window.print();
    } catch {
      restore();
      setError({ title: 'Printing unavailable', message: 'Use your browser’s Print command and choose “Save as PDF”.' });
      return;
    }
    // Inside some embedded frames the print dialog is blocked without an error.
    setTimeout(() => {
      window.removeEventListener('beforeprint', onBefore);
      if (!opened) {
        restore();
        setNotes({ title: 'Printing is blocked here', items: ['Use the PNG export instead, or open Scripto in its own tab.'] });
      }
    }, 1500);
  };

  const handleExportJson = () => {
    if (!storyboard) return;
    const blob = new Blob([serializeStoryboard(storyboard)], { type: 'application/json' });
    downloadBlob(blob, fileNameFor(storyboard, 'json'));
    announce('JSON downloaded.');
  };

  const handleClear = () => {
    if (!storyboard) return;
    abortRef.current?.abort();
    dispatch({ type: 'clear' });
    setNotes(null);
    setCharge(null);
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
    saveSettings(next, safeStorage(), host);
    setSettings(sanitizeSettings(next, host));
  };

  const frames = sceneCount === 'auto' ? 6 : sceneCount;
  const makeChip =
    host === 'zibby'
      ? comped || storyQuote === null || frameQuote === null
        ? null
        : `~${storyQuote + (settings.generateImages ? frames * frameQuote : 0)} cr`
      : apiKey
        ? null
        : 'add key';

  const firstTry: FirstTry =
    host === 'zibby'
      ? {
          free: true,
          title: ['One story,', 'six real frames.'],
          line: 'New Zibby accounts get 200 free credits. No key, no card.',
          href: null,
          cta: '',
        }
      : ZIBBY_APP_URL
        ? {
            free: true,
            title: ['One story,', 'six real frames.'],
            line: 'Free on Zibby: new accounts get 200 credits. No key, no card.',
            href: ZIBBY_APP_URL,
            cta: 'Try it on Zibby',
          }
        : {
            free: false,
            title: ['Two minutes,', 'once.'],
            line: 'Bring a Gemini key and frames are drawn on your own Google account.',
            href: null,
            cta: 'Add your key',
          };

  const canGenerate = canRun && !busy;
  const generateHint = !canRun ? 'Add your API key in Settings to draw frames.' : 'Wait for the current run to finish.';

  const errorActions =
    error?.kind === 'credits' ? (
      <button
        type="button"
        className="button primary small"
        onClick={() => {
          impl.topUp();
        }}
      >
        Top up credits
      </button>
    ) : error?.kind === 'signed-out' ? (
      <button
        type="button"
        className="button primary small"
        onClick={() => {
          impl.signIn();
        }}
      >
        Sign in to Zibby
      </button>
    ) : error?.kind === 'cap' && retry ? (
      <>
        <button
          type="button"
          className="button primary small"
          onClick={() => {
            setRetry(null);
            setError(null);
            retry();
          }}
        >
          Continue
        </button>
        <button
          type="button"
          className="button ghost small"
          onClick={() => {
            setRetry(null);
            setError(null);
          }}
        >
          Not now
        </button>
      </>
    ) : undefined;

  const empty = (what: string) => (
    <EmptyBoard
      what={what}
      onGoStory={() => {
        goTo('story');
      }}
      onPickDemo={handleDemo}
      onImport={(file) => {
        void handleImport(file);
      }}
    />
  );

  return (
    <div className="app">
      <Background />
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header
        tab={tab}
        onTab={goTo}
        status={
          <impl.Status
            apiKey={apiKey}
            onOpenSettings={() => {
              setSettingsOpen(true);
            }}
          />
        }
        onOpenSettings={() => {
          setSettingsOpen(true);
        }}
      />

      <main id="main" tabIndex={-1}>
        <div className="status-area">
          {busy && (
            <div className="progress" role="status">
              <span className="spinner" aria-hidden="true" />
              <span>
                {busy === 'writing'
                  ? 'Writing scenes…'
                  : progress
                    ? `Drawing frames ${progress.done} of ${progress.total}`
                    : 'Drawing frames…'}
              </span>
              {busy === 'drawing' && progress && (
                <progress max={progress.total} value={progress.done} aria-label="Frames drawn" />
              )}
              <button type="button" className="button small" onClick={handleCancel}>
                <Icon name="stop" size={14} /> Stop
              </button>
            </div>
          )}
          {error && (
            <Notice
              tone="error"
              title={error.title}
              detail={[error.detail, error.requestId ? `Request id ${error.requestId}` : undefined].filter(Boolean).join(' · ') || undefined}
              actions={errorActions}
              onDismiss={() => {
                setRetry(null);
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
          {charge && !busy && (
            <p className="charge-line" role="status">
              {charge}
            </p>
          )}
        </div>

        {tab === 'story' && (
          <StoryTab
            story={story}
            onStoryChange={setStory}
            styleId={styleId}
            onStyleChange={setStyleId}
            sceneCount={sceneCount}
            onSceneCountChange={setSceneCount}
            drawFrames={settings.generateImages}
            onToggleFrames={() => {
              handleSaveSettings({ ...settings, generateImages: !settings.generateImages });
            }}
            busy={busy !== null}
            canRun={canRun}
            makeChip={makeChip}
            firstTry={firstTry}
            onGenerate={() => {
              void handleGenerate();
            }}
            onCancel={handleCancel}
            onOpenSettings={() => {
              setSettingsOpen(true);
            }}
            onPickDemo={handleDemo}
          />
        )}
        {tab === 'board' &&
          (storyboard ? (
            <BoardTab
              storyboard={storyboard}
              frames={board.frames}
              layout={layout}
              onLayoutChange={setLayout}
              canGenerate={canGenerate}
              generateHint={generateHint}
              frameQuote={host === 'zibby' && !comped ? frameQuote : null}
              busy={busy !== null}
              exporting={exporting}
              onGenerateAll={() => {
                void generateFor(missingFrames());
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
                goTo('story');
              }}
            />
          ) : (
            empty('Board')
          ))}
        {tab === 'script' && (storyboard ? <ScriptTab storyboard={storyboard} /> : empty('Script'))}
        {tab === 'arc' && (storyboard ? <ArcTab storyboard={storyboard} /> : empty('Arc'))}
        {tab === 'cast' && (storyboard ? <CastTab storyboard={storyboard} /> : empty('Cast'))}
      </main>

      <footer className="footer">
        <span>
          Built by{' '}
          <a className="footer-name" href="https://ayanabil.vercel.app" target="_blank" rel="noreferrer noopener">
            AyaNexus
          </a>{' '}
          🦢
        </span>
        <a
          className="footer-github"
          href="https://github.com/1AyaNabil1/scripto"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Source on GitHub"
          title="Source on GitHub"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
        </a>
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
        }}
        host={host}
        apiKey={apiKey}
        settings={settings}
        onSaveKey={handleSaveKey}
        onForgetKey={handleForgetKey}
        onSaveSettings={handleSaveSettings}
      />

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
