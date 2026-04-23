import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Idea, InlineComment, ModelId } from "./types";

export interface Essay {
  id: string;
  user_id: string;
  title: string;
  draft: string;
  style_notes: string;
  comments: InlineComment[];
  ideas: Idea[];
  model: ModelId | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  anthropic_key: string | null;
  default_model: ModelId | null;
  updated_at: string;
}

export async function loadUserSettings(userId: string): Promise<UserSettings | null> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserSettings | null) ?? null;
}

export async function upsertUserSettings(
  userId: string,
  patch: Partial<Pick<UserSettings, "anthropic_key" | "default_model">>
): Promise<void> {
  const sb = getSupabaseBrowserClient();
  const { error } = await sb
    .from("user_settings")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function listEssays(userId: string): Promise<Essay[]> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("essays")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Essay[];
}

export async function createEssay(
  userId: string,
  title = "Untitled"
): Promise<Essay> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("essays")
    .insert({ user_id: userId, title })
    .select()
    .single();
  if (error) throw error;
  return data as Essay;
}

export async function updateEssay(
  id: string,
  patch: Partial<Pick<Essay, "title" | "draft" | "style_notes" | "comments" | "ideas" | "model">>
): Promise<void> {
  const sb = getSupabaseBrowserClient();
  const { error } = await sb.from("essays").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteEssay(id: string): Promise<void> {
  const sb = getSupabaseBrowserClient();
  const { error } = await sb.from("essays").delete().eq("id", id);
  if (error) throw error;
}
