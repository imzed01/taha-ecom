import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// NEXTAUTH_SECRET must be set in .env.local in production. Dev-only fallback avoids JWEDecryptionFailed when unset.
const DEV_FALLBACK_SECRET =
  "taha-ecom-dev-secret-min-32-chars-long-do-not-use-in-production";
function getSecret() {
  const s =
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "development" ? DEV_FALLBACK_SECRET : undefined);
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.NEXTAUTH_SECRET &&
    s === DEV_FALLBACK_SECRET
  ) {
    if (typeof globalThis !== "undefined" && !(globalThis as { __nextAuthDevWarned?: boolean }).__nextAuthDevWarned) {
      (globalThis as { __nextAuthDevWarned?: boolean }).__nextAuthDevWarned = true;
      console.warn(
        "[NextAuth] NEXTAUTH_SECRET not set. Using dev fallback. Set NEXTAUTH_SECRET (and NEXTAUTH_URL) in .env.local for production."
      );
    }
  }
  return s;
}
export const authOptions = {
  secret: getSecret(),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Auth attempt:", {
          email: credentials?.email,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        await dbConnect();

        // Automatically determine role based on email
        const role =
          credentials.email === "admin@taha.com" ? "admin" : "seller";

        const user = await User.findOne({
          email: credentials.email,
          role: role,
        });

        console.log("User found:", user ? "Yes" : "No", "Role:", role);

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
    async jwt({
      token,
      user,
      trigger,
    }: {
      token: JWT;
      user?: Record<string, unknown>;
      trigger?: string;
    }) {
      if (user) {
        token.role = String(user.role);
        token.storeName = user.storeName ? String(user.storeName) : undefined;
        token.verificationStatus = user.verificationStatus
          ? String(user.verificationStatus)
          : undefined;
        token.isBlocked = user.isBlocked ? Boolean(user.isBlocked) : false;
        token.blockedReason = user.blockedReason
          ? String(user.blockedReason)
          : undefined;
      }

      // If session is being refreshed (e.g., via getSession()), fetch fresh user data
      if (trigger === "update" && "sub" in token && token.sub) {
        try {
          await dbConnect();
          const freshUser = await User.findById(token.sub);
          if (freshUser) {
            token.role = freshUser.role;
            token.storeName = freshUser.storeName;
            token.verificationStatus = freshUser.verificationStatus;
            token.isBlocked = Boolean(freshUser.isBlocked);
            token.blockedReason = freshUser.blockedReason;
          }
        } catch (error) {
          console.error("Error refreshing token with fresh user data:", error);
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id =
          "sub" in token && typeof token.sub === "string" ? token.sub : "";
        session.user.role = token.role as string;
        session.user.storeName = token.storeName as string;
        session.user.verificationStatus = token.verificationStatus as string;
        session.user.isBlocked = token.isBlocked as boolean;
        session.user.blockedReason = token.blockedReason as string;
      }
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
};
