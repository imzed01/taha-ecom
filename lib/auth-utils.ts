import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export async function getServerSessionWithAuth() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any);
    return session;
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkAdminAuth(session: any) {
  return session && session.user && session.user.role === "admin";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkSellerAuth(session: any) {
  return session && session.user && session.user.role === "seller";
}
