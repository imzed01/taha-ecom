"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Store,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShoppingBag,
  Settings,
  Headphones,
  Gift,
  Bell,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface SidebarProps {
  userRole: "admin" | "seller";
  userEmail: string;
  storeName?: string;
}

export type { SidebarProps };

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: { label: string; href: string }[];
  showBadge?: boolean;
}

export default function Sidebar({
  userRole,
  userEmail,
  storeName,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [totalUnseenCount, setTotalUnseenCount] = useState(0);
  const [totalUnseenOrders, setTotalUnseenOrders] = useState(0);
  const [totalPendingWalletRequests, setTotalPendingWalletRequests] =
    useState(0);
  const [totalWalletRequestUpdates, setTotalWalletRequestUpdates] = useState(0);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Check if user is on specific pages
  const isOnWalletPage = pathname?.includes("/wallet");
  const isOnChatPage = pathname?.includes("/chat");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id || "";

  // Check if animation has already played in this session
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Check session storage on client side only
  useEffect(() => {
    const animated = sessionStorage.getItem("sidebarAnimated");
    setShouldAnimate(!animated);
  }, []);

  // Mark as animated after first load
  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        sessionStorage.setItem("sidebarAnimated", "true");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  // Fetch total unseen messages and orders count
  useEffect(() => {
    if (!userId) return;

    const fetchTotalUnseenCount = async () => {
      try {
        const endpoint =
          userRole === "admin"
            ? `/api/admin/total-unseen-messages?adminId=${userId}`
            : "/api/seller/total-unseen-messages";

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setTotalUnseenCount(data.totalUnseenCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch total unseen count:", error);
      }
    };

    const fetchTotalUnseenOrders = async () => {
      if (userRole !== "seller") return;

      try {
        const response = await fetch("/api/seller/total-unseen-orders");
        if (response.ok) {
          const data = await response.json();
          setTotalUnseenOrders(data.totalUnseenCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch total unseen orders:", error);
      }
    };

    const fetchTotalPendingWalletRequests = async () => {
      try {
        const endpoint =
          userRole === "admin"
            ? "/api/admin/total-pending-wallet-requests"
            : "/api/seller/total-pending-wallet-requests";

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setTotalPendingWalletRequests(data.totalPendingRequests || 0);
        }
      } catch (error) {
        console.error("Failed to fetch total pending wallet requests:", error);
      }
    };

    const fetchTotalWalletRequestUpdates = async () => {
      if (userRole !== "seller") return;

      try {
        console.log("Fetching wallet request updates for seller...");
        const response = await fetch(
          "/api/seller/total-wallet-request-updates",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Wallet request updates data:", data);
          setTotalWalletRequestUpdates(data.totalUpdates || 0);
        } else {
          console.error(
            "Failed to fetch wallet request updates. Status:",
            response.status
          );
          const errorText = await response.text();
          console.error("Error response:", errorText);
          // Set to 0 if there's an error to avoid showing incorrect badge
          setTotalWalletRequestUpdates(0);
        }
      } catch (error) {
        console.error("Failed to fetch total wallet request updates:", error);
        // Set to 0 if there's an error to avoid showing incorrect badge
        setTotalWalletRequestUpdates(0);
      }
    };

    fetchTotalUnseenCount();
    fetchTotalUnseenOrders();
    fetchTotalPendingWalletRequests();
    fetchTotalWalletRequestUpdates();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchTotalUnseenCount();
      fetchTotalUnseenOrders();
      fetchTotalPendingWalletRequests();
      fetchTotalWalletRequestUpdates();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, userRole]);

  // Mark wallet requests as seen when on wallet page
  useEffect(() => {
    if (isOnWalletPage) {
      // Mark pending wallet requests as seen
      if (totalPendingWalletRequests > 0) {
        const markWalletRequestsAsSeen = async () => {
          try {
            const endpoint =
              userRole === "admin"
                ? "/api/admin/mark-wallet-requests-seen"
                : "/api/seller/mark-wallet-requests-seen";

            await fetch(endpoint, { method: "POST" });
            setTotalPendingWalletRequests(0);
          } catch (error) {
            console.error("Failed to mark wallet requests as seen:", error);
          }
        };
        markWalletRequestsAsSeen();
      }

      // Mark wallet request updates as seen (seller only)
      if (userRole === "seller" && totalWalletRequestUpdates > 0) {
        const markWalletUpdatesAsSeen = async () => {
          try {
            await fetch("/api/seller/mark-wallet-updates-seen", {
              method: "POST",
            });
            setTotalWalletRequestUpdates(0);
          } catch (error) {
            console.error("Failed to mark wallet updates as seen:", error);
          }
        };
        markWalletUpdatesAsSeen();
      }
    }
  }, [
    isOnWalletPage,
    totalPendingWalletRequests,
    totalWalletRequestUpdates,
    userRole,
  ]);

  // Listen for custom events to update badge count
  useEffect(() => {
    const handleBadgeUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.count === "number") {
        setTotalUnseenCount(event.detail.count);
      }
    };

    const handleOrdersBadgeUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.count === "number") {
        setTotalUnseenOrders(event.detail.count);
      }
    };

    const handleWalletBadgeUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.count === "number") {
        setTotalPendingWalletRequests(event.detail.count);
      }
    };

    const handleWalletUpdatesBadgeUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.count === "number") {
        setTotalWalletRequestUpdates(event.detail.count);
      }
    };

    window.addEventListener(
      "updateSupportBadge",
      handleBadgeUpdate as EventListener
    );

    window.addEventListener(
      "updateOrdersBadge",
      handleOrdersBadgeUpdate as EventListener
    );

    window.addEventListener(
      "updateWalletBadge",
      handleWalletBadgeUpdate as EventListener
    );

    window.addEventListener(
      "updateWalletUpdatesBadge",
      handleWalletUpdatesBadgeUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "updateSupportBadge",
        handleBadgeUpdate as EventListener
      );
      window.removeEventListener(
        "updateOrdersBadge",
        handleOrdersBadgeUpdate as EventListener
      );
      window.removeEventListener(
        "updateWalletBadge",
        handleWalletBadgeUpdate as EventListener
      );
      window.removeEventListener(
        "updateWalletUpdatesBadge",
        handleWalletUpdatesBadgeUpdate as EventListener
      );
    };
  }, []);

  const adminNavItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Products",
      href: "/admin/products",
      icon: Package,
    },
    {
      label: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      label: "Sellers",
      href: "/admin/sellers",
      icon: Users,
      subItems: [
        { label: "All Sellers", href: "/admin/sellers" },
        {
          label: "Pending Verification",
          href: "/admin/sellers?status=pending",
        },
      ],
    },
    {
      label: "Referral Codes",
      href: "/admin/referral-codes",
      icon: Gift,
    },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
    },
    {
      label: "Wallet",
      href: "/admin/wallet",
      icon: Wallet,
      showBadge: true,
      subItems: [
        { label: "Overview", href: "/admin/wallet" },
        { label: "Withdrawal Requests", href: "/admin/wallet/requests" },
      ],
    },
  ];

  const sellerNavItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/seller/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Product Catalog",
      href: "/seller/products",
      icon: Package,
    },
    {
      label: "Orders",
      href: "/seller/orders",
      icon: ShoppingCart,
      showBadge: true,
    },
    {
      label: "Store",
      href: "/seller/store",
      icon: Store,
    },
    {
      label: "Wallet",
      href: "/seller/wallet",
      icon: Wallet,
      showBadge: true,
      subItems: [
        { label: "Overview", href: "/seller/wallet" },
        { label: "Transactions", href: "/seller/wallet/transactions" },
      ],
    },
    {
      label: "Settings",
      href: "/seller/settings",
      icon: Settings,
    },
  ];

  const navItems = userRole === "admin" ? adminNavItems : sellerNavItems;

  // Add Support Chat to navItems with badge
  const fullNavItems = [
    ...navItems,
    {
      label: "Support Chat",
      href: userRole === "admin" ? "/admin/chat" : "/seller/chat",
      icon: Headphones,
      showBadge: true,
    },
  ];

  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <motion.div
      initial={shouldAnimate ? { x: -100 } : { x: 0 }}
      animate={{ x: 0 }}
      className="sidebar h-screen w-64 lg:w-64 bg-sidebar border-r border-border flex flex-col overflow-hidden"
      suppressHydrationWarning={true}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sidebar-header p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <motion.div
              initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              {userRole === "admin" ? (
                <Shield className="w-6 h-6 text-primary flex-shrink-0" />
              ) : (
                <ShoppingBag className="w-6 h-6 text-primary flex-shrink-0" />
              )}
              <span className="font-bold text-lg text-foreground truncate">
                {userRole === "admin" ? "Admin" : "Seller"}
              </span>
            </motion.div>
            {/* Hide collapse button on mobile */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-md hover:bg-sidebar-hover transition-colors hidden lg:block touch-manipulation"
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {fullNavItems.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium cursor-pointer relative min-h-[44px] touch-manipulation ${
                  isActive(item.href) ||
                  (item.href.includes("/admin/chat") &&
                    pathname?.includes("/admin/chat")) ||
                  (item.href.includes("/seller/dashboard?tab=chat") &&
                    pathname?.includes("/seller/dashboard"))
                    ? "active"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <item.icon className="w-5 h-5 mr-3" />
                  {/* Badge for Support Chat when not on chat page */}
                  {item.showBadge &&
                    item.href.includes("/chat") &&
                    totalUnseenCount > 0 &&
                    !isOnChatPage && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                        {totalUnseenCount > 99 ? "99+" : totalUnseenCount}
                      </span>
                    )}
                  {/* Badge for Orders when not on orders page */}
                  {item.showBadge &&
                    item.href.includes("/orders") &&
                    totalUnseenOrders > 0 &&
                    !pathname?.includes("/orders") && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                        {totalUnseenOrders > 99 ? "99+" : totalUnseenOrders}
                      </span>
                    )}
                  {/* Badge for Wallet when not on wallet page */}
                  {item.showBadge &&
                    item.href.includes("/wallet") &&
                    totalPendingWalletRequests > 0 &&
                    !isOnWalletPage && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-orange-500 rounded-full min-w-[18px] h-[18px]">
                        {totalPendingWalletRequests > 99
                          ? "99+"
                          : totalPendingWalletRequests}
                      </span>
                    )}
                  {/* Badge for Wallet Updates (seller only) */}
                  {item.showBadge &&
                    item.href.includes("/wallet") &&
                    userRole === "seller" &&
                    totalWalletRequestUpdates > 0 &&
                    !isOnWalletPage && (
                      <span className="absolute -top-2 -right-8 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-green-500 rounded-full min-w-[18px] h-[18px]">
                        {totalWalletRequestUpdates > 99
                          ? "99+"
                          : totalWalletRequestUpdates}
                      </span>
                    )}
                </div>
                <motion.div
                  initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex items-center justify-between min-w-0"
                  suppressHydrationWarning={true}
                >
                  <span className="truncate">{item.label}</span>
                  {/* Badge for mobile view */}
                  {item.showBadge &&
                    item.href.includes("/chat") &&
                    totalUnseenCount > 0 &&
                    !isOnChatPage && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px] flex-shrink-0">
                        {totalUnseenCount > 99 ? "99+" : totalUnseenCount}
                      </span>
                    )}
                  {item.showBadge &&
                    item.href.includes("/orders") &&
                    totalUnseenOrders > 0 &&
                    !pathname?.includes("/orders") && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px] flex-shrink-0">
                        {totalUnseenOrders > 99 ? "99+" : totalUnseenOrders}
                      </span>
                    )}
                  {item.showBadge &&
                    item.href.includes("/wallet") &&
                    totalPendingWalletRequests > 0 &&
                    !isOnWalletPage && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-orange-500 rounded-full min-w-[18px] h-[18px] flex-shrink-0">
                        {totalPendingWalletRequests > 99
                          ? "99+"
                          : totalPendingWalletRequests}
                      </span>
                    )}
                  {/* Badge for Wallet Updates - mobile view (seller only) */}
                  {item.showBadge &&
                    item.href.includes("/wallet") &&
                    userRole === "seller" &&
                    totalWalletRequestUpdates > 0 &&
                    !isOnWalletPage && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-green-500 rounded-full min-w-[18px] h-[18px] flex-shrink-0 ml-1">
                        {totalWalletRequestUpdates > 99
                          ? "99+"
                          : totalWalletRequestUpdates}
                      </span>
                    )}
                </motion.div>
              </Link>
            </div>
          ))}
        </nav>

        {/* User Info & Sign Out */}
        <div className="sidebar-footer p-4 border-t border-border flex-shrink-0">
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            className="mb-3"
          >
            <div className="text-sm font-medium text-foreground truncate">
              {userEmail}
            </div>
            {storeName && (
              <div className="text-xs text-muted-foreground truncate">
                {storeName}
              </div>
            )}
          </motion.div>
          <button
            onClick={handleSignOut}
            className="sidebar-item flex items-center w-full px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground min-h-[44px] touch-manipulation"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
