"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { InlineComment } from "./types";
import { markdownToHtml, htmlToMarkdown } from "./markdown";

export interface HoverState {
  markIds: string[];
  rect: DOMRect;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSelect?: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  readOnly?: boolean;
  placeholder?: string;
  marks: InlineComment[];
  onHoverChange?: (state: HoverState | null) => void;
  minHeight?: number;
}

function wrapSelection(
  ta: HTMLTextAreaElement,
  value: string,
  leftMarker: string,
  rightMarker: string,
  onChange: (v: string) => void
) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  if (start === end) {
    // Insert markers with cursor between
    const next = value.slice(0, start) + leftMarker + rightMarker + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.selectionStart = start + leftMarker.length;
      ta.selectionEnd = start + leftMarker.length;
    });
  } else {
    const selected = value.slice(start, end);
    // Toggle: if already wrapped, unwrap
    if (
      value.slice(start - leftMarker.length, start) === leftMarker &&
      value.slice(end, end + rightMarker.length) === rightMarker
    ) {
      const next =
        value.slice(0, start - leftMarker.length) +
        selected +
        value.slice(end + rightMarker.length);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = start - leftMarker.length;
        ta.selectionEnd = end - leftMarker.length;
      });
      return;
    }
    const next = value.slice(0, start) + leftMarker + selected + rightMarker + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.selectionStart = start + leftMarker.length;
      ta.selectionEnd = end + leftMarker.length;
    });
  }
}

type MdKind =
  | "heading-hash"
  | "heading-content"
  | "bold-syntax"
  | "bold-content"
  | "italic-syntax"
  | "italic-content";

interface MdSpan {
  start: number;
  end: number;
  kind: MdKind;
}

/**
 * Find line-start headings (`# `, `## `, etc.), inline `**bold**` and
 * inline `*italic*` runs. Returns spans tagged by kind so the renderer can
 * style each character range appropriately — e.g. fade the `**` markers,
 * apply -webkit-text-stroke to the content between them.
 */
function findMdSpans(text: string): MdSpan[] {
  const spans: MdSpan[] = [];

  // Headings: line starts with 1-6 # followed by space
  const lines = text.split("\n");
  let pos = 0;
  for (const line of lines) {
    const m = line.match(/^(#{1,6}) /);
    if (m) {
      const prefixLen = m[0].length; // # + space
      spans.push({ start: pos, end: pos + prefixLen, kind: "heading-hash" });
      if (line.length > prefixLen) {
        spans.push({ start: pos + prefixLen, end: pos + line.length, kind: "heading-content" });
      }
    }
    pos += line.length + 1;
  }

  // Bold: **non-empty, no newline**
  const boldRegex = /\*\*([^*\n]+?)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = boldRegex.exec(text)) !== null) {
    const openStart = m.index;
    const contentStart = openStart + 2;
    const contentEnd = contentStart + m[1].length;
    const closeEnd = contentEnd + 2;
    spans.push({ start: openStart, end: contentStart, kind: "bold-syntax" });
    spans.push({ start: contentStart, end: contentEnd, kind: "bold-content" });
    spans.push({ start: contentEnd, end: closeEnd, kind: "bold-syntax" });
  }

  // Italic: *text* — must not be adjacent to another * (i.e. not part of **)
  const italicRegex = /(^|[^*])\*([^*\n]+?)\*(?!\*)/g;
  while ((m = italicRegex.exec(text)) !== null) {
    const offset = m[1].length;
    const openStart = m.index + offset;
    const contentStart = openStart + 1;
    const contentEnd = contentStart + m[2].length;
    const closeEnd = contentEnd + 1;
    spans.push({ start: openStart, end: contentStart, kind: "italic-syntax" });
    spans.push({ start: contentStart, end: contentEnd, kind: "italic-content" });
    spans.push({ start: contentEnd, end: closeEnd, kind: "italic-syntax" });
  }

  return spans;
}

interface Segment {
  start: number;
  end: number;
  text: string;
  markIds: string[];
  hasNote: boolean;
  hasLike: boolean;
  mdKinds: Set<MdKind>;
}

