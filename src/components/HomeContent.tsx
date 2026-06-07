"use client";

import { useState } from "react";
import Link from "next/link";
import FeedbackForm from '@/components/FeedbackForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Article {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  href?: string;
}

interface HomeContentProps {
    articles: Article[];
    allTags: string[];
  }

function MinimalList({
  title,
  items,
}: {
  title: string;
  items: Article[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2
        className="text-[11px] uppercase tracking-[0.25em] text-[#B0B0B0] mb-5"
        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
      >
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((article) => (
          <li key={article.id}>
            <Link
              href={article.href ?? `/p/${article.slug}`}
              className="text-[rgb(45,45,52)] text-base transition-colors duration-200 hover:text-[rgb(18,18,22)]"
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomeContent({ articles }: HomeContentProps) {

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const visible = articles.filter((a) => !a.tags.includes("hideOnThisiscrispin"));
  const tools = visible.filter((a) => a.tags.includes("devProjects"));
  const writing = visible.filter((a) => !a.tags.includes("devProjects")).slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen overflow-auto">
      <section className="flex-grow-0 pt-[30vh] px-[5%] sm:px-[10%] 2xl:px-[20%]">
        <div className="max-w-3xl">
          <h1
            className="text-[rgb(30,30,36)] text-4xl sm:text-6xl mb-8 tracking-[-0.03em] leading-[1]"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            Dominique Paul
          </h1>
          <div
            className="max-w-3xl text-base leading-relaxed text-[rgb(90,90,98)] space-y-4"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            <p>
              Europe is unique. Diverse cultures bound by a belief that a society is measured by how it treats its weakest, not its strongest. For those values to stay relevant, Europe has to change. Technology is the greatest force for that change, and young technologists are its sharpest edge. Yet too many leave technical universities convinced they can&apos;t just do whatever they want, or copying foreign playbooks in a chase to earn money. Europe needs more value-driven entrepreneurs solving societal problems.
            </p>
            <p>
              I build <a href="https://dream-machines.eu/" className="underline decoration-1 underline-offset-4 decoration-[#C0C0C0] transition-colors hover:decoration-[rgb(90,90,98)]" target="_blank" rel="noopener noreferrer">AI models for robotic arms</a> that let small manufacturers match the output of companies ten times their size, and I create spaces for technical builders to meet.
            </p>
          </div>
          <div className="mt-12">
            <div style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a href="https://thisiscrispin.substack.com" target="_blank" rel="noopener noreferrer" className="text-[#9A9A9A] text-sm transition-colors duration-200 hover:text-[rgb(18,18,22)]">
                    Substack
                  </a>
                  <a href="https://github.com/dominiquePaul" target="_blank" rel="noopener noreferrer" className="text-[#9A9A9A] text-sm transition-colors duration-200 hover:text-[rgb(18,18,22)]">
                    GitHub
                  </a>
                  <a href="https://www.linkedin.com/in/dominique-paul/" target="_blank" rel="noopener noreferrer" className="text-[#9A9A9A] text-sm transition-colors duration-200 hover:text-[rgb(18,18,22)]">
                    LinkedIn
                  </a>
                  <a href="https://x.com/dominiquecapaul" target="_blank" rel="noopener noreferrer" className="text-[#9A9A9A] text-sm transition-colors duration-200 hover:text-[rgb(18,18,22)]">
                    X
                  </a>
                  <Link
                    href="/shots"
                    className="text-[#9A9A9A] text-sm transition-colors duration-200 hover:text-[rgb(18,18,22)]"
                  >
                    Photography
                  </Link>
                </div>
                {/* Anonymous note - aligned to the right on wide screens */}
                <div className="flex sm:justify-end">
                  <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-[#9A9A9A] text-sm transition-colors duration-200 cursor-pointer hover:text-[rgb(18,18,22)]"
                      >
                        Send anonymous message
                      </button>
                    </DialogTrigger>
                    <DialogContent
                      className="sm:max-w-md gap-0 p-0 rounded-none border-2 border-[rgb(18,18,22)]"
                      style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      <DialogHeader className="sr-only">
                        <DialogTitle>Send anonymous message</DialogTitle>
                        <DialogDescription>Share any thoughts you would like me to read.</DialogDescription>
                      </DialogHeader>
                      <FeedbackForm onSuccess={() => setIsFeedbackOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Minimal link lists - hidden when articles fail to load (e.g. rate limiting) */}
      {visible.length > 0 && (
        <section
          className="px-[5%] sm:px-[10%] 2xl:px-[20%] py-24"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          <div className="max-w-3xl grid gap-12 md:grid-cols-2">
            <MinimalList title="Writing" items={writing} />
            <MinimalList title="Tools" items={tools} />
          </div>
        </section>
      )}
    </div>
  );
}