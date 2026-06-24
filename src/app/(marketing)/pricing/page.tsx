"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { CheckCircle, X, Crown, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  { text: "3 PDF uploads per month", included: true },
  { text: "5 quiz generations per month", included: true },
  { text: "Up to 10 questions per quiz", included: true },
  { text: "MCQ and True/False questions", included: true },
  { text: "Basic difficulty levels", included: true },
  { text: "Quiz attempt history", included: true },
  { text: "Mixed question types", included: false },
  { text: "AI explanations for answers", included: false },
  { text: "Export quiz as PDF", included: false },
  { text: "Share quizzes publicly", included: false },
];

const PREMIUM_FEATURES = [
  { text: "50 PDF uploads per month", included: true },
  { text: "100 quiz generations per month", included: true },
  { text: "Up to 100 questions per quiz", included: true },
  { text: "All question types (MCQ, T/F, Short, Mixed)", included: true },
  { text: "Advanced difficulty control", included: true },
  { text: "Quiz attempt history", included: true },
  { text: "Mixed question types", included: true },
  { text: "AI explanations for every answer", included: true },
  { text: "Export quiz as PDF", included: true },
  { text: "Share quizzes publicly", included: true },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);

  const isPremium = session?.user?.subscriptionStatus === "PREMIUM";
  const yearlyPrice = 79; // Effective $6.58/month
  const monthlyPrice = 9;

  async function handleUpgrade() {
    if (!session) {
      router.push("/register?plan=pro");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/payment/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: billingInterval }),
      });
      const json = await res.json();
      if (json.success && json.data.url) {
        window.location.href = json.data.url;
      } else {
        toast.error("Checkout failed", json.error);
      }
    } catch {
      toast.error("Something went wrong", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <div className="container py-16 md:py-24">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade when you need more power.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={cn("text-sm", billingInterval === "monthly" ? "font-medium" : "text-muted-foreground")}>
                Monthly
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={billingInterval === "yearly"}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  billingInterval === "yearly" ? "bg-purple-600" : "bg-muted"
                )}
                onClick={() => setBillingInterval(billingInterval === "monthly" ? "yearly" : "monthly")}
              >
                <span className={cn(
                  "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                  billingInterval === "yearly" ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
              <span className={cn("text-sm", billingInterval === "yearly" ? "font-medium" : "text-muted-foreground")}>
                Yearly
                <Badge variant="success" className="ml-2 text-[10px]">Save 27%</Badge>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="flex flex-col">
              <CardContent className="flex-1 pt-8 pb-6">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    <span className="font-bold text-xl">Free</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">$0</span>
                    <span className="text-muted-foreground">/forever</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Perfect for trying out the platform
                  </p>
                </div>

                {session ? (
                  <Button variant="outline" className="w-full mb-6" asChild>
                    <Link href="/dashboard">
                      {isPremium ? "Your Previous Plan" : "Current Plan"}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full mb-6" asChild>
                    <Link href="/register">Get Started Free</Link>
                  </Button>
                )}

                <ul className="space-y-3">
                  {FREE_FEATURES.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      {f.included
                        ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        : <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />}
                      <span className={f.included ? "" : "text-muted-foreground"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="flex flex-col border-2 border-purple-500 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 px-4 py-1">
                  ✦ Most Popular
                </Badge>
              </div>
              <CardContent className="flex-1 pt-8 pb-6">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Premium
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">
                      ${billingInterval === "yearly" ? Math.round(yearlyPrice / 12) : monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {billingInterval === "yearly" && (
                    <p className="text-sm text-purple-600 font-medium mt-1">
                      Billed ${yearlyPrice}/year — save ${monthlyPrice * 12 - yearlyPrice}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    For serious learners and educators
                  </p>
                </div>

                {isPremium ? (
                  <Button variant="outline" className="w-full mb-6" disabled>
                    <Crown className="mr-2 h-4 w-4 text-purple-600" />
                    Current Plan ✓
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    className="w-full mb-6"
                    onClick={handleUpgrade}
                    loading={isLoading}
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    {session ? "Upgrade to Premium" : "Start Free Trial"}
                  </Button>
                )}

                <ul className="space-y-3">
                  {PREMIUM_FEATURES.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      {f.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Guarantee */}
          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground">
              🔒 Secure checkout via Stripe · Cancel anytime · No hidden fees
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
