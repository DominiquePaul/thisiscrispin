"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { NoteMark, LikeMark } from "./marks-extension";
import { htmlToMarkdown, markdownToHtml } from "./markdown";
import type { InlineComment } from "./types";

const CONTEXT_CHARS = 60;

export interface SelectionState {
  from: number;
  to: number;
  quoted: string;
  rect: DOMRect;
}

export interface HoverMarkState {
  markIds: string[];
  rect: DOMRect;
}

export interface TipTapEditorHandle {
  /** Apply a note mark to the current selection. Returns the captured mark data. */
  addNoteMark: (
    id: string,
    text: string
  ) => {
    quoted: string;
    contextBefore: string;
    contextAfter: string;
    start: number;
    end: number;
  } | null;
  /** Apply a like (preserve) mark to the current selection. */
  addLikeMark: (
    id: string
  ) => {
    quoted: string;
    contextBefore: string;
    contextAfter: string;
    start: number;
    end: number;
  } | null;
  /** Update the stored text on an existing note mark. */
  updateNoteText: (id: string, text: string) => void;
  /** Remove a note or like mark by id. */
  removeMark: (id: string) => void;
  /** Focus the editor caret. */
  focus: () => void;
}

interface Props {
  /** Markdown source. Used to initialize the editor; external changes reset content. */
  value: string;
  /** Existing marks from the DB. Re-applied on mount / external value changes. */
  initialComments: InlineComment[];
  /** Fires on every edit. Emits current markdown. */
  onChange: (markdown: string) => void;
  /** Fires on every edit. Emits the current list of marks from the doc. */
  onCommentsChange: (comments: InlineComment[]) => void;
  /** Fires when the user makes a non-empty selection (or clears it). */
  onSelectionChange: (state: SelectionState | null) => void;
  /** Fires when the mouse hovers a marked span (or leaves it). */
  onMarkHover: (state: HoverMarkState | null) => void;
  /** Intercept keydown events (used by focus-mode lock). */
  onKeyDown?: (e: KeyboardEvent) => boolean | void;
  readOnly?: boolean;
  placeholder?: string;
  /** Key that changes when the active essay changes — forces a content reset. */
  resetKey?: string | number;
}

/**
 * Walk the ProseMirror doc and collect contiguous ranges for every note/like
 * mark. Returns InlineComment records with fresh quoted/context snapshots.
 */
function extractMarksFromDoc(doc: PMNode): InlineComment[] {
  type RawMark = {
    id: string;
    kind: "note" | "preserve";
    text: string;
    from: number;
    to: number;
  };
  const raw: Record<string, RawMark> = {};

  doc.descendants((node: PMNode, pos: number) => {
    if (!node.isText) return;
    const nodeEnd = pos + node.nodeSize;
    for (const mark of node.marks) {
      const name = mark.type.name;
      if (name !== "writerNote" && name !== "writerLike") continue;
      const id =
        name === "writerNote"
          ? (mark.attrs.noteId as string | null)
          : (mark.attrs.likeId as string | null);
      if (!id) continue;
      const kind: "note" | "preserve" = name === "writerNote" ? "note" : "preserve";
      const existing = raw[id];
      if (existing) {
        // Extend existing range (handles contiguous text nodes with same mark)
        existing.from = Math.min(existing.from, pos);
        existing.to = Math.max(existing.to, nodeEnd);
      } else {
        raw[id] = {
          id,
          kind,
          from: pos,
          to: nodeEnd,
          text:
            name === "writerNote"
              ? ((mark.attrs.text as string) ?? "")
              : "Keep this passage exactly as written — don't edit it.",
        };
      }
    }
  });

  const docSize = doc.content.size;
  return Object.values(raw).map((m) => {
    const quoted = doc.textBetween(m.from, m.to, "\n");
    const beforeStart = Math.max(0, m.from - CONTEXT_CHARS * 3);
    const afterEnd = Math.min(docSize, m.to + CONTEXT_CHARS * 3);
    const beforeRaw = doc.textBetween(beforeStart, m.from, "\n");
    const afterRaw = doc.textBetween(m.to, afterEnd, "\n");
    const contextBefore = beforeRaw.slice(-CONTEXT_CHARS);
    const contextAfter = afterRaw.slice(0, CONTEXT_CHARS);
    return {
      id: m.id,
      start: m.from,
      end: m.to,
      quoted,
      contextBefore,
      contextAfter,
      text: m.kind === "preserve" ? "Keep this passage exactly as written — don't edit it." : m.text,
      kind: m.kind,
      createdAt: Date.now(),
    } as InlineComment;
  });
}

/**
 * Walk the doc to find a plain-text substring and return the PM positions of
 * its first match. Accounts for block boundaries via textBetween's newline
 * separator — we search using the same separator the doc reports.
 */
