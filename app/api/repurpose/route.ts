export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { generateRepurposedContent, LlmError } from "@/lib/llm";
import {
  MAX_TRANSCRIPT_LENGTH,
  MIN_TRANSCRIPT_LENGTH,
  OutputFormat,
  RepurposeRequestBody,
} from "@/lib/types";

const VALID_FORMATS: OutputFormat[] = ["twitter", "linkedin", "blog"];

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

  const { transcript, format } = body ?? {};

  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    return NextResponse.json(
      { error: "Please paste some text to repurpose." },
      { status: 400 }
    );
  }

  if (transcript.trim().length < MIN_TRANSCRIPT_LENGTH) {
    return NextResponse.json(
      {
        error: `That text is too short — add at least ${MIN_TRANSCRIPT_LENGTH} characters so there's enough to work with.`,
      },
      { status: 400 }
    );
  }

  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return NextResponse.json(
      {
        error: `That text is too long — please keep it under ${MAX_TRANSCRIPT_LENGTH.toLocaleString()} characters.`,
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

  try {
    const result = await generateRepurposedContent(transcript.trim(), format);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // Unexpected failure — never leak internals, never crash the process.
    console.error("Unexpected /api/repurpose error:", err);
    return NextResponse.json(
      { error: "Something went wrong while generating content. Please try again." },
      { status: 500 }
    );
  }
}
