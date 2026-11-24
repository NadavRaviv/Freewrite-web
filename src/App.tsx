import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { BottomBar } from "./components/BottomBar";
import { HistorySheet } from "./components/HistorySheet";
import { Toast, type ToastMessage } from "./components/Toast";
import { useChrome } from "./hooks/useChrome";
import { useSessionTimer } from "./hooks/useSessionTimer";
import { copyChatPrompt, copyEntry, downloadEntry } from "./lib/clipboard";
import { writingStack } from "./lib/fonts";
import { pickPlaceholder } from "./lib/prompt";
import {
  chooseFont,
  emptyTrash,
  getSaveWarning,
  getSnapshot,
  newEntry,
  openEntry,
  patchSettings,
  purgeEntry,
  restoreEntry,
  setText,
  stepFontSize,
  subscribe,
  subscribeSaveWarning,
  trashEntry,
  undoTrash,
} from "./lib/store";
import type { Entry, FontId } from "./lib/types";

export function App() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const saveWarning = useSyncExternalStore(subscribeSaveWarning, getSaveWarning, getSaveWarning);
  const entry = snap.entries.find((item) => item.id === snap.currentId) ?? snap.entries[0];
  const writingRef = useRef<HTMLTextAreaElement>(null);
  const [placeholder, setPlaceholder] = useState(pickPlaceholder);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => document.fullscreenElement !== null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastId = useRef(0);
  const revealRef = useRef<() => void>(() => {});
  const toastRef = useRef<(text: string, options?: { undo?: () => void; duration?: number }) => void>(() => {});

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((text: string, options?: { undo?: () => void; duration?: number }) => {
    toastId.current += 1;
    const id = toastId.current;
    setToast({
      id,
      text,
      duration: options?.duration ?? (options?.undo ? 8000 : 3200),
      undo: options?.undo
        ? () => {
            options.undo?.();
            setToast((current) => (current?.id === id ? null : current));
          }
        : undefined,
    });
  }, []);
  useEffect(() => {
    toastRef.current = showToast;
  }, [showToast]);

  const timer = useSessionTimer(
    snap.settings.timerMinutes,
    (minutes) => patchSettings({ timerMinutes: minutes }),
    () => {
      revealRef.current();
      toastRef.current("Time's up");
    },
  );
  const chrome = useChrome(timer.running, historyOpen);
  const reveal = chrome.reveal;
  useEffect(() => {
    revealRef.current = reveal;
  }, [reveal]);

  const focusWriting = useCallback((event?: { detail: number }) => {
    if (!event || event.detail > 0) writingRef.current?.focus();
  }, []);

  const startNew = useCallback(() => {
    newEntry();
    setPlaceholder(pickPlaceholder());
    setHistoryOpen(false);
    requestAnimationFrame(() => writingRef.current?.focus());
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    document.title = historyOpen ? "History — Freewrite" : "Freewrite";
  }, [historyOpen]);

  useEffect(() => {
    if (!historyOpen) writingRef.current?.focus();
  }, [entry?.id, historyOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (historyOpen) {
          event.preventDefault();
          setHistoryOpen(false);
          reveal();
        } else if (document.fullscreenElement) {
          void document.exitFullscreen();
        }
        return;
      }
      const modified = event.metaKey || event.ctrlKey;
      if (!modified || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "n" && !event.shiftKey) {
        event.preventDefault();
        startNew();
      } else if (key === "h" && !event.shiftKey) {
        event.preventDefault();
        setHistoryOpen((open) => !open);
        reveal();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        stepFontSize(1);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        stepFontSize(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen, startNew, reveal]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      showToast("Full screen isn't available here");
    }
  }, [showToast]);

  const onChat = useCallback(
    async (event: ReactMouseEvent<HTMLButtonElement>) => {
      const result = await copyChatPrompt(entry?.text ?? "");
      showToast(result === "copied" ? "Prompt copied" : result === "empty" ? "Write something first" : "Couldn't copy");
      focusWriting(event);
    },
    [entry?.text, focusWriting, showToast],
  );

  const onCopy = useCallback(
    async (event: ReactMouseEvent<HTMLButtonElement>) => {
      const result = await copyEntry(entry?.text ?? "");
      showToast(result === "copied" ? "Copied" : result === "empty" ? "Write something first" : "Couldn't copy");
      focusWriting(event);
    },
    [entry?.text, focusWriting, showToast],
  );

  const onDownload = useCallback(
    (item: Entry) => {
      downloadEntry(item);
      showToast("Downloaded");
    },
    [showToast],
  );

  const onTrash = useCallback(
    (id: string) => {
      const result = trashEntry(id);
      if (!result) return;
      showToast("Moved to trash", {
        duration: 8000,
        undo: () => undoTrash(result.entry, result.spawnedId),
      });
    },
    [showToast],
  );

  if (!entry) return null;

  return (
    <div className="app" data-history={historyOpen ? "open" : "closed"} data-theme={snap.settings.theme}>
      <a className="skip" href="#writing">
        Skip to writing
      </a>
      <main className="stage" inert={historyOpen ? true : undefined}>
        <div
          className="column"
          style={{ fontFamily: writingStack(snap.settings), fontSize: `${snap.settings.fontSize}px` }}
        >
          <label className="sr-only" htmlFor="writing">
            Writing
          </label>
          <textarea
            id="writing"
            ref={writingRef}
            className="writing"
            value={entry.text}
            placeholder={placeholder}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            dir="auto"
            onChange={(event) => {
              setText(event.target.value);
              chrome.noteTyping();
            }}
            onKeyDown={(event) => {
              if (!snap.settings.backspaceEnabled && (event.key === "Backspace" || event.key === "Delete")) {
                event.preventDefault();
              }
            }}
          />
        </div>
      </main>

      <BottomBar
        settings={snap.settings}
        barRef={chrome.barRef}
        visible={chrome.visible && !historyOpen}
        remaining={timer.remaining}
        running={timer.running}
        fullscreen={fullscreen}
        historyOpen={historyOpen}
        onFont={(font: FontId, event) => {
          chooseFont(font);
          focusWriting(event);
        }}
        onSize={(event) => {
          stepFontSize(1);
          focusWriting(event);
        }}
        onBackspace={(event) => {
          patchSettings({ backspaceEnabled: !snap.settings.backspaceEnabled });
          focusWriting(event);
        }}
        onToggleTimer={() => {
          const wasRunning = timer.running;
          timer.toggle();
          if (wasRunning) chrome.reveal();
        }}
        onAdjustTimer={timer.adjust}
        onResetTimer={() => {
          timer.reset();
          chrome.reveal();
        }}
        onTimerActivate={(detail) => focusWriting({ detail })}
        onChat={(event) => void onChat(event)}
        onCopy={(event) => void onCopy(event)}
        onNew={startNew}
        onTheme={(event) => {
          patchSettings({ theme: snap.settings.theme === "dark" ? "light" : "dark" });
          focusWriting(event);
        }}
        onFullscreen={(event) => {
          void toggleFullscreen();
          focusWriting(event);
        }}
        onHistory={() => {
          setHistoryOpen((open) => !open);
          chrome.reveal();
        }}
      />

      {!chrome.visible && !historyOpen ? (
        <button
          type="button"
          className="reveal"
          onClick={() => {
            chrome.reveal();
            requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".bar button")?.focus());
          }}
        >
          <span className="sr-only">Show controls</span>
        </button>
      ) : null}

      {historyOpen ? (
        <HistorySheet
          entries={snap.entries}
          trash={snap.trash}
          currentId={entry.id}
          onClose={() => {
            setHistoryOpen(false);
            chrome.reveal();
          }}
          onOpen={(id) => {
            openEntry(id);
            if (window.matchMedia("(max-width: 720px)").matches) setHistoryOpen(false);
          }}
          onNew={startNew}
          onTrash={onTrash}
          onDownload={onDownload}
          onRestore={(id) => {
            restoreEntry(id);
            showToast("Restored");
          }}
          onPurge={purgeEntry}
          onEmptyTrash={() => {
            emptyTrash();
            showToast("Trash emptied");
          }}
        />
      ) : null}

      {saveWarning ? (
        <p className="save-warning" role="alert">
          This browser couldn't save just now. Copy your writing somewhere safe before you leave.
        </p>
      ) : null}
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
