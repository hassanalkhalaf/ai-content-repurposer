export type OutputFormat = "twitter" | "linkedin" | "blog";

export interface TwitterThreadResult {
  tweets: string[]; // exactly 5, each <= 280 chars
}

export interface LinkedInPostResult {
  post: string;
}

export interface BlogArticleResult {
  title: string;
  content: string; // markdown: H1 handled separately via `title`, body uses H2/H3
}

export type RepurposeData =
  | { format: "twitter"; data: TwitterThreadResult }
  | { format: "linkedin"; data: LinkedInPostResult }
  | { format: "blog"; data: BlogArticleResult };

export interface RepurposeRequestBody {
  transcript: string;
  format: OutputFormat;
}

export interface ApiErrorBody {
  error: string;
}

export const FORMAT_LABELS: Record<OutputFormat, string> = {
  twitter: "Twitter/X Thread",
  linkedin: "Professional LinkedIn Post",
  blog: "SEO-optimized Blog Article",
};

export const MIN_TRANSCRIPT_LENGTH = 40;
export const MAX_TRANSCRIPT_LENGTH = 20000;
