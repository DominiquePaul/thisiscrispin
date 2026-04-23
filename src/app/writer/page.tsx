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
  MessageSquarePlus,
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
import { parseEditResponse, applyDecisions, pendingCount, changeCount } from "./diff";
import { requestEdits } from "./api";
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

const DEFAULT_MODEL: ModelId = "claude-sonnet-4-6";
const SAMPLE_DRAFT = `Write your first draft here. Don't stop to edit — just get the ideas down.

When you're ready, select a passage, click "Comment", and tell Claude what to change. Then hit "Get edits" to see redlines you can accept or reject one by one.`;

type FocusState =
  | { active: false }
  | { active: true; startedAt: number; durationMs: number; lockedLength: number; remaining: number };

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: User };

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
  const [ideasOpen, setIdeasOpen] = useState(true);

  const [mode, setMode] = useState<Mode>("write");
  const [segments, setSegments] = useState<DiffSegment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [focus, setFocus] = useState<FocusState>({ active: false });
  const [focusMinutes, setFocusMinutes] = useState(10);

  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [draftingComment, setDraftingComment] = useState<{ start: number; end: number; quoted: string } | null>(null);
  const [commentText, setCommentText] = useState("");

  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadingEssayRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // flush on next tick so the edit effect doesn't fire for the load
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

  const focusProgress = useMemo(() => {
    if (!focus.active) return null;
    const pct = 1 - focus.remaining / focus.durationMs;
    return { pct, mmss: formatMs(focus.remaining) };
  }, [focus]);

  const onSelectionChange = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start !== end) {
      setSelection({ start, end });
    } else {
      setSelection(null);
    }
  }, []);

  const startCommentOnSelection = () => {
    if (!selection) return;
    const quoted = draft.slice(selection.start, selection.end);
    setDraftingComment({ start: selection.start, end: selection.end, quoted });
    setCommentText("");
  };

  const saveComment = () => {
    if (!draftingComment || !commentText.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        start: draftingComment.start,
        end: draftingComment.end,
        quoted: draftingComment.quoted,
        text: commentText.trim(),
        createdAt: Date.now(),
      },
    ]);
    setDraftingComment(null);
    setCommentText("");
  };

  const removeComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
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

  const promoteIdeaToComment = (id: string) => {
    const idea = ideas.find((i) => i.id === id);
    if (!idea || !idea.text.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        start: 0,
        end: 0,
        quoted: "(from idea buffer)",
        text: `Consider weaving in this idea where it fits: ${idea.text.trim()}`,
        createdAt: Date.now(),
      },
    ]);
  };

  const requestAiEdits = async () => {
    if (!settings?.anthropic_key) {
      setShowApiKeyPrompt(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await requestEdits({
        apiKey: settings.anthropic_key,
        model,
        draft,
        comments,
        styleNotes,
        ideas,
      });
      const parsed = parseEditResponse(response);
      if (changeCount(parsed) === 0) {
        setError("Claude returned no changes. Try sharpening your comments or asking for specific revisions.");
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

  const handleTextareaKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    if (insideLocked && e.key.length === 1) {
      e.preventDefault();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (focus.active) {
      if (next.length < focus.lockedLength) return;
      if (next.slice(0, focus.lockedLength) !== draft.slice(0, focus.lockedLength)) return;
    }
    setDraft(next);
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
    // Flush pending autosave synchronously by letting the cleanup trigger; just switch.
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

  if (!settings?.anthropic_key || showApiKeyPrompt) {
    return <TokenGate onSubmit={handleSaveApiKey} />;
  }

  const canEdit = mode !== "review" && !loading;
  const hasActiveEssay = activeEssayId !== null;

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-neutral-900">
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
        email={auth.user.email ?? ""}
        saving={saving}
        onChangeApiKey={() => setShowApiKeyPrompt(true)}
        onSignOut={handleSignOut}
      />

      {mode === "focus" && focusProgress && (
        <FocusBanner
          mmss={focusProgress.mmss}
          pct={focusProgress.pct}
          wordCount={wordCount}
          onExit={exitFocus}
        />
      )}

      <div className="flex">
        {sidebarOpen && (
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
            <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              <div className="bg-white border border-neutral-200 rounded-lg">
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
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!selection || mode === "focus"}
                        onClick={startCommentOnSelection}
                      >
                        <MessageSquarePlus size={14} className="mr-1.5" />
                        Comment on selection
                      </Button>
                      {mode !== "focus" ? (
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
                      )}
                      {mode !== "focus" && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                          <Clock size={14} />
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={focusMinutes}
                            onChange={(e) => setFocusMinutes(Math.max(1, parseInt(e.target.value || "1", 10)))}
                            className="w-12 h-7 px-2 border border-neutral-300 rounded text-sm"
                          />
                          <span>min</span>
                        </div>
                      )}
                      <div className="ml-auto">
                        <Button
                          size="sm"
                          onClick={requestAiEdits}
                          disabled={loading || mode === "focus" || !draft.trim()}
                        >
                          {loading ? (
                            <Loader2 size={14} className="mr-1.5 animate-spin" />
                          ) : (
                            <Sparkles size={14} className="mr-1.5" />
                          )}
                          {loading ? "Thinking…" : "Get edits"}
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={handleTextareaChange}
                      onKeyDown={handleTextareaKey}
                      onSelect={onSelectionChange}
                      onMouseUp={onSelectionChange}
                      onKeyUp={onSelectionChange}
                      readOnly={!canEdit}
                      placeholder="Start writing…"
                      className="min-h-[480px] leading-relaxed text-[15px] font-[var(--font-segoe-ui)] resize-y border-neutral-200 focus-visible:ring-neutral-400"
                    />

                    {draftingComment && (
                      <div className="mt-3 border border-neutral-200 rounded p-3 bg-neutral-50">
                        <div className="text-xs text-neutral-500 uppercase tracking-widest mb-1">
                          Comment on passage
                        </div>
                        <div className="text-sm text-neutral-800 italic mb-2 border-l-2 border-neutral-300 pl-2">
                          &ldquo;{draftingComment.quoted.slice(0, 200)}
                          {draftingComment.quoted.length > 200 && "…"}&rdquo;
                        </div>
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="What should Claude do with this? e.g. 'make it tighter', 'preserve this exactly', 'expand on the idea of X'"
                          className="text-sm"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDraftingComment(null);
                              setCommentText("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={saveComment} disabled={!commentText.trim()}>
                            Save comment
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                          A scratch pad for half-formed thoughts. Stuff you&apos;re still
                          debating, parked ideas, things too raw for the draft. Claude sees
                          these as context on edit, but won&apos;t force them in unless you
                          ask.
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
                              onClick={() => promoteIdeaToComment(idea.id)}
                              className="text-[11px] text-neutral-500 hover:text-emerald-700"
                              title="Ask Claude to weave this into the next edit"
                              disabled={!idea.text.trim()}
                            >
                              → weave in
                            </button>
                            <span className="text-neutral-300">·</span>
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

                <div className="bg-white border border-neutral-200 rounded-lg">
                  <div className="flex items-center px-4 py-2.5 border-b border-neutral-200 text-xs uppercase tracking-widest text-neutral-500">
                    Comments
                    <span className="ml-auto text-neutral-400">{comments.length}</span>
                  </div>
                  {comments.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-500">
                      Select text in the draft and click <em>Comment on selection</em>. Your notes
                      go to Claude with the next round of edits.
                    </div>
                  ) : (
                    <ul className="divide-y divide-neutral-100">
                      {comments.map((c) => (
                        <li key={c.id} className="p-3 text-sm group">
                          <div className="text-[11px] text-neutral-400 uppercase tracking-widest mb-1 italic">
                            on &ldquo;{c.quoted.slice(0, 80)}
                            {c.quoted.length > 80 && "…"}&rdquo;
                          </div>
                          <div className="text-neutral-800">{c.text}</div>
                          <button
                            onClick={() => removeComment(c.id)}
                            className="mt-1 text-[11px] text-neutral-400 hover:text-rose-600 inline-flex items-center gap-1"
                          >
                            <Trash2 size={11} />
                            remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopBar({
  model,
  onModelChange,
  sidebarOpen,
  onToggleSidebar,
  email,
  saving,
  onChangeApiKey,
  onSignOut,
}: {
  model: ModelId;
  onModelChange: (m: ModelId) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  email: string;
  saving: boolean;
  onChangeApiKey: () => void;
  onSignOut: () => void;
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
          <div className="text-xs text-neutral-400 hidden md:inline">{email}</div>
          <Button variant="outline" size="sm" onClick={onChangeApiKey} title="Change API key">
            <KeyRound size={13} className="mr-1.5" />
            API key
          </Button>
          <Button variant="outline" size="sm" onClick={onSignOut}>
            <LogOut size={14} className="mr-1.5" />
            Sign out
          </Button>
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
        Each essay keeps its own draft, comments, ideas, and style notes. Switching
        between them swaps the full context — nothing leaks across.
      </p>
      <Button onClick={onCreate}>
        <Plus size={14} className="mr-1.5" />
        Create your first essay
      </Button>
    </div>
  );
}

function FocusBanner({
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
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="max-w-6xl mx-auto px-6 py-2 flex items-center gap-3 text-sm">
        <Clock size={14} className="text-amber-700" />
        <span className="font-mono text-amber-900">{mmss}</span>
        <div className="flex-1 h-1.5 bg-amber-200 rounded overflow-hidden">
          <div
            className="h-full bg-amber-600 transition-[width] duration-200"
            style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }}
          />
        </div>
        <span className="text-amber-900">{wordCount} words</span>
        <span className="text-amber-800 italic hidden sm:inline">keep going — no edits until the timer runs out</span>
        <button onClick={onExit} className="text-amber-900 underline text-xs">exit</button>
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
