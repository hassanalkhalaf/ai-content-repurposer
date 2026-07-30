"use client";

import { MessageSquareText, Briefcase, Newspaper, Instagram } from "lucide-react";
import clsx from "clsx";
import { OutputFormat } from "@/lib/types";
import { useUILanguage } from "@/lib/ui-language";

interface FormatOption {
  value: OutputFormat;
  icon: typeof MessageSquareText;
  activeClasses: string;
}

const OPTIONS: FormatOption[] = [
  {
    value: "twitter",
    icon: MessageSquareText,
    activeClasses: "border-signal-twitter/30 bg-signal-twitter/[0.06] text-signal-twitter",
  },
  {
    value: "linkedin",
    icon: Briefcase,
    activeClasses: "border-signal-linkedin/30 bg-signal-linkedin/[0.06] text-signal-linkedin",
  },
  {
    value: "blog",
    icon: Newspaper,
    activeClasses: "border-signal-blog/30 bg-signal-blog/[0.06] text-signal-blog",
  },
  {
    value: "instagram",
    icon: Instagram,
    activeClasses: "border-pink-500/30 bg-pink-500/[0.06] text-pink-600",
  },
];

interface Props {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
  disabled?: boolean;
}

export default function FormatSelector({ value, onChange, disabled }: Props) {
  const { t } = useUILanguage();

  const COPY: Record<OutputFormat, { label: string; sub: string }> = {
    twitter: { label: t.twitterLabel, sub: t.twitterSub },
    linkedin: { label: t.linkedinLabel, sub: t.linkedinSub },
    blog: { label: t.blogLabel, sub: t.blogSub },
    instagram: { label: t.instagramLabel, sub: t.instagramSub },
  };
  return (
    <div
      role="radiogroup"
      aria-label="Output format"
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
    >
      {OPTIONS.map((opt) => {
        const isActive = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={clsx(
              "focus-ring flex items-center gap-3 rounded-card border px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              isActive
                ? opt.activeClasses
                : "border-line bg-panel text-ink-soft hover:border-ink-faint"
            )}
          >
            <Icon size={18} strokeWidth={2} className="shrink-0" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{COPY[opt.value].label}</span>
              <span className="text-xs text-ink-faint">{COPY[opt.value].sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
