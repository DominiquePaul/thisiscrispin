"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import BlogPostEditButton from './BlogPostEditButton';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import Image from 'next/image';

// Load ContentfulEditor with dynamic imports (client-side only)
const ContentfulEditor = dynamic(() => import('./ContentfulEditor'), {
  ssr: false
});

const LINK_CLASS =
  "text-[rgb(18,18,22)] underline decoration-1 underline-offset-2 decoration-[#C8C8C8] transition-colors hover:decoration-[rgb(18,18,22)]";

const escapeAttr = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Render Contentful Rich Text to an HTML string (server- and client-safe).
 *
 * We deliberately render to HTML + dangerouslySetInnerHTML instead of using
 * documentToReactComponents: the prebuilt rich-text React renderer produces
 * React elements that Next 15's renderer rejects ("Objects are not valid as a
 * React child"). Emitting an HTML string avoids that entirely.
 */
function richTextToHtml(content: any): string {
  if (!content) return '';
  return documentToHtmlString(content, {
    renderMark: {
      [MARKS.CODE]: (text) => `<code class="bg-[#EAEAEA] rounded px-1" style="font-family:var(--font-jetbrains-mono)">${text}</code>`,
    },
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
        try {
          const { file, title: assetTitle, description } = node.data.target.fields;
          const url = file?.['en-US']?.url || file?.url;
          if (!url) return '';
          const fullUrl = url.startsWith('//') ? `https:${url}` : url;
          const alt = escapeAttr(
            description?.['en-US'] || assetTitle?.['en-US'] || description || assetTitle || ''
          );
          const isVideo = /\.(mp4|m4v|webm|ogg|mov)(\?.*)?$/i.test(fullUrl);
          if (isVideo) {
            return `<video controls preload="metadata" class="my-6 w-full rounded-lg" style="max-height:70vh"><source src="${escapeAttr(fullUrl)}" /></video>`;
          }
          return `<img src="${escapeAttr(fullUrl)}" alt="${alt}" loading="lazy" class="my-4 w-full h-auto" />`;
        } catch {
          return '';
        }
      },
      [BLOCKS.TABLE]: (node: any, next) =>
        `<div class="overflow-x-auto my-6"><table class="min-w-full border-collapse border border-gray-300">${next(node.content)}</table></div>`,
      [BLOCKS.TABLE_ROW]: (node: any, next) =>
        `<tr class="border-b border-gray-300">${next(node.content)}</tr>`,
      [BLOCKS.TABLE_CELL]: (node: any, next) =>
        `<td class="border border-gray-300 px-4 py-2">${next(node.content)}</td>`,
      [BLOCKS.TABLE_HEADER_CELL]: (node: any, next) =>
        `<th class="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">${next(node.content)}</th>`,
      [INLINES.HYPERLINK]: (node: any, next) =>
        `<a href="${escapeAttr(node.data.uri)}" class="${LINK_CLASS}">${next(node.content)}</a>`,
      [INLINES.ASSET_HYPERLINK]: (node: any, next) => {
        try {
          const url = node.data?.target?.fields?.file?.url;
          if (url) {
            const fullUrl = url.startsWith('//') ? `https:${url}` : url;
            return `<a href="${escapeAttr(fullUrl)}" class="${LINK_CLASS}">${next(node.content)}</a>`;
          }
        } catch {}
        return `<span>${next(node.content)}</span>`;
      },
      [BLOCKS.EMBEDDED_ENTRY]: () => '',
      [INLINES.EMBEDDED_ENTRY]: () => '',
      [INLINES.ENTRY_HYPERLINK]: (node: any, next) => `<span>${next(node.content)}</span>`,
    },
  });
}

interface BlogPostClientProps {
  contentfulId: string;
  title: string;
  // Contentful Rich Text document
  content: any;
  tags: string[];
  createdAt: string;
  coverImage?: string;
  excerpt?: string;
}

export default function BlogPostClient({
  contentfulId,
  title: initialTitle,
  content: initialContent,
  tags: initialTags,
  createdAt,
  coverImage: initialCoverImage,
  excerpt: initialExcerpt
}: BlogPostClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<any>(initialContent);
  const [tags, setTags] = useState(initialTags);
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [excerpt, setExcerpt] = useState(initialExcerpt || '');

  // Format date for display
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const contentHtml = useMemo(() => richTextToHtml(content), [content]);

  // Update state when props change (in case content is reloaded)
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setTags(initialTags);
    setCoverImage(initialCoverImage);
    setExcerpt(initialExcerpt || '');
  }, [initialTitle, initialContent, initialTags, initialCoverImage, initialExcerpt]);

  // Handle cancellation of editing
  const handleCancel = () => {
    // Reset to the initial content if needed
    setTitle(initialTitle);
    setContent(initialContent);
    setTags(initialTags);
    setCoverImage(initialCoverImage);
    setExcerpt(initialExcerpt || '');
    setIsEditing(false);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  // Handle successful save from the editor
  const handleSaved = (newTitle: string, newContent: any, newTags: string[], newCoverImage?: string, newExcerpt?: string) => {
    setTitle(newTitle);
    setContent(newContent);
    setTags(newTags);
    if (newCoverImage) {
      setCoverImage(newCoverImage);
    }
    setExcerpt(newExcerpt || '');
    setIsEditing(false); // Exit editing mode after successful save
  };

  return (
    <>
      {/* Admin Edit Button - only show when not editing */}
      {!isEditing && (
        <div className="mb-6 flex justify-end">
          <BlogPostEditButton
            postId={contentfulId}
            isEditing={isEditing}
            onToggleEdit={toggleEditing}
          />
        </div>
      )}

      {/* Editor (only for admins) */}
      {isEditing ? (
        <div className="mb-16 border-b pb-8">
          <ContentfulEditor
            contentfulId={contentfulId}
            initialContent={{
              title,
              content: content,
              coverImage,
              excerpt
            }}
            initialTags={tags}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        /* Render article content when not in editing mode */
        <article>
          {coverImage && (
            <div className="w-full mb-8 relative aspect-[16/9]">
              <Image
                src={coverImage}
                alt={title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover rounded-md"
              />
            </div>
          )}
          <h1
            className="text-4xl sm:text-5xl mb-4 tracking-[-0.03em] leading-[1.05] text-[rgb(18,18,22)]"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {title}
          </h1>
          <div
            className="text-[#9A9A9A] mb-12 text-xs uppercase tracking-[0.2em]"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {formattedDate}
          </div>
          <div
            className="prose prose-neutral prose-base max-w-none text-[rgb(45,45,52)]"
            style={{ fontFamily: 'var(--font-lora)', lineHeight: 'normal' }}
          >
            {content ? (
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            ) : (
              <div className="text-gray-600">No content available</div>
            )}
          </div>
        </article>
      )}
    </>
  );
}
