import { fileStamp } from "./format";
import { chatPayload } from "./prompt";
import type { Entry } from "./types";

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadEntry(entry: Entry): void {
  const blob = new Blob([entry.text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `freewrite-${fileStamp(entry.createdAt)}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function copyEntry(text: string): Promise<"empty" | "copied" | "failed"> {
  if (text.trim() === "") return "empty";
  return (await copyText(text)) ? "copied" : "failed";
}

export async function copyChatPrompt(text: string): Promise<"empty" | "copied" | "failed"> {
  if (text.trim() === "") return "empty";
  return (await copyText(chatPayload(text))) ? "copied" : "failed";
}
