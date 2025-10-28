import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Document, Block, Inline, Text, BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert Contentful Rich Text to Markdown
export function richTextToMarkdown(document: Document | any): string {
  if (!document || !document.content) return '';

  const processNode = (node: Block | Inline | Text): string => {
    // Handle text nodes
    if (node.nodeType === 'text') {
      let text = (node as Text).value;
      
      // Apply marks (bold, italic, code, etc.)
      const marks = (node as Text).marks || [];
      marks.forEach(mark => {
        switch (mark.type) {
          case MARKS.BOLD:
            text = `**${text}**`;
            break;
          case MARKS.ITALIC:
            text = `*${text}*`;
            break;
          case MARKS.CODE:
            text = `\`${text}\``;
            break;
          case MARKS.UNDERLINE:
            text = `<u>${text}</u>`;
            break;
        }
      });
      
      return text;
    }

    // Handle block and inline nodes
    const content = node.content || [];
    const childrenText = content.map(child => processNode(child)).join('');

    switch (node.nodeType) {
      case BLOCKS.PARAGRAPH:
        return `${childrenText}\n\n`;
      
      case BLOCKS.HEADING_1:
        return `# ${childrenText}\n\n`;
      
      case BLOCKS.HEADING_2:
        return `## ${childrenText}\n\n`;
      
      case BLOCKS.HEADING_3:
        return `### ${childrenText}\n\n`;
      
      case BLOCKS.HEADING_4:
        return `#### ${childrenText}\n\n`;
      
      case BLOCKS.HEADING_5:
        return `##### ${childrenText}\n\n`;
      
      case BLOCKS.HEADING_6:
        return `###### ${childrenText}\n\n`;
      
      case BLOCKS.UL_LIST:
        return `${childrenText}\n`;
      
      case BLOCKS.OL_LIST:
        return `${childrenText}\n`;
      
      case BLOCKS.LIST_ITEM:
        // Get the parent list type from context (we'll handle it in the list itself)
        return `- ${childrenText}`;
      
      case BLOCKS.QUOTE:
        return `> ${childrenText}\n\n`;
      
      case BLOCKS.HR:
        return `---\n\n`;
      
      case BLOCKS.EMBEDDED_ASSET:
        const assetUrl = (node as any)?.data?.target?.fields?.file?.['en-US']?.url || '';
        const assetDescription = (node as any)?.data?.target?.fields?.description?.['en-US'] || '';
        if (assetUrl) {
          const fullUrl = assetUrl.startsWith('//') ? `https:${assetUrl}` : assetUrl;
          return `![${assetDescription}](${fullUrl})\n\n`;
        }
        return '';
      
      case BLOCKS.EMBEDDED_ENTRY:
        // Handle embedded entries if needed
        return '';
      
      case INLINES.HYPERLINK:
        const url = (node as any)?.data?.uri || '';
        return `[${childrenText}](${url})`;
      
      case INLINES.ASSET_HYPERLINK:
        const assetLinkUrl = (node as any)?.data?.target?.fields?.file?.['en-US']?.url || '';
        if (assetLinkUrl) {
          const fullAssetUrl = assetLinkUrl.startsWith('//') ? `https:${assetLinkUrl}` : assetLinkUrl;
          return `[${childrenText}](${fullAssetUrl})`;
        }
        return childrenText;
      
      case INLINES.ENTRY_HYPERLINK:
        // Handle entry hyperlinks if needed
        return childrenText;
      
      default:
        return childrenText;
    }
  };

  return document.content.map((node: Block) => processNode(node)).join('').trim();
}
