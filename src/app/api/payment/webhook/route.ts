import { NextRequest } from "next/server";
import { handleWebhook } from "@/lib/payment-handlers";

// Stripe webhooks need the raw body, not parsed JSON
// Next.js App Router provides raw body by default via req.text()
export const POST = handleWebhook;

// Disable Next.js default body size limit for webhook route
export const config = {
  api: { bodyParser: false },
};
