import { FONT_SIZES, type Entry, type FontSize } from "./types";

export const MIN_MINUTES = 5;
export const MAX_MINUTES = 120;
export const DEFAULT_MINUTES = 15;

export function dayKey(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function dayLabel(ms: number, now = Date.now()): string {
  const date = new Date(ms);
  const today = new Date(now);
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = Math.round((start(today) - start(date)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export function timeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function shiftMinutes(seconds: number, steps: number): number {
  const snapped = Math.round(Math.floor(Math.max(0, seconds) / 60) / 5) * 5;
  const next = snapped + steps * 5;
  if (next < MIN_MINUTES) return MIN_MINUTES;
  if (next > MAX_MINUTES) return MAX_MINUTES;
  return next;
}

export function clampMinutes(value: number): number {
  const stepped = Math.round(value / 5) * 5;
  if (stepped < MIN_MINUTES) return MIN_MINUTES;
  if (stepped > MAX_MINUTES) return MAX_MINUTES;
  return stepped;
}

export function cycleSize(current: number, direction: 1 | -1): FontSize {
  const sizes: readonly number[] = FONT_SIZES;
  const index = sizes.indexOf(current);
  const start = index < 0 ? 0 : index;
  return FONT_SIZES[(start + direction + FONT_SIZES.length) % FONT_SIZES.length];
}

export function previewText(text: string, max = 88): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

export function fileStamp(ms: number): string {
  const date = new Date(ms);
  const part = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}-${part(date.getHours())}${part(date.getMinutes())}`;
}

export function entryCountLabel(count: number): string {
  if (count === 0) return "No entries yet";
  if (count === 1) return "1 entry";
  return `${count} entries`;
}

export interface EntryGroup {
  id: string;
  label: string;
  entries: Entry[];
}

export function groupEntries(entries: Entry[], now = Date.now()): EntryGroup[] {
  const sorted = entries.slice().sort((a, b) => b.createdAt - a.createdAt);
  const groups: EntryGroup[] = [];
  for (const entry of sorted) {
    const id = dayKey(entry.createdAt);
    const last = groups[groups.length - 1];
    if (!last || last.id !== id) {
      groups.push({ id, label: dayLabel(entry.createdAt, now), entries: [entry] });
    } else {
      last.entries.push(entry);
    }
  }
  return groups;
}
