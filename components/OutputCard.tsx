"use client";

import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import { FORMAT_LABELS, RepurposeData } from "@/lib/types";
import CopyButton from "./CopyButton";
import { renderMarkdownLite } from "@/lib/markdown-lite";
import { directionClass } from "@/lib/rtl";

const ACCENTS: Record<RepurposeData["format"], string> = {
  twitter: "text-signal-twitter",
  linkedin: "text-signal-linkedin",
  blog: "text-signal-blog",
};

export default function OutputCard({ result }: { result: RepurposeData }) {
  return (
    <div className="animate-fade-up rounded-card border border-line bg-panel shadow-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className={clsx("text-xs font-semibold uppercase tracking-wide", ACCENTS[result.format])}>
          {FORMAT_LABELS[result.format]}
        </span>
        <CopyButton text={getFullCopyText(result)} label="Copy all" />
      </div>

      <div className="px-5 py-5">
        {result.format === "twitter" && <TwitterOutput tweets={result.data.tweets} />}
        {result.format === "linkedin" && <LinkedInOutput post={result.data.post} />}
        {result.format === "blog" && (
          <BlogOutput title={result.data.title} content={result.data.content} />
        )}
      </div>
    </div>
  );
}

// Builds X's official "compose tweet" URL with the text pre-filled. This is
// the only share method that works without OAuth/API access — it just opens
// X's own compose window; the user still has to tap "Post" themselves.
// There's no equivalent for auto-posting a whole thread without the user
// connecting their account through X's API, which is out of scope here.
function xComposeUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function TwitterOutput({ tweets }: { tweets: string[] }) {
  return (
    <ol className="space-y-3">
      {tweets.map((tweet, i) => {
        const overLimit = tweet.length > 280;
        const { dir, className } = directionClass(tweet);
        return (
          <li
            key={i}
            className="rounded-lg border border-line bg-paper/60 p-3.5"
          >
            <div className="mb-2 flex items-center justify-between" dir="ltr">
              <span className="font-mono text-[11px] text-ink-faint">
                {i + 1}/{tweets.length}
              </span>
              <span
                className={clsx(
                  "font-mono text-[11px]",
                  overLimit ? "font-semibold text-red-600" : "text-ink-faint"
                )}
              >
                {tweet.length}/280
              </span>
            </div>
            <p dir={dir} className={clsx("whitespace-pre-wrap text-sm leading-relaxed text-ink", className)}>
              {tweet}
            </p>
            <div className="mt-2.5 flex items-center justify-end gap-2">
              <a
                href={xComposeUrl(tweet)}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
              >
                <ExternalLink size={13} strokeWidth={2} />
                نشر على X
              </a>
              <CopyButton text={tweet} label="Copy" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LinkedInOutput({ post }: { post: string }) {
  const { dir, className } = directionClass(post);
  return (
    <div dir={dir} className={clsx("whitespace-pre-wrap text-sm leading-relaxed text-ink", className)}>
      {post}
    </div>
  );
}

function BlogOutput({ title, content }: { title: string; content: string }) {
  // Detect direction from the title + content combined so a short title
  // doesn't get misjudged on its own.
  const { dir, className } = directionClass(`${title} ${content}`);
  return (
    <article dir={dir} className={className}>
      <h1 className="mb-3 font-display text-2xl font-bold leading-snug tracking-tight text-ink">
        {title}
      </h1>
      <div>{renderMarkdownLite(content)}</div>
    </article>
  );
}

function getFullCopyText(result: RepurposeData): string {
  switch (result.format) {
    case "twitter":
      return result.data.tweets.map((t, i) => `${i + 1}/${result.data.tweets.length} ${t}`).join("\n\n");
    case "linkedin":
      return result.data.post;
    case "blog":
      return `# ${result.data.title}\n\n${result.data.content}`;
  }
}
