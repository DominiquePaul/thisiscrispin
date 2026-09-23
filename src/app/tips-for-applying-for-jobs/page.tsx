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
              I&apos;ve read over 100 applications by now, and after a while the
              same patterns keep showing up. Instead of writing everyone
              individual feedback, I wrote down what I noticed once. These are
              my observations, not rules. Other people hiring will disagree
              with some of them. I mainly wanted something I can link to in
              emails, and there was no reason not to make it public.
            </p>
            <p>
              One thing sits underneath all of it. Unless your application comes
              through an intro, the person reading it won&apos;t spend much time
              on it. They&apos;re looking for one good reason to talk to you.
              Make that reason easy to find.
            </p>

            <h2>1. A CV that&apos;s easy to read</h2>
            <p>
              Use a clean, professional format. Keep it short. If you have more
              to say, put a longer version on your website and link to it, but
              send the short one.
            </p>
            <p>
              Put your grades on it.{" "}
              <a href={CV_TEMPLATE_URL} className={LINK_CLASS}>
                This template
              </a>{" "}
              is a good example of how. When I don&apos;t see grades on a CV, I
              assume they&apos;re bad, or at least that the applicant thinks
              they are. That&apos;s probably unfair sometimes. It&apos;s still
              what happens.
            </p>

            <h2>2. Let the job find you</h2>
            <p>
              Ideally you aren&apos;t planning for a job at all. The job finds
              you. I scout LinkedIn for good people all the time, and most
              profiles give me very little to go on.
            </p>
            <p>
              Put your grades on your LinkedIn too. Add one or two projects
              you&apos;re really proud of, and two work experiences with a line
              on what you actually did there.
            </p>

            <h2>3. Have a personal website</h2>
            <p>
              It doesn&apos;t need much. Mine shows a few good projects and not
              much else. A few blog posts are a big plus. In my experience,
              interesting people have interesting things to say, and a website
              where you&apos;ve written some of them down is a good signal.
            </p>
            <p>
              One really good project beats many small ones. Nobody has time to
              read five anyway. They&apos;re still looking for one reason to
              speak to you.
            </p>

            <hr />
            <p>
              If I sent you here from an email, that&apos;s why. It was either
              this or writing the same three paragraphs a hundred times.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
