import { useEffect, useState } from "react";

export interface ToastMessage {
  id: number;
  text: string;
  duration: number;
  undo?: () => void;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!toast || paused) return;
    const id = window.setTimeout(onDismiss, toast.duration);
    return () => window.clearTimeout(id);
  }, [toast, paused, onDismiss]);

  return (
    <div className="toast-slot" role="status" aria-live="polite">
      {toast ? (
        <div
          className="toast"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
          }}
        >
          <p>{toast.text}</p>
          {toast.undo ? (
            <button type="button" onClick={toast.undo}>
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