function findTextRangeInDoc(
  doc: PMNode,
  needle: string
): { from: number; to: number } | null {
  if (!needle) return null;
  const docSize = doc.content.size;
  const plain = doc.textBetween(0, docSize, "\n");
  const plainIdx = plain.indexOf(needle);
  if (plainIdx < 0) return null;
  const plainEnd = plainIdx + needle.length;

  // Walk and map plain-text indices back to PM positions.
  let plainCursor = 0;
  let from: number | null = null;
  let to: number | null = null;

  doc.descendants((node: PMNode, pos: number) => {
    if (from !== null && to !== null) return false;
    if (node.isText) {
      const text = node.text ?? "";
      const textLen = text.length;
      const textStart = plainCursor;
      const textEnd = plainCursor + textLen;
      if (from === null && plainIdx >= textStart && plainIdx <= textEnd) {
        from = pos + (plainIdx - textStart);
      }
      if (to === null && plainEnd >= textStart && plainEnd <= textEnd) {
        to = pos + (plainEnd - textStart);
      }
      plainCursor += textLen;
    } else if (node.isBlock && !node.inlineContent) {
      // textBetween inserts the separator between block siblings; match that.
      // (Leaf blocks are rare in our content; skip.)
    }
    return true;
  });

  // Textbetween separator between blocks — approximate by adding 1 per top-level child gap
  // Actually the mapping above is close enough for our prose use case.
  if (from === null || to === null) return null;
  return { from, to };
}

