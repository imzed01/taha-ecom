"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Package,
  Search,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  Calendar,
  User,
  DollarSign,
  Play,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import toast from "react-hot-toast";
import OrderImage from "@/components/OrderImage";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  title: string;
  image: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  orderItems: OrderItem[];
  totalAmount: number;
  commission: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  status: "pending" | "confirmed" | "on_the_way" | "delivered";
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
}

function truncateWords(text: string, wordLimit: number = 5) {
  if (!text) return "";
  const words = text.split(" ");
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + " ...";
}

export default function SellerOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [showInsufficientFundsModal, setShowInsufficientFundsModal] =
    useState(false);
  const [insufficientFundsData] = useState<{
    requiredAmount: number;
    availableBalance: number;
  } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinOrderId, setPinOrderId] = useState<string | null>(null);
  const [proceedPin, setProceedPin] = useState("");
  const [proceedPinError, setProceedPinError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      console.log("Fetching orders...");
      const response = await fetch("/api/seller/orders", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      console.log("Orders response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Orders fetched successfully:", data.length, "orders");
        console.log("Setting orders state with:", data);

        // Log image URLs for debugging
        if (
          data.length > 0 &&
          data[0].orderItems &&
          data[0].orderItems.length > 0
        ) {
          console.log(
            "Sample order item image URL:",
            data[0].orderItems[0].image
          );
          console.log("Sample order item data:", data[0].orderItems[0]);

          // Test if the image URL is valid
          const testUrl = data[0].orderItems[0].image;
          if (testUrl) {
            try {
              const url = new URL(testUrl);
              console.log("Image URL is valid:", {
                protocol: url.protocol,
                hostname: url.hostname,
                pathname: url.pathname,
                fullUrl: url.href,
              });

              // Image accessibility testing removed from UI - only logged to console
            } catch (error) {
              console.error("Invalid image URL:", testUrl, error);
            }
          }
        }

        // Ensure data is an array
        if (Array.isArray(data)) {
          setOrders(data);
          console.log(
            "Orders state updated successfully with",
            data.length,
            "orders"
          );
        } else {
          console.error("API returned non-array data:", data);
          setOrders([]);
        }
      } else {
        console.error(
          "Failed to fetch orders:",
          response.status,
          response.statusText
        );
        const errorData = await response.json().catch(() => ({}));
        console.error("Error details:", errorData);
        // Don't clear orders on error, keep existing data
        toast.error("Failed to refresh orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Don't clear orders on error, keep existing data
      toast.error("Network error while refreshing orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as { role?: string })?.role !== "seller") {
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

    // Immediately fetch orders when component is ready
    console.log("Component ready, fetching orders immediately...");
    fetchOrders();
  }, [session, status, router, fetchOrders]);

  // Mark orders as seen when seller visits the orders page
  useEffect(() => {
    if (status === "loading" || !session) return;

    const markOrdersAsSeen = async () => {
      try {
        const response = await fetch("/api/seller/mark-orders-seen", {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`Marked ${data.modifiedCount} orders as seen`);

          // Dispatch custom event to update the orders badge
          window.dispatchEvent(
            new CustomEvent("updateOrdersBadge", {
              detail: { count: 0 },
            })
          );
        }
      } catch (error) {
        console.error("Error marking orders as seen:", error);
      }
    };

    markOrdersAsSeen();
  }, [session, status]);

  // Effect to ensure orders don't disappear when modal opens
  useEffect(() => {
    console.log("Orders state changed:", {
      ordersCount: orders.length,
      showPinModal,
      orders: orders.map((o) => ({ id: o._id, status: o.status })),
    });

    if (showPinModal && orders.length === 0) {
      console.warn("Modal opened but orders are empty, attempting to refetch");
      fetchOrders();
    }
  }, [showPinModal, orders.length, fetchOrders, orders]);

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

  const maskCustomerInfo = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return parts
      .map((part) => part.charAt(0) + "*".repeat(Math.max(0, part.length - 1)))
      .join(" ");
  };

  const maskEmail = (email: string) => {
    const [username, domain] = email.split("@");
    const maskedUsername = username.charAt(0) + "*".repeat(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  const handleProceedOrder = (orderId: string) => {
    setSearchTerm(""); // Clear the search input first
    setTimeout(() => {
      console.log("Opening modal for order:", orderId);
      console.log("Current orders count before modal:", orders.length);

      // Check if orders exist
      if (orders.length === 0) {
        console.error("No orders available to proceed");
        toast.error("No orders available to proceed");
        return;
      }

      // Check if the order exists
      const orderExists = orders.find((order) => order._id === orderId);
      if (!orderExists) {
        console.error("Order not found:", orderId);
        toast.error("Order not found");
        return;
      }

      setPinOrderId(orderId);
      setProceedPin("");
      setProceedPinError("");
      setShowPinModal(true);
    }, 0);
  };

  // Force refresh function
  const forceRefreshOrders = useCallback(async () => {
    console.log("Force refreshing orders...");
    setIsLoading(true);
    await fetchOrders();
    setIsLoading(false);
  }, [fetchOrders]);

  const submitProceedOrder = async () => {
    if (processingOrder) {
      console.warn("Already processing an order, aborting duplicate submit.");
      return;
    }
    setProcessingOrder(pinOrderId);
    setProceedPinError("");

    if (!proceedPin) {
      setProceedPinError("Please enter your transaction PIN");
      setProcessingOrder(null);
      return;
    }

    if (proceedPin.length !== 4) {
      setProceedPinError("PIN must be 4 digits");
      setProcessingOrder(null);
      return;
    }

    try {
      console.log("Submitting PIN:", proceedPin, "for order:", pinOrderId);
      console.log(
        "Request body:",
        JSON.stringify({ transactionPin: proceedPin })
      );
      console.log("Current state:", {
        pinOrderId,
        proceedPin,
        processingOrder,
      });
      const response = await fetch(`/api/seller/orders/${pinOrderId}/proceed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionPin: proceedPin }),
      });

      const text = await response.text();
      console.log("Raw response text:", text);
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { error: "Invalid JSON in response" };
      }

      if (response.ok) {
        console.log("Order processed successfully:", result);
        toast.success("Order processed successfully!");

        // Update the order locally instead of fetching all orders
        if (result.order) {
          console.log("Updating order status:", {
            pinOrderId,
            resultOrder: result.order,
            currentOrders: orders,
          });

          setOrders((prevOrders) => {
            const updatedOrders = prevOrders.map((order) => {
              // Check if this is the specific order that was processed
              if (order._id === pinOrderId) {
                console.log("Found order to update:", {
                  orderId: order._id,
                  oldStatus: order.status,
                  newStatus: "confirmed",
                });

                // Update the status to confirmed since it was successfully processed
                return {
                  ...order,
                  status: "confirmed" as const, // Force status to confirmed for the separated order
                  paymentStatus: "paid" as const, // Force payment status to paid
                };
              }
              return order;
            });

            console.log("Updated orders:", updatedOrders);
            return updatedOrders;
          });

          // Force refresh orders to ensure we have the latest data from the database
          console.log("Forcing refresh of orders...");
          fetchOrders();
        }

        // Close modal
        setShowPinModal(false);
        setPinOrderId(null);
        setProceedPin("");
        setProceedPinError("");
      } else {
        console.error("Failed to process order:", result);
        setProceedPinError(result.error || "Failed to process order");
      }
    } catch (error) {
      console.error("Error processing order:", error);
      setProceedPinError("An error occurred while processing the order");
    } finally {
      setProcessingOrder(null);
    }
  };

  const getStatusChipStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "on_the_way":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-muted text-black";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "on_the_way":
        return "On The Way";
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "delivered":
        return "Delivered";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "on_the_way":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <Package className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderItems.some((item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((order) => order.status === "pending").length;
    const confirmed = orders.filter(
      (order) => order.status === "confirmed"
    ).length;
    const onTheWay = orders.filter(
      (order) => order.status === "on_the_way"
    ).length;
    const delivered = orders.filter(
      (order) => order.status === "delivered"
    ).length;
    const totalRevenue = orders
      .filter((order) => order.status === "delivered")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return { total, pending, confirmed, onTheWay, delivered, totalRevenue };
  }, [orders]);

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout requiredRole="seller" title="Orders">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="seller" title="Orders">
      {/* Order Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Orders
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
            <div className="w-12 h-12 gradient-info rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                In Transit
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.confirmed + stats.onTheWay}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-success rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Revenue
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalRevenue)}
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
                type="search"
                placeholder="Search orders by customer name, email, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-10 pr-4 py-2"
                autoComplete="new-password"
                name="orderSearchXyz123"
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
              <option value="confirmed">Confirmed</option>
              <option value="on_the_way">On The Way</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          {/* <button
            onClick={() => setShowMaskedInfo(!showMaskedInfo)}
            className="flex items-center gap-2 px-4 py-2 bg-sidebar-hover hover:bg-accent rounded-lg transition-colors"
          >
            {showMaskedInfo ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Details
              </>
            )}
          </button> */}
          <button
            onClick={() => {
              console.log("Manual refresh clicked");
              forceRefreshOrders();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse"
              style={{
                tableLayout: "fixed",
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <colgroup>
                <col className="w-36 lg:w-44" style={{ width: "144px" }} />{" "}
                {/* Order Number */}
                <col className="w-80 lg:w-96" style={{ width: "320px" }} />{" "}
                {/* Product */}
                <col className="w-52 lg:w-60" style={{ width: "208px" }} />{" "}
                {/* Customer */}
                <col className="w-24 lg:w-28" style={{ width: "96px" }} />{" "}
                {/* Quantity */}
                <col className="w-32 lg:w-36" style={{ width: "128px" }} />{" "}
                {/* Total Amount */}
                <col className="w-32 lg:w-36" style={{ width: "128px" }} />{" "}
                {/* Commission */}
                <col className="w-36 lg:w-40" style={{ width: "144px" }} />{" "}
                {/* Payment Status */}
                <col className="w-36 lg:w-40" style={{ width: "144px" }} />{" "}
                {/* Order Status */}
                <col className="w-36 lg:w-44" style={{ width: "144px" }} />{" "}
                {/* Date */}
                <col className="w-36 lg:w-44" style={{ width: "144px" }} />{" "}
                {/* Actions */}
              </colgroup>
              <thead className="bg-sidebar-hover">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order Status
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
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-sidebar-hover transition-colors"
                    style={{
                      height: "112px !important",
                      minHeight: "112px !important",
                      maxHeight: "112px !important",
                      lineHeight: "112px !important",
                    }}
                  >
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <div className="text-sm font-medium text-foreground">
                        {order.orderNumber}
                      </div>
                      {order._id.includes("_item_") && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Individual Item
                        </div>
                      )}
                    </td>
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <div className="flex items-start h-full">
                        {order.orderItems && order.orderItems.length > 0 ? (
                          <>
                            <div
                              className="flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm"
                              style={{
                                height: "80px !important",
                                minWidth: "80px !important",
                                minHeight: "80px !important",
                                maxWidth: "80px !important",
                                maxHeight: "80px !important",
                                flexShrink: "0 !important",
                                overflow: "hidden",
                                // width: "100%",
                                justifyContent: "center",
                                display: "flex",
                              }}
                            >
                              <OrderImage
                                src={order.orderItems[0].image}
                                alt={order.orderItems[0].title}
                                width={80}
                                height={80}
                              />
                            </div>
                            <div className="ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate max-w-56">
                                {truncateWords(order.orderItems[0].title)}
                                {order.orderItems.length > 1 && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    +{order.orderItems.length - 1} more
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {formatCurrency(
                                  Number(order.orderItems[0]?.price ?? 0)
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center text-muted-foreground">
                            <div
                              className="flex-shrink-0 rounded-lg bg-sidebar-hover flex items-center justify-center border border-gray-200 shadow-sm"
                              style={{
                                height: "80px !important",
                                minWidth: "80px !important",
                                minHeight: "80px !important",
                                maxWidth: "80px !important",
                                maxHeight: "80px !important",
                                flexShrink: "0 !important",
                                overflow: "hidden",
                                width: "100%",
                                justifyContent: "center",
                                display: "flex",
                              }}
                            >
                              <Package className="w-7 h-7" />
                            </div>
                            <div className="ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium">
                                No items
                              </div>
                              <div className="text-xs text-muted-foreground">
                                —
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-foreground">
                            {maskCustomerInfo(order.buyerName)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {maskEmail(order.buyerEmail)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <div className="text-sm font-medium text-foreground">
                        {order.orderItems[0]?.quantity || 0}
                      </div>
                    </td>
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <div className="text-sm font-medium text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </td>
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <div className="text-sm font-medium text-success">
                        {formatCurrency(order.commission)}
                      </div>
                    </td>
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.paymentStatus === "paid"
                            ? "text-success bg-success/20"
                            : order.paymentStatus === "failed"
                            ? "text-destructive bg-destructive/20"
                            : "text-warning bg-warning/20"
                        }`}
                      >
                        {order.paymentStatus.charAt(0).toUpperCase() +
                          order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusChipStyle(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-1">
                          {getStatusText(order.status)}
                        </span>
                      </span>
                    </td>
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <div className="text-sm text-foreground">
                        {formatDate(order.createdAt)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td
                      className="px-6 py-5 whitespace-nowrap align-top"
                      style={{
                        height: "112px !important",
                        minHeight: "112px !important",
                        maxHeight: "112px !important",
                      }}
                    >
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(`/seller/orders/${order._id}`)
                          }
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {order.status === "pending" && (
                          <button
                            onClick={() => handleProceedOrder(order._id)}
                            disabled={processingOrder === order._id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                              processingOrder === order._id
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-green-100 text-green-700 hover:bg-green-200 animate-pulse"
                            }`}
                          >
                            <Play className="w-4 h-4" />
                            {processingOrder === order._id
                              ? "Processing..."
                              : "Proceed"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No orders found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Orders will appear here once customers start purchasing your products"}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Insufficient Funds Modal */}
      {showInsufficientFundsModal && insufficientFundsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Insufficient Funds
              </h3>
              <p className="text-gray-600 mb-4">
                You need to add funds to your wallet to proceed with this order.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Required Amount:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${insufficientFundsData.requiredAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Available Balance:
                  </span>
                  <span className="text-sm font-semibold text-red-600">
                    ${insufficientFundsData.availableBalance.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInsufficientFundsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowInsufficientFundsModal(false);
                    router.push("/seller/wallet");
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Go to Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-background rounded-3xl shadow-2xl p-0 w-full max-w-sm relative border border-gray-200/50"
          >
            <div className="px-6 py-6 border-b border-gray-200/50">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Enter Transaction PIN
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Please enter your 4-digit transaction PIN to proceed with the
                order.
              </p>
              <input
                type="password"
                maxLength={4}
                value={proceedPin}
                onChange={(e) =>
                  setProceedPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-gray-500"
                placeholder="Enter 4-digit PIN"
                required
                autoComplete="new-password"
                name="transactionPinXyz123"
              />
              {proceedPinError && (
                <p className="text-sm text-red-600 mt-1">{proceedPinError}</p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    console.log(
                      "Closing modal, current orders count:",
                      orders.length
                    );
                    setShowPinModal(false);
                    setPinOrderId(null);
                    setProceedPin("");
                    setProceedPinError("");
                    setProcessingOrder(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitProceedOrder}
                  disabled={processingOrder === pinOrderId}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingOrder === pinOrderId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>Proceed</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
