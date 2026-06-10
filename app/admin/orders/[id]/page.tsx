"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  Store,
  Eye,
  EyeOff,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import toast from "react-hot-toast";
import ImageWithFallback from "@/components/ImageWithFallback";

interface OrderItem {
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
}

interface OrderDetails {
  _id: string;
  sellerId: {
    _id: string;
    storeName: string;
    email: string;
    phone?: string;
    address?: string;
    verificationStatus: string;
  };
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

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnmaskedInfo, setShowUnmaskedInfo] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    type AdminUser = { role: string };
    if (!session || (session.user as AdminUser)?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${id}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          router.push("/admin/orders");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        router.push("/admin/orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [session, status, router, id]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Order status updated successfully");
        // Refresh the order data
        const refreshResponse = await fetch(`/api/admin/orders/${id}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setOrder(refreshData);
        }
      } else {
        toast.error("Failed to update order status");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-warning bg-warning/20";
      case "confirmed":
        return "text-primary bg-primary/20";
      case "on_the_way":
        return "text-info bg-info/20";
      case "delivered":
        return "text-success bg-success/20";
      default:
        return "text-muted-foreground bg-muted";
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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

  const maskCustomerInfo = (name: string) => {
    if (!showUnmaskedInfo) {
      const parts = name.split(" ");
      return parts
        .map((part) => part.charAt(0) + "*".repeat(part.length - 1))
        .join(" ");
    }
    return name;
  };

  const maskEmail = (email: string) => {
    if (!showUnmaskedInfo) {
      const [username, domain] = email.split("@");
      const maskedUsername =
        username.charAt(0) + "*".repeat(username.length - 1);
      return `${maskedUsername}@${domain}`;
    }
    return email;
  };

  const maskPhone = (phone: string) => {
    if (!showUnmaskedInfo) {
      return phone.replace(/\d(?=\d{4})/g, "*");
    }
    return phone;
  };

  const maskAddress = (address: string) => {
    if (!showUnmaskedInfo) {
      const words = address.split(" ");
      return words
        .map((word, index) => {
          if (index < 2) return word;
          return word.charAt(0) + "*".repeat(word.length - 1);
        })
        .join(" ");
    }
    return address;
  };

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout requiredRole="admin" title="Order Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout requiredRole="admin" title="Order Details">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Order not found
          </h3>
          <p className="text-muted-foreground">
            The order you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin" title="Order Details">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Order Items ({order.orderItems.length})
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {order.orderItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 border border-border rounded-lg"
                >
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg object-cover mr-4"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-bold text-foreground">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-muted-foreground">
                          Quantity: {item.quantity}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Order Summary */}
              <div className="border-t border-border pt-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Subtotal
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Commission (15%)
                    </div>
                    <div className="text-sm font-medium text-success">
                      {formatCurrency(order.commission)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-lg font-semibold text-foreground">
                      Order Total
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Seller Receives
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {formatCurrency(order.totalAmount - order.commission)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Order Status
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="ml-2 capitalize">
                        {order.status.replace("_", " ")}
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Payment Status
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        order.paymentStatus === "paid"
                          ? "text-success"
                          : order.paymentStatus === "failed"
                          ? "text-destructive"
                          : "text-warning"
                      }`}
                    >
                      {order.paymentStatus.charAt(0).toUpperCase() +
                        order.paymentStatus.slice(1)}
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Update Order Status
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {["pending", "confirmed", "on_the_way", "delivered"].map(
                      (statusOption) => (
                        <button
                          key={statusOption}
                          onClick={() => handleStatusUpdate(statusOption)}
                          disabled={order.status === statusOption}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            order.status === statusOption
                              ? "bg-primary text-white cursor-not-allowed"
                              : "bg-sidebar-hover hover:bg-accent text-foreground"
                          }`}
                        >
                          {statusOption
                            .replace("_", " ")
                            .charAt(0)
                            .toUpperCase() +
                            statusOption.replace("_", " ").slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Seller Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Store className="w-5 h-5 text-muted-foreground" />
                Seller Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Store className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {order.sellerId.storeName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Store Name
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {order.sellerId.email}
                  </div>
                  <div className="text-xs text-muted-foreground">Email</div>
                </div>
              </div>

              {order.sellerId.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {order.sellerId.phone}
                    </div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground capitalize">
                    {order.sellerId.verificationStatus}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Verification Status
                  </div>
                </div>
              </div>

              {order.sellerId.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {order.sellerId.address}
                    </div>
                    <div className="text-xs text-muted-foreground">Address</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Customer Information
                </h2>
                <button
                  onClick={() => setShowUnmaskedInfo(!showUnmaskedInfo)}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showUnmaskedInfo ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Show Details
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {maskCustomerInfo(order.buyerName)}
                  </div>
                  <div className="text-xs text-muted-foreground">Full Name</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {maskEmail(order.buyerEmail)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Email Address
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {maskPhone(order.buyerPhone)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Phone Number
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {maskAddress(order.buyerAddress)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Delivery Address
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {formatDate(order.createdAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Order Date
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
