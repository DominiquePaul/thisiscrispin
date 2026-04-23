import type { Idea, InlineComment, ModelId } from "./types";

const API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are a skilled editor helping a writer improve their draft. You receive:
1. The full draft.
2. Optional inline comments tied to specific quoted passages the writer wants you to address.
3. Optional voice/style notes from the writer.
4. An optional idea buffer — a spec-sheet of ideas the writer is thinking about. These are CONTEXT, not a checklist. Some may belong in the essay; others are parked, half-formed, or deliberately excluded. Do not inject buffered ideas into the draft unless a comment explicitly asks you to, or unless doing so fills a clear gap the draft is reaching for.

Your job: return the entire edited draft with your changes marked inline so the writer can accept or reject each change individually.

Mark every change using these tags:
- <del>...</del> for text to remove
- <ins>...</ins> for text to add
- A replacement is <del>old</del><ins>new</ins> written back-to-back with NO whitespace between the closing </del> and opening <ins>. Any shared surrounding whitespace belongs outside the tags.

Rules:
- Preserve the author's voice. Do not rewrite for the sake of rewriting.
- Make the smallest change that improves the passage.
- Keep all unchanged text verbatim, including paragraph breaks and whitespace.
- Do NOT wrap your answer in code fences or commentary. Output ONLY the annotated draft.
- If a comment asks for a new idea to be injected, add it with <ins>...</ins> at the most natural location.
- If a comment asks to preserve a passage, do not touch that passage.
- If a comment is ambiguous, address it conservatively with the smallest change that responds.`;

export interface EditRequest {
  apiKey: string;
  model: ModelId;
  draft: string;
  comments: InlineComment[];
  styleNotes?: string;
  ideas?: Idea[];
}

export async function requestEdits(req: EditRequest): Promise<string> {
  const commentsBlock = req.comments.length
    ? req.comments
        .map((c, i) => {
          const hasContext = c.contextBefore != null || c.contextAfter != null;
          const before = c.contextBefore ?? "";
          const after = c.contextAfter ?? "";
          const ellipsisL = before && req.draft.indexOf(before) > 0 ? "…" : "";
          const ellipsisR = after && req.draft.endsWith(after) ? "" : "…";
          const contextLine = hasContext
            ? `  Exact occurrence (⟦⟧ marks the target — there may be similar phrases elsewhere; address only this one):\n  ${ellipsisL}${before}⟦${c.quoted}⟧${after}${ellipsisR}`
            : `  Quoted passage: """${c.quoted}"""`;
          return `Comment ${i + 1}\n${contextLine}\n  Writer's note: ${c.text}`;
        })
        .join("\n\n")
    : "(no inline comments; give a light copyedit pass only)";

  const styleBlock = req.styleNotes?.trim()
    ? `VOICE / STYLE NOTES FROM THE WRITER:\n${req.styleNotes.trim()}\n\n`
    : "";

  const ideasBlock =
    req.ideas && req.ideas.length > 0
      ? `IDEA BUFFER (context only — do not force these into the draft):\n${req.ideas
          .map((idea, i) => `- [${i + 1}] ${idea.text}`)
          .join("\n")}\n\n`
      : "";

  const userContent = `${styleBlock}${ideasBlock}DRAFT:\n"""\n${req.draft}\n"""\n\nINLINE COMMENTS:\n${commentsBlock}`;

  const body = {
    model: req.model,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": req.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error?.message || JSON.stringify(err);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`Anthropic API ${res.status}: ${detail || res.statusText}`);
  }

  const data = await res.json();
  const text = (data?.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
  if (!text) throw new Error("Empty response from API");
  return text;
}
