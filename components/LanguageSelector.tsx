import { getSystemPrompt } from "./prompts";
import {
  BlogArticleResult,
  InstagramCaptionResult,
  LinkedInPostResult,
  OutputFormat,
  RepurposeData,
  TargetLanguage,
  TwitterThreadResult,
} from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
const REQUEST_TIMEOUT_MS = 55000;

const MAX_TOKENS_BY_FORMAT: Record<OutputFormat, number> = {
  twitter: 900,
  linkedin: 900,
  blog: 1400,
  instagram: 700,
};

export class LlmError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "LlmError";
    this.status = status;
  }
}

export async function generateRepurposedContent(
  transcript: string,
  format: OutputFormat,
  targetLanguage: TargetLanguage = "auto"
): Promise<RepurposeData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LlmError(
      "Server is missing ANTHROPIC_API_KEY. Add it to your environment to enable generation.",
      500
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let rawText: string;
  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS_BY_FORMAT[format],
        system: getSystemPrompt(format, targetLanguage),
        messages: [
          {
            role: "user",
            content: transcript,
          },
        ],
      }),
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
        throw new LlmError("Server API key was rejected by the provider.", 500);
      }
      if (status === 429) {
        throw new LlmError(
          "The AI provider is rate-limiting requests right now. Please try again in a moment.",
          429
        );
      }
      if (status >= 500) {
        throw new LlmError(
          "The AI provider is temporarily unavailable. Please try again shortly.",
          502
        );
      }
      throw new LlmError(
        "AI provider rejected the request" + (detail ? ": " + detail : "."),
        502
      );
    }

    const json = await response.json();
    const block = json?.content?.find((b: any) => b.type === "text");
    rawText = block?.text ?? "";
    if (!rawText) {
      throw new LlmError("The AI provider returned an empty response.", 502);
    }
  } catch (err) {
    if (err instanceof LlmError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new LlmError(
        "The request took too long and was cancelled. Please try again.",
        504
      );
    }
    throw new LlmError(
      "Could not reach the AI provider. Check your connection and try again.",
      502
    );
  } finally {
    clearTimeout(timeout);
  }

  return parseAndValidate(rawText, format);
}

function parseAndValidate(rawText: string, format: OutputFormat): RepurposeData {
  const cleaned = stripCodeFences(rawText);

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new LlmError(
      "The AI returned a response that couldn't be understood. Please try again.",
      502
    );
  }

  switch (format) {
    case "twitter": {
      const tweets = parsed?.tweets;
      if (!Array.isArray(tweets) || tweets.length === 0) {
        throw new LlmError("The AI response was missing the expected thread content.", 502);
      }
      const cleanTweets = tweets
        .filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0)
        .slice(0, 5);
      if (cleanTweets.length === 0) {
        throw new LlmError("The AI response didn't contain any usable tweets.", 502);
      }
      const result: TwitterThreadResult = { tweets: cleanTweets };
      return { format: "twitter", data: result };
    }
    case "linkedin": {
      const post = parsed?.post;
      if (typeof post !== "string" || post.trim().length === 0) {
        throw new LlmError("The AI response was missing the expected post content.", 502);
      }
      const result: LinkedInPostResult = { post };
      return { format: "linkedin", data: result };
    }
    case "blog": {
      const title = parsed?.title;
      const content = parsed?.content;
      if (
        typeof title !== "string" ||
        title.trim().length === 0 ||
        typeof content !== "string" ||
        content.trim().length === 0
      ) {
        throw new LlmError("The AI response was missing the expected article content.", 502);
      }
      const result: BlogArticleResult = { title, content };
      return { format: "blog", data: result };
    }
    case "instagram": {
      const hook = parsed?.hook;
      const points = parsed?.points;
      const cta = parsed?.cta;
      const hashtags = parsed?.hashtags;
      if (typeof hook !== "string" || hook.trim().length === 0) {
        throw new LlmError("The AI response was missing the expected caption hook.", 502);
      }
      if (!Array.isArray(points) || points.length === 0) {
        throw new LlmError("The AI response was missing the expected caption points.", 502);
      }
      if (typeof cta !== "string" || cta.trim().length === 0) {
        throw new LlmError("The AI response was missing the expected caption call-to-action.", 502);
      }
      const cleanPoints = points
        .filter((p: unknown): p is string => typeof p === "string" && p.trim().length > 0)
        .slice(0, 5);
      if (cleanPoints.length === 0) {
        throw new LlmError("The AI response didn't contain any usable caption points.", 502);
      }
      const cleanHashtags = Array.isArray(hashtags)
        ? hashtags
            .filter((h: unknown): h is string => typeof h === "string" && h.trim().length > 0)
            .map((h: string) => h.replace(/^#/, ""))
            .slice(0, 5)
        : [];
      const result: InstagramCaptionResult = {
        hook,
        points: cleanPoints,
        cta,
        hashtags: cleanHashtags,
      };
      return { format: "instagram", data: result };
    }
  }
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}
