"use client";

import { FileText, Plus, Trash2, PanelLeftClose } from "lucide-react";
import type { Essay } from "./db";

interface Props {
  essays: Essay[];
  activeEssayId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onCollapse: () => void;
  saving: boolean;
}

export function EssaySidebar({
  essays,
  activeEssayId,
  onSelect,
  onCreate,
  onDelete,
  onCollapse,
  saving,
}: Props) {
  return (
    <aside className="w-[260px] shrink-0 bg-white border-r border-neutral-200 flex flex-col h-[calc(100vh-49px)] sticky top-[49px]">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-200">
        <div className="text-[11px] uppercase tracking-widest text-neutral-500 flex-1">
          Essays
        </div>
        <span className="text-[10px] text-neutral-400">
          {saving ? "saving…" : ""}
        </span>
        <button
          onClick={onCollapse}
          className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
          title="Hide sidebar (⌘.)"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      <button
        onClick={onCreate}
        className="mx-3 my-2 inline-flex items-center gap-1.5 text-sm text-neutral-700 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded-md px-2.5 py-1.5 bg-white transition-colors"
      >
        <Plus size={14} />
        New essay
      </button>

      <div className="flex-1 overflow-y-auto py-1">
        {essays.length === 0 && (
          <div className="px-4 py-6 text-xs text-neutral-400 leading-relaxed">
            No essays yet. Create one to start writing.
          </div>
        )}
        <ul className="px-2 space-y-0.5">
          {essays.map((essay) => {
            const active = essay.id === activeEssayId;
            return (
              <li key={essay.id} className="group relative">
                <button
                  onClick={() => onSelect(essay.id)}
                  className={
                    "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors " +
                    (active
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900")
                  }
                >
                  <FileText size={13} className="shrink-0 text-neutral-400" />
                  <span className="truncate flex-1">
                    {essay.title || "Untitled"}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${essay.title || "Untitled"}"?`)) {
                      onDelete(essay.id);
                    }
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-neutral-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete essay"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
