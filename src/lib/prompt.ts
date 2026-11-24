export const PLACEHOLDERS = [
  "Begin writing",
  "Pick a thought and go",
  "Start typing",
  "What's on your mind",
  "Just start",
  "Type your first thought",
  "Start with one sentence",
  "Just say it",
] as const;

export function pickPlaceholder(): string {
  const index = Math.floor(Math.random() * PLACEHOLDERS.length);
  return PLACEHOLDERS[index] ?? PLACEHOLDERS[0];
}

export const CHAT_PROMPT = `Read the freewrite below and talk it through with me like a thoughtful friend. Make connections I might not see. Don't just repeat it back, and don't turn it into a clinical breakdown.

Start with: "hey, thanks for showing me this. my thoughts:"

my entry:

`;

export function chatPayload(entryText: string): string {
  return `${CHAT_PROMPT}${entryText.trim()}`;
}
