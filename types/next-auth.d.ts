declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: string;
    storeName?: string;
    verificationStatus?: string;
    isBlocked?: boolean;
    blockedReason?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      storeName?: string;
      verificationStatus?: string;
      isBlocked?: boolean;
      blockedReason?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    storeName?: string;
    verificationStatus?: string;
    isBlocked?: boolean;
    blockedReason?: string;
  }
}
