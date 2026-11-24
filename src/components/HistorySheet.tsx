import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { IconDownload, IconTrash } from "./Icons";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { entryCountLabel, groupEntries, previewText, timeLabel } from "../lib/format";
import type { Entry } from "../lib/types";

interface HistorySheetProps {
  entries: Entry[];
  trash: Entry[];
  currentId: string;
  onClose: () => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onTrash: (id: string) => void;
  onDownload: (entry: Entry) => void;
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
  onEmptyTrash: () => void;
}

export function HistorySheet({
  entries,
  trash,
  currentId,
  onClose,
  onOpen,
  onNew,
  onTrash,
  onDownload,
  onRestore,
  onPurge,
  onEmptyTrash,
}: HistorySheetProps) {
  const ref = useRef<HTMLElement>(null);
  const [view, setView] = useState<"entries" | "trash">("entries");
  const [confirm, setConfirm] = useState<{ kind: "one" | "all"; id?: string } | null>(null);
  useFocusTrap(ref, confirm === null);

  const saved = entries.filter((entry) => entry.text.trim() !== "");
  const groups = groupEntries(saved);

  return (
    <>
      <button type="button" className="scrim" aria-label="Close history" tabIndex={-1} onClick={onClose} />
      <aside
        ref={ref}
        id="history-sheet"
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        <header className="sheet-header">
          <div>
            <h2 id="history-title" tabIndex={-1} data-autofocus>
              {view === "entries" ? "History" : "Trash"}
            </h2>
            <p className="sheet-count">{view === "entries" ? entryCountLabel(saved.length) : entryCountLabel(trash.length)}</p>
          </div>
          <div className="cluster">
            {view === "entries" ? (
              <button type="button" onClick={onNew}>
                New entry
              </button>
            ) : (
              <button type="button" onClick={() => setView("entries")}>
                Back
              </button>
            )}
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        {view === "entries" ? (
          <div className="sheet-body">
            {saved.length === 0 ? (
              <p className="empty">Nothing saved yet. Whatever you type is kept on this device.</p>
            ) : (
              groups.map((group) => (
                <section key={group.id} className="day" aria-label={group.label}>
                  <h3>{group.label}</h3>
                  <ul>
                    {group.entries.map((entry) => {
                      const label = previewText(entry.text) || "Empty entry";
                      const selected = entry.id === currentId;
                      return (
                        <li key={entry.id} className={selected ? "entry is-selected" : "entry"}>
                          <button
                            type="button"
                            className="entry-open"
                            aria-current={selected ? "true" : undefined}
                            onClick={() => onOpen(entry.id)}
                            onKeyDown={(event) => moveEntryFocus(event)}
                          >
                            <time dateTime={new Date(entry.createdAt).toISOString()}>{timeLabel(entry.createdAt)}</time>
                            <span className="entry-preview">{label}</span>
                          </button>
                          <div className="entry-actions">
                            <button type="button" aria-label={`Download ${label}`} onClick={() => onDownload(entry)}>
                              <IconDownload />
                            </button>
                            <button type="button" aria-label={`Move to trash, ${label}`} onClick={() => onTrash(entry.id)}>
                              <IconTrash />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        ) : (
          <div className="sheet-body">
            {trash.length === 0 ? (
              <p className="empty">Trash is empty.</p>
            ) : (
              <ul>
                {trash.map((entry) => {
                  const label = previewText(entry.text) || "Empty entry";
                  return (
                    <li key={entry.id} className="entry">
                      <div className="entry-open" aria-hidden="true">
                        <time dateTime={new Date(entry.createdAt).toISOString()}>{timeLabel(entry.createdAt)}</time>
                        <span className="entry-preview">{label}</span>
                      </div>
                      <div className="entry-actions entry-actions-text">
                        <button type="button" onClick={() => onRestore(entry.id)}>
                          Restore
                        </button>
                        <button type="button" className="danger-text" onClick={() => setConfirm({ kind: "one", id: entry.id })}>
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <footer className="sheet-footer">
          {view === "entries" ? (
            <button type="button" onClick={() => setView("trash")}>
              Trash{trash.length > 0 ? ` (${trash.length})` : ""}
            </button>
          ) : (
            <button type="button" onClick={() => setConfirm({ kind: "all" })} disabled={trash.length === 0}>
              Empty trash
            </button>
          )}
        </footer>

        {confirm ? (
          <Confirm
            title={confirm.kind === "all" ? "Empty trash?" : "Delete this entry forever?"}
            body={
              confirm.kind === "all"
                ? "This removes every entry in trash from this browser."
                : "This removes it from this browser. There is no way to bring it back."
            }
            confirmLabel={confirm.kind === "all" ? "Empty trash" : "Delete forever"}
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              if (confirm.kind === "all") onEmptyTrash();
              else if (confirm.id) onPurge(confirm.id);
              setConfirm(null);
            }}
          />
        ) : null}
      </aside>
    </>
  );
}

function moveEntryFocus(event: ReactKeyboardEvent<HTMLButtonElement>): void {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const current = event.currentTarget;
  const items = [...current.closest(".sheet-body")!.querySelectorAll<HTMLButtonElement>(".entry-open")];
  const index = items.indexOf(current);
  if (index < 0) return;
  const next = event.key === "ArrowDown" ? items[index + 1] : items[index - 1];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

function Confirm({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);

  return (
    <div className="confirm" role="presentation" onClick={onCancel}>
      <div
        ref={ref}
        className="confirm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onCancel();
          }
        }}
      >
        <h3 id="confirm-title">{title}</h3>
        <p id="confirm-body">{body}</p>
        <div className="cluster">
          <button type="button" data-autofocus onClick={onCancel}>
            Keep
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
