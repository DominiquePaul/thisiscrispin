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

interface Segment {
  start: number;
  end: number;
  text: string;
  markIds: string[];
  hasNote: boolean;
  hasLike: boolean;
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

  const boundaries = new Set<number>([0, len]);
  for (const m of clamped) {
    boundaries.add(m.start);
    boundaries.add(m.end);
  }
  const sorted = [...boundaries].sort((a, b) => a - b);
  const out: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (end === start) continue;
    const active = clamped.filter((m) => m.start <= start && m.end >= end);
    out.push({
      start,
      end,
      text: text.slice(start, end),
      markIds: active.map((m) => m.id),
      hasNote: active.some((m) => (m.kind ?? "note") === "note"),
      hasLike: active.some((m) => m.kind === "preserve"),
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

  // Sync mirror height to textarea's rendered (resized) height
  useLayoutEffect(() => {
    const ta = innerTextareaRef.current;
    if (!ta) return;
    const ro = new ResizeObserver(() => setHeight(ta.offsetHeight));
    ro.observe(ta);
    setHeight(ta.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Sync scroll position
  useEffect(() => {
    const ta = innerTextareaRef.current;
    const mirror = mirrorRef.current;
    if (!ta || !mirror) return;
    const sync = () => {
      mirror.scrollTop = ta.scrollTop;
      mirror.scrollLeft = ta.scrollLeft;
    };
    ta.addEventListener("scroll", sync);
    return () => ta.removeEventListener("scroll", sync);
  }, []);

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
    const style: React.CSSProperties = backgrounds.length
      ? {
          backgroundImage: backgrounds.join(", "),
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundPosition: positions.join(", "),
          backgroundSize: sizes.join(", "),
        }
      : {};
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
    <div
      ref={wrapperRef}
      className="relative border border-neutral-200 rounded bg-white focus-within:ring-2 focus-within:ring-neutral-300"
    >
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden text-transparent"
        style={{
          ...sharedStyle,
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
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck
        className="relative w-full bg-transparent resize-y focus:outline-none"
        style={{
          ...sharedStyle,
          minHeight: minHeight ?? 480,
          color: "#1a1a18",
          caretColor: "#1a1a18",
        }}
      />
    </div>
  );
});
