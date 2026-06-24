"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { toast } from "@/hooks/use-toast";
import { UserX, UserCheck, Shield } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  subscriptionStatus: string;
  isDisabled: boolean;
  createdAt: Date;
  _count: { quizzes: number; pdfs: number };
}

export function AdminUserTable({ users: initialUsers }: { users: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleDisabled(userId: string, currentlyDisabled: boolean) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDisabled: !currentlyDisabled }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isDisabled: !currentlyDisabled } : u
          )
        );
        toast.success(
          currentlyDisabled ? "User re-enabled" : "User disabled",
          currentlyDisabled
            ? "The user can now sign in again."
            : "The user has been blocked from signing in."
        );
      } else {
        toast.error("Action failed", json.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  async function makeAdmin(userId: string) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "ADMIN" }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: "ADMIN" } : u))
        );
        toast.success("User promoted to Admin");
      } else {
        toast.error("Action failed", json.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="pb-3 text-left font-medium text-muted-foreground">User</th>
            <th className="pb-3 text-left font-medium text-muted-foreground">Role</th>
            <th className="pb-3 text-left font-medium text-muted-foreground">Plan</th>
            <th className="pb-3 text-left font-medium text-muted-foreground">Activity</th>
            <th className="pb-3 text-left font-medium text-muted-foreground">Joined</th>
            <th className="pb-3 text-left font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className={cn("hover:bg-muted/30 transition-colors", user.isDisabled && "opacity-50")}>
              <td className="py-3 pr-4">
                <div>
                  <p className="font-medium">{user.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </td>
              <td className="py-3 pr-4">
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
                  {user.role}
                </Badge>
              </td>
              <td className="py-3 pr-4">
                <Badge
                  variant={user.subscriptionStatus === "PREMIUM" ? "premium" : "secondary"}
                  className="text-xs"
                >
                  {user.subscriptionStatus}
                </Badge>
              </td>
              <td className="py-3 pr-4 text-xs text-muted-foreground">
                {user._count.quizzes} quizzes · {user._count.pdfs} PDFs
              </td>
              <td className="py-3 pr-4 text-xs text-muted-foreground">
                {formatDate(user.createdAt)}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-7 px-2 text-xs",
                      user.isDisabled
                        ? "text-green-600 hover:text-green-700"
                        : "text-destructive hover:text-destructive"
                    )}
                    loading={loadingId === user.id}
                    onClick={() => toggleDisabled(user.id, user.isDisabled)}
                  >
                    {user.isDisabled ? (
                      <><UserCheck className="h-3 w-3 mr-1" /> Enable</>
                    ) : (
                      <><UserX className="h-3 w-3 mr-1" /> Disable</>
                    )}
                  </Button>
                  {user.role !== "ADMIN" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-orange-600 hover:text-orange-700"
                      loading={loadingId === user.id}
                      onClick={() => makeAdmin(user.id)}
                    >
                      <Shield className="h-3 w-3 mr-1" /> Make Admin
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
