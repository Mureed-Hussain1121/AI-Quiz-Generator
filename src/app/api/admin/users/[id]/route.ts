import { NextRequest } from "next/server";
import { requireAdmin, apiSuccess, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  isDisabled: z.boolean().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  subscriptionStatus: z
    .enum(["FREE", "PREMIUM", "CANCELLED", "PAST_DUE"])
    .optional(),
});

// ── PATCH /api/admin/users/:id ────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  // Prevent admin from disabling themselves
  if (params.id === session!.user.id) {
    return apiError("You cannot modify your own admin account", 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400);
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      subscriptionStatus: true,
      isDisabled: true,
    },
  });

  return apiSuccess({ user, message: "User updated successfully" });
}
