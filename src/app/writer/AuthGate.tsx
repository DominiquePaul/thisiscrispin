"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthGate() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const sendMagicLink = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Enter your email.");
      return;
    }
    setStatus("sending");
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/writer` : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#F2F2F2]">
      <div className="max-w-xl w-full bg-white border border-neutral-200 rounded-lg p-8 shadow-sm">
        <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase tracking-widest mb-1">
          <Mail size={14} />
          Sign in
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Sign in to the writer
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          Magic link — no password. Your drafts and API key are synced to your account
          so they&rsquo;re there on every device.
        </p>

        {status === "sent" ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md px-4 py-4 text-sm text-emerald-900 flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Check your email</div>
              <div className="mt-1">
                I sent a magic link to <strong>{email}</strong>. Click it to sign in.
              </div>
            </div>
          </div>
        ) : (
          <>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              autoFocus
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") {
                  setStatus("idle");
                  setMessage(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMagicLink();
              }}
            />
            {status === "error" && message && (
              <div className="text-rose-600 text-xs mt-2">{message}</div>
            )}
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-neutral-500">
                Sign-ups are restricted.
              </p>
              <Button onClick={sendMagicLink} disabled={status === "sending"}>
                {status === "sending" ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send magic link"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