function computeSegments(text: string, marks: InlineComment[]): Segment[] {
  const len = text.length;
  const clamped = marks
    .map((m) => ({
      ...m,
      start: Math.max(0, Math.min(len, m.start)),
      end: Math.max(0, Math.min(len, m.end)),
    }))
    .filter((m) => m.end > m.start);

  const mdSpans = findMdSpans(text);

  const boundaries = new Set<number>([0, len]);
  for (const m of clamped) {
    boundaries.add(m.start);
    boundaries.add(m.end);
  }
  for (const s of mdSpans) {
    boundaries.add(s.start);
    boundaries.add(s.end);
  }
  const sorted = [...boundaries].sort((a, b) => a - b);

  const out: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (end === start) continue;
    const active = clamped.filter((m) => m.start <= start && m.end >= end);
    const mdKinds = new Set<MdKind>();
    for (const s of mdSpans) {
      if (s.start <= start && s.end >= end) mdKinds.add(s.kind);
    }
    out.push({
      start,
      end,
      text: text.slice(start, end),
      markIds: active.map((m) => m.id),
      hasNote: active.some((m) => (m.kind ?? "note") === "note"),
      hasLike: active.some((m) => m.kind === "preserve"),
      mdKinds,
    });
  }
  return out;
}

export const MarkedEditor = forwardRef<HTMLTextAreaElement, Props>(function MarkedEditor(
  {
    value,
    onChange,
    onKeyDown,
    onMouseUp,
    onKeyUp,
    onSelect,
    readOnly,
    placeholder,
    marks,
    onHoverChange,
    minHeight,
  },
  ref
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const innerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  // Forward ref
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(innerTextareaRef.current);
    } else {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
        innerTextareaRef.current;
    }
  }, [ref]);

  // Auto-grow the textarea to fit its content so the whole document is
  // visible; the page itself scrolls, not an internal textarea scroll.
  const recomputeHeight = useCallback(() => {
    const ta = innerTextareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const next = Math.max(minHeight ?? 480, ta.scrollHeight);
    ta.style.height = next + "px";
    setHeight(next);
  }, [minHeight]);

  useLayoutEffect(() => {
    recomputeHeight();
  }, [value, recomputeHeight]);

  // Width changes (window resize, sidebar toggle) change wrap points, which
  // changes scrollHeight. Recompute when the wrapper resizes.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => recomputeHeight());
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [recomputeHeight]);

  const segments = useMemo(() => computeSegments(value, marks), [value, marks]);

  // Hover detection using elementsFromPoint (textarea is on top, pointer-events: none
  // on the mirror, so we manually fish for mirror spans under the cursor).
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (!onHoverChange) return;
      const elems = document.elementsFromPoint(e.clientX, e.clientY);
      const markEl = elems.find(
        (el) => (el as HTMLElement).dataset?.markIds
      ) as HTMLElement | undefined;
      if (markEl) {
        const ids = markEl.dataset.markIds!.split(" ").filter(Boolean);
        if (ids.length) {
          onHoverChange({ markIds: ids, rect: markEl.getBoundingClientRect() });
          return;
        }
      }
      onHoverChange(null);
    },
    [onHoverChange]
  );

  const handleMouseLeave = useCallback(() => {
    onHoverChange?.(null);
  }, [onHoverChange]);

  const renderedSegments = segments.map((seg, i) => {
    const style: React.CSSProperties = {};

    // Mark underlines (stacked per-line backgrounds so they wrap correctly)
    const backgrounds: string[] = [];
    const positions: string[] = [];
    const sizes: string[] = [];
    if (seg.hasNote) {
      backgrounds.push("linear-gradient(#f97316, #f97316)");
      positions.push("0 100%");
      sizes.push("100% 2px");
    }
    if (seg.hasLike) {
      backgrounds.push("linear-gradient(#10b981, #10b981)");
      positions.push(seg.hasNote ? "0 calc(100% - 3px)" : "0 100%");
      sizes.push("100% 2px");
    }
    if (backgrounds.length) {
      style.backgroundImage = backgrounds.join(", ");
      style.backgroundRepeat = "no-repeat, no-repeat";
      style.backgroundPosition = positions.join(", ");
      style.backgroundSize = sizes.join(", ");
    }

    // Markdown styling — all applied to the mirror only. We use
    // -webkit-text-stroke to simulate bold weight without changing
    // character advance widths, so the invisible textarea below still
    // wraps at the same points and the caret stays aligned.
    const isSyntax =
      seg.mdKinds.has("heading-hash") ||
      seg.mdKinds.has("bold-syntax") ||
      seg.mdKinds.has("italic-syntax");
    const isBold = seg.mdKinds.has("bold-content");
    const isHeading =
      seg.mdKinds.has("heading-content") || seg.mdKinds.has("heading-hash");
    const isItalic = seg.mdKinds.has("italic-content");

    if (isBold || (isHeading && !seg.mdKinds.has("heading-hash"))) {
      style.WebkitTextStrokeWidth = "0.5px";
      style.WebkitTextStrokeColor = "currentColor";
    }
    if (isItalic) {
      style.fontStyle = "italic";
    }
    if (isSyntax) {
      // Fade the ** / * / # markers so they recede but stay visible for editing.
      style.color = "#c9c5bc";
    }
    if (isHeading && !isSyntax) {
      // Slightly darker for visual weight on headings.
      style.color = "#0f0f0e";
    }

    const hasMark = seg.markIds.length > 0;
    return (
      <span
        key={i}
        style={style}
        data-mark-ids={hasMark ? seg.markIds.join(" ") : undefined}
      >
        {seg.text}
      </span>
    );
  });

  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const ta = innerTextareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      if (start === end) return; // nothing selected — let the browser do its thing
      const selected = ta.value.slice(start, end);
      e.preventDefault();
      e.clipboardData.setData("text/plain", selected);
      e.clipboardData.setData("text/html", markdownToHtml(selected));
    },
    []
  );

  const handleCut = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const ta = innerTextareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      if (start === end) return;
      const selected = ta.value.slice(start, end);
      e.preventDefault();
      e.clipboardData.setData("text/plain", selected);
      e.clipboardData.setData("text/html", markdownToHtml(selected));
      const next = ta.value.slice(0, start) + ta.value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = start;
        ta.selectionEnd = start;
      });
    },
    [onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const html = e.clipboardData.getData("text/html");
      if (!html) return; // plain text paste — native behaviour is fine
      e.preventDefault();
      const ta = innerTextareaRef.current;
      if (!ta) return;
      const md = htmlToMarkdown(html);
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = ta.value.slice(0, start) + md + ta.value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        const pos = start + md.length;
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
      });
    },
    [onChange]
  );

  const handleKeyDownInternal = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Forward to parent first — focus-mode lock may block things
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const ta = innerTextareaRef.current;
      if (!ta) return;
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        wrapSelection(ta, value, "**", "**", onChange);
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        wrapSelection(ta, value, "*", "*", onChange);
      }
    },
    [onKeyDown, value, onChange]
  );

  // Shared styles (must match between mirror and textarea exactly)
  const sharedStyle: React.CSSProperties = {
    fontFamily:
      "'Source Serif 4', 'Source Serif Pro', Charter, 'Iowan Old Style', 'Palatino Linotype', Georgia, Cambria, serif",
    letterSpacing: "0",
    tabSize: 4,
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    padding: "16px 18px",
    lineHeight: 1.75,
    fontSize: 17,
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          ...sharedStyle,
          color: "#1a1a18",
          height: height ?? undefined,
        }}
      >
        {renderedSegments}
        {/* trailing pad so last-line wraps match textarea */}
        {"\u200B"}
      </div>
      <textarea
        ref={innerTextareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDownInternal}
        onMouseUp={onMouseUp}
        onKeyUp={onKeyUp}
        onSelect={onSelect}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck
        rows={1}
        className="relative w-full bg-transparent focus:outline-none resize-none overflow-hidden placeholder:text-neutral-400"
        style={{
          ...sharedStyle,
          minHeight: minHeight ?? 480,
          color: "transparent",
          caretColor: "#1a1a18",
          WebkitTextFillColor: "transparent",
        }}
      />
    </div>
  );
});
