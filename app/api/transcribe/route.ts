import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const maxDuration = 60;

// Deepgram accepts far larger files, but Vercel Blob upload + a 60s function
// timeout are the real ceiling here, so we keep the same 25MB guard.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

// Transcription costs real money per minute of audio, so it's a paid feature.
const PAID_TIERS = ["starter", "pro"];

const CLEANUP_PROMPT = `أنت محرّر متخصص في معالجة وتدقيق نصوص التفريغ الصوتي.

النص التالي مفرّغ آلياً من محتوى عربي قد يكون مختلطاً بالإنجليزية، ويحتوي على أخطاء لفظية وتكرارات وكلمات وجمل إنجليزية كُتبت صوتياً بحروف عربية.

التعليمات:

1. أعد كتابة أي كلمة أو جملة إنجليزية نُطقت في التسجيل بحروفها الإنجليزية الصحيحة. مثال: "و ك ذس" ← "We did this"، "بوث" ← "Booth"، "دفت" ← "Drift".

2. المصطلحات التقنية وأسماء المنصات اكتبها بالإنجليزية بين قوسين بعد العربية عند أول ورود، هكذا: البوث (Booth).

3. أصلح الأخطاء اللفظية الواضحة في العربية، وأبقِ روح اللهجة كما هي.

4. أزل التكرارات الناتجة عن التلعثم، واحتفظ بورود واحد من العبارات المكررة.

5. أضف علامات الترقيم المناسبة، وقسّم النص إلى جمل وفقرات مفهومة.

6. لا تضف معلومات غير موجودة في النص الخام. إذا تعذّر فهم مقطع تماماً، ضع [غير واضح].

7. أخرج النص المنظّف فقط، وابدأ ردك مباشرة بأول كلمة منه.

النص الخام:`;

export async function POST(req: NextRequest) {
  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramKey) {
    return NextResponse.json(
      { error: "Server is missing DEEPGRAM_API_KEY. Add it to your environment to enable transcription." },
      { status: 500 }
    );
  }

  let body: { blobUrl?: string; fileName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { blobUrl } = body;
  if (typeof blobUrl !== "string" || blobUrl.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing uploaded file reference." },
      { status: 400 }
    );
  }

  // --- Auth ---
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await safeDeleteBlob(blobUrl);
    return NextResponse.json(
      { error: "Please sign in to transcribe audio.", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // --- Plan gate ---
  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    await safeDeleteBlob(blobUrl);
    return NextResponse.json(
      { error: "Could not verify your account. Please try again." },
      { status: 500 }
    );
  }

  if (!PAID_TIERS.includes(profile.subscription_tier)) {
    await safeDeleteBlob(blobUrl);
    return NextResponse.json(
      {
        error: "Audio and video transcription is available on the Starter and Pro plans.",
        code: "upgrade_required",
        tier: profile.subscription_tier,
      },
      { status: 402 }
    );
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  let fileBuffer: ArrayBuffer;
  let contentType: string;
  try {
    const blobResponse = await fetch(blobUrl, {
      headers: blobToken ? { Authorization: "Bearer " + blobToken } : {},
    });

    if (!blobResponse.ok) {
      return NextResponse.json(
        { error: "Could not retrieve the uploaded file. Please try uploading again." },
        { status: 502 }
      );
    }

    contentType = blobResponse.headers.get("content-type") ?? "application/octet-stream";
    fileBuffer = await blobResponse.arrayBuffer();
  } catch {
    return NextResponse.json(
      { error: "Could not retrieve the uploaded file. Please try uploading again." },
      { status: 502 }
    );
  }

  if (fileBuffer.byteLength === 0) {
    await safeDeleteBlob(blobUrl);
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
    await safeDeleteBlob(blobUrl);
    return NextResponse.json(
      { error: "That file is too large — please keep it under 25MB." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  let rawText = "";

  try {
    const dgUrl =
"https://api.deepgram.com/v1/listen?model=nova-3&language=ar&smart_format=true&punctuate=true";    const response = await fetch(dgUrl, {
      method: "POST",
      headers: {
        Authorization: "Token " + deepgramKey,
        "Content-Type": contentType,
      },
      body: fileBuffer,
      signal: controller.signal,
    });

    if (!response.ok) {
      const status = response.status;
      let detail = "";
      try {
        const errBody = await response.json();
        detail = errBody?.err_msg ?? errBody?.error ?? "";
      } catch {
      }

      if (status === 401 || status === 403) {
        return NextResponse.json(
          { error: "Server API key was rejected by the transcription provider." },
          { status: 500 }
        );
      }
      if (status === 429) {
        return NextResponse.json(
          { error: "Transcription is temporarily rate-limited. Please try again in a moment." },
          { status: 429 }
        );
      }
      if (status >= 500) {
        return NextResponse.json(
          { error: "The transcription provider is temporarily unavailable. Please try again shortly." },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: "Transcription provider rejected the request" + (detail ? ": " + detail : ".") },
        { status: 502 }
      );
    }

    const data = await response.json();
    rawText =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Transcription came back empty. Please try a different file." },
        { status: 502 }
      );
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Transcription took too long and was cancelled. Try a shorter file." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Could not reach the transcription provider. Check your connection and try again." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
    await safeDeleteBlob(blobUrl);
  }

  // --- Cleanup pass. If it fails for any reason we fall back to the raw text
  // rather than failing the whole request, since raw output is still usable.
  const cleaned = await cleanupTranscript(rawText);

  return NextResponse.json({ text: cleaned ?? rawText }, { status: 200 });
}

async function cleanupTranscript(rawText: string): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: CLEANUP_PROMPT + "\n\n" + rawText,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.content
      ?.filter((block: any) => block?.type === "text")
      ?.map((block: any) => block?.text ?? "")
      ?.join("\n")
      ?.trim();

    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function safeDeleteBlob(url: string) {
  try {
    await del(url);
  } catch {
  }
}
