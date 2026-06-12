"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  FileText,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import StarRating from "@/components/StarRating";
import ImageWithFallback from "@/components/ImageWithFallback";

interface Seller {
  _id: string;
  email: string;
  plainPassword?: string;
  transactionPin?: string;
  username?: string;
  storeName: string;
  verificationStatus: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  rating?: number;
  ratingCount?: number;
  isBlocked?: boolean;
  blockedReason?: string;
  createdAt: string;
}

interface IDImages {
  idImageFront: string;
  idImageBack: string;
}

export default function AdminSellerDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sellerId = params?.id as string;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [idImages, setIdImages] = useState<IDImages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [isUpdatingRating, setIsUpdatingRating] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);
  const [wallet, setWallet] = useState<{balance: number; pendingBalance: number; totalEarned: number} | null>(null);
  const fetchSellerImages = useCallback(async () => {
    // Check if images are already loaded
    if (imagesLoaded) return;

    setIsLoadingImages(true);
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/id-image`);
      if (response.ok) {
        const data = await response.json();
        setIdImages(data);
        setImagesLoaded(true);
      } else if (response.status === 404) {
        // Seller doesn't have ID images uploaded yet
        console.log("Seller doesn't have ID images uploaded");
        setImagesLoaded(true); // Mark as loaded to prevent retries
      } else {
        console.error("Failed to load ID images:", response.status);
      }
    } catch (error) {
      console.error("Error fetching ID images:", error);
      setImagesLoaded(true); // Mark as loaded to prevent retries
    } finally {
      setIsLoadingImages(false);
    }
  }, [sellerId, imagesLoaded]);

  const fetchSellerDetails = useCallback(async () => {
    try {
      // Add cache busting to ensure fresh data
      const response = await fetch(`/api/admin/sellers?t=${Date.now()}`);
      if (response.ok) {
        const sellers = await response.json();
        const foundSeller = sellers.find((s: Seller) => s._id === sellerId);
        if (foundSeller) {
            setSeller(foundSeller);
            fetchSellerImages();
            // Fetch wallet
            const walletRes = await fetch(`/api/admin/sellers/${sellerId}/wallet`);
            if (walletRes.ok) {
              const walletData = await walletRes.json();
              setWallet(walletData);
            }
        } else {
          toast.error("Seller not found");
          router.push("/admin/sellers");
        }
      }
    } catch (error) {
      console.error("Error fetching seller details:", error);
      toast.error("Failed to fetch seller details");
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, router, fetchSellerImages]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as { role?: string })?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    if (sellerId) {
      fetchSellerDetails();
    }
  }, [session, status, router, sellerId, fetchSellerDetails]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedImage) {
        setSelectedImage(null);
        setImageZoom(1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  const handleVerification = async (status: "verified" | "rejected") => {
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          rejectionReason: status === "rejected" ? rejectionReason : undefined,
        }),
      });

      if (response.ok) {
        toast.success(
          `Seller ${
            status === "verified" ? "verified" : "rejected"
          } successfully`
        );
        // Add a small delay to ensure database is updated
        setTimeout(() => {
          fetchSellerDetails();
        }, 500);
        setRejectionReason("");
      } else {
        toast.error("Failed to update seller status");
      }
    } catch (error) {
      console.error("Error updating seller status:", error);
      toast.error("An error occurred");
    }
  };

  const handleRatingChange = async (newRating: number) => {
    setIsUpdatingRating(true);
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: newRating }),
      });

      if (response.ok) {
        toast.success("Rating updated successfully");
        // Refresh seller details to get updated rating
        setTimeout(() => {
          fetchSellerDetails();
        }, 500);
      } else {
        toast.error("Failed to update rating");
      }
    } catch (error) {
      console.error("Error updating rating:", error);
      toast.error("An error occurred while updating rating");
    } finally {
      setIsUpdatingRating(false);
    }
  };

  const handleBlockSeller = async (action: "block" | "unblock") => {
    try {
      setIsBlocking(true);
      const response = await fetch(`/api/admin/sellers/${sellerId}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reason: action === "block" ? blockReason : undefined,
        }),
      });

      if (response.ok) {
        toast.success(`Seller ${action}ed successfully`);
        // Refresh seller details
        setTimeout(() => {
          fetchSellerDetails();
        }, 500);
        setBlockReason("");
      } else {
        toast.error(`Failed to ${action} seller`);
      }
    } catch (error) {
      console.error(`Error ${action}ing seller:`, error);
      toast.error(`An error occurred while ${action}ing seller`);
    } finally {
      setIsBlocking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "verified":
        return "text-green-600 bg-green-100 border-green-200";
      case "rejected":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "verified":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!seller) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Seller not found
          </h3>
          <p className="text-muted-foreground mb-4">
            The seller you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <button
            onClick={() => router.push("/admin/sellers")}
            className="btn-primary"
          >
            Back to Sellers
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/sellers")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Sellers
            </button>
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-2xl font-bold text-foreground">
              Seller Details
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSellerDetails}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                seller.verificationStatus
              )}`}
            >
              {getStatusIcon(seller.verificationStatus)}
              <span className="ml-1 capitalize">
                {seller.verificationStatus}
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seller Information */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Seller Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Store Name
                  </label>
                  <p className="text-foreground font-medium">
                    {seller.storeName}
                  </p>
                </div>
                {seller.username && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Username
                    </label>
                    <p className="text-foreground font-medium">
                      @{seller.username}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </label>
                  <p className="text-foreground font-medium">{seller.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Password
                  </label>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {seller.plainPassword || "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Transaction PIN
                  </label>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {seller.transactionPin || "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Registration Date
                  </label>
                  <p className="text-foreground">
                    {formatDate(seller.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Rating
                  </label>
                  <div className="mt-2">
                    <StarRating
                      rating={seller.rating || 5}
                      ratingCount={seller.ratingCount || 0}
                      onRatingChange={handleRatingChange}
                      readonly={isUpdatingRating}
                      showValue={true}
                      size="lg"
                    />
                  </div>
                </div>
                {seller.rejectionReason && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Rejection Reason
                    </label>
                    <p className="text-red-600 text-sm">
                      {seller.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Actions */}
            {seller.verificationStatus === "pending" && (
              <div className="card mt-6">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Verification Actions
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <button
                    onClick={() => handleVerification("verified")}
                    className="w-full btn-success flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Seller
                  </button>
                  <div className="space-y-2">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (optional)"
                      className="w-full p-3 border border-border rounded-lg resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => handleVerification("rejected")}
                      className="w-full btn-destructive flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Seller
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Wallet */}
            <div className="card mt-6">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet w-5 h-5" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path></svg> Wallet
                  </h3>
                  <button onClick={() => {
                    fetch(`/api/admin/sellers/${sellerId}/wallet`)
                      .then(res => res.json())
                      .then(data => setWallet(data));
                  }}>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {wallet ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Available</p>
                        <p className="text-xl font-bold">${wallet.balance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-xl font-bold">${wallet.pendingBalance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Earned</p>
                        <p className="text-xl font-bold">${wallet.totalEarned.toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Last updated {new Date().toLocaleString()}
                    </p>
                    <button
                      onClick={() => router.push(`/admin/wallet?sellerId=${sellerId}`)}
                      className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet w-5 h-5" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path></svg> Manage Wallet
                    </button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center">No wallet found</p>
                )}
              </div>
            </div>

            {/* Block/Unblock Actions */}
            <div className="card mt-6">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Management
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {seller.isBlocked ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-800">
                          Account Blocked
                        </span>
                      </div>
                      {seller.blockedReason && (
                        <p className="text-sm text-red-700">
                          {seller.blockedReason}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleBlockSeller("unblock")}
                      disabled={isBlocking}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {isBlocking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Unblocking...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Unblock Seller
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <textarea
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Reason for blocking (required)"
                        className="w-full p-3 border border-border rounded-lg resize-none"
                        rows={3}
                      />
                      <button
                        onClick={() => handleBlockSeller("block")}
                        disabled={isBlocking || !blockReason.trim()}
                        className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {isBlocking ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Blocking...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Block Seller
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ID Verification */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Identity Verification
                </h2>
              </div>
              <div className="p-6">
                {isLoadingImages ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : idImages ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front ID Image */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        Front ID Image
                      </h3>
                      <div className="relative group cursor-pointer">
                        <ImageWithFallback
                          src={idImages.idImageFront}
                          alt="Front ID"
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg border-2 border-border hover:border-primary transition-colors"
                          onClick={() =>
                            setSelectedImage(idImages.idImageFront)
                          }
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium">
                            Click to enlarge
                          </span>
                        </div>
                      </div>
                      <button
                        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                        onClick={() => setSelectedImage(idImages.idImageFront)}
                      >
                        View Full Size
                      </button>
                    </div>

                    {/* Back ID Image */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        Back ID Image
                      </h3>
                      <div className="relative group cursor-pointer">
                        <ImageWithFallback
                          src={idImages.idImageBack}
                          alt="Back ID"
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg border-2 border-border hover:border-primary transition-colors"
                          onClick={() => setSelectedImage(idImages.idImageBack)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium">
                            Click to enlarge
                          </span>
                        </div>
                      </div>
                      <button
                        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                        onClick={() => setSelectedImage(idImages.idImageBack)}
                      >
                        View Full Size
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      ID Images Not Available
                    </h3>
                    <p className="text-muted-foreground">
                      {isLoadingImages
                        ? "Loading ID images..."
                        : "The seller hasn't uploaded their ID images yet or they are not available."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedImage(null);
              setImageZoom(1);
            }
          }}
        >
          <div className="relative w-full max-w-6xl max-h-[95vh] p-6">
            {/* Close button */}
            <button
              onClick={() => {
                setSelectedImage(null);
                setImageZoom(1);
              }}
              className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl hover:bg-white transition-all duration-200 hover:scale-110"
            >
              <XCircle className="w-6 h-6 text-gray-700" />
            </button>

            {/* Zoom controls */}
            <div className="flex gap-3 absolute top-4 left-4 z-20">
              <button
                onClick={() => setImageZoom(Math.max(0.25, imageZoom - 0.25))}
                className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50"
                disabled={imageZoom <= 0.25}
              >
                <ZoomOut className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setImageZoom(1)}
                className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-3 shadow-xl hover:bg-white transition-all duration-200 hover:scale-110 text-sm font-medium text-gray-700"
              >
                {Math.round(imageZoom * 100)}%
              </button>
              <button
                onClick={() => setImageZoom(Math.min(4, imageZoom + 0.25))}
                className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50"
                disabled={imageZoom >= 4}
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Image container */}
            <div className="relative overflow-hidden rounded-lg">
              <ImageWithFallback
                src={selectedImage}
                alt="ID Image"
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${imageZoom})`,
                  cursor: imageZoom > 1 ? "grab" : "default",
                }}
              />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                Use zoom controls to examine details • Press ESC to close
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
