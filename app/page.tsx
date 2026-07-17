"use client";

import { useMemo, useState } from "react";
import { Sparkles, Loader2, TriangleAlert, Wand2 } from "lucide-react";
import FormatSelector from "@/components/FormatSelector";
import OutputCard from "@/components/OutputCard";
import {
  MAX_TRANSCRIPT_LENGTH,
  MIN_TRANSCRIPT_LENGTH,
  OutputFormat,
  RepurposeData,
} from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

export default function DashboardPage() {
  const [transcript, setTranscript] = useState("");
  const [format, setFormat] = useState<OutputFormat>("twitter");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<RepurposeData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ transcript, format }),
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

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 sm:py-14">
      <Header />

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* Input panel */}
        <section className="rounded-card border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-ink">Source content</h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              Paste a video transcript, podcast notes, or any long-form text.
            </p>
          </div>

          <div className="px-5 py-5">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your transcript or long-form text here…"
              rows={12}
              className="focus-ring w-full resize-y rounded-lg border border-line bg-paper/60 p-3.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint"
            />
            <div className="mt-1.5 flex justify-end">
              <span
                className={`font-mono text-[11px] ${
                  isTooLong ? "font-semibold text-red-600" : "text-ink-faint"
                }`}
              >
                {charCount.toLocaleString()}/{MAX_TRANSCRIPT_LENGTH.toLocaleString()}
              </span>
            </div>

            <div className="mt-5">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Output format
              </h3>
              <FormatSelector value={format} onChange={setFormat} disabled={status === "loading"} />
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
                  Repurposing…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Repurpose Content
                </>
              )}
            </button>

            {isTooShort && (
              <p className="mt-2 text-xs text-ink-faint">
                Add at least {MIN_TRANSCRIPT_LENGTH} characters to enable generation.
              </p>
            )}
          </div>
        </section>

        {/* Output panel */}
        <section aria-live="polite" className="min-h-[420px]">
          {status === "idle" && <EmptyState />}
          {status === "loading" && <LoadingState />}
          {status === "error" && error && <ErrorState message={error} onRetry={handleRepurpose} />}
          {status === "success" && result && <OutputCard result={result} />}
        </section>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper">
        <Wand2 size={18} />
      </div>
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Repurpose</h1>
        <p className="text-sm text-ink-soft">One transcript in. Every format out.</p>
      </div>
    </header>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-card border border-dashed border-line px-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Sparkles size={18} />
      </div>
      <p className="text-sm font-medium text-ink">Your generated content will show up here</p>
      <p className="mt-1 max-w-xs text-xs text-ink-soft">
        Paste your source text, pick a format, and hit Repurpose Content.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-card border border-line bg-panel px-8 text-center shadow-panel">
      <Loader2 size={22} className="mb-3 animate-spin text-accent" />
      <p className="animate-pulse-soft text-sm font-medium text-ink">Rewriting your content…</p>
      <p className="mt-1 text-xs text-ink-soft">This usually takes a few seconds.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-card border border-red-200 bg-red-50/60 px-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
        <TriangleAlert size={18} />
      </div>
      <p className="text-sm font-medium text-ink">Generation failed</p>
      <p className="mt-1 max-w-sm text-xs text-ink-soft">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-4 rounded-full border border-line bg-panel px-4 py-2 text-xs font-medium text-ink hover:border-ink-faint"
      >
        Try again
      </button>
    </div>
  );
}

// دالة إرسال الرسائل لـ Web3Forms
async function sendContactMessage(formData: FormData) {
  // تذكر استبدال المفتاح بالـ Access Key الخاص بك من موقع web3forms
  formData.append("access_key", "YOUR_ACCESS_KEY_HERE"); 

  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    body: formData
  });
  return await response.json();
}

function ContactForm() {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);
    try {
      const data = await sendContactMessage(formData);
      if (data.success) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  function ContactForm() {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);
    try {
      const data = await sendContactMessage(formData);
      if (data.success) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 mb-8 p-6 bg-panel border border-line rounded-card shadow-panel text-center">
      <h3 className="text-lg font-semibold text-ink mb-1">تواصل معي ✉️</h3>
      <p className="text-ink-soft text-xs mb-4">لديك ملاحظة أو فكرة لتطوير الموقع؟ أرسل لي مباشرة!</p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <input 
          type="text" 
          name="name" 
          required 
          placeholder="اسمك الكريم"
          className="w-full px-3 py-2 rounded-md bg-panel border border-line text-ink text-sm text-right focus:outline-none focus:border-accent"
        />
        <input 
          type="email" 
          name="email" 
          required 
          placeholder="بريدك الإلكتروني"
          className="w-full px-3 py-2 rounded-md bg-panel border border-line text-ink text-sm text-left focus:outline-none focus:border-accent"
        />
        <textarea 
          name="message" 
          rows={3} 
          required 
          placeholder="اكتب اقتراحك أو رسالتك هنا..."
          className="w-full px-3 py-2 rounded-md bg-panel border border-line text-ink text-sm text-right focus:outline-none focus:border-accent"
        ></textarea>
        
        <button 
          type="submit" 
          disabled={status === "loading"}
          className="w-full py-2 rounded-md bg-accent text-white text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {status === "loading" ? "جاري الإرسال..." : "إرسال الرسالة"}
        </button>

        {status === "success" && <p className="text-green-500 text-xs mt-2">تم الإرسال بنجاح! شكراً لك ❤️</p>}
        {status === "error" && <p className="text-red-500 text-xs mt-2">حدث خطأ، يرجى المحاولة لاحقاً.</p>}
      </form>
    </div>
  );
}
      </form>
    </div>
  );
}


