"use client";

import React, { useMemo, useRef, useState } from "react";
import { Sparkles, Loader2, TriangleAlert, Wand2, Globe, Mic } from "lucide-react";
import FormatSelector from "@/components/FormatSelector";
import LanguageSelector from "@/components/LanguageSelector";
import OutputCard from "@/components/OutputCard";
import { useUILanguage, UILanguage, UI_LANGUAGE_NATIVE_NAMES } from "@/lib/ui-language";
import {
  MAX_TRANSCRIPT_LENGTH,
  MIN_TRANSCRIPT_LENGTH,
  OutputFormat,
  RepurposeData,
  TargetLanguage,
} from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";
type TranscribeStatus = "idle" | "uploading" | "error";

const UI_LANGUAGE_ORDER: UILanguage[] = ["en", "ar", "fr", "es", "tr", "ur", "hi", "de"];

export default function DashboardPage() {
  const [transcript, setTranscript] = useState("");
  const [format, setFormat] = useState<OutputFormat>("twitter");
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("auto");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<RepurposeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useUILanguage();

  const [transcribeStatus, setTranscribeStatus] = useState<TranscribeStatus>("idle");
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = transcript.length;
  const isTooShort = charCount > 0 && charCount < MIN_TRANSCRIPT_LENGTH;
  const isTooLong = charCount > MAX_TRANSCRIPT_LENGTH;
  const canSubmit = useMemo(
    () => charCount >= MIN_TRANSCRIPT_LENGTH && !isTooLong && status !== "loading",
    [charCount, isTooLong, status]
  );

  async function handleRepurpose() {
    if (!canSubmit) return;
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, format, targetLanguage }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          body && typeof body.error === "string"
            ? body.error
            : "Something went wrong. Please try again.";
        setError(message);
        setStatus("error");
        return;
      }

      setResult(body as RepurposeData);
      setStatus("success");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  function handleTranscribeClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so selecting the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    setTranscribeStatus("uploading");
    setTranscribeError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          body && typeof body.error === "string" ? body.error : t.transcribeErrorFallback;
        setTranscribeError(message);
        setTranscribeStatus("error");
        return;
      }

      const text = typeof body?.text === "string" ? body.text : "";
      setTranscript((prev) => (prev.trim().length > 0 ? prev + "\n\n" + text : text));
      setTranscribeStatus("idle");
    } catch {
      setTranscribeError(t.transcribeErrorFallback);
      setTranscribeStatus("error");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 sm:py-14">
      <Header />

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <section className="rounded-card border border-line bg-panel shadow-panel">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-sm font-semibold text-ink">{t.sourceContentTitle}</h2>
              <p className="mt-0.5 text-xs text-ink-soft">{t.sourceContentDesc}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={handleTranscribeClick}
                disabled={transcribeStatus === "uploading" || status === "loading"}
                className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {transcribeStatus === "uploading" ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    {t.transcribingButton}
                  </>
                ) : (
                  <>
                    <Mic size={13} strokeWidth={2} />
                    {t.transcribeButton}
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileSelected}
                className="hidden"
              />
              <span className="text-[10px] text-ink-faint">{t.transcribeHint}</span>
            </div>
          </div>

          <div className="px-5 py-5">
            {transcribeError && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-xs text-red-600">
                {transcribeError}
              </p>
            )}

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={t.textareaPlaceholder}
              rows={12}
              className="focus-ring w-full resize-y rounded-lg border border-line bg-paper/60 p-3.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint"
            />
            <div className="mt-1.5 flex justify-end">
              <span
                dir="ltr"
                className={`font-mono text-[11px] ${
                  isTooLong ? "font-semibold text-red-600" : "text-ink-faint"
                }`}
              >
                {charCount.toLocaleString()}/{MAX_TRANSCRIPT_LENGTH.toLocaleString()}
              </span>
            </div>

            <div className="mt-5">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {t.outputFormatLabel}
              </h3>
              <FormatSelector value={format} onChange={setFormat} disabled={status === "loading"} />
            </div>

            <div className="mt-5">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {t.outputLanguageLabel}
              </h3>
              <LanguageSelector
                value={targetLanguage}
                onChange={setTargetLanguage}
                disabled={status === "loading"}
              />
            </div>

            <button
              type="button"
              onClick={handleRepurpose}
              disabled={!canSubmit}
              className="focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t.repurposingButton}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {t.repurposeButton}
                </>
              )}
            </button>

            {isTooShort && (
              <p className="mt-2 text-xs text-ink-faint">{t.tooShort(MIN_TRANSCRIPT_LENGTH)}</p>
            )}
          </div>
        </section>

        <section aria-live="polite" className="min-h-[420px]">
          {status === "idle" && <EmptyState />}
          {status === "loading" && <LoadingState />}
          {status === "error" && error && <ErrorState message={error} onRetry={handleRepurpose} />}
          {status === "success" && result && <OutputCard result={result} />}
        </section>
      </div>

      <ContactForm />
    </main>
  );
}

