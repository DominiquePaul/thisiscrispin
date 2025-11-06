"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FormState = "idle" | "sending" | "success" | "error";

type Status = {
  tone: "success" | "error";
  text: string;
};

interface FeedbackFormProps {
  onSuccess?: () => void;
}

export default function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [notes, setNotes] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [status, setStatus] = useState<Status | null>(null);

  const isSubmitting = formState === "sending";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!notes.trim()) {
      setStatus({
        tone: "error",
        text: "Add at least one clear thought before sending.",
      });
      setFormState("error");
      return;
    }

    try {
      setFormState("sending");
      setStatus(null);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: notes.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "" }));
        throw new Error(data.error || "Unable to send feedback right now");
      }

      setNotes("");
      setFormState("success");
      setStatus({ tone: "success", text: "Sent to my inbox. Thank you." });
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1900);
      }
    } catch (error) {
      console.error("Anonymous feedback submission failed", error);
      setFormState("error");
      setStatus({
        tone: "error",
        text: "Something went wrong. Try again in a moment.",
      });
    }
  };

  const characterCount = notes.length;
  const maxCharacters = 1500;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-base font-medium leading-relaxed text-slate-800">
        It’s easier to be real when you don’t have to be polite.
      </p>

      <div className="space-y-2">
        <Textarea
          id="anonymous-feedback"
          aria-label="Anonymous feedback"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              if (isSubmitting) {
                return;
              }

              const form = event.currentTarget.form;
              form?.requestSubmit();
            }
          }}
          placeholder="Tell me what you see that I don’t. Bold ideas, honest criticism, raw thoughts."
          maxLength={maxCharacters}
          className="min-h-[220px] resize-none border border-slate-300 bg-white text-base leading-relaxed text-slate-900 focus-visible:ring-slate-900/20"
        />
        {characterCount > maxCharacters && (
          <div className="flex items-center justify-between text-xs text-red-600">
            <span>
              {characterCount}/{maxCharacters} — please keep it under {maxCharacters} characters.
            </span>
          </div>
        )}
        {characterCount > 600 && characterCount <= maxCharacters && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{characterCount}/{maxCharacters}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        {status && (
          <p
            role={status.tone === "error" ? "alert" : undefined}
            className={cn(
              "text-sm sm:mr-auto",
              status.tone === "error" ? "text-red-600" : "text-emerald-600"
            )}
          >
            {status.text}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="ml-auto w-full min-w-[160px] rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? "Sending…" : formState === "success" ? "Sent" : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}

