import { useEffect, useRef } from "react";
import { formatClock } from "../lib/format";

interface TimerButtonProps {
  remaining: number;
  running: boolean;
  onToggle: () => void;
  onAdjust: (steps: number) => void;
  onReset: () => void;
  onActivate: (detail: number) => void;
}

export function TimerButton({ remaining, running, onToggle, onAdjust, onReset, onActivate }: TimerButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);
  const origin = useRef(0);
  const applied = useRef(0);
  const clicks = useRef(0);
  const clickTimer = useRef(0);
  const buffer = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      buffer.current += event.deltaY;
      if (Math.abs(buffer.current) < 48) return;
      onAdjust(buffer.current < 0 ? 1 : -1);
      buffer.current = 0;
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [onAdjust]);

  useEffect(() => () => window.clearTimeout(clickTimer.current), []);

  const label = formatClock(remaining);
  const stateWord = running ? "running" : remaining === 0 ? "finished" : "paused";

  return (
    <button
      ref={ref}
      type="button"
      className={running || remaining === 0 ? "timer is-live" : "timer"}
      aria-label={`Timer ${label}, ${stateWord}`}
      aria-pressed={running}
      aria-describedby="timer-help"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        moved.current = false;
        origin.current = event.clientY;
        applied.current = 0;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const delta = origin.current - event.clientY;
        if (Math.abs(delta) > 6) moved.current = true;
        const step = Math.trunc(delta / 28);
        if (step !== applied.current) {
          onAdjust(step - applied.current);
          applied.current = step;
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onAdjust(1);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          onAdjust(-1);
        } else if (event.key === "Home") {
          event.preventDefault();
          onReset();
        }
      }}
      onClick={(event) => {
        if (moved.current) {
          moved.current = false;
          return;
        }
        const detail = event.detail;
        clicks.current += 1;
        window.clearTimeout(clickTimer.current);
        clickTimer.current = window.setTimeout(() => {
          if (clicks.current >= 2) onReset();
          else onToggle();
          clicks.current = 0;
          onActivate(detail);
        }, 240);
      }}
    >
      <span className="timer-dot" aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
    </button>
  );
}
