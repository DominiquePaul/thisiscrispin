"use client";

import { Check, X } from "lucide-react";
import type { DiffSegment } from "./types";

interface Props {
  segments: DiffSegment[];
  onDecide: (id: string, decision: "accepted" | "rejected") => void;
}

export function DiffView({ segments, onDecide }: Props) {
  return (
    <div className="whitespace-pre-wrap font-[var(--font-segoe-ui)] text-[15px] leading-relaxed text-neutral-900">
      {segments.map((seg, i) => {
        if (seg.kind === "keep") {
          return <span key={i}>{seg.text}</span>;
        }
        const accepted = seg.status === "accepted";
        const rejected = seg.status === "rejected";
        const pending = seg.status === "pending";

        if (seg.kind === "insert") {
          return (
            <ChangeBlock
              key={seg.id}
              id={seg.id}
              pending={pending}
              accepted={accepted}
              rejected={rejected}
              onDecide={onDecide}
            >
              <span
                className={
                  rejected
                    ? "text-neutral-400 line-through decoration-neutral-400"
                    : "bg-emerald-100 text-emerald-900 underline decoration-emerald-500"
                }
              >
                {seg.text}
              </span>
            </ChangeBlock>
          );
        }
        if (seg.kind === "delete") {
          return (
            <ChangeBlock
              key={seg.id}
              id={seg.id}
              pending={pending}
              accepted={accepted}
              rejected={rejected}
              onDecide={onDecide}
            >
              <span
                className={
                  accepted
                    ? "text-neutral-400 line-through decoration-neutral-400"
                    : rejected
                      ? "text-neutral-700"
                      : "bg-rose-100 text-rose-900 line-through decoration-rose-500"
                }
              >
                {seg.text}
              </span>
            </ChangeBlock>
          );
        }
        // replace
        return (
          <ChangeBlock
            key={seg.id}
            id={seg.id}
            pending={pending}
            accepted={accepted}
            rejected={rejected}
            onDecide={onDecide}
          >
            {accepted ? (
              <span className="bg-emerald-50 text-emerald-900">{seg.replacement}</span>
            ) : rejected ? (
              <span className="text-neutral-700">{seg.original}</span>
            ) : (
              <>
                <span className="bg-rose-100 text-rose-900 line-through decoration-rose-500">
                  {seg.original}
                </span>
                <span className="bg-emerald-100 text-emerald-900 underline decoration-emerald-500">
                  {seg.replacement}
                </span>
              </>
            )}
          </ChangeBlock>
        );
      })}
    </div>
  );
}

function ChangeBlock({
  id,
  pending,
  accepted,
  rejected,
  children,
  onDecide,
}: {
  id: string;
  pending: boolean;
  accepted: boolean;
  rejected: boolean;
  children: React.ReactNode;
  onDecide: (id: string, decision: "accepted" | "rejected") => void;
}) {
  return (
    <span className="relative inline group">
      {children}
      {pending && (
        <span className="inline-flex align-middle ml-1 mr-0.5 gap-0.5 opacity-80 group-hover:opacity-100">
          <button
            onClick={() => onDecide(id, "accepted")}
            className="h-5 w-5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center justify-center"
            title="Accept"
            type="button"
          >
            <Check size={12} />
          </button>
          <button
            onClick={() => onDecide(id, "rejected")}
            className="h-5 w-5 rounded-sm bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center justify-center"
            title="Reject"
            type="button"
          >
            <X size={12} />
          </button>
        </span>
      )}
      {!pending && (
        <button
          onClick={() => onDecide(id, accepted ? "rejected" : "accepted")}
          className="ml-1 mr-0.5 text-[10px] uppercase tracking-wide text-neutral-500 hover:text-neutral-900"
          type="button"
          title="Toggle decision"
        >
          {accepted ? "accepted ↺" : "rejected ↺"}
        </button>
      )}
    </span>
  );
}
