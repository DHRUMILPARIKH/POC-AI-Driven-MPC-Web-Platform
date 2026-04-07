import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./db";

const providers: NextAuthConfig["providers"] = [];

// Azure AD provider for production
if (process.env.AZURE_AD_CLIENT_ID) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID!}/v2.0`,
    }),
  );
}

// Dev credentials fallback — NEVER enabled in production
if (process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_CREDENTIALS_AUTH === "true") {
  providers.push(
    Credentials({
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@mpc.local" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== "ACTIVE") return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  );
}

export const authConfig: NextAuthConfig = {
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "microsoft-entra-id" && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!dbUser) return false;
        if (dbUser.status !== "ACTIVE") return false;

        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            lastLoginAt: new Date(),
            azureAdId: account.providerAccountId,
          },
        });
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
