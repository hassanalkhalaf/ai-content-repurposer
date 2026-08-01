import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

// Lemon Squeezy Variant IDs → subscription tier + word quota
const VARIANT_TIER_MAP: Record<string, { tier: "starter" | "pro"; wordsLimit: number }> = {
  "1949636": { tier: "starter", wordsLimit: 150000 },
  "1949667": { tier: "pro", wordsLimit: 200000 },
};

const FREE_TIER = { tier: "free" as const, wordsLimit: 30000 };

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
    console.error("Server is missing LEMON_SQUEEZY_WEBHOOK_SECRET.");
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-signature");

  if (!verifySignature(rawBody, signatureHeader, secret)) {
    console.error("Invalid Lemon Squeezy webhook signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventName: string | undefined = payload?.meta?.event_name;
  const customData = payload?.meta?.custom_data ?? {};
  const supabaseUserId: string | undefined = customData?.user_id;

  const attributes = payload?.data?.attributes ?? {};
  const customerId: string | number | undefined = attributes?.customer_id;
  const variantId: string | undefined = attributes?.variant_id?.toString();
  const subscriptionId: string | number | undefined = payload?.data?.id;
  const renewsAt: string | undefined = attributes?.renews_at;
  const endsAt: string | undefined = attributes?.ends_at;
  const status: string | undefined = attributes?.status;

  const supabase = createSupabaseAdminClient();

  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const tierInfo = variantId && VARIANT_TIER_MAP[variantId] ? VARIANT_TIER_MAP[variantId] : FREE_TIER;

        const updatePayload = {
          subscription_tier: tierInfo.tier,
          subscription_status: status ?? null,
          lemon_squeezy_customer_id: customerId ?? null,
          lemon_squeezy_subscription_id: subscriptionId ?? null,
          words_limit: tierInfo.wordsLimit,
          renews_at: renewsAt ?? null,
          ends_at: endsAt ?? null,
        };

        const identifier = supabaseUserId
          ? { column: "id", value: supabaseUserId }
          : { column: "lemon_squeezy_customer_id", value: customerId };

        if (!identifier.value) {
          console.error("Webhook had no way to identify the Supabase user (no custom_data.user_id or customer_id).");
          return NextResponse.json({ received: true, warning: "No user identifier" }, { status: 200 });
        }

        const { error } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq(identifier.column, identifier.value);

        if (error) {
          console.error("Failed to update profile from webhook:", error);
          return NextResponse.json({ error: "Database update failed." }, { status: 500 });
        }
        break;
      }

      case "subscription_cancelled": {
        const identifier = supabaseUserId
          ? { column: "id", value: supabaseUserId }
          : { column: "lemon_squeezy_customer_id", value: customerId };

        if (!identifier.value) {
          return NextResponse.json({ received: true, warning: "No user identifier" }, { status: 200 });
        }

        // Revert to the free tier immediately. If you'd rather let the user
        // keep paid access until the period actually ends, only set
        // subscription_status here and downgrade the tier via a separate
        // scheduled job checking `renews_at` / `ends_at`.
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: FREE_TIER.tier,
            subscription_status: "cancelled",
            words_limit: FREE_TIER.wordsLimit,
          })
          .eq(identifier.column, identifier.value);

        if (error) {
          console.error("Failed to downgrade profile from webhook:", error);
          return NextResponse.json({ error: "Database update failed." }, { status: 500 });
        }
        break;
      }

      default:
        // Any other event type (e.g. subscription_payment_success) — 200 OK
        // with no action needed, so Lemon Squeezy doesn't retry it forever.
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Unexpected Lemon Squeezy webhook error:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
