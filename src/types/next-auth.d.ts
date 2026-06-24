import "next-auth";
import "next-auth/jwt";
import type { Role, SubscriptionStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      subscriptionStatus: SubscriptionStatus;
    };
  }

  interface User {
    id: string;
    role: Role;
    subscriptionStatus: SubscriptionStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    subscriptionStatus: SubscriptionStatus;
  }
}
