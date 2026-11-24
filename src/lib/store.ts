import { nextRandomFamily } from "./fonts";
import { cycleSize } from "./format";
import { applyTheme, createEntry, loadSnapshot, mergeSnapshots, persist, sanitize, STORAGE_KEY } from "./storage";
import type { Entry, FontId, Settings, Snapshot } from "./types";

let state: Snapshot = loadSnapshot();
applyTheme(state.settings.theme);

const listeners = new Set<() => void>();
const warningListeners = new Set<() => void>();
let saveWarning = false;

function emit(): void {
  for (const listener of listeners) listener();
}

function setSaveWarning(next: boolean): void {
  if (saveWarning === next) return;
  saveWarning = next;
  for (const listener of warningListeners) listener();
}

function commit(next: Snapshot): void {
  state = next;
  applyTheme(next.settings.theme);
  setSaveWarning(!persist(next));
  emit();
}

export function getSnapshot(): Snapshot {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSaveWarning(): boolean {
  return saveWarning;
}

export function subscribeSaveWarning(listener: () => void): () => void {
  warningListeners.add(listener);
  return () => warningListeners.delete(listener);
}

export function setText(text: string): void {
  const current = state.entries.find((entry) => entry.id === state.currentId);
  if (!current || current.text === text) return;
  const updated: Entry = { ...current, text, updatedAt: Date.now() };
  commit({
    ...state,
    entries: state.entries.map((entry) => (entry.id === updated.id ? updated : entry)),
  });
}

export function newEntry(): "blank" | "created" {
  const current = state.entries.find((entry) => entry.id === state.currentId);
  if (current && current.text.trim() === "") return "blank";
  const fresh = createEntry();
  commit({ ...state, entries: [fresh, ...state.entries], currentId: fresh.id });
  return "created";
}

export function openEntry(id: string): void {
  if (state.currentId === id) return;
  if (!state.entries.some((entry) => entry.id === id)) return;
  const current = state.entries.find((entry) => entry.id === state.currentId);
  const entries =
    current && current.text.trim() === "" ? state.entries.filter((entry) => entry.id !== current.id) : state.entries;
  commit({ ...state, entries, currentId: id });
}

export interface TrashResult {
  entry: Entry;
  spawnedId?: string;
}

export function trashEntry(id: string): TrashResult | null {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return null;
  let entries = state.entries.filter((item) => item.id !== id);
  let currentId = state.currentId;
  let spawnedId: string | undefined;
  if (currentId === id) {
    const next = entries.slice().sort((a, b) => b.createdAt - a.createdAt)[0];
    if (next) currentId = next.id;
    else {
      const fresh = createEntry();
      entries = [fresh];
      currentId = fresh.id;
      spawnedId = fresh.id;
    }
  }
  commit({
    ...state,
    entries,
    trash: [entry, ...state.trash.filter((item) => item.id !== entry.id)],
    currentId,
  });
  return { entry, spawnedId };
}

export function undoTrash(entry: Entry, spawnedId?: string): void {
  let entries = state.entries;
  if (spawnedId) {
    const spawned = entries.find((item) => item.id === spawnedId);
    if (spawned && spawned.text.trim() === "") entries = entries.filter((item) => item.id !== spawnedId);
  }
  if (!entries.some((item) => item.id === entry.id)) entries = [entry, ...entries];
  commit({
    ...state,
    entries,
    trash: state.trash.filter((item) => item.id !== entry.id),
    currentId: entry.id,
  });
}

export function restoreEntry(id: string): void {
  const entry = state.trash.find((item) => item.id === id);
  if (!entry) return;
  const entries = state.entries.some((item) => item.id === id) ? state.entries : [entry, ...state.entries];
  commit({
    ...state,
    entries,
    trash: state.trash.filter((item) => item.id !== id),
    currentId: entry.id,
  });
}

export function purgeEntry(id: string): void {
  commit({ ...state, trash: state.trash.filter((item) => item.id !== id) });
}

export function emptyTrash(): void {
  if (state.trash.length === 0) return;
  commit({ ...state, trash: [] });
}

export function patchSettings(partial: Partial<Settings>): void {
  commit({ ...state, settings: { ...state.settings, ...partial } });
}

export function chooseFont(font: FontId): void {
  if (font === "random") {
    const randomFamily = nextRandomFamily(state.settings.font === "random" ? state.settings.randomFamily : "");
    patchSettings({ font: "random", randomFamily });
    return;
  }
  if (state.settings.font === font) return;
  patchSettings({ font });
}

export function stepFontSize(direction: 1 | -1): void {
  patchSettings({ fontSize: cycleSize(state.settings.fontSize, direction) });
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const incoming = sanitize(JSON.parse(event.newValue) as unknown);
      const merged = mergeSnapshots(state, incoming);
      if (JSON.stringify(merged) === JSON.stringify(state)) return;
      commit(merged);
    } catch {
      // Ignore a malformed write from another tab. This tab still has its copy.
    }
  });
}
