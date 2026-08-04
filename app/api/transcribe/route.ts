import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
const PAID_TIERS = ["starter", "pro"];

const CLEANUP_PROMPT = `أنت مدقّق لنصوص التفريغ الصوتي العربي باللهجة الخليجية.

مهمتك محدودة جداً: تحسين قابلية القراءة فقط.

افعل هذا فقط:
1. أضف علامات الترقيم وقسّم النص إلى فقرات.
2. أزل التكرار الناتج عن التلعثم مثل "ك ك" و"اا".

ممنوع منعاً باتاً:
- لا تترجم أي كلمة عربية إلى الإنجليزية.
- لا تضع أي كلمة إنجليزية بين قوسين بعد كلمة عربية.
- لا تستبدل كلمة بكلمة أخرى تظنها أصح.
- لا تخمّن أسماء منتجات أو منصات. اترك ما هو مكتوب كما هو.
- لا تضف أي معلومة غير موجودة.

الكلمات الخليجية العامية مثل: سلف، كبت، يسولف، سالفة، دحين، هني، شلون، عساس — هذي كلمات عربية صحيحة، اتركها كما هي تماماً.

إذا كان مقطع غير مفهوم، اتركه كما هو ولا تحاول إصلاحه.

أخرج النص فقط، وابدأ مباشرة بأول كلمة.

النص:`;

export async function POST(req: NextRequest) {
  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramKey) {
    return NextResponse.json(
      { error: "Server is missing DEEPGRAM_API_KEY." },
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
  const timeout = setTimeout(() => controller.abort(), 20000);

  let rawText = "";

  try {
    const dgUrl =
      "https://api.deepgram.com/v1/listen?model=nova-3&language=ar&smart_format=true&punctuate=true";

    const response = await fetch(dgUrl, {
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

      console.error("DEEPGRAM: returned " + status + " — " + detail);

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
          { error: "The transcription provider is temporarily unavailable." },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: "Transcription provider rejected the request" + (detail ? ": " + detail : ".") },
        { status: 502 }
      );
    }

    const data = await response.json();
    rawText = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Transcription came back empty. Please try a different file." },
        { status: 502 }
      );
    }

    console.log("DEEPGRAM: ok, " + rawText.length + " chars.");
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Transcription took too long and was cancelled. Try a shorter file." },
        { status: 504 }
      );
    }
    console.error("DEEPGRAM: request failed.");
    return NextResponse.json(
      { error: "Could not reach the transcription provider." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
    await safeDeleteBlob(blobUrl);
  }

  const cleaned = await cleanupTranscript(rawText);

  return NextResponse.json({ text: cleaned ?? rawText }, { status: 200 });
}

async function cleanupTranscript(rawText: string): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error("CLEANUP: ANTHROPIC_API_KEY is missing.");
    return null;
  }

  const started = Date.now();
  console.log("CLEANUP: starting, input " + rawText.length + " chars.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 33000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: CLEANUP_PROMPT + "\n\n" + rawText,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("CLEANUP: Anthropic returned " + response.status + " — " + detail);
      return null;
    }

    const data = await response.json();
    const text = data?.content
      ?.filter((block: any) => block?.type === "text")
      ?.map((block: any) => block?.text ?? "")
      ?.join("\n")
      ?.trim();

    if (!text) {
      console.error("CLEANUP: no text block in response.");
      return null;
    }

    console.log(
      "CLEANUP: success in " + (Date.now() - started) + "ms, " + text.length + " chars."
    );
    return text;
  } catch (err: any) {
    console.error(
      "CLEANUP: failed after " + (Date.now() - started) + "ms — " + (err?.name ?? "") + " " + (err?.message ?? "")
    );
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
