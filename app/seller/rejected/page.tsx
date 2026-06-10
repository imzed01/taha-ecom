"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { XCircle, LogOut, RefreshCw, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function SellerRejectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isLoadingReason, setIsLoadingReason] = useState(true);

  const checkVerificationStatusOnLoad = useCallback(async () => {
    try {
      const response = await fetch("/api/seller/status");
      if (response.ok) {
        const data = await response.json();

        // Check if seller is blocked
        if (data.isBlocked) {
          router.push("/seller/blocked");
          return;
        }

        if (data.verificationStatus === "verified") {
          router.push("/seller/dashboard");
        } else if (data.verificationStatus === "pending") {
          router.push("/seller/pending");
        }
        // If still rejected, stay on this page and continue loading rejection reason
      }
    } catch (error) {
      console.error("Error checking status on load:", error);
      // Don't show error toast on page load, just log it
    }
  }, [router]);

  const fetchRejectionReason = useCallback(async () => {
    try {
      const response = await fetch("/api/seller/status");
      if (response.ok) {
        const data = await response.json();
        setRejectionReason(
          data.rejectionReason || "No specific reason provided"
        );
      }
    } catch (error) {
      console.error("Error fetching rejection reason:", error);
      setRejectionReason("Failed to load rejection reason");
    } finally {
      setIsLoadingReason(false);
    }
  }, []);

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
          router.push("/seller/blocked");
          return;
        }

        if (data.verificationStatus === "verified") {
          toast.success("Your account has been verified!");
          router.push("/seller/dashboard");
        } else if (data.verificationStatus === "pending") {
          toast.success("Your account is now pending verification");
          router.push("/seller/pending");
        } else {
          toast.error(
            `Account still rejected: ${
              data.rejectionReason || "No reason provided"
            }`
          );
        }
      }
    } catch {
      toast.error("Failed to check status");
    } finally {
      setIsChecking(false);
    }
  }, [router]);

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
      "pending"
    ) {
      router.push("/seller/pending");
      return;
    }

    // Only fetch rejection reason if status is rejected
    if (
      (session.user as { verificationStatus?: string })?.verificationStatus ===
      "rejected"
    ) {
      fetchRejectionReason();
    }

    // Check current status immediately when page loads
    checkVerificationStatusOnLoad();
  }, [
    session,
    status,
    router,
    checkVerificationStatusOnLoad,
    fetchRejectionReason,
  ]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
    router.push("/seller/dashboard");
    return null;
  }

  // If user is pending, redirect to pending page
  if (user?.verificationStatus === "pending") {
    router.push("/seller/pending");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Account Verification Rejected
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Unfortunately, your account verification has been rejected. Please
            review the reason below and contact support if you believe this is
            an error.
          </p>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Rejection Reason
              </h2>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              {isLoadingReason ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mr-3"></div>
                  <p className="text-red-800 text-lg">
                    Loading rejection reason...
                  </p>
                </div>
              ) : (
                <p className="text-red-800 text-lg">
                  {rejectionReason ||
                    "No specific reason provided. Please contact support for more information."}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Review Issue
                </h3>
                <p className="text-gray-600 text-sm">
                  Check the rejection reason and ensure all information is
                  correct
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Contact Support
                </h3>
                <p className="text-gray-600 text-sm">
                  Reach out to our support team if you need clarification or
                  believe this is an error
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={checkVerificationStatus}
              disabled={isChecking}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mx-auto"
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
              <p className="text-sm text-gray-500 text-center">
                Last checked: {lastChecked}
              </p>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 mx-auto"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              Store:{" "}
              {(session?.user as { storeName?: string })?.storeName ?? "-"}
            </p>
            <p>Email: {(session?.user as { email?: string })?.email ?? "-"}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
