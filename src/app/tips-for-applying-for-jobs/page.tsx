import type { Metadata } from "next";
import PageViewTracker from "@/components/PageViewTracker";

export const metadata: Metadata = {
  title: "Tips for applying for jobs",
  description:
    "Patterns I noticed after reading over 100 job applications. Observations, not rules.",
};

const CV_TEMPLATE_URL =
  "https://www.overleaf.com/articles/sarvesh-parabs-resume/ykttqtjgwssv";

const LINK_CLASS =
  "text-[rgb(18,18,22)] underline decoration-1 underline-offset-2 decoration-[#C8C8C8] transition-colors hover:decoration-[rgb(18,18,22)]";

export default function TipsForApplyingForJobsPage() {
  return (
    <div className="min-h-screen pt-20">
      <PageViewTracker slug="tips-for-applying-for-jobs" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <article className="pt-14">
          <h1
            className="text-4xl sm:text-5xl mb-4 tracking-[-0.03em] leading-[1.05] text-[rgb(18,18,22)]"
            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
          >
            Tips for applying for jobs
          </h1>
          <div
            className="text-[#9A9A9A] mb-12 text-xs uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
          >
            September 23, 2026
          </div>
          <div
            className="prose prose-neutral prose-base max-w-none text-[rgb(45,45,52)]"
            style={{ fontFamily: "var(--font-dm-sans)", lineHeight: 1.6 }}
          >
            <p>
              I&apos;ve read over 100 applications and noticed patterns. Rather
              than write individual feedback, I wrote them down once.
              Observations, not rules.
            </p>
            <p>
              Unless you come through an intro, nobody spends long on your
              application. They&apos;re looking for one good reason to talk to
              you. Make it easy to find.
            </p>

            <ol>
              <li>
                <strong>Use a clean CV.</strong> Professional and easy to scan.
              </li>
              <li>
                <strong>Send the short version.</strong> Link to a longer one on
                your website if you need to.
              </li>
              <li>
                <strong>Put your grades on it.</strong> No grades and I assume
                they&apos;re bad.{" "}
                <a href={CV_TEMPLATE_URL} className={LINK_CLASS}>
                  This template
                </a>{" "}
                does it well.
              </li>
              <li>
                <strong>Let the job find you.</strong> I scout LinkedIn for good
                people constantly.
              </li>
              <li>
                <strong>Fill in your LinkedIn.</strong> Grades, one or two
                projects you&apos;re proud of, and two work experiences with what
                you actually did.
              </li>
              <li>
                <strong>Have a personal website.</strong> A few good projects is
                enough.
              </li>
              <li>
                <strong>Write a few blog posts.</strong> Interesting people have
                interesting things to say.
              </li>
              <li>
                <strong>One great project beats five small ones.</strong> Nobody
                reads five.
              </li>
            </ol>

            <hr />
            <p>
              If I sent you here from an email, it was this or writing the same
              three paragraphs a hundred times.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
