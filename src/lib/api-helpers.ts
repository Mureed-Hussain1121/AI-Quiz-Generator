import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/**
 * Returns the session or a 401 JSON response.
 * Use in API routes to enforce authentication.
 */
export async function requireAuth(): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      ),
    };
  }

  return { session, error: null };
}

/**
 * Returns the session or a 401 response.
 * Additionally checks for ADMIN role.
 */
export async function requireAdmin(): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse }
> {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (session!.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      ),
    };
  }

  return { session: session!, error: null };
}

/**
 * Standard API error response helper
 */
export function apiError(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Standard API success response helper
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}
