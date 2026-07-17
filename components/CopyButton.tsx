"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import clsx from "clsx";

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export default function CopyButton({ text, label = "Copy", className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — fail quietly,
      // the button just won't flip to "Copied".
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={clsx(
        "focus-ring inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink",
        className
      )}
    >
      {copied ? (
        <>
          <Check size={13} strokeWidth={2.5} className="text-signal-linkedin" />
          Copied
        </>
      ) : (
        <>
          <Copy size={13} strokeWidth={2} />
          {label}
        </>
      )}
    </button>
  );
}
