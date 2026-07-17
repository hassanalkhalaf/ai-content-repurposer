"use client";

import clsx from "clsx";
import { FORMAT_LABELS, RepurposeData } from "@/lib/types";
import CopyButton from "./CopyButton";
import { renderMarkdownLite } from "@/lib/markdown-lite";

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

function TwitterOutput({ tweets }: { tweets: string[] }) {
  return (
    <ol className="space-y-3">
      {tweets.map((tweet, i) => {
        const overLimit = tweet.length > 280;
        return (
          <li
            key={i}
            className="rounded-lg border border-line bg-paper/60 p-3.5"
          >
            <div className="mb-2 flex items-center justify-between">
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
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{tweet}</p>
            <div className="mt-2.5 flex justify-end">
              <CopyButton text={tweet} label="Copy" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LinkedInOutput({ post }: { post: string }) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{post}</div>
  );
}

function BlogOutput({ title, content }: { title: string; content: string }) {
  return (
    <article>
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
