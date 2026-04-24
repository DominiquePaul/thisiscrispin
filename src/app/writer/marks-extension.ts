/**
 * TipTap mark extensions for inline notes and likes.
 *
 * Both are inline marks (not nodes) so they can layer over bold/italic text
 * and overlap each other. Each mark carries a stable id so the popover UI
 * can correlate the DOM hover with the comment object in React state.
 */

import { Mark, mergeAttributes } from "@tiptap/core";

export interface NoteMarkAttrs {
  noteId: string | null;
  text: string;
}

export const NoteMark = Mark.create<{
  HTMLAttributes: Record<string, unknown>;
}>({
  name: "writerNote",
  inclusive: false,
  spanning: true,
  excludes: "",

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-note-id"),
        renderHTML: (attrs) =>
          attrs.noteId ? { "data-note-id": attrs.noteId } : {},
      },
      text: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-note-text") ?? "",
        renderHTML: (attrs) =>
          attrs.text ? { "data-note-text": attrs.text } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-note-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { class: "writer-note", "data-writer-mark": "note" },
        HTMLAttributes
      ),
      0,
    ];
  },
});

export interface LikeMarkAttrs {
  likeId: string | null;
}

export const LikeMark = Mark.create<{
  HTMLAttributes: Record<string, unknown>;
}>({
  name: "writerLike",
  inclusive: false,
  spanning: true,
  excludes: "",

  addAttributes() {
    return {
      likeId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-like-id"),
        renderHTML: (attrs) =>
          attrs.likeId ? { "data-like-id": attrs.likeId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-like-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { class: "writer-like", "data-writer-mark": "like" },
        HTMLAttributes
      ),
      0,
    ];
  },
});
