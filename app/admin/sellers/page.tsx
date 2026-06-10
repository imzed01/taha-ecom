"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Search,
  Calendar,
  Mail,
  Store,
  RefreshCw,
  Ban,
  Unlock,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import StarRating from "@/components/StarRating";
import toast from "react-hot-toast";

interface Seller {
  _id: string;
  email: string;
  password?: string;
  plainPassword?: string;
  transactionPin?: string;
  username?: string;
  storeName: string;
  idImage?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  rating?: number;
  ratingCount?: number;
  isBlocked?: boolean;
  blockedReason?: string;
  createdAt: string;
}

export default function AdminSellersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [blockingSeller, setBlockingSeller] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as { role?: string })?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    fetchSellers();
  }, [session, status, router]);

  const fetchSellers = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch("/api/admin/sellers?t=" + Date.now());
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched sellers:", data);
        setSellers(data);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      setIsLoading(false);
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSellerStats = () => {
    const total = sellers.length;
    const pending = sellers.filter(
      (seller) => seller.verificationStatus === "pending"
    ).length;
    const verified = sellers.filter(
      (seller) => seller.verificationStatus === "verified"
    ).length;
    const rejected = sellers.filter(
      (seller) => seller.verificationStatus === "rejected"
    ).length;

    return { total, pending, verified, rejected };
  };

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      seller.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (seller.username &&
        seller.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || seller.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = getSellerStats();

  const handleBlockSeller = async (
    sellerId: string,
    action: "block" | "unblock"
  ) => {
    try {
      console.log("Handling block/unblock:", { sellerId, action, blockReason });
      setBlockingSeller(sellerId);
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

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Success response:", data);
        toast.success(data.message || `Seller ${action}ed successfully`);
        // Refresh the sellers list
        fetchSellers();
        setBlockReason("");
        setBlockingSeller(null);
      } else {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        toast.error(errorData.message || `Failed to ${action} seller`);
        setBlockingSeller(null);
      }
    } catch (error) {
      console.error("Error blocking/unblocking seller:", error);
      toast.error(`Error ${action}ing seller`);
      setBlockingSeller(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout requiredRole="admin" title="Seller Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin" title="Seller Management">
      {/* Seller Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Sellers
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-warning rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-success rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Verified
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.verified}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-destructive rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Rejected
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search sellers by store name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-10 pr-4 py-2"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full px-4 py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={fetchSellers}
            disabled={isLoading}
            className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Sellers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Seller Verification Requests
              </h2>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Sorted by most recent
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sidebar-hover">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Seller Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSellers.map((seller) => {
                  const isRecent =
                    new Date(seller.createdAt) >
                    new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return (
                    <tr
                      key={seller._id}
                      className={`hover:bg-sidebar-hover transition-colors ${
                        isRecent ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <Store className="w-5 h-5 text-primary" />
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-foreground">
                                {seller.storeName}
                              </div>
                              {isRecent && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Store ID: {seller._id.slice(-8)}
                            </div>
                            {seller.username && (
                              <div className="text-sm text-muted-foreground">
                                @{seller.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {seller.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              seller.verificationStatus
                            )}`}
                          >
                            {getStatusIcon(seller.verificationStatus)}
                            <span className="ml-1 capitalize">
                              {seller.verificationStatus}
                            </span>
                          </span>
                          {seller.isBlocked && (
                            <div className="flex items-center gap-1">
                              <Ban className="w-3 h-3 text-red-500" />
                              <span className="text-xs text-red-600 font-medium">
                                Blocked
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StarRating
                          rating={seller.rating || 5}
                          ratingCount={seller.ratingCount || 0}
                          readonly={true}
                          size="sm"
                          showValue={false}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                          <div className="text-sm text-foreground">
                            {formatDate(seller.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              router.push(`/admin/sellers/${seller._id}`)
                            }
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          {seller.isBlocked ? (
                            <button
                              onClick={() =>
                                handleBlockSeller(seller._id, "unblock")
                              }
                              disabled={blockingSeller === seller._id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                            >
                              <Unlock className="w-4 h-4" />
                              {blockingSeller === seller._id
                                ? "Unblocking..."
                                : "Unblock"}
                            </button>
                          ) : (
                            <button
                              onClick={() => setBlockingSeller(seller._id)}
                              disabled={blockingSeller === seller._id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              <Ban className="w-4 h-4" />
                              Block
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredSellers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No sellers found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Sellers will appear here once they register"}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Block Reason Modal */}
      {blockingSeller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Block Seller</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for blocking this seller:
            </p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Enter reason for blocking..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setBlockingSeller(null);
                  setBlockReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlockSeller(blockingSeller, "block")}
                disabled={!blockReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Block Seller
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
