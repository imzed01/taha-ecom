"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Sidebar from "./Sidebar";
import type { SidebarProps } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: "admin" | "seller";
  title?: string;
  sidebarProps?: Partial<SidebarProps>;
  noPadding?: boolean; // For chat pages that need full width
}

interface ExtendedUser {
  id: string;
  email: string;
  role: string;
  storeName?: string;
  verificationStatus?: string;
  isBlocked?: boolean;
  blockedReason?: string;
}

export default function DashboardLayout({
  children,
  requiredRole,
  title,
  sidebarProps = {},
  noPadding = false,
}: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Real-time status checking for sellers
  useEffect(() => {
    if (requiredRole !== "seller" || status === "loading" || !session) return;

    const checkSellerStatus = async () => {
      try {
        const response = await fetch("/api/seller/status");
        if (response.ok) {
          const data = await response.json();

          // If seller is now blocked, force logout (but only if not already on blocked page)
          if (
            data.isBlocked &&
            !window.location.pathname.includes("/seller/blocked")
          ) {
            console.log("Seller blocked - forcing logout");
            await signOut({
              callbackUrl: "/auth/signin?role=seller&message=blocked",
              redirect: true,
            });
            return;
          }

          // Handle verification status changes (but not if on blocked page)
          if (!window.location.pathname.includes("/seller/blocked")) {
            if (data.verificationStatus === "pending") {
              router.push("/seller/pending");
              return;
            } else if (data.verificationStatus === "rejected") {
              router.push("/seller/rejected");
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking seller status:", error);
      }
    };

    // Check status immediately
    checkSellerStatus();

    // Set up interval to check status every 30 seconds
    const interval = setInterval(checkSellerStatus, 30000);

    return () => clearInterval(interval);
  }, [session, status, requiredRole, router]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(`/auth/signin?role=${requiredRole}`);
      return;
    }

    const user = session.user as ExtendedUser;
    if (user?.role !== requiredRole) {
      router.push(`/auth/signin?role=${requiredRole}`);
      return;
    }

    // Only check verification status for sellers
    if (requiredRole === "seller" && user?.verificationStatus === "pending") {
      router.push("/seller/pending");
      return;
    }

    if (requiredRole === "seller" && user?.verificationStatus === "rejected") {
      router.push("/seller/rejected");
      return;
    }

    // Check if seller is blocked (this is from JWT token, but real-time check above will handle actual blocking)
    // Only redirect to blocked page if not already there
    if (
      requiredRole === "seller" &&
      user?.isBlocked &&
      !window.location.pathname.includes("/seller/blocked")
    ) {
      console.log("Seller is blocked, redirecting to blocked page");
      router.push("/seller/blocked");
      return;
    }

    setIsLoading(false);
  }, [session, status, router, requiredRole]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="dashboard-layout min-h-screen bg-background flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => {
            setIsMobileMenuOpen(false);
          }}
        />
      )}

      {/* Sidebar - Fixed position on mobile, static on desktop */}
      <div
        className={`sidebar-container ${
          isMobileMenuOpen ? "open" : ""
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50`}
        style={{
          transform: isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <Sidebar
          userRole={(session.user as ExtendedUser).role as "admin" | "seller"}
          userEmail={(session.user as ExtendedUser).email}
          storeName={(session.user as ExtendedUser).storeName}
          {...sidebarProps}
        />
      </div>

      {/* Main Content Area */}
      <div className="main-content flex-1 flex flex-col min-h-screen lg:min-h-screen">
        {/* Mobile Header */}
        <div className="mobile-header lg:hidden bg-card border-b border-border sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
                className={`p-2 rounded-md transition-colors touch-manipulation ${
                  isMobileMenuOpen
                    ? "bg-sidebar-hover"
                    : "hover:bg-sidebar-hover"
                }`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-foreground" />
                ) : (
                  <Menu className="w-5 h-5 text-foreground" />
                )}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {(session.user as ExtendedUser).role === "admin"
                      ? "A"
                      : "S"}
                  </span>
                </div>
                <span className="font-semibold text-foreground">
                  {(session.user as ExtendedUser).role === "admin"
                    ? "Admin"
                    : "Seller"}
                </span>
              </div>
            </div>
            {title && (
              <h1 className="text-lg font-semibold text-foreground truncate max-w-[200px]">
                {title}
              </h1>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className={`content-wrapper flex-1 ${noPadding ? "" : "p-4 lg:p-6"}`}
        >
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${noPadding ? "h-full" : ""}`}
          >
            {title && !noPadding && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 hidden lg:block"
              >
                <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                <div className="w-20 h-1 bg-gradient-primary rounded-full mt-2"></div>
              </motion.div>
            )}

            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
