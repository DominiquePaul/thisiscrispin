"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Clock,
  LogOut,
  Play,
  Sparkles,
  Square,
  Trash2,
  X,
  Check,
  Loader2,
  FileText,
  Undo2,
  Plus,
  Lightbulb,
  PanelLeftOpen,
  KeyRound,
  ThumbsUp,
  MessageSquareText,
  Settings as SettingsIcon,
  FastForward,
  Pencil,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthGate } from "./AuthGate";
import { TokenGate } from "./TokenGate";
import { DiffView } from "./DiffView";
import { EssaySidebar } from "./EssaySidebar";
import { MarkedEditor, type HoverState } from "./MarkedEditor";
import { parseEditResponse, applyDecisions, pendingCount, changeCount } from "./diff";
import { requestEdits, type Question } from "./api";
import {
  listEssays,
  createEssay,
  updateEssay,
  deleteEssay,
  loadUserSettings,
  upsertUserSettings,
  type Essay,
  type UserSettings,
} from "./db";
import type { DiffSegment, Idea, InlineComment, Mode, ModelId } from "./types";

const DEFAULT_MODEL: ModelId = "claude-opus-4-7";
const CONTEXT_CHARS = 60;
const SAMPLE_DRAFT = `Write your first draft here. Don't stop to edit — just get the ideas down.

When you're ready, select a passage and choose "Like this" (green underline — Claude will preserve it) or "Add note" (orange underline — write what you want changed). Then hit "Next draft" and Claude will revise.

Markdown shortcuts: **bold**, *italic*, # heading. Cmd/Ctrl+B and Cmd/Ctrl+I wrap your selection.`;

type FocusState =
  | { active: false }
  | { active: true; startedAt: number; durationMs: number; lockedLength: number; remaining: number };

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: User };

/**
 * When the draft text changes, shift mark start/end so underlines follow the
 * same characters after insertion/deletion.
 */
function shiftComments(
  oldDraft: string,
  newDraft: string,
  comments: InlineComment[]
): InlineComment[] {
  if (oldDraft === newDraft) return comments;
  let lo = 0;
  const oldLen = oldDraft.length;
  const newLen = newDraft.length;
  const maxLo = Math.min(oldLen, newLen);
  while (lo < maxLo && oldDraft[lo] === newDraft[lo]) lo++;
  let oldHi = oldLen;
  let newHi = newLen;
  while (
    oldHi > lo &&
    newHi > lo &&
    oldDraft[oldHi - 1] === newDraft[newHi - 1]
  ) {
    oldHi--;
    newHi--;
  }
  const delta = newHi - oldHi; // +N inserted or -N removed
  return comments
    .map((c) => {
      if (c.end <= lo) return c; // fully before edit
      if (c.start >= oldHi) return { ...c, start: c.start + delta, end: c.end + delta }; // fully after
      // Overlaps the edit: shift the end only; if mark collapsed to zero length, drop it later
      const newEnd = Math.max(c.start, c.end + delta);
      return { ...c, end: newEnd };
    })
    .filter((c) => c.end > c.start);
}

