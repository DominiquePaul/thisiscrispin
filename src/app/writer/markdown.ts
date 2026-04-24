/**
 * Tiny markdown ↔ HTML converters for clipboard interop.
 *
 * Goals:
 *   markdownToHtml — produce semantic HTML rich destinations (Gmail, Word,
 *   Google Docs, Notion) can ingest so bold/italic/headings survive a paste.
 *   htmlToMarkdown — take an HTML clipboard payload (typically messy,
 *   with inline styles from Office / Google Docs) and produce a clean
 *   markdown string to drop into the editor.
 *
 * Scope is deliberately small: bold, italic, code, headings, links, lists,
 * paragraphs, line breaks, blockquotes, horizontal rules, images. Good
 * enough for prose; anything exotic degrades to plain text.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineMd(s: string): string {
  let out = escapeHtml(s);
  // inline code first so asterisks inside don't get interpreted
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  // bold (non-greedy, avoid crossing newlines)
  out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  // italic — single asterisks not preceded/followed by another
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  // links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const blocks: string[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length === 0) return;
    blocks.push(`<p>${inlineMd(para.join(" "))}</p>`);
    para = [];
  };

  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (!inList) return;
    blocks.push(`<ul>${listItems.map((i) => `<li>${inlineMd(i)}</li>`).join("")}</ul>`);
    listItems = [];
    inList = false;
  };

  for (const raw of lines) {
    const line = raw;
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);

    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inlineMd(heading[2])}</h${level}>`);
      continue;
    }
    if (bullet) {
      flushPara();
      inList = true;
      listItems.push(bullet[1]);
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();

  return blocks.join("\n");
}

/* -------------------- HTML → Markdown -------------------- */

function collapseWhitespace(s: string): string {
  // Preserve leading/trailing single spaces but collapse internal runs
  return s.replace(/\s+/g, " ");
}

function walk(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return collapseWhitespace(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // Skip script/style/head-ish garbage that Word/Docs loves to ship
  if (tag === "script" || tag === "style" || tag === "meta" || tag === "link") return "";

  const kids = Array.from(el.childNodes).map(walk).join("");

  switch (tag) {
    case "strong":
    case "b": {
      const inner = kids.trim();
      return inner ? `**${inner}**` : "";
    }
    case "em":
    case "i": {
      const inner = kids.trim();
      return inner ? `*${inner}*` : "";
    }
    case "code":
      if (el.parentElement?.tagName.toLowerCase() === "pre") return kids;
      return `\`${kids}\``;
    case "pre":
      return `\n\n\`\`\`\n${kids.trim()}\n\`\`\`\n\n`;
    case "h1":
      return `\n\n# ${kids.trim()}\n\n`;
    case "h2":
      return `\n\n## ${kids.trim()}\n\n`;
    case "h3":
      return `\n\n### ${kids.trim()}\n\n`;
    case "h4":
      return `\n\n#### ${kids.trim()}\n\n`;
    case "h5":
      return `\n\n##### ${kids.trim()}\n\n`;
    case "h6":
      return `\n\n###### ${kids.trim()}\n\n`;
    case "p":
      return `\n\n${kids.trim()}\n\n`;
    case "br":
      return "\n";
    case "div":
      return `\n${kids}`;
    case "a": {
      const href = el.getAttribute("href") ?? "";
      const text = kids.trim();
      if (!text) return "";
      return href ? `[${text}](${href})` : text;
    }
    case "li": {
      const ordered = el.parentElement?.tagName.toLowerCase() === "ol";
      return ordered ? `\n1. ${kids.trim()}` : `\n- ${kids.trim()}`;
    }
    case "ul":
    case "ol":
      return `\n${kids}\n\n`;
    case "blockquote":
      return `\n\n${kids
        .trim()
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n")}\n\n`;
    case "hr":
      return "\n\n---\n\n";
    case "img": {
      const alt = el.getAttribute("alt") ?? "";
      const src = el.getAttribute("src") ?? "";
      return src ? `![${alt}](${src})` : "";
    }
    case "body":
    case "html":
      return kids;
    default:
      return kids;
  }
}

export function htmlToMarkdown(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  // Word/Google Docs ship giant <html> fragments — DOMParser handles both
  const doc = new DOMParser().parseFromString(html, "text/html");
  const out = walk(doc.body || doc.documentElement);
  return out
    .replace(/\u00a0/g, " ") // nbsp
    .replace(/[ \t]+\n/g, "\n") // trailing spaces before newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
