import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// OpenAI's Whisper endpoint itself hard-caps uploads at 25MB per file, so we
// enforce the same limit here rather than inventing our own — anything
// larger will be rejected by the provider anyway.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY. Add it to your environment to enable transcription." },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Please attach an audio or video file." },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "That file is too large — please keep it under 25MB." },
      { status: 400 }
    );
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name);
  upstreamForm.append("model", "whisper-1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
      },
      body: upstreamForm,
      signal: controller.signal,
    });

    if (!response.ok) {
      const status = response.status;
      let detail = "";
      try {
        const body = await response.json();
        detail = body?.error?.message ?? "";
      } catch {
      }

      if (status === 401) {
        return NextResponse.json(
          { error: "Server API key was rejected by the provider." },
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
    const text = typeof data?.text === "string" ? data.text : "";
    if (!text.trim()) {
      return NextResponse.json(
        { error: "Transcription came back empty. Please try a different file." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text }, { status: 200 });
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
  }
}
