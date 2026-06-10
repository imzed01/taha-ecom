"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  User,
  Wallet,
  Clock,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import ImageWithFallback from "@/components/ImageWithFallback";

interface WalletRequest {
  _id: string;
  sellerId: {
    storeName: string;
    email: string;
  };
  type: "topup" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected";
  description: string;
  proofImage?: string;
  adminNotes?: string;
  createdAt: string;
}

interface FundingRequest {
  _id: string;
  sellerId: {
    storeName: string;
    email: string;
  };
  type: "funding_request" | "topup"; // Temporarily include topup
  amount: number;
  status: "pending" | "approved" | "rejected";
  description: string;
  adminNotes?: string;
  createdAt: string;
}

interface WithdrawalRequest {
  _id: string;
  sellerId: {
    storeName: string;
    email: string;
  };
  amount: number;
  transactionPin: string;
  paymentMethod: "crypto" | "bank_account";
  paymentDetails: {
    walletAddress?: string;
    cryptoType?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

interface SellerWithWallet {
  _id: string;
  email: string;
  storeName: string;
  name: string;
  wallet: {
    balance: number;
    pendingBalance: number;
    totalEarned: number;
  };
}

export default function AdminWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [fundingRequests, setFundingRequests] = useState<FundingRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(
    null
  );
  const [selectedFundingRequest, setSelectedFundingRequest] =
    useState<FundingRequest | null>(null);
  const [selectedWithdrawalRequest, setSelectedWithdrawalRequest] =
    useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sellersWithWallets, setSellersWithWallets] = useState<
    SellerWithWallet[]
  >([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerWithWallet | null>(
    null
  );
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentAction, setAdjustmentAction] = useState<"add" | "deduct">(
    "add"
  );
  const [adjustmentReason, setAdjustmentReason] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as { role?: string })?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    fetchRequests();
  }, [session, status, router]);

  const fetchRequests = async () => {
    try {
      const [walletResponse, withdrawalResponse, sellersResponse] =
        await Promise.all([
          fetch("/api/admin/wallet/requests"),
          fetch("/api/admin/wallet/withdrawal-requests"),
          fetch("/api/admin/wallet/adjust-balance"),
        ]);

      if (walletResponse.ok) {
        const data = await walletResponse.json();
        console.log("All requests:", data); // Debug log
        // Separate wallet requests and funding requests
        // Temporarily treat topup requests as funding requests
        const walletRequests = data.filter(
          (req: { type: string }) =>
            req.type !== "topup" && req.type !== "funding_request"
        );
        const fundingRequests = data.filter(
          (req: { type: string }) =>
            req.type === "topup" || req.type === "funding_request"
        );
        console.log("Funding requests:", fundingRequests); // Debug log
        setRequests(walletRequests);
        setFundingRequests(fundingRequests);
      }

      if (withdrawalResponse.ok) {
        const withdrawalData = await withdrawalResponse.json();
        console.log("Withdrawal requests:", withdrawalData); // Debug log
        setWithdrawalRequests(withdrawalData);
      }

      if (sellersResponse.ok) {
        const sellersData = await sellersResponse.json();
        setSellersWithWallets(sellersData);
      }
    } catch {
      console.error("Error fetching wallet requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const response = await fetch(
        `/api/admin/wallet/requests/${requestId}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminNotes: action === "reject" ? adminNotes : undefined,
          }),
        }
      );

      if (response.ok) {
        toast.success(`Request ${action}d successfully`);
        fetchRequests();
        setSelectedRequest(null);
        setSelectedFundingRequest(null);
        setAdminNotes("");

        // Update wallet badge
        window.dispatchEvent(
          new CustomEvent("updateWalletBadge", {
            detail: { count: 0 },
          })
        );

        // Update wallet updates badge for seller
        window.dispatchEvent(
          new CustomEvent("updateWalletUpdatesBadge", {
            detail: { count: 0 },
          })
        );
      } else {
        toast.error(`Failed to ${action} request`);
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleFundingRequestAction = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const response = await fetch(
        `/api/admin/wallet/requests/${requestId}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminNotes: action === "reject" ? adminNotes : undefined,
          }),
        }
      );

      if (response.ok) {
        toast.success(`Funding request ${action}d successfully`);
        fetchRequests();
        setSelectedFundingRequest(null);
        setAdminNotes("");

        // Update wallet badge
        window.dispatchEvent(
          new CustomEvent("updateWalletBadge", {
            detail: { count: 0 },
          })
        );

        // Update wallet updates badge for seller
        window.dispatchEvent(
          new CustomEvent("updateWalletUpdatesBadge", {
            detail: { count: 0 },
          })
        );
      } else {
        toast.error(`Failed to ${action} funding request`);
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleWithdrawalRequestAction = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const response = await fetch(
        `/api/admin/wallet/withdrawal-requests/${requestId}/${action}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminNotes: action === "reject" ? adminNotes : undefined,
          }),
        }
      );

      if (response.ok) {
        toast.success(`Withdrawal request ${action}d successfully`);
        fetchRequests();
        setSelectedWithdrawalRequest(null);
        setAdminNotes("");

        // Update wallet badge
        window.dispatchEvent(
          new CustomEvent("updateWalletBadge", {
            detail: { count: 0 },
          })
        );

        // Update wallet updates badge for seller
        window.dispatchEvent(
          new CustomEvent("updateWalletUpdatesBadge", {
            detail: { count: 0 },
          })
        );
      } else {
        toast.error(`Failed to ${action} withdrawal request`);
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleWalletAdjustment = async () => {
    if (!selectedSeller || !adjustmentAmount || !adjustmentReason) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/admin/wallet/adjust-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId: selectedSeller._id,
          amount: parseFloat(adjustmentAmount),
          action: adjustmentAction,
          reason: adjustmentReason,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchRequests();
        setShowAdjustmentModal(false);
        setSelectedSeller(null);
        setAdjustmentAmount("");
        setAdjustmentReason("");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to adjust wallet balance");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-warning bg-warning/20";
      case "approved":
        return "text-success bg-success/20";
      case "rejected":
        return "text-destructive bg-destructive/20";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "topup" ? (
      <TrendingUp className="w-4 h-4 text-success" />
    ) : (
      <TrendingDown className="w-4 h-4 text-destructive" />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRequestStats = () => {
    const total = requests.length;
    const pending = requests.filter(
      (request) => request.status === "pending"
    ).length;
    const approved = requests.filter(
      (request) => request.status === "approved"
    ).length;
    const rejected = requests.filter(
      (request) => request.status === "rejected"
    ).length;
    const totalAmount = requests
      .filter((request) => request.status === "approved")
      .reduce((sum, request) => sum + request.amount, 0);

    return { total, pending, approved, rejected, totalAmount };
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.sellerId.storeName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.sellerId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;
    const matchesType = typeFilter === "all" || request.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = getRequestStats();

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout requiredRole="admin" title="Wallet Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin" title="Wallet Management">
      {/* Wallet Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Requests
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
                Approved
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.approved}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-secondary rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Processed
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalAmount)}
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
                placeholder="Search requests by seller name, email, or description..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-full px-4 py-2"
            >
              <option value="all">All Types</option>
              <option value="topup">Top-up</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Wallet Requests
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sidebar-hover">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Seller Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Request Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map((request) => (
                  <tr
                    key={request._id}
                    className="hover:bg-sidebar-hover transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-foreground">
                            {request.sellerId.storeName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.sellerId.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-sidebar-hover rounded-lg flex items-center justify-center mr-3">
                          {getTypeIcon(request.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {request.type === "topup" ? "Top-up" : "Withdrawal"}{" "}
                            Request
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {formatCurrency(request.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">
                          {request.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                        <div className="text-sm text-foreground">
                          {formatDate(request.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleRequestAction(request._id, "approve")
                              }
                              className="flex items-center gap-2 px-3 py-1.5 bg-success/20 text-success rounded-lg hover:bg-success/30 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No wallet requests found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Wallet requests will appear here once sellers submit them"}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Funding Requests Section */}
      {fundingRequests.length >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Funding Requests ({fundingRequests.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sellers requesting funds to be added to their wallet
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sidebar-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Seller Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Request Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fundingRequests.map((request) => (
                    <tr
                      key={request._id}
                      className="hover:bg-sidebar-hover transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-foreground">
                              {request.sellerId.storeName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.sellerId.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                            <DollarSign className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {request.type === "topup"
                                ? "Funding Request"
                                : "Funding Request"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">
                          {formatCurrency(request.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">
                            {request.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                          <div className="text-sm text-foreground">
                            {formatDate(request.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedFundingRequest(request)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleFundingRequestAction(
                                    request._id,
                                    "approve"
                                  )
                                }
                                className="flex items-center gap-2 px-3 py-1.5 bg-success/20 text-success rounded-lg hover:bg-success/30 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setSelectedFundingRequest(request)
                                }
                                className="flex items-center gap-2 px-3 py-1.5 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {fundingRequests.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No funding requests found
                </h3>
                <p className="text-muted-foreground">
                  Funding requests from sellers will appear here once they
                  submit them
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Withdrawal Requests Section */}
      {withdrawalRequests.length >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8"
        >
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Withdrawal Requests ({withdrawalRequests.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sellers requesting to withdraw funds from their wallet
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sidebar-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Seller Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount & PIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {withdrawalRequests.map((request) => (
                    <tr
                      key={request._id}
                      className="hover:bg-sidebar-hover transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-warning" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-foreground">
                              {request.sellerId.storeName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.sellerId.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center mr-3">
                            <CreditCard className="w-4 h-4 text-warning" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {request.paymentMethod === "crypto"
                                ? "Crypto"
                                : "Bank Account"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.paymentMethod === "crypto"
                                ? `${
                                    request.paymentDetails.cryptoType
                                  } - ${request.paymentDetails.walletAddress?.slice(
                                    0,
                                    10
                                  )}...`
                                : `${
                                    request.paymentDetails.bankName
                                  } - ${request.paymentDetails.accountNumber?.slice(
                                    -4
                                  )}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">
                          {formatCurrency(request.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          PIN: {request.transactionPin}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">
                            {request.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                          <div className="text-sm text-foreground">
                            {formatDate(request.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              setSelectedWithdrawalRequest(request)
                            }
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleWithdrawalRequestAction(
                                    request._id,
                                    "approve"
                                  )
                                }
                                className="flex items-center gap-2 px-3 py-1.5 bg-success/20 text-success rounded-lg hover:bg-success/30 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setSelectedWithdrawalRequest(request)
                                }
                                className="flex items-center gap-2 px-3 py-1.5 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {withdrawalRequests.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No withdrawal requests found
                </h3>
                <p className="text-muted-foreground">
                  Withdrawal requests from sellers will appear here once they
                  submit them
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Request Details - {selectedRequest.sellerId.storeName}
            </h3>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Seller
                </label>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.sellerId.storeName} (
                  {selectedRequest.sellerId.email})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Type
                </label>
                <div className="flex items-center">
                  {getTypeIcon(selectedRequest.type)}
                  <span className="ml-2 text-sm text-foreground capitalize">
                    {selectedRequest.type} Request
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Amount
                </label>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(selectedRequest.amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.proofImage && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Proof Image
                  </label>
                  <ImageWithFallback
                    src={selectedRequest.proofImage}
                    alt="Proof"
                    width={500}
                    height={500}
                  />
                </div>
              )}
            </div>

            {selectedRequest.status === "pending" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Admin Notes (if rejecting)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="Provide notes for rejection..."
                />
              </div>
            )}

            <div className="flex space-x-3">
              {selectedRequest.status === "pending" && (
                <>
                  <button
                    onClick={() =>
                      handleRequestAction(selectedRequest._id, "approve")
                    }
                    className="btn-success flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleRequestAction(selectedRequest._id, "reject")
                    }
                    className="btn-destructive flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Funding Request Details Modal */}
      {selectedFundingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Funding Request Details -{" "}
              {selectedFundingRequest.sellerId.storeName}
            </h3>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Seller
                </label>
                <p className="text-sm text-muted-foreground">
                  {selectedFundingRequest.sellerId.storeName} (
                  {selectedFundingRequest.sellerId.email})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Type
                </label>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="ml-2 text-sm text-foreground">
                    Funding Request
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Amount
                </label>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(selectedFundingRequest.amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <p className="text-sm text-muted-foreground">
                  {selectedFundingRequest.description}
                </p>
              </div>

              {selectedFundingRequest.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Admin Notes
                  </label>
                  <p className="text-sm text-muted-foreground bg-sidebar-hover p-3 rounded-lg">
                    {selectedFundingRequest.adminNotes}
                  </p>
                </div>
              )}
            </div>

            {selectedFundingRequest.status === "pending" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Admin Notes (if rejecting)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="Provide notes for rejection..."
                />
              </div>
            )}

            <div className="flex space-x-3">
              {selectedFundingRequest.status === "pending" && (
                <>
                  <button
                    onClick={() =>
                      handleFundingRequestAction(
                        selectedFundingRequest._id,
                        "approve"
                      )
                    }
                    className="btn-success flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleFundingRequestAction(
                        selectedFundingRequest._id,
                        "reject"
                      )
                    }
                    className="btn-destructive flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedFundingRequest(null)}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sellers Wallet Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-8"
      >
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Seller Wallet Management ({sellersWithWallets.length})
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage seller wallet balances
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sidebar-hover">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Seller Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Available Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pending Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Earned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sellersWithWallets.map((seller) => (
                  <tr
                    key={seller._id}
                    className="hover:bg-sidebar-hover transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-foreground">
                            {seller.storeName || seller.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {seller.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {formatCurrency(seller.wallet.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {formatCurrency(seller.wallet.pendingBalance)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {formatCurrency(seller.wallet.totalEarned)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedSeller(seller);
                          setShowAdjustmentModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                      >
                        <Wallet className="w-4 h-4" />
                        Adjust Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sellersWithWallets.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No sellers found
              </h3>
              <p className="text-muted-foreground">
                Verified sellers will appear here with their wallet information
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Wallet Adjustment Modal */}
      {showAdjustmentModal && selectedSeller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Adjust Wallet Balance -{" "}
              {selectedSeller.storeName || selectedSeller.name}
            </h3>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Current Balance
                </label>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(selectedSeller.wallet.balance)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Action
                </label>
                <select
                  value={adjustmentAction}
                  onChange={(e) =>
                    setAdjustmentAction(e.target.value as "add" | "deduct")
                  }
                  className="input w-full"
                >
                  <option value="add">Add Money</option>
                  <option value="deduct">Deduct Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="input w-full"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reason
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="Provide a reason for this adjustment..."
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleWalletAdjustment}
                className="btn-primary flex-1"
              >
                Confirm Adjustment
              </button>
              <button
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setSelectedSeller(null);
                  setAdjustmentAmount("");
                  setAdjustmentReason("");
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Request Details Modal */}
      {selectedWithdrawalRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background/95 backdrop-blur-md rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border/50 shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Withdrawal Request Details -{" "}
              {selectedWithdrawalRequest.sellerId.storeName}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Seller Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Seller Information
                  </label>
                  <div className="bg-sidebar-hover p-4 rounded-lg">
                    <p className="text-sm font-medium text-foreground">
                      {selectedWithdrawalRequest.sellerId.storeName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedWithdrawalRequest.sellerId.email}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Request Amount
                  </label>
                  <div className="bg-sidebar-hover p-4 rounded-lg">
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(selectedWithdrawalRequest.amount)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Transaction PIN
                  </label>
                  <div className="bg-sidebar-hover p-4 rounded-lg">
                    <p className="text-sm font-mono text-foreground">
                      {selectedWithdrawalRequest.transactionPin}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Status
                  </label>
                  <div className="bg-sidebar-hover p-4 rounded-lg">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        selectedWithdrawalRequest.status
                      )}`}
                    >
                      {getStatusIcon(selectedWithdrawalRequest.status)}
                      <span className="ml-1 capitalize">
                        {selectedWithdrawalRequest.status}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Payment Method
                  </label>
                  <div className="bg-sidebar-hover p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CreditCard className="w-4 h-4 text-primary mr-2" />
                      <span className="text-sm font-medium text-foreground capitalize">
                        {selectedWithdrawalRequest.paymentMethod === "crypto"
                          ? "Cryptocurrency"
                          : "Bank Account"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Payment Details
                  </label>
                  <div className="bg-sidebar-hover p-4 rounded-lg space-y-3">
                    {selectedWithdrawalRequest.paymentMethod === "crypto" ? (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Crypto Type
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {
                              selectedWithdrawalRequest.paymentDetails
                                .cryptoType
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Wallet Address
                          </p>
                          <p className="text-sm font-mono text-foreground break-all">
                            {
                              selectedWithdrawalRequest.paymentDetails
                                .walletAddress
                            }
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Bank Name
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedWithdrawalRequest.paymentDetails.bankName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Account Holder
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {
                              selectedWithdrawalRequest.paymentDetails
                                .accountHolderName
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Account Number
                          </p>
                          <p className="text-sm font-mono text-foreground">
                            {
                              selectedWithdrawalRequest.paymentDetails
                                .accountNumber
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Routing Number
                          </p>
                          <p className="text-sm font-mono text-foreground">
                            {
                              selectedWithdrawalRequest.paymentDetails
                                .routingNumber
                            }
                          </p>
                        </div>
                        {selectedWithdrawalRequest.paymentDetails.swiftCode && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              SWIFT Code
                            </p>
                            <p className="text-sm font-mono text-foreground">
                              {
                                selectedWithdrawalRequest.paymentDetails
                                  .swiftCode
                              }
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Request Timeline */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Request Timeline
              </label>
              <div className="bg-sidebar-hover p-4 rounded-lg space-y-3">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-muted-foreground mr-3" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Request Submitted
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(selectedWithdrawalRequest.createdAt)}
                    </p>
                  </div>
                </div>
                {selectedWithdrawalRequest.processedAt && (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-success mr-3" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {selectedWithdrawalRequest.status === "approved"
                          ? "Approved"
                          : "Rejected"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(selectedWithdrawalRequest.processedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            {selectedWithdrawalRequest.adminNotes && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Admin Notes
                </label>
                <div className="bg-sidebar-hover p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {selectedWithdrawalRequest.adminNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedWithdrawalRequest.status === "pending" && (
              <div className="mb-6 p-4 bg-sidebar-hover rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Admin Notes (if rejecting)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="input w-full p-3"
                  rows={3}
                  placeholder="Provide notes for rejection..."
                />
              </div>
            )}

            <div className="flex space-x-4">
              {selectedWithdrawalRequest.status === "pending" && (
                <>
                  <button
                    onClick={() =>
                      handleWithdrawalRequestAction(
                        selectedWithdrawalRequest._id,
                        "approve"
                      )
                    }
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleWithdrawalRequestAction(
                        selectedWithdrawalRequest._id,
                        "reject"
                      )
                    }
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedWithdrawalRequest(null)}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
