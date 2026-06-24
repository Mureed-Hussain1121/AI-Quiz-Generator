import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database-backed sessions
  adapter: PrismaAdapter(prisma) as Adapter,

  // Use JWT strategy (works with credentials provider)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login with error query param
  },

  providers: [
    // ── Optional Google OAuth ─────────────────────────────────
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // ── Email + Password ──────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        if (user.isDisabled) {
          throw new Error("Your account has been disabled. Contact support.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus,
        };
      },
    }),
  ],

  callbacks: {
    // Persist role + subscription into the JWT token
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.subscriptionStatus = user.subscriptionStatus;
      }

      // Allow client-side session update (e.g., after subscription change)
      if (trigger === "update" && session) {
        token.subscriptionStatus = session.subscriptionStatus;
      }

      // Always refresh subscription from DB on token refresh
      if (token.id && !user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { subscriptionStatus: true, role: true, isDisabled: true },
        });
        if (dbUser) {
          token.subscriptionStatus = dbUser.subscriptionStatus;
          token.role = dbUser.role;
          if (dbUser.isDisabled) {
            throw new Error("Account disabled");
          }
        }
      }

      return token;
    },

    // Expose token fields to the session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.subscriptionStatus = token.subscriptionStatus;
      }
      return session;
    },
  },

  events: {
    // When a new user signs in via Google for the first time,
    // set default role and subscription
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "USER",
          subscriptionStatus: "FREE",
        },
      });
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
