import type { Idea, InlineComment, ModelId } from "./types";

const API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are a skilled editor helping a writer improve their draft. You receive:
1. The full draft.
2. Optional inline comments tied to specific quoted passages the writer wants you to address. Each comment shows the EXACT occurrence with ⟦⟧ markers around the target passage in its surrounding context — address only that one occurrence, even if similar phrases appear elsewhere. A comment text of "Keep this passage exactly as written — don't edit it." means the writer has explicitly marked that passage as liked; leave it untouched.
3. Optional voice/style notes from the writer.
4. An optional idea buffer — a spec-sheet of ideas the writer is thinking about. These are CONTEXT, not a checklist. Some may belong in the essay; others are parked, half-formed, or deliberately excluded. Do not inject buffered ideas into the draft unless a comment explicitly asks you to, or unless doing so fills a clear gap the draft is reaching for.
5. Optional answers to clarifying questions you previously asked.

STEP 1 — DECIDE: Do you have enough to act?
- If the writer's comments are vague, conflict with each other, or require a judgment call about intent that you cannot confidently make, ASK 1-3 short clarifying questions.
- Otherwise, proceed directly to editing.

FORMAT A — clarifying questions:
Respond with ONLY:
<questions>
1. Your first question?
2. Your second question?
</questions>
Keep questions short (<= 20 words). No preamble, no closing text. Do NOT ask questions if the request is obvious — prefer to just make the edit.

FORMAT B — the edited draft:
Return the entire edited draft with changes marked inline so the writer can accept or reject each change individually. Use:
- <del>...</del> for text to remove
- <ins>...</ins> for text to add
- A replacement is <del>old</del><ins>new</ins> back-to-back with NO whitespace between </del> and <ins>. Shared surrounding whitespace belongs outside the tags.

Rules for editing:
- Preserve the author's voice. Do not rewrite for the sake of rewriting.
- Make the smallest change that improves the passage.
- Keep all unchanged text verbatim, including paragraph breaks and whitespace.
- Do NOT wrap your answer in code fences or commentary. Output ONLY the annotated draft.
- If a comment asks to preserve a passage, do not touch that passage.
- If a comment is still ambiguous after considering context, address it conservatively with the smallest change that responds.`;

export interface Question {
  id: string;
  text: string;
}

export type EditResult =
  | { kind: "questions"; questions: Question[] }
  | { kind: "edits"; text: string };

export interface EditRequest {
  apiKey: string;
  model: ModelId;
  draft: string;
  comments: InlineComment[];
  styleNotes?: string;
  ideas?: Idea[];
  /** If set, LLM should NOT ask further questions, just produce edits using these answers. */
  answers?: { question: string; answer: string }[];
}

export async function requestEdits(req: EditRequest): Promise<EditResult> {
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

  const answersBlock = req.answers && req.answers.length > 0
    ? `ANSWERS TO YOUR CLARIFYING QUESTIONS — proceed directly to edits (do NOT ask further questions):\n${req.answers
        .map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer || "(writer left blank — use your judgment)"}`)
        .join("\n")}\n\n`
    : "";

  const userContent = `${styleBlock}${ideasBlock}${answersBlock}DRAFT:\n"""\n${req.draft}\n"""\n\nINLINE COMMENTS:\n${commentsBlock}`;

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

  // Detect a <questions> block (only respected when we haven't already answered)
  if (!req.answers || req.answers.length === 0) {
    const qMatch = text.match(/<questions>([\s\S]*?)<\/questions>/i);
    if (qMatch) {
      const rawLines: string[] = qMatch[1].split(/\n/);
      const questions: Question[] = rawLines
        .map((line: string) => line.trim())
        // Strip common list prefixes: "1.", "1)", "Q1:", "- ", "• "
        .map((line: string) => line.replace(/^(?:Q?\d+[.):\-]?\s*|[-•]\s*)/i, "").trim())
        .filter((text: string) => text.length > 0)
        .slice(0, 5)
        .map((text: string, i: number) => ({ id: `q${i}`, text }));
      if (questions.length > 0) return { kind: "questions", questions };
    }
  }

  return { kind: "edits", text };
}
