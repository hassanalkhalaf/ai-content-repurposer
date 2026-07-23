"use client";

import { Languages } from "lucide-react";
import { TargetLanguage } from "@/lib/types";
import { useUILanguage, UI_LANGUAGE_NATIVE_NAMES, UILanguage } from "@/lib/ui-language";

// Same 8 language codes as the UI language switcher, plus "auto" for
// "match the source text's language". We deliberately show each language's
// name in its OWN script (e.g. "Français", "العربية") rather than
// translating it into whatever the site's current UI language is — that's
// both the standard convention for language pickers and avoids needing a
// separate translated label for every language in every language.
const TARGET_LANGUAGE_ORDER: TargetLanguage[] = ["auto", "ar", "en", "fr", "es", "tr", "ur", "hi", "de"];

interface Props {
  value: TargetLanguage;
  onChange: (lang: TargetLanguage) => void;
  disabled?: boolean;
}

export default function LanguageSelector({ value, onChange, disabled }: Props) {
  const { t } = useUILanguage();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3.5 py-2.5">
      <Languages size={16} strokeWidth={2} className="shrink-0 text-ink-faint" />
      <select
        aria-label={t.outputLanguageLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as TargetLanguage)}
        disabled={disabled}
        className="focus-ring w-full bg-transparent text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {TARGET_LANGUAGE_ORDER.map((code) => (
          <option key={code} value={code}>
            {code === "auto" ? t.sameAsSourceLanguage : UI_LANGUAGE_NATIVE_NAMES[code as UILanguage]}
          </option>
        ))}
      </select>
    </div>
  );
}
