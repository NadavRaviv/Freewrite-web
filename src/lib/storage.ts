import { RANDOM_FACES } from "./fonts";
import { clampMinutes, dayKey } from "./format";
import { FONT_SIZES, type Entry, type FontId, type Settings, type Snapshot, type ThemeName } from "./types";

export const STORAGE_KEY = "freewrite.v1";
export const BACKUP_KEY = "freewrite.v1.backup";

const FONT_IDS: readonly FontId[] = ["lato", "arial", "system", "serif", "random"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createEntry(now = Date.now()): Entry {
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    text: "",
  };
}

export function defaultSettings(): Settings {
  const dark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return {
    theme: dark ? "dark" : "light",
    font: "lato",
    randomFamily: RANDOM_FACES[0].name,
    fontSize: 18,
    timerMinutes: 15,
    backspaceEnabled: true,
  };
}

function asEntry(value: unknown): Entry | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || value.id.length === 0) return null;
  if (typeof value.text !== "string") return null;
  const createdAt = typeof value.createdAt === "number" && Number.isFinite(value.createdAt) ? value.createdAt : Date.now();
  const updatedAt = typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt) ? value.updatedAt : createdAt;
  return { id: value.id, text: value.text, createdAt, updatedAt };
}

function uniqueEntries(values: unknown): Entry[] {
  if (!Array.isArray(values)) return [];
  const map = new Map<string, Entry>();
  for (const value of values) {
    const entry = asEntry(value);
    if (!entry) continue;
    const previous = map.get(entry.id);
    if (!previous || entry.updatedAt >= previous.updatedAt) map.set(entry.id, entry);
  }
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function asSettings(value: unknown): Settings {
  const defaults = defaultSettings();
  if (!isRecord(value)) return defaults;
  const theme: ThemeName = value.theme === "dark" || value.theme === "light" ? value.theme : defaults.theme;
  const font = FONT_IDS.includes(value.font as FontId) ? (value.font as FontId) : defaults.font;
  const fontSize = FONT_SIZES.includes(value.fontSize as (typeof FONT_SIZES)[number])
    ? (value.fontSize as number)
    : defaults.fontSize;
  const timerMinutes = typeof value.timerMinutes === "number" ? clampMinutes(value.timerMinutes) : defaults.timerMinutes;
  const backspaceEnabled = typeof value.backspaceEnabled === "boolean" ? value.backspaceEnabled : defaults.backspaceEnabled;
  const randomFamily =
    typeof value.randomFamily === "string" && RANDOM_FACES.some((face) => face.name === value.randomFamily)
      ? value.randomFamily
      : defaults.randomFamily;
  return { theme, font, randomFamily, fontSize, timerMinutes, backspaceEnabled };
}

export function sanitize(value: unknown): Snapshot {
  const root = isRecord(value) ? value : {};
  const entries = uniqueEntries(root.entries);
  const entryIds = new Set(entries.map((entry) => entry.id));
  const trash = uniqueEntries(root.trash).filter((entry) => !entryIds.has(entry.id));
  const settings = asSettings(root.settings);
  const requested = typeof root.currentId === "string" ? root.currentId : "";
  const currentId = entries.some((entry) => entry.id === requested) ? requested : (entries[0]?.id ?? "");
  return { entries, trash, settings, currentId };
}

export function ensureToday(snapshot: Snapshot, now = Date.now()): Snapshot {
  if (snapshot.entries.length === 0) {
    const fresh = createEntry(now);
    return { ...snapshot, entries: [fresh], currentId: fresh.id };
  }
  const current = snapshot.entries.find((entry) => entry.id === snapshot.currentId) ?? snapshot.entries[0];
  if (dayKey(current.createdAt) === dayKey(now)) {
    return { ...snapshot, currentId: current.id };
  }
  const emptyToday = snapshot.entries.find((entry) => dayKey(entry.createdAt) === dayKey(now) && entry.text.trim() === "");
  if (emptyToday) return { ...snapshot, currentId: emptyToday.id };
  const fresh = createEntry(now);
  return { ...snapshot, entries: [fresh, ...snapshot.entries], currentId: fresh.id };
}

function readRaw(key: string): unknown | undefined {
  if (typeof localStorage === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export function persist(snapshot: Snapshot): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const raw = JSON.stringify(snapshot);
    const previous = localStorage.getItem(STORAGE_KEY);
    if (previous && previous !== raw) localStorage.setItem(BACKUP_KEY, previous);
    if (previous !== raw) localStorage.setItem(STORAGE_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

export function loadSnapshot(): Snapshot {
  try {
    const primary = readRaw(STORAGE_KEY);
    const parsed = primary ?? readRaw(BACKUP_KEY);
    const next = ensureToday(sanitize(parsed ?? {}));
    persist(next);
    return next;
  } catch {
    const next = ensureToday(sanitize({}));
    persist(next);
    return next;
  }
}

export function mergeSnapshots(local: Snapshot, incoming: Snapshot): Snapshot {
  const map = new Map<string, Entry>();
  for (const entry of [...local.entries, ...incoming.entries, ...local.trash, ...incoming.trash]) {
    const previous = map.get(entry.id);
    if (!previous || entry.updatedAt >= previous.updatedAt) map.set(entry.id, entry);
  }
  const localTrashIds = new Set(local.trash.map((entry) => entry.id));
  const incomingTrashIds = new Set(incoming.trash.map((entry) => entry.id));
  const trash: Entry[] = [];
  const entries: Entry[] = [];
  for (const entry of map.values()) {
    const inLocalTrash = localTrashIds.has(entry.id);
    const inIncomingTrash = incomingTrashIds.has(entry.id);
    const localCopy = local.entries.find((item) => item.id === entry.id) ?? local.trash.find((item) => item.id === entry.id);
    const incomingCopy =
      incoming.entries.find((item) => item.id === entry.id) ?? incoming.trash.find((item) => item.id === entry.id);
    const newestIsTrash =
      (inLocalTrash && (!incomingCopy || (localCopy?.updatedAt ?? 0) >= incomingCopy.updatedAt)) ||
      (inIncomingTrash && (!localCopy || (incomingCopy?.updatedAt ?? 0) >= localCopy.updatedAt));
    if (newestIsTrash && (inLocalTrash || inIncomingTrash)) trash.push(entry);
    else entries.push(entry);
  }
  entries.sort((a, b) => b.createdAt - a.createdAt);
  trash.sort((a, b) => b.updatedAt - a.updatedAt);
  const currentId = entries.some((entry) => entry.id === local.currentId) ? local.currentId : (entries[0]?.id ?? "");
  return { settings: local.settings, currentId, entries, trash };
}

export function applyTheme(theme: ThemeName): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
}
