"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function SellerPendingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkVerificationStatusOnLoad = useCallback(async () => {
    try {
      const response = await fetch("/api/seller/status");
      if (response.ok) {
        const data = await response.json();

        // Check if seller is blocked
        if (data.isBlocked) {
          // Force session refresh to get updated JWT token
          await update();
          router.push("/seller/blocked");
          return;
        }

        if (data.verificationStatus === "verified") {
          // Force session refresh to get updated JWT token
          await update();
          router.push("/auth/signin?role=seller&message=verified");
        } else if (data.verificationStatus === "rejected") {
          // Force session refresh to get updated JWT token
          await update();
          router.push("/seller/rejected");
        }
        // If still pending, stay on this page
      }
    } catch (error) {
      console.error("Error checking status on load:", error);
      // Don't show error toast on page load, just log it
    }
  }, [router, update]);

  const checkVerificationStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/seller/status");
      if (response.ok) {
        const data = await response.json();
        setLastChecked(new Date().toLocaleTimeString());

        // Check if seller is blocked
        if (data.isBlocked) {
          toast.error("Your account has been blocked!");
          // Force session refresh to get updated JWT token
          await update();
          router.push("/seller/blocked");
          return;
        }

        if (data.verificationStatus === "verified") {
          toast.success("Your account has been verified! Please login again.");
          // Force session refresh to get updated JWT token
          await update();
          router.push("/auth/signin?role=seller&message=verified");
        } else if (data.verificationStatus === "rejected") {
          toast.error(
            `Account rejected: ${data.rejectionReason || "No reason provided"}`
          );
          // Force session refresh to get updated JWT token
          await update();
          router.push("/seller/rejected");
        } else {
          toast.success("Your account is still pending verification");
        }
      }
    } catch {
      toast.error("Failed to check status");
    } finally {
      setIsChecking(false);
    }
  }, [router, update]);

  // Auto-check status every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkVerificationStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [checkVerificationStatus]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as { role?: string })?.role !== "seller") {
      router.push("/auth/signin");
      return;
    }

    if (
      (session.user as { verificationStatus?: string })?.verificationStatus ===
      "verified"
    ) {
      router.push("/seller/dashboard");
      return;
    }

    if (
      (session.user as { verificationStatus?: string })?.verificationStatus ===
      "rejected"
    ) {
      router.push("/seller/rejected");
      return;
    }

    // Check current status immediately when page loads
    checkVerificationStatusOnLoad();
  }, [session, status, router, checkVerificationStatusOnLoad]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user as {
    role?: string;
    verificationStatus?: string;
    storeName?: string;
    email?: string;
  };

  // If user is not a seller, redirect to signin
  if (user?.role !== "seller") {
    router.push("/auth/signin");
    return null;
  }

  // If user is already verified, redirect to dashboard
  if (user?.verificationStatus === "verified") {
    router.push("/auth/signin?role=seller&message=verified");
    return null;
  }

  // If user is rejected, redirect to rejected page
  if (user?.verificationStatus === "rejected") {
    router.push("/seller/rejected");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/30">
            <Clock className="w-12 h-12 text-yellow-400" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Please Wait - Account Under Review
          </h1>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8 backdrop-blur-sm">
            <p className="text-xl text-yellow-300 font-medium text-center">
              Admin will review and approve your account soon!
            </p>
          </div>

          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Thank you for registering! Your account is currently under review by
            our admin team. This process typically takes 24-48 hours. You can
            check your status anytime using the button below.
          </p>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              What happens next?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <span className="text-2xl font-bold text-blue-400">1</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Admin Review</h3>
                <p className="text-gray-300 text-sm">
                  Our admin team will review your ID and store information
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <span className="text-2xl font-bold text-green-400">2</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Verification</h3>
                <p className="text-gray-300 text-sm">
                  Once approved, you&apos;ll get access to your seller dashboard
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <span className="text-2xl font-bold text-purple-400">3</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Start Selling</h3>
                <p className="text-gray-300 text-sm">
                  Pick products and start earning commissions
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={checkVerificationStatus}
              disabled={isChecking}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mx-auto transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Checking Status...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Check Verification Status
                </>
              )}
            </button>

            {lastChecked && (
              <p className="text-sm text-gray-400 text-center">
                Last checked: {lastChecked}
              </p>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 mx-auto transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-400 bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <p className="mb-1">
              <span className="text-gray-300 font-medium">Store:</span>{" "}
              {(session?.user as { storeName?: string })?.storeName ?? "-"}
            </p>
            <p>
              <span className="text-gray-300 font-medium">Email:</span>{" "}
              {(session?.user as { email?: string })?.email ?? "-"}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
