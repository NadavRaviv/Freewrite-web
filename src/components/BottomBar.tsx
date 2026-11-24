import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { FACES, randomStack } from "../lib/fonts";
import type { FontId, Settings } from "../lib/types";
import { TimerButton } from "./TimerButton";

interface BottomBarProps {
  settings: Settings;
  barRef: RefObject<HTMLDivElement | null>;
  visible: boolean;
  remaining: number;
  running: boolean;
  fullscreen: boolean;
  historyOpen: boolean;
  onFont: (font: FontId, event: ReactMouseEvent<HTMLButtonElement>) => void;
  onSize: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onBackspace: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onToggleTimer: () => void;
  onAdjustTimer: (steps: number) => void;
  onResetTimer: () => void;
  onTimerActivate: (detail: number) => void;
  onChat: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onCopy: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onNew: () => void;
  onTheme: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onFullscreen: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onHistory: () => void;
}

export function BottomBar({
  settings,
  barRef,
  visible,
  remaining,
  running,
  fullscreen,
  historyOpen,
  onFont,
  onSize,
  onBackspace,
  onToggleTimer,
  onAdjustTimer,
  onResetTimer,
  onTimerActivate,
  onChat,
  onCopy,
  onNew,
  onTheme,
  onFullscreen,
  onHistory,
}: BottomBarProps) {
  const themeLabel = settings.theme === "dark" ? "Dark" : "Light";
  const randomLabel = settings.font === "random" ? settings.randomFamily : "Random";

  return (
    <div
      ref={barRef}
      className="bar"
      role="toolbar"
      aria-label="Writing controls"
      data-hidden={visible ? "false" : "true"}
      inert={visible ? undefined : true}
    >
      <div className="cluster">
        <button type="button" onClick={onSize} aria-label={`Font size ${settings.fontSize} pixels. Activate for the next size.`}>
          {settings.fontSize}
        </button>
        <span className="dot" aria-hidden="true">
          ·
        </span>
        {FACES.map((face) => (
          <button
            key={face.id}
            type="button"
            aria-pressed={settings.font === face.id}
            style={{ fontFamily: face.stack }}
            onClick={(event) => onFont(face.id, event)}
          >
            {face.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={settings.font === "random"}
          aria-label={settings.font === "random" ? `Random font, ${settings.randomFamily}` : "Random font"}
          style={{ fontFamily: settings.font === "random" ? randomStack(settings.randomFamily) : undefined }}
          onClick={(event) => onFont("random", event)}
        >
          {randomLabel}
        </button>
        <span className="dot" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          className={settings.backspaceEnabled ? undefined : "is-locked"}
          aria-pressed={settings.backspaceEnabled}
          aria-label={settings.backspaceEnabled ? "Backspace on" : "Backspace off"}
          onClick={onBackspace}
        >
          {settings.backspaceEnabled ? "Backspace" : "No backspace"}
        </button>
      </div>
      <div className="spacer" />
      <div className="cluster">
        <TimerButton
          remaining={remaining}
          running={running}
          onToggle={onToggleTimer}
          onAdjust={onAdjustTimer}
          onReset={onResetTimer}
          onActivate={onTimerActivate}
        />
        <span className="dot" aria-hidden="true">
          ·
        </span>
        <button type="button" onClick={onChat}>
          Chat
        </button>
        <button type="button" onClick={onCopy}>
          Copy
        </button>
        <button type="button" onClick={onNew} aria-label="New entry">
          New
        </button>
        <button
          type="button"
          onClick={onTheme}
          aria-label={settings.theme === "dark" ? "Dark theme, switch to light" : "Light theme, switch to dark"}
        >
          {themeLabel}
        </button>
        <button
          type="button"
          aria-pressed={fullscreen}
          aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
          onClick={onFullscreen}
        >
          {fullscreen ? "Window" : "Full screen"}
        </button>
        <button type="button" aria-expanded={historyOpen} aria-controls="history-sheet" onClick={onHistory}>
          History
        </button>
      </div>
      <span id="timer-help" className="sr-only">
        Click to start or pause. Scroll or drag up and down to change it by five minutes. Double-click, or press Home, to
        reset to 15 minutes. Arrow up and arrow down change it while the timer is focused.
      </span>
    </div>
  );
}
