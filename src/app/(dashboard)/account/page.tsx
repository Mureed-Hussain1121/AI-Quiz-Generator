"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input, Label, Badge } from "@/components/ui/primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/primitives";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/interactive";
import {
  User, CreditCard, Shield, LogOut, Crown,
  AlertTriangle, CheckCircle, ExternalLink,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const isPremium = session?.user?.subscriptionStatus === "PREMIUM";
  const isCancelled = session?.user?.subscriptionStatus === "CANCELLED";

  async function handleUpgrade() {
    setIsCreatingCheckout(true);
    try {
      const res = await fetch("/api/payment/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: "monthly" }),
      });
      const json = await res.json();
      if (json.success && json.data.url) {
        window.location.href = json.data.url;
      } else {
        toast.error("Failed to create checkout session", json.error);
      }
    } catch {
      toast.error("Something went wrong", "Please try again.");
    } finally {
      setIsCreatingCheckout(false);
    }
  }

  async function handleCancelSubscription() {
    setIsCancelling(true);
    try {
      const res = await fetch("/api/payment/cancel-subscription", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success("Subscription cancelled", json.data.message);
        await update({ subscriptionStatus: "CANCELLED" });
        setShowCancelDialog(false);
      } else {
        toast.error("Cancellation failed", json.error);
      }
    } catch {
      toast.error("Something went wrong", "Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }

  if (!session?.user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and subscription</p>
      </div>

      {/* ── Profile ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-2xl font-bold">
              {session.user.name?.[0]?.toUpperCase() ?? session.user.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-semibold">{session.user.name ?? "No name set"}</p>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {isPremium ? (
                  <Badge variant="premium" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" /> Premium
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Free Plan</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Subscription ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Subscription
          </CardTitle>
          <CardDescription>
            Manage your billing and subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPremium ? (
            <>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Premium Plan</span>
                  </div>
                  <p className="text-sm text-purple-700 mt-0.5">Active subscription</p>
                </div>
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Your Premium Benefits</h4>
                {[
                  "50 PDF uploads per month",
                  "100 quiz generations per month",
                  "Up to 100 questions per quiz",
                  "All question types including Mixed",
                  "AI explanations for answers",
                  "Export quiz as PDF",
                  "Share quizzes publicly",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>

              <Separator />

              <div>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Subscription
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  You&apos;ll retain access until the end of your current billing period.
                </p>
              </div>
            </>
          ) : isCancelled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">Subscription Cancelled</p>
                  <p className="text-sm text-orange-700">Re-subscribe to restore premium features.</p>
                </div>
              </div>
              <Button variant="gradient" onClick={handleUpgrade} loading={isCreatingCheckout}>
                <Crown className="mr-2 h-4 w-4" /> Re-subscribe to Premium
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">Free Plan</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  3 PDFs/month · 5 quizzes/month · 10 questions max
                </p>
              </div>

              <div className="border-2 border-purple-200 bg-purple-50/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Upgrade to Premium — $9/month</span>
                </div>
                <ul className="space-y-1.5">
                  {[
                    "50 PDF uploads & 100 quizzes/month",
                    "Up to 100 questions per quiz",
                    "All question types + explanations",
                    "Export & share quizzes",
                  ].map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={handleUpgrade}
                  loading={isCreatingCheckout}
                >
                  <Crown className="mr-2 h-4 w-4" /> Upgrade Now
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Security ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out everywhere</p>
              <p className="text-xs text-muted-foreground">Sign out of all devices and sessions</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Cancel Dialog ─────────────────────────────────── */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription?</DialogTitle>
            <DialogDescription>
              Your subscription will be cancelled, but you&apos;ll keep Premium access until the end of your
              current billing period. After that, your account will revert to the Free plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              loading={isCancelling}
              onClick={handleCancelSubscription}
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
