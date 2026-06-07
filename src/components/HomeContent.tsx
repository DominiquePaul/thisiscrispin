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
      {/* <InteractiveGrainyHero /> */}
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
              I build <a href="https://dream-machines.eu/" className="text-[rgb(30,30,36)] underline decoration-1 underline-offset-4 decoration-[#D0D0D0] transition-colors hover:decoration-[rgb(30,30,36)]" target="_blank" rel="noopener noreferrer">AI models for robotic arms</a> that let small manufacturers match the output of companies ten times their size, and I create spaces for technical builders to meet and exchange ideas.
            </p>
          </div>
          <div className="mt-12">
            <div style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
                <div className="flex items-center space-x-[28px] sm:space-x-[22px]">
                  <a href="https://thisiscrispin.substack.com" target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 448 511.471" fill="#8E8E8E" className="w-5">
                      <path d="M0 0h448v62.804H0V0zm0 229.083h448v282.388L223.954 385.808 0 511.471V229.083zm0-114.542h448v62.804H0v-62.804z"/>
                    </svg>
                  </a>
                  <a href="https://github.com/dominiquePaul" target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 48 48" fill="#8E8E8E" className="w-5" style={{ transform: 'scale(1.4)' }}>
                      <path d="M24,4C12.954,4,4,12.954,4,24c0,8.887,5.801,16.411,13.82,19.016h12.36C38.199,40.411,44,32.887,44,24C44,12.954,35.046,4,24,4z"></path>
                      <path fill="#FFFFFF" d="M36.744,23.334c0-2.31-0.782-4.226-2.117-5.728c0.145-0.325,0.296-0.761,0.371-1.309c0.172-1.25-0.031-2-0.203-2.734s-0.375-1.25-0.375-1.25s-0.922-0.094-1.703,0.172s-1.453,0.469-2.422,1.047c-0.453,0.27-0.909,0.566-1.27,0.806C27.482,13.91,25.785,13.69,24,13.69c-1.801,0-3.513,0.221-5.067,0.652c-0.362-0.241-0.821-0.539-1.277-0.811c-0.969-0.578-1.641-0.781-2.422-1.047s-1.703-0.172-1.703-0.172s-0.203,0.516-0.375,1.25s-0.375,1.484-0.203,2.734c0.077,0.562,0.233,1.006,0.382,1.333c-1.31,1.493-2.078,3.397-2.078,5.704c0,5.983,3.232,8.714,9.121,9.435c-0.687,0.726-1.148,1.656-1.303,2.691c-0.387,0.17-0.833,0.33-1.262,0.394c-1.104,0.167-2.271,0-2.833-0.333s-1.229-1.083-1.729-1.813c-0.422-0.616-1.031-1.331-1.583-1.583c-0.729-0.333-1.438-0.458-1.833-0.396c-0.396,0.063-0.583,0.354-0.5,0.563c0.083,0.208,0.479,0.521,0.896,0.75c0.417,0.229,1.063,0.854,1.438,1.458c0.418,0.674,0.5,1.063,0.854,1.833c0.249,0.542,1.101,1.219,1.708,1.583c0.521,0.313,1.562,0.491,2.688,0.542c0.389,0.018,1.308-0.096,2.083-0.206v3.75c0,0.639-0.585,1.125-1.191,1.013C19.756,43.668,21.833,44,24,44c2.166,0,4.243-0.332,6.19-0.984C29.585,43.127,29,42.641,29,42.002v-5.804c0-1.329-0.527-2.53-1.373-3.425C33.473,32.071,36.744,29.405,36.744,23.334z M11.239,32.727c-0.154-0.079-0.237-0.225-0.185-0.328c0.052-0.103,0.22-0.122,0.374-0.043c0.154,0.079,0.237,0.225,0.185,0.328S11.393,32.806,11.239,32.727z M12.451,33.482c-0.081,0.088-0.255,0.06-0.389-0.062s-0.177-0.293-0.096-0.381c0.081-0.088,0.255-0.06,0.389,0.062S12.532,33.394,12.451,33.482z M13.205,34.732c-0.102,0.072-0.275,0.005-0.386-0.15s-0.118-0.34-0.016-0.412s0.275-0.005,0.386,0.15C13.299,34.475,13.307,34.66,13.205,34.732z M14.288,35.673c-0.069,0.112-0.265,0.117-0.437,0.012s-0.256-0.281-0.187-0.393c0.069-0.112,0.265-0.117,0.437-0.012S14.357,35.561,14.288,35.673z M15.312,36.594c-0.213-0.026-0.371-0.159-0.353-0.297c0.017-0.138,0.204-0.228,0.416-0.202c0.213,0.026,0.371,0.159,0.353,0.297C15.711,36.529,15.525,36.62,15.312,36.594z M16.963,36.833c-0.227-0.013-0.404-0.143-0.395-0.289c0.009-0.146,0.2-0.255,0.427-0.242c0.227,0.013,0.404,0.143,0.395,0.289C17.381,36.738,17.19,36.846,16.963,36.833z M18.521,36.677c-0.242,0-0.438-0.126-0.438-0.281s0.196-0.281,0.438-0.281c0.242,0,0.438,0.126,0.438,0.281S18.762,36.677,18.521,36.677z"></path>
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/in/dominique-paul/" target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 50 50" fill="#8E8E8E" className="w-5" style={{ transform: 'scale(1.4)' }}>
                      <path d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M17,20v19h-6V20H17z M11,14.47c0-1.4,1.2-2.47,3-2.47s2.93,1.07,3,2.47c0,1.4-1.12,2.53-3,2.53C12.2,17,11,15.87,11,14.47z M39,39h-6c0,0,0-9.26,0-10 c0-2-1-4-3.5-4.04h-0.08C27,24.96,26,27.02,26,29c0,0.91,0,10,0,10h-6V20h6v2.56c0,0,1.93-2.56,5.81-2.56 c3.97,0,7.19,2.73,7.19,8.26V39z"></path>
                    </svg>
                  </a>
                  <a href="https://x.com/dominiquecapaul" target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 300 300" fill="#8E8E8E" className="w-5">
                      <path d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z"/>
                    </svg>
                  </a>
                  <Link
                    href="/shots"
                    className="text-[#ADADAD] text-[11px] uppercase tracking-[0.2em] transition-colors duration-200 hover:text-[rgb(18,18,22)]"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    Photographs
                  </Link>
                </div>
                {/* Anonymous note - aligned to the right on wide screens */}
                <div className="flex sm:justify-end">
                  <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-[#ADADAD] text-[11px] uppercase tracking-[0.2em] transition-colors duration-200 cursor-pointer hover:text-[rgb(18,18,22)]"
                        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        Send me an anonymous note
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl p-8 sm:rounded-[20px]">
                      <DialogHeader className="sr-only">
                        <DialogTitle>Send anonymous feedback</DialogTitle>
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