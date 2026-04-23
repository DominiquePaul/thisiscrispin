"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, KeyRound, ExternalLink, Loader2, ArrowLeft } from "lucide-react";

interface Props {
  onSubmit: (key: string) => Promise<void> | void;
  onCancel?: () => void;
}

export function TokenGate({ onSubmit, onCancel }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste your key first.");
      return;
    }
    if (!trimmed.startsWith("sk-")) {
      setError("That doesn't look like an Anthropic API key (should start with sk-).");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#F2F2F2]">
      <div className="max-w-xl w-full bg-white border border-neutral-200 rounded-lg p-8 shadow-sm">
        {onCancel && (
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 mb-4"
          >
            <ArrowLeft size={12} />
            Back to writer
          </button>
        )}
        <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase tracking-widest mb-1">
          <KeyRound size={14} />
          API key
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Paste your Anthropic API key
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          Saved to your account so you don&rsquo;t have to re-enter it. Requests go
          directly from your browser to Anthropic — the key is only used to sign those
          calls.
        </p>

        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-900">
          <div className="font-medium mb-1 flex items-center gap-1.5">
            <ShieldCheck size={14} /> About Claude Code subscriptions
          </div>
          <p className="leading-relaxed">
            A Claude Pro/Max subscription lets you use Claude Code but does{" "}
            <strong>not</strong> include browser API access. You&apos;ll need an API key from
            the Anthropic Console, which is billed separately (pay-as-you-go).
          </p>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-amber-900 underline underline-offset-2"
          >
            Create a key at console.anthropic.com
            <ExternalLink size={12} />
          </a>
        </div>

        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
          Anthropic API key
        </label>
        <Input
          type="password"
          placeholder="sk-ant-..."
          value={value}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handle();
          }}
          className="font-mono"
        />
        {error && <div className="text-rose-600 text-xs mt-2">{error}</div>}

        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-neutral-500">
            Stored in Supabase behind row-level security.
          </p>
          <Button onClick={handle} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save key"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
