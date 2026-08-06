import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// This route does NOT receive the audio/video file itself — that's the
// whole point. The browser calls this route first to get a short-lived,
// scoped upload token, then uploads the file directly to Vercel Blob using
// that token. This sidesteps Vercel's 4.5MB serverless function request
// body limit entirely, since the file bytes never pass through our server.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          // Deepgram fetches the recording by URL rather than receiving the
          // bytes from us, so the blob has to be publicly readable. URLs
          // carry a random suffix and are effectively unguessable, and the
          // file is deleted right after transcription in /api/transcribe.
          access: "public",
          addRandomSuffix: true,
          // Deepgram handles far larger files than Whisper did. This ceiling
          // is a guard against runaway storage use, not a provider limit.
          maximumSizeInBytes: 500 * 1024 * 1024,
          // Restrict to audio/video so this token can't be used to upload
          // arbitrary files.
          allowedContentTypes: ["audio/*", "video/*"],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async () => {
        // No-op: nothing to persist. The client receives the blob URL
        // directly from upload() and immediately calls /api/transcribe
        // with it.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 400 }
    );
  }
}
