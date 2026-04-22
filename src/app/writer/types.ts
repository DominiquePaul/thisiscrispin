export interface InlineComment {
  id: string;
  start: number;
  end: number;
  quoted: string;
  text: string;
  createdAt: number;
}

export interface Idea {
  id: string;
  text: string;
  createdAt: number;
}

export type DiffSegment =
  | { kind: "keep"; text: string }
  | {
      kind: "insert";
      id: string;
      text: string;
      status: "pending" | "accepted" | "rejected";
    }
  | {
      kind: "delete";
      id: string;
      text: string;
      status: "pending" | "accepted" | "rejected";
    }
  | {
      kind: "replace";
      id: string;
      original: string;
      replacement: string;
      status: "pending" | "accepted" | "rejected";
    };

export type Mode = "write" | "review" | "focus";

export type ModelId = "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5";