export default function WriterPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [essays, setEssays] = useState<Essay[]>([]);
  const [activeEssayId, setActiveEssayId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [title, setTitle] = useState("Untitled");
  const [draft, setDraft] = useState(SAMPLE_DRAFT);
  const [comments, setComments] = useState<InlineComment[]>([]);
  const [styleNotes, setStyleNotes] = useState("");
  const [styleOpen, setStyleOpen] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideasOpen, setIdeasOpen] = useState(false);

  const [mode, setMode] = useState<Mode>("write");
  const [segments, setSegments] = useState<DiffSegment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [focus, setFocus] = useState<FocusState>({ active: false });
  const [focusMinutes, setFocusMinutes] = useState(10);

  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [popover, setPopover] = useState<{ x: number; y: number } | null>(null);
  const [noteEditor, setNoteEditor] = useState<{
    markId: string;
    x: number;
    y: number;
  } | null>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);

  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadingEssayRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isZen = focus.active;

  // ── Auth subscription ─────────────────────────────────────────────
  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    (async () => {
      const { data } = await sb.auth.getSession();
      if (data.session?.user) {
        setAuth({ status: "authenticated", user: data.session.user });
      } else {
        setAuth({ status: "unauthenticated" });
      }
    })();
    const { data: sub } = sb.auth.onAuthStateChange((_evt: string, session: { user?: User } | null) => {
      if (session?.user) {
        setAuth({ status: "authenticated", user: session.user });
      } else {
        setAuth({ status: "unauthenticated" });
        setSettings(null);
        setSettingsLoaded(false);
        setEssays([]);
        setActiveEssayId(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Load settings + essays on auth ────────────────────────────────
  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const [s, es] = await Promise.all([
          loadUserSettings(auth.user.id),
          listEssays(auth.user.id),
        ]);
        if (cancelled) return;
        setSettings(s);
        setSettingsLoaded(true);
        setEssays(es);
        if (s?.default_model) setModel(s.default_model);
        if (es.length > 0) {
          setActiveEssayId(es[0].id);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  // ── Load active essay into editor state ───────────────────────────
  useEffect(() => {
    if (!activeEssayId) return;
    const essay = essays.find((e) => e.id === activeEssayId);
    if (!essay) return;
    loadingEssayRef.current = true;
    setTitle(essay.title);
    setDraft(essay.draft);
    setComments(essay.comments ?? []);
    setIdeas(essay.ideas ?? []);
    setStyleNotes(essay.style_notes ?? "");
    setModel((essay.model as ModelId) ?? settings?.default_model ?? DEFAULT_MODEL);
    setSegments(null);
    setMode("write");
    setFocus({ active: false });
    setError(null);
    setSelection(null);
    setPopover(null);
    setNoteEditor(null);
    setHovered(null);
    setQuestions(null);
    setAnswers({});
    setTimeout(() => {
      loadingEssayRef.current = false;
    }, 0);
  }, [activeEssayId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Autosave on edits ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeEssayId || loadingEssayRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateEssay(activeEssayId, {
          title,
          draft,
          style_notes: styleNotes,
          comments,
          ideas,
          model,
        });
        setEssays((prev) =>
          prev
            .map((e) =>
              e.id === activeEssayId
                ? {
                    ...e,
                    title,
                    draft,
                    style_notes: styleNotes,
                    comments,
                    ideas,
                    model,
                    updated_at: new Date().toISOString(),
                  }
                : e
            )
            .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, draft, comments, ideas, styleNotes, model, activeEssayId]);

  // ── Focus timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (!focus.active) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, focus.startedAt + focus.durationMs - Date.now());
      if (remaining <= 0) {
        setFocus({ active: false });
      } else {
        setFocus({ ...focus, remaining });
      }
    }, 250);
    return () => clearInterval(id);
  }, [focus]);

  const wordCount = useMemo(() => draft.trim().split(/\s+/).filter(Boolean).length, [draft]);
  const readingTime = useMemo(() => {
    if (wordCount < 50) return "< 1 min read";
    const mins = Math.max(1, Math.round(wordCount / 225));
    return `${mins} min read`;
  }, [wordCount]);

  const focusProgress = useMemo(() => {
    if (!focus.active) return null;
    const pct = 1 - focus.remaining / focus.durationMs;
    return { pct, mmss: formatMs(focus.remaining) };
  }, [focus]);

  const captureContext = useCallback(
    (start: number, end: number) => ({
      contextBefore: draft.slice(Math.max(0, start - CONTEXT_CHARS), start),
      contextAfter: draft.slice(end, Math.min(draft.length, end + CONTEXT_CHARS)),
    }),
    [draft]
  );

  const updateSelectionAndPopover = useCallback(
    (mouseX?: number, mouseY?: number) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (start === end) {
        setSelection(null);
        setPopover(null);
        return;
      }
      setSelection({ start, end });
      if (mouseX != null && mouseY != null) {
        setPopover({ x: mouseX, y: mouseY });
      } else {
        const rect = el.getBoundingClientRect();
        setPopover({ x: rect.left + rect.width / 2, y: rect.top + 40 });
      }
    },
    []
  );

  const onTextareaMouseUp = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      updateSelectionAndPopover(e.clientX, e.clientY);
    },
    [updateSelectionAndPopover]
  );

  const onTextareaKeyUp = useCallback(() => {
    updateSelectionAndPopover();
  }, [updateSelectionAndPopover]);

  const onTextareaSelect = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.selectionStart === el.selectionEnd) {
      setSelection(null);
      setPopover(null);
    }
  }, []);

  useEffect(() => {
    if (!popover) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t?.closest("[data-popover='selection']")) return;
      if (t?.closest("textarea")) return;
      setPopover(null);
      setSelection(null);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopover(null);
        setSelection(null);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [popover]);

  const quickLike = () => {
    if (!selection) return;
    const quoted = draft.slice(selection.start, selection.end);
    const ctx = captureContext(selection.start, selection.end);
    setComments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        start: selection.start,
        end: selection.end,
        quoted,
        contextBefore: ctx.contextBefore,
        contextAfter: ctx.contextAfter,
        text: "Keep this passage exactly as written — don't edit it.",
        kind: "preserve",
        createdAt: Date.now(),
      },
    ]);
    setSelection(null);
    setPopover(null);
  };

  const startAddNote = () => {
    if (!selection || !popover) return;
    const quoted = draft.slice(selection.start, selection.end);
    const ctx = captureContext(selection.start, selection.end);
    const id = crypto.randomUUID();
    setComments((prev) => [
      ...prev,
      {
        id,
        start: selection.start,
        end: selection.end,
        quoted,
        contextBefore: ctx.contextBefore,
        contextAfter: ctx.contextAfter,
        text: "",
        kind: "note",
        createdAt: Date.now(),
      },
    ]);
    setNoteEditor({ markId: id, x: popover.x, y: popover.y });
    setSelection(null);
    setPopover(null);
  };

  const updateNoteText = (id: string, text: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));
  };

  const closeNoteEditor = () => {
    if (!noteEditor) return;
    const mark = comments.find((c) => c.id === noteEditor.markId);
    if (mark && !mark.text.trim()) {
      setComments((prev) => prev.filter((c) => c.id !== noteEditor.markId));
    }
    setNoteEditor(null);
  };

  const openNoteEditorForMark = (markId: string, rect: DOMRect) => {
    setNoteEditor({ markId, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    setHovered(null);
  };

  const removeMark = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    if (noteEditor?.markId === id) setNoteEditor(null);
    setHovered(null);
  };

  const addIdea = () => {
    setIdeas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", createdAt: Date.now() },
    ]);
    setIdeasOpen(true);
  };

  const updateIdea = (id: string, text: string) => {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));
  };

  const removeIdea = (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  const runEditRequest = useCallback(
    async (answersPayload?: { question: string; answer: string }[]) => {
      if (!settings?.anthropic_key) {
        setShowApiKeyPrompt(true);
        return;
      }
      setLoading(true);
      setError(null);
      setQuestions(null);
      try {
        const result = await requestEdits({
          apiKey: settings.anthropic_key,
          model,
          draft,
          comments,
          styleNotes,
          ideas,
          answers: answersPayload,
        });
        if (result.kind === "questions") {
          setQuestions(result.questions);
          const base: Record<string, string> = {};
          for (const q of result.questions) base[q.id] = "";
          setAnswers(base);
          setLoading(false);
          return;
        }
        const parsed = parseEditResponse(result.text);
        if (changeCount(parsed) === 0) {
          setError("Claude returned no changes. Try sharpening your notes or asking for specific revisions.");
          setLoading(false);
          return;
        }
        setSegments(parsed);
        setMode("review");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [settings?.anthropic_key, model, draft, comments, styleNotes, ideas]
  );

  const handleNextDraft = () => {
    runEditRequest();
  };

  const handleSubmitAnswers = () => {
    if (!questions) return;
    const payload = questions.map((q) => ({
      question: q.text,
      answer: (answers[q.id] ?? "").trim(),
    }));
    runEditRequest(payload);
  };

  const handleCancelQuestions = () => {
    setQuestions(null);
    setAnswers({});
  };

  const decideSegment = (id: string, decision: "accepted" | "rejected") => {
    setSegments((prev) => {
      if (!prev) return prev;
      return prev.map((s) => (s.kind !== "keep" && s.id === id ? { ...s, status: decision } as DiffSegment : s));
    });
  };

  const acceptAll = () => {
    setSegments((prev) => prev?.map((s) => (s.kind !== "keep" ? { ...s, status: "accepted" } as DiffSegment : s)) ?? null);
  };

  const rejectAll = () => {
    setSegments((prev) => prev?.map((s) => (s.kind !== "keep" ? { ...s, status: "rejected" } as DiffSegment : s)) ?? null);
  };

  const applyChanges = () => {
    if (!segments) return;
    const finalSegments: DiffSegment[] = segments.map((s) => {
      if (s.kind === "keep" || s.status !== "pending") return s;
      return { ...s, status: "rejected" } as DiffSegment;
    });
    const newDraft = applyDecisions(finalSegments);
    setDraft(newDraft);
    setComments([]);
    setSegments(null);
    setMode("write");
  };

  const discardReview = () => {
    setSegments(null);
    setMode("write");
  };

  const startFocus = () => {
    const durationMs = Math.max(1, focusMinutes) * 60 * 1000;
    setFocus({
      active: true,
      startedAt: Date.now(),
      durationMs,
      lockedLength: draft.length,
      remaining: durationMs,
    });
    setMode("focus");
    setSelection(null);
    setPopover(null);
    setNoteEditor(null);
    setHovered(null);
    setTimeout(() => {
      textareaRef.current?.focus();
      const el = textareaRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    }, 50);
  };

  const exitFocus = () => {
    setFocus({ active: false });
    setMode("write");
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!focus.active) return;
    const el = e.currentTarget;
    const blocked = e.key === "Backspace" || e.key === "Delete";
    const hasSelection = el.selectionStart !== el.selectionEnd;
    const insideLocked = el.selectionStart < focus.lockedLength;

    if (blocked) {
      e.preventDefault();
      return;
    }
    if (hasSelection) {
      e.preventDefault();
      el.setSelectionRange(el.selectionEnd, el.selectionEnd);
      return;
    }
    if (insideLocked && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  };

  const handleDraftChange = (next: string) => {
    if (focus.active) {
      if (next.length < focus.lockedLength) return;
      if (next.slice(0, focus.lockedLength) !== draft.slice(0, focus.lockedLength)) return;
    }
    const shifted = shiftComments(draft, next, comments);
    setDraft(next);
    if (shifted !== comments) setComments(shifted);
  };

  // ── Essay management ──────────────────────────────────────────────
  const handleCreateEssay = async () => {
    if (auth.status !== "authenticated") return;
    try {
      const essay = await createEssay(auth.user.id, "Untitled");
      setEssays((prev) => [essay, ...prev]);
      setActiveEssayId(essay.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDeleteEssay = async (id: string) => {
    try {
      await deleteEssay(id);
      setEssays((prev) => {
        const next = prev.filter((e) => e.id !== id);
        if (activeEssayId === id) {
          setActiveEssayId(next[0]?.id ?? null);
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSelectEssay = (id: string) => {
    if (id === activeEssayId) return;
    setActiveEssayId(id);
  };

  const handleSaveApiKey = async (key: string) => {
    if (auth.status !== "authenticated") return;
    await upsertUserSettings(auth.user.id, { anthropic_key: key, default_model: model });
    setSettings((prev) => {
      const base: UserSettings = prev ?? {
        user_id: auth.user.id,
        anthropic_key: null,
        default_model: model,
        updated_at: new Date().toISOString(),
      };
      return { ...base, anthropic_key: key, updated_at: new Date().toISOString() };
    });
    setShowApiKeyPrompt(false);
  };

  const handleSignOut = async () => {
    const sb = getSupabaseBrowserClient();
    await sb.auth.signOut();
  };

  // ── Early returns for auth flow ───────────────────────────────────
  if (auth.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F2]">
        <Loader2 size={20} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return <AuthGate />;
  }

  if (!settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F2]">
        <Loader2 size={20} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!settings?.anthropic_key) {
    return <TokenGate onSubmit={handleSaveApiKey} />;
  }

  if (showApiKeyPrompt) {
    return (
      <TokenGate
        onSubmit={handleSaveApiKey}
        onCancel={() => setShowApiKeyPrompt(false)}
      />
    );
  }

  const canEdit = mode !== "review" && !loading;
  const hasActiveEssay = activeEssayId !== null;

  return (
    <div
      className={
        "min-h-screen text-neutral-900 transition-colors duration-500 " +
        (isZen ? "bg-[#0f0f0f]" : "bg-[#F2F2F2]")
      }
    >
      {!isZen && (
        <TopBar
          model={model}
          onModelChange={async (m) => {
            setModel(m);
            if (auth.user) {
              try {
                await upsertUserSettings(auth.user.id, { default_model: m });
                setSettings((prev) =>
                  prev ? { ...prev, default_model: m } : prev
                );
              } catch {
                /* non-fatal */
              }
            }
          }}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          saving={saving}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          email={auth.user.email ?? ""}
          keyMasked={maskKey(settings.anthropic_key)}
          onChangeApiKey={() => {
            setSettingsOpen(false);
            setShowApiKeyPrompt(true);
          }}
          onSignOut={async () => {
            setSettingsOpen(false);
            await handleSignOut();
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {questions && (
        <QuestionsPanel
          questions={questions}
          answers={answers}
          onAnswer={(id, v) => setAnswers((prev) => ({ ...prev, [id]: v }))}
          onSubmit={handleSubmitAnswers}
          onCancel={handleCancelQuestions}
          submitting={loading}
        />
      )}

      {isZen && focusProgress && (
        <ZenHeader
          mmss={focusProgress.mmss}
          pct={focusProgress.pct}
          wordCount={wordCount}
          onExit={exitFocus}
        />
      )}

      <div className="flex">
        {!isZen && sidebarOpen && (
          <EssaySidebar
            essays={essays}
            activeEssayId={activeEssayId}
            onSelect={handleSelectEssay}
            onCreate={handleCreateEssay}
            onDelete={handleDeleteEssay}
            onCollapse={() => setSidebarOpen(false)}
            saving={saving}
          />
        )}

        <div className="flex-1 min-w-0">
          {error && (
            <div className="max-w-6xl mx-auto mt-4 px-6">
              <div className="bg-rose-50 border border-rose-200 text-rose-900 text-sm rounded px-4 py-2 flex items-start gap-2">
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-rose-700">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {!hasActiveEssay ? (
            <EmptyState onCreate={handleCreateEssay} />
          ) : (
            <div
              className={
                isZen
                  ? "max-w-3xl mx-auto px-6 py-10"
                  : "max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
              }
            >
              <div
                className={
                  "bg-white rounded-lg transition-shadow " +
                  (isZen
                    ? "border border-neutral-800 shadow-[0_0_80px_rgba(0,0,0,0.5)]"
                    : "border border-neutral-200")
                }
              >
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-200">
                  <FileText size={14} className="text-neutral-500 shrink-0" />
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled"
                    className="h-7 border-0 shadow-none focus-visible:ring-0 px-0 text-sm font-medium text-neutral-800 bg-transparent"
                  />
                  <div className="ml-auto text-xs text-neutral-400">
                    {mode === "review" ? "Review edits" : mode === "focus" ? "Focus draft" : "Draft"}
                    {" · "}
                    {wordCount} words
                    {" · "}
                    {readingTime}
                  </div>
                </div>

                {mode === "review" && segments ? (
                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <div className="text-sm text-neutral-600">
                        {changeCount(segments)} changes · {pendingCount(segments)} undecided
                      </div>
                      <div className="ml-auto flex gap-2">
                        <Button size="sm" variant="outline" onClick={rejectAll}>
                          Reject all
                        </Button>
                        <Button size="sm" variant="outline" onClick={acceptAll}>
                          Accept all
                        </Button>
                        <Button size="sm" variant="ghost" onClick={discardReview}>
                          <Undo2 size={14} className="mr-1" />
                          Discard
                        </Button>
                        <Button size="sm" onClick={applyChanges}>
                          <Check size={14} className="mr-1" />
                          Apply to draft
                        </Button>
                      </div>
                    </div>
                    <DiffView segments={segments} onDecide={decideSegment} />
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {!isZen &&
                        (mode !== "focus" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={startFocus}
                            disabled={loading}
                          >
                            <Play size={14} className="mr-1.5" />
                            Focus mode
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={exitFocus}>
                            <Square size={14} className="mr-1.5" />
                            Exit focus
                          </Button>
                        ))}
                      {mode !== "focus" && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                          <Clock size={14} />
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={focusMinutes}
                            onChange={(e) => setFocusMinutes(Math.max(1, parseInt(e.target.value || "1", 10)))}
                            className="w-16 h-7 px-2 border border-neutral-300 rounded text-sm"
                          />
                          <span>min</span>
                        </div>
                      )}
                      <div className="ml-auto">
                        <Button
                          size="sm"
                          onClick={handleNextDraft}
                          disabled={loading || mode === "focus" || !draft.trim()}
                        >
                          {loading ? (
                            <Loader2 size={14} className="mr-1.5 animate-spin" />
                          ) : (
                            <FastForward size={14} className="mr-1.5 fill-current" />
                          )}
                          {loading ? "Thinking…" : "Next draft"}
                        </Button>
                      </div>
                    </div>

                    <MarkedEditor
                      ref={textareaRef}
                      value={draft}
                      onChange={handleDraftChange}
                      onKeyDown={handleEditorKeyDown}
                      onSelect={onTextareaSelect}
                      onMouseUp={onTextareaMouseUp}
                      onKeyUp={onTextareaKeyUp}
                      onHoverChange={setHovered}
                      readOnly={!canEdit}
                      placeholder="Start writing…"
                      marks={comments}
                      minHeight={isZen ? 600 : 480}
                    />

                    <div className="mt-3 flex items-center gap-4 text-[11px] text-neutral-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-4 h-0.5 bg-[#f97316] rounded" />
                        note
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-4 h-0.5 bg-[#10b981] rounded" />
                        liked
                      </span>
                      <span className="italic ml-auto">
                        hover marks to edit or remove · Cmd/Ctrl+B for bold · Cmd/Ctrl+I for italic
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!isZen && (
                <div className="space-y-4">
                  <div className="bg-white border border-neutral-200 rounded-lg">
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-neutral-200 text-xs uppercase tracking-widest text-neutral-500"
                      onClick={() => setStyleOpen((o) => !o)}
                    >
                      Voice / style notes
                      <span className="ml-auto text-neutral-400">{styleOpen ? "–" : "+"}</span>
                    </button>
                    {styleOpen && (
                      <div className="p-3">
                        <Textarea
                          value={styleNotes}
                          onChange={(e) => setStyleNotes(e.target.value)}
                          rows={5}
                          placeholder="e.g. short sentences, no jargon, dry humour, prefer concrete examples over abstractions"
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-lg">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-200 text-xs uppercase tracking-widest text-neutral-500">
                      <button
                        className="flex items-center gap-1.5 flex-1 text-left"
                        onClick={() => setIdeasOpen((o) => !o)}
                      >
                        <Lightbulb size={13} />
                        Idea buffer
                        <span className="ml-1 text-neutral-400 normal-case tracking-normal">
                          {ideas.length}
                        </span>
                        <span className="ml-auto text-neutral-400">{ideasOpen ? "–" : "+"}</span>
                      </button>
                    </div>
                    {ideasOpen && (
                      <div className="p-3 space-y-2">
                        {ideas.length === 0 && (
                          <p className="text-xs text-neutral-500 leading-relaxed">
                            A scratch pad for half-formed thoughts. Claude sees these as context
                            on edit, but won&apos;t force them in unless you ask.
                          </p>
                        )}
                        {ideas.map((idea) => (
                          <div
                            key={idea.id}
                            className="border border-neutral-200 rounded p-2 bg-neutral-50/60"
                          >
                            <Textarea
                              value={idea.text}
                              onChange={(e) => updateIdea(idea.id, e.target.value)}
                              placeholder="jot a thought — contradict it, argue with it, park it…"
                              rows={2}
                              className="text-sm bg-white resize-y min-h-[48px]"
                            />
                            <div className="flex items-center justify-end gap-1 mt-1.5">
                              <button
                                onClick={() => removeIdea(idea.id)}
                                className="text-[11px] text-neutral-400 hover:text-rose-600 inline-flex items-center gap-1"
                              >
                                <Trash2 size={10} />
                                remove
                              </button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addIdea}
                          className="w-full"
                        >
                          <Plus size={13} className="mr-1" />
                          Add idea
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {popover && selection && mode !== "focus" && canEdit && (
        <SelectionPopover
          x={popover.x}
          y={popover.y}
          onLike={quickLike}
          onNote={startAddNote}
        />
      )}

      {noteEditor && (() => {
        const mark = comments.find((c) => c.id === noteEditor.markId);
        if (!mark) return null;
        return (
          <NoteInput
            x={noteEditor.x}
            y={noteEditor.y}
            value={mark.text}
            quoted={mark.quoted}
            onChange={(v) => updateNoteText(mark.id, v)}
            onClose={closeNoteEditor}
            onRemove={() => removeMark(mark.id)}
          />
        );
      })()}

      {hovered && !noteEditor && mode !== "focus" && (
        <MarkTooltip
          rect={hovered.rect}
          markIds={hovered.markIds}
          comments={comments}
          onEdit={(id) => openNoteEditorForMark(id, hovered.rect)}
          onRemove={removeMark}
          onClose={() => setHovered(null)}
        />
      )}
    </div>
  );
}

function TopBar({
  model,
  onModelChange,
  sidebarOpen,
  onToggleSidebar,
  saving,
  onOpenSettings,
}: {
  model: ModelId;
  onModelChange: (m: ModelId) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  saving: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <div className="border-b border-neutral-200 bg-white sticky top-0 z-20">
      <div className="px-4 py-2 flex items-center gap-3">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900"
            title="Show essays"
          >
            <PanelLeftOpen size={15} />
          </button>
        )}
        <div className="font-semibold tracking-tight">writer</div>
        <div className="text-xs text-neutral-500 hidden sm:block">a cursor-ish thing for prose</div>
        {saving && (
          <div className="text-xs text-neutral-400 inline-flex items-center gap-1">
            <Loader2 size={11} className="animate-spin" />
            saving…
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Select value={model} onValueChange={(v) => onModelChange(v as ModelId)}>
            <SelectTrigger className="h-8 text-xs w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-opus-4-7">Opus 4.7 (best)</SelectItem>
              <SelectItem value="claude-sonnet-4-6">Sonnet 4.6 (balanced)</SelectItem>
              <SelectItem value="claude-haiku-4-5">Haiku 4.5 (fast)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onOpenSettings} title="Settings">
            <SettingsIcon size={14} className="mr-1.5" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

function SelectionPopover({
  x,
  y,
  onLike,
  onNote,
}: {
  x: number;
  y: number;
  onLike: () => void;
  onNote: () => void;
}) {
  const POPOVER_W = 200;
  const POPOVER_H = 40;
  const left = Math.min(
    Math.max(8, x - POPOVER_W / 2),
    typeof window !== "undefined" ? window.innerWidth - POPOVER_W - 8 : x
  );
  const top = Math.max(8, y - POPOVER_H - 12);
  return (
    <div
      data-popover="selection"
      className="fixed z-40 bg-neutral-900 text-white rounded-md shadow-lg flex items-center overflow-hidden"
      style={{ left, top, width: POPOVER_W }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={onLike}
        className="flex-1 px-3 py-2 text-xs inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors"
      >
        <ThumbsUp size={13} className="text-emerald-400" />
        Like this
      </button>
      <div className="w-px h-5 bg-neutral-700" />
      <button
        onClick={onNote}
        className="flex-1 px-3 py-2 text-xs inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors"
      >
        <MessageSquareText size={13} />
        Add note
      </button>
    </div>
  );
}

function NoteInput({
  x,
  y,
  value,
  quoted,
  onChange,
  onClose,
  onRemove,
}: {
  x: number;
  y: number;
  value: string;
  quoted: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onRemove: () => void;
}) {
  const BOX_W = 300;
  const left = Math.min(
    Math.max(8, x - BOX_W / 2),
    typeof window !== "undefined" ? window.innerWidth - BOX_W - 8 : x
  );
  const top = y + 6;
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <div
      className="fixed z-40 bg-white rounded-md shadow-xl border border-neutral-200 p-3"
      style={{ left, top, width: BOX_W }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        <span className="w-3 h-0.5 bg-[#f97316] rounded" />
        note on passage
      </div>
      <div className="text-[11px] text-neutral-500 italic mb-2 border-l-2 border-[#f97316]/40 pl-2 line-clamp-2">
        &ldquo;{quoted.slice(0, 160)}
        {quoted.length > 160 && "…"}&rdquo;
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onClose();
          }
        }}
        placeholder="What should Claude do here? e.g. 'make this tighter', 'expand on X'"
        className="w-full text-sm text-neutral-800 border border-neutral-200 rounded px-2 py-1.5 resize-y min-h-[64px] focus:outline-none focus:ring-2 focus:ring-neutral-300"
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={onRemove}
          className="text-[11px] text-neutral-400 hover:text-rose-600 inline-flex items-center gap-1"
        >
          <Trash2 size={11} />
          remove mark
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-neutral-400">Cmd/Ctrl+Enter to close</span>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function MarkTooltip({
  rect,
  markIds,
  comments,
  onEdit,
  onRemove,
  onClose,
}: {
  rect: DOMRect;
  markIds: string[];
  comments: InlineComment[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const active = markIds
    .map((id) => comments.find((c) => c.id === id))
    .filter((c): c is InlineComment => !!c);
  if (active.length === 0) return null;

  const BOX_W = 280;
  const left = Math.min(
    Math.max(8, rect.left + rect.width / 2 - BOX_W / 2),
    typeof window !== "undefined" ? window.innerWidth - BOX_W - 8 : rect.left
  );
  const top = rect.bottom + 6;

  return (
    <div
      className="fixed z-30 bg-neutral-900 text-neutral-100 rounded-md shadow-xl border border-neutral-800 p-2.5"
      style={{ left, top, width: BOX_W }}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={onClose}
    >
      <div className="space-y-2">
        {active.map((c) => {
          const isLike = c.kind === "preserve";
          return (
            <div key={c.id} className="flex items-start gap-2 text-xs">
              <span
                className={
                  "mt-0.5 inline-block w-2.5 h-2.5 rounded-full shrink-0 " +
                  (isLike ? "bg-emerald-400" : "bg-orange-400")
                }
              />
              <div className="flex-1 min-w-0">
                {isLike ? (
                  <div className="text-emerald-300 italic">Liked — preserved verbatim</div>
                ) : (
                  <div className="text-neutral-100 whitespace-pre-wrap">
                    {c.text || <span className="text-neutral-500 italic">(empty note)</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isLike && (
                  <button
                    onClick={() => onEdit(c.id)}
                    className="p-1 text-neutral-400 hover:text-neutral-100 rounded"
                    title="Edit note"
                  >
                    <Pencil size={11} />
                  </button>
                )}
                <button
                  onClick={() => onRemove(c.id)}
                  className="p-1 text-neutral-400 hover:text-rose-400 rounded"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionsPanel({
  questions,
  answers,
  onAnswer,
  onSubmit,
  onCancel,
  submitting,
}: {
  questions: Question[];
  answers: Record<string, string>;
  onAnswer: (id: string, v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-neutral-200 flex items-center gap-2">
          <Sparkles size={14} className="text-amber-500" />
          <div className="font-medium text-sm text-neutral-800">
            Claude has a few questions before the next draft
          </div>
          <button
            onClick={onCancel}
            className="ml-auto p-1 text-neutral-400 hover:text-neutral-900 rounded"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-neutral-500">
            Answer what you can. Skip anything with &ldquo;use your judgment&rdquo; — Claude will decide.
          </p>
          {questions.map((q, i) => (
            <div key={q.id}>
              <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                Question {i + 1}
              </div>
              <div className="text-sm text-neutral-800 mb-1.5">{q.text}</div>
              <Textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => onAnswer(q.id, e.target.value)}
                rows={2}
                placeholder="Your answer (or leave blank for Claude to decide)"
                className="text-sm"
              />
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-neutral-200 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <div className="ml-auto">
            <Button size="sm" onClick={onSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={13} className="mr-1.5" />
                  Generate next draft
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function maskKey(key: string | null | undefined) {
  if (!key) return "—";
  if (key.length <= 10) return "•••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

function SettingsModal({
  email,
  keyMasked,
  onChangeApiKey,
  onSignOut,
  onClose,
}: {
  email: string;
  keyMasked: string;
  onChangeApiKey: () => void;
  onSignOut: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
          <div className="inline-flex items-center gap-2">
            <SettingsIcon size={14} className="text-neutral-500" />
            <div className="font-medium text-sm text-neutral-800">Settings</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">
              Signed in as
            </div>
            <div className="text-sm text-neutral-800 font-mono">{email}</div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">
              Anthropic API key
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-neutral-800 font-mono flex-1">{keyMasked}</div>
              <Button size="sm" variant="outline" onClick={onChangeApiKey}>
                <KeyRound size={13} className="mr-1.5" />
                Change
              </Button>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              Stored in your account. Calls go browser → Anthropic directly.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <Button variant="outline" size="sm" onClick={onSignOut} className="w-full">
              <LogOut size={13} className="mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="max-w-xl mx-auto mt-24 px-6 text-center">
      <FileText size={32} className="mx-auto text-neutral-300 mb-3" />
      <h2 className="text-lg font-medium text-neutral-800 mb-1">No essays yet</h2>
      <p className="text-sm text-neutral-500 mb-5">
        Each essay keeps its own draft, notes, ideas, and style guide. Switching
        between them swaps the full context — nothing leaks across.
      </p>
      <Button onClick={onCreate}>
        <Plus size={14} className="mr-1.5" />
        Create your first essay
      </Button>
    </div>
  );
}

function ZenHeader({
  mmss,
  pct,
  wordCount,
  onExit,
}: {
  mmss: string;
  pct: number;
  wordCount: number;
  onExit: () => void;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-neutral-800">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3 text-sm">
        <Clock size={14} className="text-amber-400" />
        <span className="font-mono text-amber-200">{mmss}</span>
        <div className="flex-1 h-1 bg-neutral-800 rounded overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-[width] duration-200"
            style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }}
          />
        </div>
        <span className="text-neutral-400 text-xs">{wordCount} words</span>
        <span className="text-neutral-500 italic hidden sm:inline text-xs">
          no edits, no deletes — just write
        </span>
        <button
          onClick={onExit}
          className="text-neutral-300 hover:text-white text-xs inline-flex items-center gap-1 border border-neutral-700 rounded px-2 py-1"
        >
          <Square size={11} />
          exit
        </button>
      </div>
    </div>
  );
}

function formatMs(ms: number) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
