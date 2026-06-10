"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface DashboardStats {
  totalSellers: number;
  pendingVerifications: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWalletRequests: number;
  withdrawalRequests: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalSellers: 0,
    pendingVerifications: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingWalletRequests: 0,
    withdrawalRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Sellers",
      value: stats.totalSellers,
      icon: Users,
      color: "gradient-primary",
      description: "Registered sellers",
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications,
      icon: Clock,
      color: "gradient-warning",
      description: "Awaiting approval",
    },
    {
      title: "Withdrawal Requests",
      value: stats.withdrawalRequests,
      icon: AlertCircle,
      color: "gradient-warning",
      description: "Pending withdrawals",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "gradient-secondary",
      description: "All time orders",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue}`,
      icon: DollarSign,
      color: "gradient-success",
      description: "Platform earnings",
    },
    {
      title: "Funding Requests",
      value: stats.pendingWalletRequests,
      icon: TrendingUp,
      color: "gradient-danger",
      description: "Pending funding requests",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="admin" title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin" title="Admin Dashboard">
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

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="card p-4 sm:p-6 mb-6 sm:mb-8"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => router.push("/admin/products")}
            className="flex items-center p-3 sm:p-4 rounded-lg bg-sidebar-hover hover:bg-accent transition-colors text-left"
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 flex-shrink-0" />
            <span className="text-sm sm:text-base text-foreground">
              Products Management
            </span>
          </button>
          <button
            onClick={() => router.push("/admin/sellers")}
            className="flex items-center p-3 sm:p-4 rounded-lg bg-sidebar-hover hover:bg-accent transition-colors text-left"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 flex-shrink-0" />
            <span className="text-sm sm:text-base text-foreground">
              Verify Sellers
            </span>
          </button>
          <button
            onClick={() => router.push("/admin/orders")}
            className="flex items-center p-3 sm:p-4 rounded-lg bg-sidebar-hover hover:bg-accent transition-colors text-left"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 flex-shrink-0" />
            <span className="text-sm sm:text-base text-foreground">
              View Orders
            </span>
          </button>
          <button
            onClick={() => router.push("/admin/wallet")}
            className="flex items-center p-3 sm:p-4 rounded-lg bg-sidebar-hover hover:bg-accent transition-colors text-left"
          >
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 flex-shrink-0" />
            <span className="text-sm sm:text-base text-foreground">
              Funding Requests
            </span>
          </button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.8 }}
        className="card p-4 sm:p-6"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center p-3 rounded-lg bg-sidebar-hover">
            <div className="w-2 h-2 bg-success rounded-full mr-3 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                New seller registration
              </p>
              <p className="text-xs text-muted-foreground">2 minutes ago</p>
            </div>
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
          </div>
          <div className="flex items-center p-3 rounded-lg bg-sidebar-hover">
            <div className="w-2 h-2 bg-warning rounded-full mr-3 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                Pending verification request
              </p>
              <p className="text-xs text-muted-foreground">15 minutes ago</p>
            </div>
            <Clock className="w-4 h-4 text-warning flex-shrink-0" />
          </div>
          <div className="flex items-center p-3 rounded-lg bg-sidebar-hover">
            <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                New order received
              </p>
              <p className="text-xs text-muted-foreground">1 hour ago</p>
            </div>
            <ShoppingCart className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
          <div className="flex items-center p-3 rounded-lg bg-sidebar-hover">
            <div className="w-2 h-2 bg-danger rounded-full mr-3 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                Withdrawal request
              </p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
            <Wallet className="w-4 h-4 text-danger flex-shrink-0" />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
