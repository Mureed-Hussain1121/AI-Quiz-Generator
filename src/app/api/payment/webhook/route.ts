import { handleWebhook } from "@/lib/payment-handlers";

// Stripe webhooks require the raw request body.
// In Next.js App Router, the raw body is available through
// `await req.text()` inside the handler.
export const POST = handleWebhook;