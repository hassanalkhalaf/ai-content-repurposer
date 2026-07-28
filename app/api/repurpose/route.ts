import { NextRequest, NextResponse } from "next/server";
import { generateRepurposedContent, LlmError } from "@/lib/llm";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  MAX_TRANSCRIPT_LENGTH,
  MIN_TRANSCRIPT_LENGTH,
  OutputFormat,
  RepurposeRequestBody,
  TargetLanguage,
} from "@/lib/types";

export const maxDuration = 60;

const VALID_FORMATS: OutputFormat[] = ["twitter", "linkedin", "blog", "instagram"];
const VALID_LANGUAGES: TargetLanguage[] = ["auto", "ar", "en", "fr", "es", "tr", "ur", "hi", "de"];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(req: NextRequest) {
  let body: RepurposeRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { transcript, format, targetLanguage } = body ?? {};

  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    return NextResponse.json(
      { error: "Please paste some text to repurpose." },
      { status: 400 }
    );
  }
  if (transcript.trim().length < MIN_TRANSCRIPT_LENGTH) {
    return NextResponse.json(
      {
        error:
          "That text is too short — add at least " +
          MIN_TRANSCRIPT_LENGTH +
          " characters so there's enough to work with.",
      },
      { status: 400 }
    );
  }
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return NextResponse.json(
      {
        error:
          "That text is too long — please keep it under " +
          MAX_TRANSCRIPT_LENGTH.toLocaleString() +
          " characters.",
      },
      { status: 400 }
    );
  }
  if (!format || !VALID_FORMATS.includes(format)) {
    return NextResponse.json(
      { error: "Please choose a valid output format." },
      { status: 400 }
    );
  }

  const resolvedLanguage: TargetLanguage =
    targetLanguage && VALID_LANGUAGES.includes(targetLanguage) ? targetLanguage : "auto";

  // --- Auth ---
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to generate content.", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // --- Quota check (before generating, so we never bill for work we refuse) ---
  const admin = createSupabaseAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("words_used, words_limit, subscription_tier")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Could not load profile for quota check:", profileError);
    return NextResponse.json(
      { error: "Could not verify your account. Please try again." },
      { status: 500 }
    );
  }

  const inputWords = countWords(transcript);
  const wordsUsed = profile.words_used ?? 0;
  const wordsLimit = profile.words_limit ?? 5000;
  const remaining = Math.max(wordsLimit - wordsUsed, 0);

  if (inputWords > remaining) {
    return NextResponse.json(
      {
        error:
          "You've used " +
          wordsUsed.toLocaleString() +
          " of your " +
          wordsLimit.toLocaleString() +
          " words this month. This text is " +
          inputWords.toLocaleString() +
          " words, which exceeds your remaining " +
          remaining.toLocaleString() +
          ". Upgrade your plan for more.",
        code: "quota_exceeded",
        wordsUsed,
        wordsLimit,
        remaining,
        tier: profile.subscription_tier,
      },
      { status: 402 }
    );
  }

  // --- Generate ---
  try {
    const result = await generateRepurposedContent(
      transcript.trim(),
      format,
      resolvedLanguage
    );

    // Only charge the user once generation actually succeeded.
    const { error: usageError } = await admin
      .from("profiles")
      .update({ words_used: wordsUsed + inputWords })
      .eq("id", user.id);

    if (usageError) {
      console.error("Failed to increment word usage:", usageError);
    }

    return NextResponse.json(
      {
        ...result,
        usage: {
          wordsUsed: wordsUsed + inputWords,
          wordsLimit,
          remaining: Math.max(wordsLimit - (wordsUsed + inputWords), 0),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Unexpected /api/repurpose error:", err);
    return NextResponse.json(
      { error: "Something went wrong while generating content. Please try again." },
      { status: 500 }
    );
  }
}
