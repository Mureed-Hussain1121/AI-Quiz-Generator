"use client";

import { Progress } from "@/components/ui/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageStat {
  used: number;
  limit: number;
  remaining: number;
}

interface UsageSummary {
  pdfUploads: UsageStat;
  quizGenerations: UsageStat;
  maxQuestionsPerQuiz: number;
  features: {
    canExportPDF: boolean;
    canShareQuiz: boolean;
    canUseMixedTypes: boolean;
    canUseExplanations: boolean;
  };
}

interface UsageCardProps {
  usage: UsageSummary;
  subscriptionStatus: string;
}

function StatBar({ label, stat, icon: Icon }: { label: string; stat: UsageStat; icon: React.ElementType }) {
  const percent = Math.round((stat.used / stat.limit) * 100);
  const isNearLimit = percent >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </div>
        <span className={cn("font-medium", isNearLimit ? "text-orange-600" : "text-foreground")}>
          {stat.used} / {stat.limit}
        </span>
      </div>
      <Progress
        value={percent}
        className={cn("h-2", isNearLimit ? "[&>div]:bg-orange-500" : "")}
      />
      <p className="text-xs text-muted-foreground">{stat.remaining} remaining this month</p>
    </div>
  );
}

export function UsageCard({ usage, subscriptionStatus }: UsageCardProps) {
  const isPremium = subscriptionStatus === "PREMIUM";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-600" />
          Monthly Usage
          {!isPremium && (
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              Free Plan
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatBar label="PDF Uploads" stat={usage.pdfUploads} icon={FileText} />
        <StatBar label="Quiz Generations" stat={usage.quizGenerations} icon={Zap} />

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Plan Features</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Export PDF", enabled: usage.features.canExportPDF },
              { label: "Share Quiz", enabled: usage.features.canShareQuiz },
              { label: "Mixed Types", enabled: usage.features.canUseMixedTypes },
              { label: "Explanations", enabled: usage.features.canUseExplanations },
            ].map(({ label, enabled }) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-1.5 text-xs rounded px-2 py-1",
                  enabled
                    ? "text-green-700 bg-green-50"
                    : "text-muted-foreground bg-muted"
                )}
              >
                {enabled ? (
                  <span className="text-green-500">✓</span>
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {label}
              </div>
            ))}
          </div>
        </div>

        {!isPremium && (
          <div className="pt-2">
            <a
              href="/pricing"
              className="block w-full text-center text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md py-2 transition-colors"
            >
              Upgrade for more →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
