import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import {
  Users, Brain, FileText, Trophy, TrendingUp, Shield,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AdminUserTable } from "@/components/admin/AdminUserTable";

export const metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/dashboard");

  const [totalUsers, premiumUsers, totalQuizzes, totalPDFs, totalAttempts, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { subscriptionStatus: "PREMIUM" } }),
      prisma.quiz.count(),
      prisma.pDFDocument.count(),
      prisma.quizAttempt.count(),
      prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscriptionStatus: true,
          isDisabled: true,
          createdAt: true,
          _count: { select: { quizzes: true, pdfs: true } },
        },
      }),
    ]);

  const conversionRate =
    totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Premium Users", value: premiumUsers, icon: Crown, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Quizzes", value: totalQuizzes, icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total PDFs", value: totalPDFs, icon: FileText, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Quiz Attempts", value: totalAttempts, icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="container py-8 max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Signed in as {session.user.email}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-4">
                <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminUserTable users={recentUsers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Fix: Crown is used in stat but not imported at top
function Crown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3H5v2h14v-2z" />
    </svg>
  );
}