function Header() {
  const { t, lang, setLang } = useUILanguage();
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper">
          <Wand2 size={18} />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{t.appTitle}</h1>
          <p className="text-sm text-ink-soft">{t.appTagline}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5">
        <Globe size={15} strokeWidth={2} className="shrink-0 text-ink-faint" />
        <select
          aria-label={t.siteLanguageLabel}
          value={lang}
          onChange={(e) => setLang(e.target.value as UILanguage)}
          className="focus-ring bg-transparent text-sm font-medium text-ink-soft"
        >
          {UI_LANGUAGE_ORDER.map((code) => (
            <option key={code} value={code}>
              {UI_LANGUAGE_NATIVE_NAMES[code]}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

function EmptyState() {
  const { t } = useUILanguage();
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-card border border-dashed border-line px-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Sparkles size={18} />
      </div>
      <p className="text-sm font-medium text-ink">{t.emptyStateTitle}</p>
      <p className="mt-1 max-w-xs text-xs text-ink-soft">{t.emptyStateDesc}</p>
    </div>
  );
}

function LoadingState() {
  const { t } = useUILanguage();
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-card border border-line bg-panel px-8 text-center shadow-panel">
      <Loader2 size={22} className="mb-3 animate-spin text-accent" />
      <p className="animate-pulse-soft text-sm font-medium text-ink">{t.loadingTitle}</p>
      <p className="mt-1 text-xs text-ink-soft">{t.loadingDesc}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useUILanguage();
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-card border border-red-200 bg-red-50/60 px-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
        <TriangleAlert size={18} />
      </div>
      <p className="text-sm font-medium text-ink">{t.errorTitle}</p>
      <p className="mt-1 max-w-sm text-xs text-ink-soft">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-4 rounded-full border border-line bg-panel px-4 py-2 text-xs font-medium text-ink hover:border-ink-faint"
      >
        {t.tryAgain}
      </button>
    </div>
  );
}

function ContactForm() {
  const { t } = useUILanguage();
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();

      if (!res.ok) {
        setErrorMsg(body.error ?? t.contactErrorFallback);
        setStatus("error");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setErrorMsg(t.contactErrorFallback);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 mb-8 p-6 bg-panel border border-line rounded-card shadow-panel text-center">
      <h3 className="text-lg font-semibold text-ink mb-1">{t.contactTitle}</h3>
      <p className="text-ink-soft text-xs mb-4">{t.contactDesc}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" name="name" required placeholder={t.namePlaceholder}
          className="w-full px-3 py-2 rounded-md bg-panel border border-line text-ink text-sm focus:outline-none focus:border-accent" />
        <input type="email" name="email" required placeholder={t.emailPlaceholder} dir="ltr"
          className="w-full px-3 py-2 rounded-md bg-panel border border-line text-ink text-sm focus:outline-none focus:border-accent" />
        <textarea name="message" rows={3} required placeholder={t.messagePlaceholder}
          className="w-full px-3 py-2 rounded-md bg-panel border border-line text-ink text-sm focus:outline-none focus:border-accent" />

        <button type="submit" disabled={status === "loading"}
          className="w-full py-2 rounded-md bg-accent text-white text-xs font-medium hover:opacity-90 transition disabled:opacity-50">
          {status === "loading" ? t.sendingButton : t.sendButton}
        </button>

        {status === "success" && <p className="text-green-500 text-xs mt-2">{t.contactSuccess}</p>}
        {status === "error" && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
      </form>
    </div>
  );
}
