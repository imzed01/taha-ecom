"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Send,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import toast from "react-hot-toast";

interface WalletData {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
}

interface Transaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

interface FundingRequest {
  _id: string;
  amount: number;
  description: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  createdAt: string;
}

interface WithdrawalRequest {
  _id: string;
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

export default function SellerWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    pendingBalance: 0,
    totalEarned: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fundingRequests, setFundingRequests] = useState<FundingRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFundingForm, setShowFundingForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [fundingAmount, setFundingAmount] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [transactionPin, setTransactionPin] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "bank_account">(
    "bank_account"
  );
  const [paymentDetails, setPaymentDetails] = useState({
    walletAddress: "",
    cryptoType: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    routingNumber: "",
    swiftCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinError, setPinError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [fundingPin, setFundingPin] = useState("");
  const [fundingPinError, setFundingPinError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (
      !session ||
      (session.user as { role?: string; verificationStatus?: string })?.role !==
        "seller"
    ) {
      router.push("/auth/signin");
      return;
    }

    if (
      (session.user as { verificationStatus?: string })?.verificationStatus ===
      "pending"
    ) {
      router.push("/seller/pending");
      return;
    }

    if (
      (session.user as { verificationStatus?: string })?.verificationStatus ===
      "rejected"
    ) {
      router.push("/seller/rejected");
      return;
    }

    fetchWalletData();
  }, [session, status, router]);

  const fetchWalletData = async () => {
    try {
      const [
        walletResponse,
        transactionsResponse,
        fundingRequestsResponse,
        withdrawalRequestsResponse,
      ] = await Promise.all([
        fetch("/api/seller/wallet"),
        fetch("/api/seller/wallet/transactions"),
        fetch("/api/seller/wallet/funding-request"),
        fetch("/api/seller/wallet/withdrawal-request"),
      ]);

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWalletData(walletData);
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      }

      if (fundingRequestsResponse.ok) {
        const fundingRequestsData = await fundingRequestsResponse.json();
        setFundingRequests(fundingRequestsData);
      }

      if (withdrawalRequestsResponse.ok) {
        const withdrawalRequestsData = await withdrawalRequestsResponse.json();
        setWithdrawalRequests(withdrawalRequestsData);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFundingPinError("");
    if (!fundingAmount) {
      toast.error("Please enter an amount");
      return;
    }
    const amount = parseFloat(fundingAmount);
    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!fundingPin) {
      setFundingPinError("Please enter your transaction PIN");
      return;
    }
    if (fundingPin.length !== 4) {
      setFundingPinError("PIN must be 4 digits");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/seller/wallet/funding-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          transactionPin: fundingPin,
        }),
      });
      if (response.ok) {
        toast.success("Funding request submitted successfully");
        setShowFundingForm(false);
        setFundingAmount("");
        setFundingPin("");
        fetchWalletData(); // Refresh data

        // Update wallet badge for admin
        window.dispatchEvent(
          new CustomEvent("updateWalletBadge", {
            detail: { count: 0 },
          })
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit request");
      }
    } catch (error) {
      toast.error((error as Error)?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawalStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setAmountError("");

    if (!withdrawalAmount) {
      setAmountError("Please enter an amount");
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setAmountError("Please enter a valid amount");
      return;
    }

    if (amount > walletData.balance) {
      setAmountError("Amount exceeds available balance");
      return;
    }

    if (!transactionPin) {
      setPinError("Please enter your transaction PIN");
      return;
    }

    if (transactionPin.length !== 4) {
      setPinError("PIN must be 4 digits");
      return;
    }

    // Verify PIN and amount - proceed to payment form
    setShowWithdrawalForm(false);
    setShowPaymentForm(true);
  };

  const handleWithdrawalStep2 = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate payment details based on method
    if (paymentMethod === "crypto") {
      if (!paymentDetails.walletAddress || !paymentDetails.cryptoType) {
        toast.error("Please fill in all crypto payment details");
        return;
      }
    } else {
      if (
        !paymentDetails.bankName ||
        !paymentDetails.accountNumber ||
        !paymentDetails.accountHolderName
      ) {
        toast.error("Please fill in all bank account details");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      console.log("Sending withdrawal request:", {
        amount: parseFloat(withdrawalAmount),
        transactionPin,
        pinType: typeof transactionPin,
        pinLength: transactionPin.length,
        paymentMethod,
        paymentDetails,
      });

      const response = await fetch("/api/seller/wallet/withdrawal-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawalAmount),
          transactionPin,
          paymentMethod,
          paymentDetails,
        }),
      });

      if (response.ok) {
        toast.success("Withdrawal request submitted successfully");
        setShowPaymentForm(false);
        resetWithdrawalForm();
        fetchWalletData(); // Refresh data

        // Update wallet badge for admin
        window.dispatchEvent(
          new CustomEvent("updateWalletBadge", {
            detail: { count: 0 },
          })
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit withdrawal request");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWithdrawalForm = () => {
    setWithdrawalAmount("");
    setTransactionPin("");
    setPaymentMethod("bank_account");
    setPaymentDetails({
      walletAddress: "",
      cryptoType: "",
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      routingNumber: "",
      swiftCode: "",
    });
    setPinError("");
    setAmountError("");
  };

  const handleWithdrawAll = () => {
    setWithdrawalAmount(walletData.balance.toString());
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "text-success";
      case "pending":
        return "text-warning";
      case "failed":
      case "rejected":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-success/20";
      case "pending":
        return "bg-warning/20";
      case "failed":
      case "rejected":
        return "bg-destructive/20";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "failed":
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout requiredRole="seller" title="Wallet">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="seller" title="Wallet">
      {/* Wallet Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Available Balance
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(walletData.balance)}
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
                Pending Balance
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(walletData.pendingBalance)}
              </p>
              {/* <p className="text-xs text-muted-foreground mt-1">
                After 15% commission addition
              </p> */}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-success rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Earned
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(walletData.totalEarned)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8"
      >
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setShowFundingForm(true)}
              className="flex items-center justify-center gap-3 p-4 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Request Funds</span>
            </button>
            <button
              onClick={() => setShowWithdrawalForm(true)}
              className="flex items-center justify-center gap-3 p-4 bg-warning/20 text-warning rounded-lg hover:bg-warning/30 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              <span>Withdraw Funds</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Funding Requests */}
      {fundingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="card">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Funding Requests
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {fundingRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-4 bg-sidebar-hover rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {request.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(request.createdAt)}</span>
                          <span>•</span>
                          <span>{formatTime(request.createdAt)}</span>
                        </div>
                        {request.adminNotes && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-700 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                              <span className="font-semibold">Reason:</span>
                              <span className="ml-1">{request.adminNotes}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(request.amount)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(
                          request.status
                        )} ${getStatusColor(request.status)}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">
                          {request.status}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Withdrawal Requests */}
      {withdrawalRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-8"
        >
          <div className="card">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Withdrawal Requests
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {withdrawalRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-4 bg-sidebar-hover rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Withdrawal -{" "}
                          {request.paymentMethod === "crypto"
                            ? "Crypto"
                            : "Bank Account"}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(request.createdAt)}</span>
                          <span>•</span>
                          <span>{formatTime(request.createdAt)}</span>
                        </div>
                        {request.adminNotes && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-700 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                              <span className="font-semibold">Reason:</span>
                              <span className="ml-1">{request.adminNotes}</span>
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          PIN: {request.transactionPin}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warning">
                        -{formatCurrency(request.amount)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(
                          request.status
                        )} ${getStatusColor(request.status)}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">
                          {request.status}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="card">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Recent Transactions
            </h3>
          </div>
          <div className="p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No transactions yet
                </h3>
                <p className="text-muted-foreground">
                  Your transaction history will appear here once you start
                  selling
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction: Transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 bg-sidebar-hover rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "credit"
                            ? "bg-success/20"
                            : "bg-destructive/20"
                        }`}
                      >
                        {transaction.type === "credit" ? (
                          <ArrowUpRight className="w-5 h-5 text-success" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(transaction.createdAt)}</span>
                          <span>•</span>
                          <span>{formatTime(transaction.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === "credit"
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(
                          transaction.status
                        )} ${getStatusColor(transaction.status)}`}
                      >
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">
                          {transaction.status.charAt(0).toUpperCase() +
                            transaction.status.slice(1)}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Funding Request Modal */}
      {showFundingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-background rounded-3xl shadow-2xl p-0 w-full max-w-md relative border border-gray-200/50"
          >
            <button
              onClick={() => setShowFundingForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-background hover:bg-background rounded-full p-2 shadow-lg transition-all duration-200 z-10"
              title="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="bg-gradient-to-br from-primary/30 to-primary/10 px-6 py-6 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Request Funds
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Submit a request to admin for wallet funding
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleFundingRequest} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-500"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Transaction PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={fundingPin}
                    onChange={(e) =>
                      setFundingPin(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                    placeholder="Enter 4-digit PIN"
                    required
                  />
                  {fundingPinError && (
                    <p className="text-sm text-red-600 mt-1">
                      {fundingPinError}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFundingForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Withdrawal Step 1 Modal - Amount and PIN */}
      {showWithdrawalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-background rounded-3xl shadow-2xl p-0 w-full max-w-md relative border border-gray-200/50"
          >
            <button
              onClick={() => {
                setShowWithdrawalForm(false);
                resetWithdrawalForm();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-background hover:bg-background rounded-full p-2 shadow-lg transition-all duration-200 z-10"
              title="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="bg-gradient-to-br from-warning/30 to-warning/10 px-6 py-6 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning rounded-xl flex items-center justify-center shadow-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Withdraw Funds
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Enter amount and verify your transaction PIN
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleWithdrawalStep1} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Amount (USD)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={walletData.balance}
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                      placeholder="Enter amount"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleWithdrawAll}
                      className="px-4 py-3 bg-warning/20 text-warning rounded-xl font-medium hover:bg-warning/30 transition-all"
                    >
                      All
                    </button>
                  </div>
                  {amountError && (
                    <p className="text-sm text-red-600 mt-1">{amountError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatCurrency(walletData.balance)} (withdrawals
                    only affect available balance, not pending balance)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Transaction PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={transactionPin}
                    onChange={(e) =>
                      setTransactionPin(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                    placeholder="Enter 4-digit PIN"
                    required
                  />
                  {pinError && (
                    <p className="text-sm text-red-600 mt-1">{pinError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawalForm(false);
                    resetWithdrawalForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-warning text-white rounded-xl font-medium hover:bg-warning/90 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Continue
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Withdrawal Step 2 Modal - Payment Details */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-background rounded-3xl shadow-2xl p-0 w-full max-w-lg relative border border-gray-200/50"
          >
            <button
              onClick={() => {
                setShowPaymentForm(false);
                resetWithdrawalForm();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-background hover:bg-background rounded-full p-2 shadow-lg transition-all duration-200 z-10"
              title="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="bg-gradient-to-br from-warning/30 to-warning/10 px-6 py-6 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning rounded-xl flex items-center justify-center shadow-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Payment Details
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(parseFloat(withdrawalAmount))} -{" "}
                    {paymentMethod === "crypto" ? "Crypto" : "Bank Account"}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleWithdrawalStep2} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as "crypto" | "bank_account"
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all"
                  >
                    <option value="bank_account">Bank Account</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>

                {paymentMethod === "crypto" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Crypto Type
                      </label>
                      <select
                        value={paymentDetails.cryptoType}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            cryptoType: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all"
                        required
                      >
                        <option value="">Select cryptocurrency</option>
                        <option value="bitcoin">Bitcoin (BTC)</option>
                        <option value="ethereum">Ethereum (ETH)</option>
                        <option value="usdt">Tether (USDT)</option>
                        <option value="usdc">USD Coin (USDC)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.walletAddress}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            walletAddress: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                        placeholder="Enter wallet address"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.bankName}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              bankName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                          placeholder="Enter bank name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.accountNumber}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              accountNumber: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                          placeholder="Enter account number"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.accountHolderName}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            accountHolderName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                        placeholder="Enter account holder name"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Routing Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.routingNumber}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              routingNumber: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                          placeholder="Enter routing number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          SWIFT Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.swiftCode}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              swiftCode: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                          placeholder="Enter SWIFT code"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setShowWithdrawalForm(true);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-warning text-white rounded-xl font-medium hover:bg-warning/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
