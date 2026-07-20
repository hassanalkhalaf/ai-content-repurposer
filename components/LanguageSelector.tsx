"use client";

import { Languages } from "lucide-react";
import { LANGUAGE_LABELS, TargetLanguage } from "@/lib/types";

const LANGUAGE_ORDER: TargetLanguage[] = ["auto", "ar", "en", "fr", "es", "tr", "ur", "hi", "de"];

interface Props {
  value: TargetLanguage;
  onChange: (lang: TargetLanguage) => void;
  disabled?: boolean;
}

export default function LanguageSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Languages size={15} strokeWidth={2} className="shrink-0 text-ink-faint" />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as TargetLanguage)}
        className="focus-ring w-full rounded-lg border border-line bg-paper/60 px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {LANGUAGE_ORDER.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>
    </div>
  );
}
