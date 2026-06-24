import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { stripe, getOrCreateStripeCustomer, mapStripeStatus, constructWebhookEvent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// ── POST /api/payment/create-checkout-session ─────────────────

export async function createCheckoutSession(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { priceId, interval = "monthly" } = body;

  const resolvedPriceId =
    priceId ||
    (interval === "yearly"
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY);

  if (!resolvedPriceId) {
    return apiError("Price ID not configured", 500);
  }

  const customerId = await getOrCreateStripeCustomer(
    session!.user.id,
    session!.user.email!,
    session!.user.name
  );

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: resolvedPriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
    metadata: { userId: session!.user.id },
    subscription_data: {
      metadata: { userId: session!.user.id },
    },
    allow_promotion_codes: true,
  });

  return apiSuccess({ url: checkoutSession.url });
}

// ── POST /api/payment/webhook ─────────────────────────────────

export async function handleWebhook(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as {
          metadata?: { userId?: string };
          subscription?: string;
          customer?: string;
        };
        const userId = checkoutSession.metadata?.userId;
        if (!userId) break;

        if (checkoutSession.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            checkoutSession.subscription as string
          );
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "PREMIUM",
              stripeSubscriptionId: sub.id,
              subscriptionEndsAt: new Date(sub.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as {
          id: string;
          status: string;
          current_period_end: number;
          metadata?: { userId?: string };
        };
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: mapStripeStatus(sub.status as any),
            stripeSubscriptionId: sub.id,
            subscriptionEndsAt: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as {
          id: string;
          metadata?: { userId?: string };
        };
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "CANCELLED",
            stripeSubscriptionId: null,
            subscriptionEndsAt: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as { subscription?: string };
        if (invoice.subscription) {
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: { subscriptionStatus: "PAST_DUE" },
          });
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ── POST /api/payment/cancel-subscription ────────────────────

export async function cancelSubscription(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { stripeSubscriptionId: true, subscriptionStatus: true },
  });

  if (!user?.stripeSubscriptionId) {
    return apiError("No active subscription found", 400);
  }

  // Cancel at period end (user keeps access until the end of their billing period)
  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return apiSuccess({
    message: "Subscription cancelled. You will retain access until the end of your billing period.",
  });
}

// ── GET /api/payment/subscription-status ─────────────────────

export async function getSubscriptionStatus(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      subscriptionEndsAt: true,
    },
  });

  if (!user) return apiError("User not found", 404);

  let stripeDetails = null;
  if (user.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      stripeDetails = {
        status: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      };
    } catch {
      // Subscription may not exist anymore
    }
  }

  return apiSuccess({
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt,
    stripeDetails,
  });
}
