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
    <form onSubmit={handleSubmit}>
      {/* Header band */}
      <div className="border-b-2 border-[rgb(18,18,22)] px-8 pb-6 pt-9">
        <div className="mb-3 text-[10px] uppercase tracking-[0.45em] text-[#9A9A9A]">
          Anonymous
        </div>
        <h2
          aria-hidden
          className="text-3xl font-bold uppercase leading-[0.9] tracking-[-0.04em] text-[rgb(18,18,22)] sm:text-4xl"
        >
          Off the record
        </h2>
      </div>

      <div className="space-y-5 px-8 pb-8 pt-7">
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
            placeholder="A tool to share something with me, without your name attached to it."
            maxLength={maxCharacters}
            className="min-h-[170px] resize-none rounded-none border-2 border-[rgb(18,18,22)] bg-white text-sm leading-relaxed text-[rgb(18,18,22)] placeholder:text-[#ADADAD] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {characterCount > maxCharacters && (
            <div className="text-[10px] uppercase tracking-[0.1em] text-red-600">
              {characterCount}/{maxCharacters} — keep it under {maxCharacters}.
            </div>
          )}
          {characterCount > 600 && characterCount <= maxCharacters && (
            <div className="text-[10px] uppercase tracking-[0.1em] text-[#ADADAD]">
              {characterCount}/{maxCharacters}
            </div>
          )}
        </div>

        {status && (
          <p
            role={status.tone === "error" ? "alert" : undefined}
            className={cn(
              "text-xs",
              status.tone === "error" ? "text-red-600" : "text-emerald-600"
            )}
          >
            {status.text}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-between rounded-none bg-[rgb(18,18,22)] px-6 py-6 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[rgb(45,45,52)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(18,18,22)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSubmitting ? "Sending" : formState === "success" ? "Sent" : "Send message"}</span>
          <span aria-hidden>&rarr;</span>
        </Button>
      </div>
    </form>
  );
}

