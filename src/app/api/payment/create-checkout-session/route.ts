import { NextRequest } from "next/server";
import { createCheckoutSession } from "@/lib/payment-handlers";
export const POST = createCheckoutSession;
