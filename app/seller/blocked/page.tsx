"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Ban,
  AlertTriangle,
  Mail,
  LogOut,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import ChatSupport from "@/components/ChatSupport";

interface BlockedUser {
  id: string;
  email: string;
  role: string;
  storeName?: string;
  isBlocked?: boolean;
  blockedReason?: string;
}

export default function BlockedSellerPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<BlockedUser | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const checkBlockStatusOnLoad = useCallback(async () => {
    try {
      const response = await fetch("/api/seller/status");
      if (response.ok) {
        const data = await response.json();

        // Check if seller is no longer blocked - redirect to login page
        if (!data.isBlocked) {
          // Force session refresh to get updated JWT token
          await update();
          // Redirect to signin page with unblocked message
          router.push("/auth/signin?role=seller&message=unblocked");
          return;
        }

        // Check verification status as well
        if (data.verificationStatus === "pending") {
          // Force session refresh to get updated JWT token
          await update();
          router.push("/seller/pending");
          return;
        } else if (data.verificationStatus === "rejected") {
          // Force session refresh to get updated JWT token
          await update();
          router.push("/seller/rejected");
          return;
        } else if (data.verificationStatus === "verified" && !data.isBlocked) {
          // Force session refresh to get updated JWT token
          await update();
          // Redirect to signin page with unblocked message
          router.push("/auth/signin?role=seller&message=unblocked");
          return;
        }
      }
    } catch (error) {
      console.error("Error checking status on load:", error);
      // Don't show error toast on page load, just log it
    }
  }, [router, update]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as { role?: string })?.role !== "seller") {
      router.push("/auth/signin");
      return;
    }

    const userData = session.user as BlockedUser;
    setUser(userData);

    // Check current status immediately when page loads
    checkBlockStatusOnLoad();
  }, [session, status, router, checkBlockStatusOnLoad]);

  const checkBlockStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/seller/status");
      if (response.ok) {
        const data = await response.json();
        setLastChecked(new Date().toLocaleTimeString());

        // Check if seller is no longer blocked
        if (!data.isBlocked) {
          toast.success("Your account has been unblocked! Please login again.");
          // Force session refresh to get updated JWT token
          await update();
          // Redirect to signin page with unblocked message
          router.push("/auth/signin?role=seller&message=unblocked");
          return;
        }

        // Check verification status as well
        if (data.verificationStatus === "pending") {
          toast.success("Your account is now pending verification");
          // Force session refresh to get updated JWT token
          await update();
          router.push("/seller/pending");
          return;
        } else if (data.verificationStatus === "rejected") {
          toast.error("Your account has been rejected");
          // Force session refresh to get updated JWT token
          await update();
          router.push("/seller/rejected");
          return;
        } else if (data.verificationStatus === "verified" && !data.isBlocked) {
          toast.success("Your account is now verified! Please login again.");
          // Force session refresh to get updated JWT token
          await update();
          // Redirect to signin page with unblocked message
          router.push("/auth/signin?role=seller&message=unblocked");
          return;
        }

        // Still blocked
        toast.error("Your account is still blocked");
      }
    } catch {
      toast.error("Failed to check status");
    } finally {
      setIsChecking(false);
    }
  }, [router, update]);

  // Auto-check status every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkBlockStatus();
    }, 15000);

    return () => clearInterval(interval);
  }, [checkBlockStatus]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If chat is open, show full-screen chat
  if (showChat) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header with back button */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <button
            onClick={() => setShowChat(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Blocked Page
          </button>
          <h1 className="text-lg font-semibold">Support Chat</h1>
          <div></div>
        </div>

        {/* Chat component with fixed height */}
        <div className="h-[90vh] overflow-hidden">
          <ChatSupport />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="card p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Ban className="w-10 h-10 text-red-600" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground mb-4"
          >
            Account Blocked
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-6"
          >
            Your seller account has been blocked by the administrator. You
            cannot access the seller dashboard at this time.
          </motion.p>

          {/* Store Info */}
          {user.storeName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 rounded-lg p-4 mb-6"
            >
              <p className="text-sm text-gray-600 mb-1">Store Name</p>
              <p className="font-medium text-black">{user.storeName}</p>
            </motion.div>
          )}

          {/* Email */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-50 rounded-lg p-4 mb-6"
          >
            <p className="text-sm text-gray-600 mb-1">Email Address</p>
            <p className="font-medium text-black">{user.email}</p>
          </motion.div>

          {/* Block Reason */}
          {user.blockedReason && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Reason for Blocking
                  </p>
                  <p className="text-sm text-red-700">{user.blockedReason}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Status Check Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={checkBlockStatus}
            disabled={isChecking}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            <RefreshCw
              className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
            />
            {isChecking ? "Checking Status..." : "Check Block Status"}
          </motion.button>

          {/* Last checked timestamp */}
          {lastChecked && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground mb-4"
            >
              Last checked: {lastChecked}
            </motion.p>
          )}

          {/* Chat Support Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            onClick={() => setShowChat(true)}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Support
          </motion.button>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Need Help?
                </p>
                <p className="text-sm text-blue-700">
                  If you believe this is an error or have questions, please use
                  the chat support above or contact our support team.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sign Out Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            onClick={handleSignOut}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
