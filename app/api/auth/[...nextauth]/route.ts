import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import type { JWT } from "next-auth/jwt";

type CustomToken = JWT & {
  sub?: string;
  role?: string;
  storeName?: string;
  verificationStatus?: string;
  email?: string;
  isBlocked?: boolean;
  blockedReason?: string;
};

// Must match lib/auth.ts so JWT encode/decode use the same secret (dev fallback when NEXTAUTH_SECRET unset).
const DEV_FALLBACK_SECRET =
  "taha-ecom-dev-secret-min-32-chars-long-do-not-use-in-production";
const authSecret =
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? DEV_FALLBACK_SECRET : undefined);

const handler = NextAuth({
  secret: authSecret,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        console.log("Auth attempt:", {
          email: credentials?.email,
          role: credentials?.role,
        });

        if (
          !credentials?.email ||
          !credentials?.password ||
          !credentials?.role
        ) {
          console.log("Missing credentials");
          return null;
        }

        // Remove hardcoded admin logic. Always check DB for user.
        await dbConnect();
        const user = await User.findOne({
          email: credentials.email,
          role: credentials.role,
        });

        console.log("User found:", user ? "Yes" : "No");

        if (!user) {
          console.log("User not found");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        console.log("Password valid:", isPasswordValid);

        if (!isPasswordValid) {
          console.log("Invalid password");
          return null;
        }

        // Return user data for both admin and seller
        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          storeName: user.storeName,
          verificationStatus: user.verificationStatus,
          isBlocked: user.isBlocked,
          blockedReason: user.blockedReason,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: string;
          storeName?: string;
          verificationStatus?: string;
          email?: string;
          isBlocked?: boolean;
          blockedReason?: string;
        };
        // Use 'as unknown as CustomToken' to avoid 'any' linter error
        const customToken = token as unknown as CustomToken;
        customToken.role = u.role ?? "";
        customToken.storeName = u.storeName ?? "";
        customToken.verificationStatus = u.verificationStatus ?? "";
        customToken.email = u.email ?? "";
        customToken.sub = u.id ?? "";
        customToken.isBlocked = u.isBlocked ?? false;
        customToken.blockedReason = u.blockedReason ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      // Use 'as unknown as CustomToken' to avoid 'any' linter error
      const customToken = token as unknown as CustomToken;
      // Extend session.user instead of replacing it
      session.user = {
        ...(session.user || {}),
        id: customToken.sub ?? "",
        email: customToken.email ?? "",
        role: customToken.role ?? "",
        storeName: customToken.storeName ?? "",
        verificationStatus: customToken.verificationStatus ?? "",
        isBlocked: customToken.isBlocked ?? false,
        blockedReason: customToken.blockedReason ?? "",
      } as typeof session.user;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
  },
});

export { handler as GET, handler as POST };
