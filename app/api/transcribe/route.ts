import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";

export const maxDuration = 60;

// This mirrors OpenAI Whisper's own 25MB hard limit per file. It's enforced
// again here (in addition to at Blob-upload time) as a second safety net.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY. Add it to your environment to enable transcription." },
      { status: 500 }
    );
  }

  let body: { blobUrl?: string; fileName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { blobUrl, fileName } = body;
  if (typeof blobUrl !== "string" || blobUrl.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing uploaded file reference." },
      { status: 400 }
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

  const upstreamForm = new FormData();
  const fileBlob = new Blob([fileBuffer], { type: contentType });
  upstreamForm.append("file", fileBlob, fileName || "audio");
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
        const errBody = await response.json();
        detail = errBody?.error?.message ?? "";
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
