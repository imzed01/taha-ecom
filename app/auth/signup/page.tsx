"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Upload,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Validation schema using Zod
const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be less than 50 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores"
    ),
  storeName: z
    .string()
    .min(1, "Store name is required")
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must be less than 100 characters"),
  transactionPin: z
    .string()
    .min(1, "Transaction PIN is required")
    .length(4, "Transaction PIN must be exactly 4 digits")
    .regex(/^\d{4}$/, "Transaction PIN must contain only numbers"),
  referralCode: z
    .string()
    .min(1, "Referral code is required")
    .length(6, "Referral code must be exactly 6 characters")
    .regex(
      /^[A-Z0-9]{6}$/,
      "Referral code must be 6 uppercase letters or numbers"
    ),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [idImageFront, setIdImageFront] = useState<File | null>(null);
  const [idImageBack, setIdImageBack] = useState<File | null>(null);
  const [previewUrlFront, setPreviewUrlFront] = useState<string>("");
  const [previewUrlBack, setPreviewUrlBack] = useState<string>("");
  const [imageErrors, setImageErrors] = useState<{
    front?: string;
    back?: string;
  }>({});

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password");

  // Custom validation for password confirmation
  const validatePasswordConfirmation = (value: string) => {
    if (value !== watchedPassword) {
      return "Passwords do not match";
    }
    return true;
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear previous errors
      setImageErrors((prev) => ({ ...prev, [type]: undefined }));

      // Validate file size and type
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (file.size > maxSize) {
        setImageErrors((prev) => ({
          ...prev,
          [type]: "Image size must be less than 5MB",
        }));
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setImageErrors((prev) => ({
          ...prev,
          [type]: "Only JPEG, PNG, and WebP images are allowed",
        }));
        return;
      }

      if (type === "front") {
        setIdImageFront(file);
        const url = URL.createObjectURL(file);
        setPreviewUrlFront(url);
      } else {
        setIdImageBack(file);
        const url = URL.createObjectURL(file);
        setPreviewUrlBack(url);
      }
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    // Clear any previous field errors
    clearErrors();

    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    // Validate images
    if (!idImageFront || !idImageBack) {
      if (!idImageFront) {
        setImageErrors((prev) => ({
          ...prev,
          front: "Please upload the front image of your ID",
        }));
      }
      if (!idImageBack) {
        setImageErrors((prev) => ({
          ...prev,
          back: "Please upload the back image of your ID",
        }));
      }
      return;
    }

    // Check for image errors
    if (imageErrors.front || imageErrors.back) {
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("email", data.email);
      formDataToSend.append("password", data.password);
      formDataToSend.append("username", data.username);
      formDataToSend.append("storeName", data.storeName);
      formDataToSend.append("transactionPin", data.transactionPin);
      formDataToSend.append("referralCode", data.referralCode);
      formDataToSend.append("idImageFront", idImageFront);
      formDataToSend.append("idImageBack", idImageBack);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: formDataToSend,
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success(
          "Registration successful! Please wait for admin verification."
        );
        router.push("/auth/signin");
      } else {
        // Handle specific field errors from backend
        if (responseData.fieldErrors) {
          Object.keys(responseData.fieldErrors).forEach((field) => {
            if (field in data) {
              setError(field as keyof SignupFormData, {
                type: "server",
                message: responseData.fieldErrors[field],
              });
            }
          });
        } else {
          // Show general error message
          toast.error(responseData.message || "Registration failed");
        }
      }
    } catch (error) {
      toast.error(
        (error as Error)?.message || "An error occurred during registration"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render error message
  const renderError = (error?: string) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-1 mt-1 text-sm text-red-500">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  };

  // Helper function to render field error
  const renderFieldError = (fieldName: keyof SignupFormData) => {
    const error = errors[fieldName];
    if (!error) return null;
    return (
      <div className="flex items-center gap-1 mt-1 text-sm text-red-500">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error.message}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="card p-8 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <ShoppingBag className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Join as Seller
            </h1>
            <p className="text-muted-foreground">
              Create your seller account and start earning
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="storeName"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Store Name
              </label>
              <input
                id="storeName"
                {...register("storeName")}
                type="text"
                className={`input w-full px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.storeName ? "border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="Enter your store name"
              />
              {renderFieldError("storeName")}
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Username
              </label>
              <input
                id="username"
                {...register("username")}
                type="text"
                className={`input w-full px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.username ? "border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="Enter your username"
              />
              {renderFieldError("username")}
              <p className="text-xs text-muted-foreground mt-1">
                This will be your unique identifier on the platform
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                {...register("email")}
                type="email"
                className={`input w-full px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.email ? "border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="Enter your email"
              />
              {renderFieldError("email")}
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
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className={`input w-full px-4 py-3 pr-12 focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.password ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {renderFieldError("password")}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  {...register("confirmPassword", {
                    validate: validatePasswordConfirmation,
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  className={`input w-full px-4 py-3 pr-12 focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {renderFieldError("confirmPassword")}
            </div>

            <div>
              <label
                htmlFor="transactionPin"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Transaction PIN
              </label>
              <input
                id="transactionPin"
                {...register("transactionPin")}
                type="text"
                maxLength={4}
                className={`input w-full px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.transactionPin
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="Enter 4-digit PIN"
              />
              {renderFieldError("transactionPin")}
            </div>

            <div>
              <label
                htmlFor="referralCode"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Referral Code
              </label>
              <input
                id="referralCode"
                {...register("referralCode")}
                type="text"
                maxLength={6}
                className={`input w-full px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.referralCode ? "border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="Enter 6-digit referral code"
              />
              {renderFieldError("referralCode")}
              <p className="text-xs text-muted-foreground mt-1">
                You need a valid referral code to register as a seller
              </p>
            </div>

            {/* Identity Verification Section */}
            <div className="space-y-4">
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  </div>
                  Identity Verification
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Please upload clear images of both sides of your
                  government-issued ID for verification
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front ID Image */}
                <div>
                  <label
                    htmlFor="idImageFront"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Front Side of ID
                  </label>
                  <div className="relative">
                    <input
                      id="idImageFront"
                      name="idImageFront"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, "front")}
                      required
                      className="hidden"
                    />
                    <label
                      htmlFor="idImageFront"
                      className={`flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${
                        imageErrors.front ? "border-red-500" : "border-border"
                      }`}
                    >
                      {previewUrlFront ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={previewUrlFront}
                            alt="ID Front Preview"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                            <Upload className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Front side
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  {renderError(imageErrors.front)}
                </div>

                {/* Back ID Image */}
                <div>
                  <label
                    htmlFor="idImageBack"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Back Side of ID
                  </label>
                  <div className="relative">
                    <input
                      id="idImageBack"
                      name="idImageBack"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, "back")}
                      required
                      className="hidden"
                    />
                    <label
                      htmlFor="idImageBack"
                      className={`flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${
                        imageErrors.back ? "border-red-500" : "border-border"
                      }`}
                    >
                      {previewUrlBack ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={previewUrlBack}
                            alt="ID Back Preview"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                            <Upload className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Back side
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  {renderError(imageErrors.back)}
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full btn-primary py-3 px-4 font-medium focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <motion.button
                onClick={() => router.push("/auth/signin")}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign in here
              </motion.button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
