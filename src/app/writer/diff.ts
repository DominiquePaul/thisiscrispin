import type { DiffSegment } from "./types";

const TAG_REGEX = /<(del|ins)>([\s\S]*?)<\/\1>/g;

export function parseEditResponse(response: string): DiffSegment[] {
  const cleaned = stripWrapperTags(response.trim());
  const segments: DiffSegment[] = [];

  type Token =
    | { type: "text"; value: string }
    | { type: "del"; value: string }
    | { type: "ins"; value: string };

  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of cleaned.matchAll(TAG_REGEX)) {
    const matchStart = match.index ?? 0;
    if (matchStart > cursor) {
      tokens.push({ type: "text", value: cleaned.slice(cursor, matchStart) });
    }
    tokens.push({ type: match[1] as "del" | "ins", value: match[2] });
    cursor = matchStart + match[0].length;
  }
  if (cursor < cleaned.length) {
    tokens.push({ type: "text", value: cleaned.slice(cursor) });
  }

  let i = 0;
  let idCounter = 0;
  const nextId = () => `c${idCounter++}`;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t.type === "text") {
      if (t.value.length > 0) segments.push({ kind: "keep", text: t.value });
      i++;
    } else if (t.type === "del") {
      const next = tokens[i + 1];
      if (next && next.type === "ins") {
        segments.push({
          kind: "replace",
          id: nextId(),
          original: t.value,
          replacement: next.value,
          status: "pending",
        });
        i += 2;
      } else {
        segments.push({
          kind: "delete",
          id: nextId(),
          text: t.value,
          status: "pending",
        });
        i++;
      }
    } else {
      const prev = segments[segments.length - 1];
      if (prev && prev.kind === "delete" && prev.status === "pending") {
        segments[segments.length - 1] = {
          kind: "replace",
          id: prev.id,
          original: prev.text,
          replacement: t.value,
          status: "pending",
        };
      } else {
        segments.push({
          kind: "insert",
          id: nextId(),
          text: t.value,
          status: "pending",
        });
      }
      i++;
    }
  }

  return segments;
}

function stripWrapperTags(text: string): string {
  const match = text.match(/```(?:[a-z]+)?\n([\s\S]*?)\n```/);
  if (match) return match[1];
  return text;
}

export function applyDecisions(segments: DiffSegment[]): string {
  let out = "";
  for (const seg of segments) {
    if (seg.kind === "keep") {
      out += seg.text;
      continue;
    }
    if (seg.status === "pending") {
      if (seg.kind === "insert") continue;
      if (seg.kind === "delete") out += seg.text;
      if (seg.kind === "replace") out += seg.original;
      continue;
    }
    if (seg.kind === "insert") {
      if (seg.status === "accepted") out += seg.text;
    } else if (seg.kind === "delete") {
      if (seg.status === "rejected") out += seg.text;
    } else if (seg.kind === "replace") {
      out += seg.status === "accepted" ? seg.replacement : seg.original;
    }
  }
  return out;
}

export function pendingCount(segments: DiffSegment[]): number {
  return segments.filter((s) => s.kind !== "keep" && (s as { status: string }).status === "pending").length;
}

export function changeCount(segments: DiffSegment[]): number {
  return segments.filter((s) => s.kind !== "keep").length;
}
