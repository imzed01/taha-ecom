"use client";

import { useState, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Show message if redirected due to blocking, unblocking, or verification
  useEffect(() => {
    const message = searchParams?.get("message");
    if (message === "blocked") {
      toast.error("Your account has been blocked. Please contact support.", {
        duration: 5000,
      });
    } else if (message === "unblocked") {
      toast.success("Your account has been unblocked! You can now login.", {
        duration: 5000,
      });
    } else if (message === "verified") {
      toast.success("Your account has been verified! You can now login.", {
        duration: 5000,
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Automatically determine role based on email
      const role = email === "admin@taha.com" ? "admin" : "seller";

      const result = await signIn("credentials", {
        email,
        password,
        role,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials");
      } else if (result?.ok) {
        if (role === "seller") {
          // For sellers, check verification status immediately
          try {
            const statusResponse = await fetch("/api/seller/status");
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();

              // Check if seller is blocked
              if (statusData.isBlocked) {
                router.push("/seller/blocked");
              } else if (statusData.verificationStatus === "pending") {
                router.push("/seller/pending");
              } else if (statusData.verificationStatus === "rejected") {
                router.push("/seller/rejected");
              } else if (statusData.verificationStatus === "verified") {
                router.push("/seller/dashboard");
              } else {
                router.push("/seller/dashboard"); // Fallback
              }
            } else {
              router.push("/seller/dashboard"); // Fallback
            }
          } catch {
            router.push("/seller/dashboard"); // Fallback
          }
        } else {
          router.push("/admin/dashboard");
        }
      }
    } catch {
      toast.error("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-sm sm:max-w-md"
      >
        <div className="card p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-12 h-12 sm:w-16 sm:h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
            >
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input w-full px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2 sm:py-3 px-4 font-medium focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a
                href="/auth/signup"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignInPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <SignInPage />
    </Suspense>
  );
}
