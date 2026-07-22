"use client";

import { useState } from "react";
import clsx from "clsx";
import { ExternalLink, Check } from "lucide-react";
import { FORMAT_LABELS, RepurposeData } from "@/lib/types";
import CopyButton from "./CopyButton";
import { renderMarkdownLite } from "@/lib/markdown-lite";
import { directionClass } from "@/lib/rtl";

const ACCENTS: Record<RepurposeData["format"], string> = {
  twitter: "text-signal-twitter",
  linkedin: "text-signal-linkedin",
  blog: "text-signal-blog",
  instagram: "text-pink-600",
};

export default function OutputCard({ result }: { result: RepurposeData }) {
  return (
    <div className="animate-fade-up rounded-card border border-line bg-panel shadow-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className={clsx("text-xs font-semibold uppercase tracking-wide", ACCENTS[result.format])}>
          {FORMAT_LABELS[result.format]}
        </span>
        <div className="flex items-center gap-2">
          <ShareButton
            label="نشر على LinkedIn"
            getText={() => getFullCopyText(result)}
            onOpen={() => openInNewTab(linkedinShareUrl())}
          />
          <ShareButton
            label="نشر على Instagram"
            getText={() => getFullCopyText(result)}
            onOpen={openInstagram}
          />
          <CopyButton text={getFullCopyText(result)} label="Copy all" />
        </div>
      </div>

      <div className="px-5 py-5">
        {result.format === "twitter" && <TwitterOutput tweets={result.data.tweets} />}
        {result.format === "linkedin" && <LinkedInOutput post={result.data.post} />}
        {result.format === "blog" && (
          <BlogOutput title={result.data.title} content={result.data.content} />
        )}
        {result.format === "instagram" && (
          <InstagramOutput
            hook={result.data.hook}
            points={result.data.points}
            cta={result.data.cta}
            hashtags={result.data.hashtags}
          />
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

// LinkedIn and Instagram don't offer a "compose with prefilled text" URL the
// way X does — neither exposes a public share endpoint that accepts text
// without OAuth. The practical workaround is copy-to-clipboard + open the
// platform, so the user pastes the text themselves once they're there.
function linkedinShareUrl(): string {
  return `https://www.linkedin.com/feed/?shareActive=true`;
}

function instagramShareUrl(): string {
  return `https://www.instagram.com/`;
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// On desktop there's no app to deep-link into, and delaying window.open()
// even briefly (e.g. inside a setTimeout fallback) makes most browsers
// treat it as an untrusted popup and silently block it — so on desktop we
// skip the deep link entirely and open the website immediately, in the
// same click handler, which keeps it a "trusted" popup.
//
// On mobile we try the app deep link first (opens straight to Instagram's
// new-post/camera screen if the app is installed) and fall back to the
// website only if the tab is still visible after a short delay — that
// delay is fine on mobile because navigating to the app (not a popup)
// isn't subject to the same blocking behavior.
function openInstagram() {
  if (!isMobileDevice()) {
    openInNewTab(instagramShareUrl());
    return;
  }

  const fallbackTimer = window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      openInNewTab(instagramShareUrl());
    }
  }, 1200);

  const clearFallback = () => window.clearTimeout(fallbackTimer);
  document.addEventListener("visibilitychange", clearFallback, { once: true });

  window.location.href = "instagram://camera";
}

// A share button that copies the given text to the clipboard, opens the
// target platform in a new tab, and shows a brief "Copied" confirmation so
// the user knows the clipboard step actually worked (clipboard writes can
// silently fail, e.g. if the page loses focus right as a new tab opens).
function ShareButton({
  label,
  getText,
  onOpen,
}: {
  label: string;
  getText: () => string;
  onOpen: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setStatus("copied");
    } catch {
      setStatus("failed");
    } finally {
      onOpen();
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="focus-ring relative inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
    >
      {status === "copied" && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-paper shadow-panel">
          <span className="inline-flex items-center gap-1">
            <Check size={12} strokeWidth={2.5} />
            تم النسخ
          </span>
        </span>
      )}
      {status === "failed" && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-paper shadow-panel">
          فشل النسخ — انسخ يدويًا
        </span>
      )}
      {label}
    </button>
  );
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

function InstagramOutput({
  hook,
  points,
  cta,
  hashtags,
}: {
  hook: string;
  points: string[];
  cta: string;
  hashtags: string[];
}) {
  const { dir, className } = directionClass(`${hook} ${points.join(" ")} ${cta}`);
  return (
    <div dir={dir} className={clsx("space-y-4 text-sm leading-relaxed text-ink", className)}>
      <p className="font-semibold">{hook}</p>
      <ul className="space-y-1.5">
        {points.map((point, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-pink-500">•</span>
            <span className="whitespace-pre-wrap">{point}</span>
          </li>
        ))}
      </ul>
      <p>{cta}</p>
      <p className="text-ink-faint" dir="ltr">
        {hashtags.map((tag) => `#${tag}`).join(" ")}
      </p>
    </div>
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
    case "instagram":
      return (
        result.data.hook +
        "\n\n" +
        result.data.points.map((p) => `• ${p}`).join("\n") +
        "\n\n" +
        result.data.cta +
        "\n\n" +
        result.data.hashtags.map((tag) => `#${tag}`).join(" ")
      );
  }
}
