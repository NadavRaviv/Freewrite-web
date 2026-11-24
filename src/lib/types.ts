export const FONT_SIZES = [16, 18, 20, 22, 24, 26] as const;

export type FontSize = (typeof FONT_SIZES)[number];

export type FontId = "lato" | "arial" | "system" | "serif" | "random";

export type ThemeName = "light" | "dark";

export interface Entry {
  id: string;
  createdAt: number;
  updatedAt: number;
  text: string;
}

export interface Settings {
  theme: ThemeName;
  font: FontId;
  randomFamily: string;
  fontSize: number;
  timerMinutes: number;
  backspaceEnabled: boolean;
}

export interface Snapshot {
  entries: Entry[];
  trash: Entry[];
  currentId: string;
  settings: Settings;
}
