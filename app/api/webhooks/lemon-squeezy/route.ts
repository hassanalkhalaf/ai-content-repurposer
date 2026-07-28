import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const VARIANT_TIER_MAP: Record<string, { tier: "starter" | "pro"; wordsLimit: number }> = {
  "1949636": { tier: "starter", wordsLimit: 50000 },
  "1949667": { tier: "pro", wordsLimit: 200000 },
};

const FREE_TIER = { tier: "free" as const, wordsLimit: 5000 };

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const digestBuffer = Buffer.from(digest, "utf8");
  const signatureBuffer = Buffer.from(signatureHeader, "utf8");
  if (digestBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-signature");

  if (!verifySignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventName: string | undefined = payload?.meta?.event_name;
  const supabaseUserId: string | undefined = payload?.meta?.custom_data?.user_id;

  const attributes = payload?.data?.attributes ?? {};
  const customerId = attributes?.customer_id;
  const variantId: string | undefined = attributes?.variant_id?.toString();
  const subscriptionId = payload?.data?.id;
  const renewsAt: string | undefined = attributes?.renews_at;
  const endsAt: string | undefined = attributes?.ends_at;
  const status: string | undefined = attributes?.status;

  // Diagnostics echoed back in the response so we can see what happened
  // without needing access to server logs.
  const debug: Record<string, unknown> = {
    eventName,
    supabaseUserId: supabaseUserId ?? null,
    variantId: variantId ?? null,
    status: status ?? null,
  };

  const supabase = createSupabaseAdminClient();

  try {
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_cancelled"
    ) {
      const identifierColumn = supabaseUserId ? "id" : "lemon_squeezy_customer_id";
      const identifierValue = supabaseUserId ?? customerId;

      if (!identifierValue) {
        return NextResponse.json(
          { received: true, debug: { ...debug, problem: "no identifier" } },
          { status: 200 }
        );
      }

      // Confirm the row actually exists before updating.
      const { data: existing, error: findError } = await supabase
        .from("profiles")
        .select("id, email, subscription_tier")
        .eq(identifierColumn, identifierValue);

      debug.lookupError = findError?.message ?? null;
      debug.rowsFound = existing?.length ?? 0;

      const updatePayload =
        eventName === "subscription_cancelled"
          ? {
              subscription_tier: FREE_TIER.tier,
              subscription_status: "cancelled",
              words_limit: FREE_TIER.wordsLimit,
            }
          : {
              subscription_tier:
                variantId && VARIANT_TIER_MAP[variantId]
                  ? VARIANT_TIER_MAP[variantId].tier
                  : FREE_TIER.tier,
              subscription_status: status ?? null,
              lemon_squeezy_customer_id: customerId ? String(customerId) : null,
              lemon_squeezy_subscription_id: subscriptionId ? String(subscriptionId) : null,
              words_limit:
                variantId && VARIANT_TIER_MAP[variantId]
                  ? VARIANT_TIER_MAP[variantId].wordsLimit
                  : FREE_TIER.wordsLimit,
              renews_at: renewsAt ?? null,
              ends_at: endsAt ?? null,
            };

      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq(identifierColumn, identifierValue)
        .select("id, subscription_tier, words_limit");

      debug.updateError = updateError?.message ?? null;
      debug.rowsUpdated = updated?.length ?? 0;
    }

    return NextResponse.json({ received: true, debug }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { received: true, debug: { ...debug, thrown: err?.message ?? String(err) } },
      { status: 200 }
    );
  }
}
