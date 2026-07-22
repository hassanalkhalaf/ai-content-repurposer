export type OutputFormat = "twitter" | "linkedin" | "blog" | "instagram";
export type TargetLanguage = "auto" | "ar" | "en" | "fr" | "es" | "tr" | "ur" | "hi" | "de";

export interface TwitterThreadResult {
  tweets: string[];
}

export interface LinkedInPostResult {
  post: string;
}

export interface BlogArticleResult {
  title: string;
  content: string;
}

export interface InstagramCaptionResult {
  hook: string;
  points: string[];
  cta: string;
  hashtags: string[];
}

export type RepurposeData =
  | { format: "twitter"; data: TwitterThreadResult }
  | { format: "linkedin"; data: LinkedInPostResult }
  | { format: "blog"; data: BlogArticleResult }
  | { format: "instagram"; data: InstagramCaptionResult };

export interface RepurposeRequestBody {
  transcript: string;
  format: OutputFormat;
  targetLanguage?: TargetLanguage;
}

export interface ApiErrorBody {
  error: string;
}

export const FORMAT_LABELS: Record<OutputFormat, string> = {
  twitter: "Twitter/X Thread",
  linkedin: "Professional LinkedIn Post",
  blog: "SEO-optimized Blog Article",
  instagram: "Instagram Caption",
};

export const LANGUAGE_LABELS: Record<TargetLanguage, string> = {
  auto: "نفس لغة النص",
  ar: "العربية",
  en: "الإنجليزية",
  fr: "الفرنسية",
  es: "الإسبانية",
  tr: "التركية",
  ur: "الأردية",
  hi: "الهندية",
  de: "الألمانية",
};

export const LANGUAGE_NAMES_FOR_PROMPT: Record<Exclude<TargetLanguage, "auto">, string> = {
  ar: "Arabic",
  en: "English",
  fr: "French",
  es: "Spanish",
  tr: "Turkish",
  ur: "Urdu",
  hi: "Hindi",
  de: "German",
};

export const MIN_TRANSCRIPT_LENGTH = 40;
export const MAX_TRANSCRIPT_LENGTH = 20000;
