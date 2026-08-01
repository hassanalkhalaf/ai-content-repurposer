import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export class QuotaExceededError extends Error {
  wordsUsed: number;
  wordsLimit: number;

  constructor(wordsUsed: number, wordsLimit: number) {
    super("Quota exceeded");
    this.wordsUsed = wordsUsed;
    this.wordsLimit = wordsLimit;
  }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Checks whether the user has enough remaining quota for this request.
 * Throws QuotaExceededError if not. Call BEFORE generating content.
 */
export async function checkQuota(userId: string, inputWords: number) {
  const supabase = createSupabaseAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("words_used, words_limit")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Could not load user profile for quota check.");
  }

  const wordsUsed = profile.words_used ?? 0;
  const wordsLimit = profile.words_limit ?? 30000;

  if (wordsUsed + inputWords > wordsLimit) {
    throw new QuotaExceededError(wordsUsed, wordsLimit);
  }
}

/**
 * Increments the user's word usage. Call AFTER generation succeeds,
 * never before — so a failed generation doesn't burn the user's quota.
 */
export async function incrementUsage(userId: string, inputWords: number) {
  const supabase = createSupabaseAdminClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("words_used")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    console.error("Failed to fetch profile before incrementing usage:", fetchError);
    return;
  }

  const newWordsUsed = (profile.words_used ?? 0) + inputWords;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ words_used: newWordsUsed })
    .eq("id", userId);

  if (updateError) {
    console.error("Failed to increment word usage:", updateError);
  }
}