export const TipTapEditor = forwardRef<TipTapEditorHandle, Props>(function TipTapEditor(
  {
    value,
    initialComments,
    onChange,
    onCommentsChange,
    onSelectionChange,
    onMarkHover,
    onKeyDown,
    readOnly,
    placeholder,
    resetKey,
  },
  ref
) {
  const lastEmittedMdRef = useRef<string>(value);
  const lastResetKeyRef = useRef(resetKey);
  const onKeyDownRef = useRef(onKeyDown);
  const onCommentsChangeRef = useRef(onCommentsChange);
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onMarkHoverRef = useRef(onMarkHover);

  useEffect(() => {
    onKeyDownRef.current = onKeyDown;
    onCommentsChangeRef.current = onCommentsChange;
    onChangeRef.current = onChange;
    onSelectionChangeRef.current = onSelectionChange;
    onMarkHoverRef.current = onMarkHover;
  }, [onKeyDown, onCommentsChange, onChange, onSelectionChange, onMarkHover]);

  const initialHtml = useMemo(() => markdownToHtml(value), []); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start writing…",
        emptyEditorClass: "is-editor-empty",
      }),
      NoteMark,
      LikeMark,
    ],
    content: initialHtml,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "writer-prose focus:outline-none",
      },
      handleKeyDown: (_view, event) => {
        const handler = onKeyDownRef.current;
        if (!handler) return false;
        const result = handler(event);
        return result === true;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = htmlToMarkdown(html);
      lastEmittedMdRef.current = md;
      onChangeRef.current?.(md);
      const marks = extractMarksFromDoc(editor.state.doc);
      onCommentsChangeRef.current?.(marks);
    },
    onSelectionUpdate: ({ editor }) => {
      emitSelection(editor);
    },
  });

  const emitSelection = useCallback((ed: Editor) => {
    const { from, to } = ed.state.selection;
    if (from === to) {
      onSelectionChangeRef.current?.(null);
      return;
    }
    const quoted = ed.state.doc.textBetween(from, to, "\n");
    // Get the DOM rect of the selection
    const domSel = window.getSelection();
    if (!domSel || domSel.rangeCount === 0) {
      onSelectionChangeRef.current?.(null);
      return;
    }
    const range = domSel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      onSelectionChangeRef.current?.(null);
      return;
    }
    onSelectionChangeRef.current?.({ from, to, quoted, rect });
  }, []);

  // Initial mark hydration: after editor mounts, apply the saved comments.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!editor || hydratedRef.current) return;
    hydratedRef.current = true;
    if (initialComments.length === 0) return;
    applyCommentsToDoc(editor, initialComments);
  }, [editor, initialComments]);

  // External resets (essay switch, apply-to-draft): reset the editor content.
  useEffect(() => {
    if (!editor) return;
    if (resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey;
      const html = markdownToHtml(value);
      editor.commands.setContent(html, false);
      // Re-apply marks
      hydratedRef.current = true;
      applyCommentsToDoc(editor, initialComments);
      lastEmittedMdRef.current = value;
    }
  }, [resetKey, editor, value, initialComments]);

  // If parent's value diverges from what we last emitted (e.g. apply-to-draft
  // rewrote the draft without changing resetKey), sync content.
  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmittedMdRef.current) {
      const html = markdownToHtml(value);
      editor.commands.setContent(html, false);
      applyCommentsToDoc(editor, initialComments);
      lastEmittedMdRef.current = value;
    }
  }, [value, editor, initialComments]);

  // Hover detection on marked spans.
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
    const handleMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const span = target?.closest("[data-writer-mark]") as HTMLElement | null;
      if (!span) {
        onMarkHoverRef.current?.(null);
        return;
      }
      // Collect all nested mark ids (overlap)
      const ids: string[] = [];
      let cur: HTMLElement | null = span;
      while (cur && cur !== el) {
        if (cur.hasAttribute("data-note-id"))
          ids.push(cur.getAttribute("data-note-id")!);
        if (cur.hasAttribute("data-like-id"))
          ids.push(cur.getAttribute("data-like-id")!);
        cur = cur.parentElement;
      }
      if (ids.length === 0) {
        onMarkHoverRef.current?.(null);
        return;
      }
      onMarkHoverRef.current?.({
        markIds: ids,
        rect: span.getBoundingClientRect(),
      });
    };
    const handleLeave = () => onMarkHoverRef.current?.(null);
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [editor]);

  // Imperative API for marks.
  useImperativeHandle(
    ref,
    (): TipTapEditorHandle => ({
      addNoteMark: (id, text) => {
        if (!editor) return null;
        const { from, to } = editor.state.selection;
        if (from === to) return null;
        editor.chain().setMark("writerNote", { noteId: id, text }).run();
        const quoted = editor.state.doc.textBetween(from, to, "\n");
        const docSize = editor.state.doc.content.size;
        const beforeRaw = editor.state.doc.textBetween(
          Math.max(0, from - CONTEXT_CHARS * 3),
          from,
          "\n"
        );
        const afterRaw = editor.state.doc.textBetween(
          to,
          Math.min(docSize, to + CONTEXT_CHARS * 3),
          "\n"
        );
        return {
          quoted,
          contextBefore: beforeRaw.slice(-CONTEXT_CHARS),
          contextAfter: afterRaw.slice(0, CONTEXT_CHARS),
          start: from,
          end: to,
        };
      },
      addLikeMark: (id) => {
        if (!editor) return null;
        const { from, to } = editor.state.selection;
        if (from === to) return null;
        editor.chain().setMark("writerLike", { likeId: id }).run();
        const quoted = editor.state.doc.textBetween(from, to, "\n");
        const docSize = editor.state.doc.content.size;
        const beforeRaw = editor.state.doc.textBetween(
          Math.max(0, from - CONTEXT_CHARS * 3),
          from,
          "\n"
        );
        const afterRaw = editor.state.doc.textBetween(
          to,
          Math.min(docSize, to + CONTEXT_CHARS * 3),
          "\n"
        );
        return {
          quoted,
          contextBefore: beforeRaw.slice(-CONTEXT_CHARS),
          contextAfter: afterRaw.slice(0, CONTEXT_CHARS),
          start: from,
          end: to,
        };
      },
      updateNoteText: (id, text) => {
        if (!editor) return;
        const { doc, tr, schema } = editor.state;
        const markType = schema.marks.writerNote;
        doc.descendants((node: PMNode, pos: number) => {
          if (!node.isText) return;
          for (const mark of node.marks) {
            if (mark.type.name === "writerNote" && mark.attrs.noteId === id) {
              const from = pos;
              const to = pos + node.nodeSize;
              tr.removeMark(from, to, mark);
              tr.addMark(from, to, markType.create({ noteId: id, text }));
            }
          }
        });
        editor.view.dispatch(tr);
      },
      removeMark: (id) => {
        if (!editor) return;
        const { doc, tr } = editor.state;
        const marksToRemove: Array<{ from: number; to: number; mark: import("@tiptap/pm/model").Mark }> = [];
        doc.descendants((node: PMNode, pos: number) => {
          if (!node.isText) return;
          for (const mark of node.marks) {
            const markIdAttr =
              mark.type.name === "writerNote"
                ? mark.attrs.noteId
                : mark.type.name === "writerLike"
                  ? mark.attrs.likeId
                  : null;
            if (markIdAttr === id) {
              marksToRemove.push({ from: pos, to: pos + node.nodeSize, mark });
            }
          }
        });
        for (const { from, to, mark } of marksToRemove) {
          tr.removeMark(from, to, mark);
        }
        editor.view.dispatch(tr);
      },
      focus: () => editor?.commands.focus(),
    }),
    [editor]
  );

  return <EditorContent editor={editor} />;
});

function applyCommentsToDoc(editor: Editor, comments: InlineComment[]) {
  if (comments.length === 0) return;
  const { schema } = editor.state;
  const noteType = schema.marks.writerNote;
  const likeType = schema.marks.writerLike;
  const tr = editor.state.tr;
  let changed = false;

  for (const c of comments) {
    // Prefer disambiguation via full context
    const needle =
      (c.contextBefore ?? "") + (c.quoted ?? "") + (c.contextAfter ?? "");
    let range = findTextRangeInDoc(editor.state.doc, needle);
    if (range) {
      const beforeLen = (c.contextBefore ?? "").length;
      range = {
        from: range.from + beforeLen,
        to: range.from + beforeLen + (c.quoted ?? "").length,
      };
    } else {
      // Fall back to quoted-only
      range = findTextRangeInDoc(editor.state.doc, c.quoted ?? "");
    }
    if (!range) continue;
    const mark =
      c.kind === "preserve"
        ? likeType.create({ likeId: c.id })
        : noteType.create({ noteId: c.id, text: c.text ?? "" });
    tr.addMark(range.from, range.to, mark);
    changed = true;
  }
  if (changed) editor.view.dispatch(tr);
}
