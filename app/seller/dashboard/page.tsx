"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  Wallet,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ChatSupport from "@/components/ChatSupport";
import StarRating from "@/components/StarRating";
import NotificationBell from "@/components/NotificationBell";
import { useSearchParams } from "next/navigation";
import ImageWithFallback from "@/components/ImageWithFallback";

interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  rating?: number;
  ratingCount?: number;
}

interface Order {
  _id: string;
  orderItems: {
    title: string;
    image: string;
    quantity: number;
  }[];
  quantity: number;
  totalAmount: number;
  commission: number;
  buyerName: string;
  status: string;
  createdAt: string;
}

function SellerDashboard() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState<SellerStats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveTab(searchParams?.get("tab") || "dashboard");
  }, [searchParams]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch("/api/seller/stats"),
        fetch("/api/seller/orders"),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const maskCustomerInfo = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return parts
      .map((part) => part.charAt(0) + "*".repeat(Math.max(0, part.length - 1)))
      .join(" ");
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

  const handleMessagesSeen = async () => {
    try {
      // Fetch the updated unseen count from the server
      const response = await fetch("/api/seller/total-unseen-messages");
      if (response.ok) {
        const data = await response.json();
        const updatedCount = data.totalUnseenCount || 0;

        // Dispatch a custom event to update the sidebar badge with the actual count
        const event = new CustomEvent("updateSupportBadge", {
          detail: { count: updatedCount },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Failed to fetch updated unseen count:", error);
      // Fallback: set count to 0 if fetch fails
      const event = new CustomEvent("updateSupportBadge", {
        detail: { count: 0 },
      });
      window.dispatchEvent(event);
    }
  };

  const statCards = [
    {
      title: "My Products",
      value: stats.totalProducts,
      icon: Package,
      color: "gradient-success",
      description: "Active products",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "gradient-primary",
      description: "All time orders",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      color: "gradient-warning",
      description: "Awaiting processing",
    },
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings}`,
      icon: DollarSign,
      color: "gradient-success",
      description: "Lifetime earnings",
    },
    {
      title: "Available Balance",
      value: `$${stats.availableBalance}`,
      icon: Wallet,
      color: "gradient-primary",
      description: "Ready to withdraw",
    },
    {
      title: "Pending Balance",
      value: `$${stats.pendingBalance}`,
      icon: TrendingUp,
      color: "gradient-warning",
      description: "Processing",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="seller" title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="seller" title="Seller Dashboard">
      {/* Tab Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-border justify-between items-center">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-medium rounded-t-lg transition-colors ${
                activeTab === "dashboard"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-medium rounded-t-lg transition-colors ${
                activeTab === "chat"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-hover"
              }`}
            >
              Support Chat
            </button>
          </div>
          <NotificationBell />
        </div>
      </div>

      {activeTab === "dashboard" && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {statCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="card p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      {card.title}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground mb-1 truncate">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {card.description}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${card.color} flex items-center justify-center flex-shrink-0 ml-3`}
                  >
                    <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Privacy Toggle */}
          {/* <div className="mb-6 sm:mb-8">
            <div className="card p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                    Customer Privacy
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {showMaskedInfo
                      ? "Showing full customer information"
                      : "Customer information is masked for privacy"}
                  </p>
                </div>
                <button
                  onClick={() => setShowMaskedInfo(!showMaskedInfo)}
                  className="flex items-center space-x-2 px-3 py-2 bg-sidebar-hover hover:bg-accent rounded-lg transition-colors"
                >
                  {showMaskedInfo ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span className="text-xs sm:text-sm">
                    {showMaskedInfo ? "Hide" : "Show"}
                  </span>
                </button>
              </div>
            </div>
          </div> */}

          {/* Seller Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="card p-4 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              My Rating
            </h2>
            <div className="flex items-center justify-center py-4">
              <StarRating
                rating={stats.rating || 5}
                ratingCount={stats.ratingCount || 0}
                readonly={true}
                size="lg"
                showValue={true}
                className="justify-center"
              />
            </div>
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="card p-4 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              Recent Orders
            </h2>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center p-3 sm:p-4 rounded-lg bg-sidebar-hover"
                  >
                    <ImageWithFallback
                      src={order.orderItems[0].image}
                      alt={order.orderItems[0].title}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg object-cover mr-4"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-medium text-foreground truncate">
                        {order.orderItems[0].title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Customer: {maskCustomerInfo(order.buyerName)}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Qty:{" "}
                        {order.orderItems.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}{" "}
                        | Total: ${order.totalAmount}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusChipStyle(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                      <p className="text-xs sm:text-sm text-success mt-1">
                        +${order.commission}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {activeTab === "chat" && (
        <div className="h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)]">
          <ChatSupport onMessagesSeen={handleMessagesSeen} />
        </div>
      )}
    </DashboardLayout>
  );
}

export default function SellerDashboardWrapper() {
  return (
    <Suspense
      fallback={
        <DashboardLayout requiredRole="seller" title="Dashboard">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      }
    >
      <SellerDashboard />
    </Suspense>
  );
}
