"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ImageWithFallback from "@/components/ImageWithFallback";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  title: string;
  image: string;
}

interface OrderDetails {
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

export default function SellerOrderDetailsPage() {
  const params = useParams() as { id?: string };
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const maskCustomerInfo = (name: string) => {
    const parts = name.split(" ");
    return parts
      .map((part) => part.charAt(0) + "*".repeat(part.length - 1))
      .join(" ");
  };

  const maskEmail = (email: string) => {
    const [username, domain] = email.split("@");
    const maskedUsername = username.charAt(0) + "*".repeat(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    return phone.replace(/\d(?=\d{4})/g, "*");
  };

  const maskAddress = (address: string) => {
    const words = address.split(" ");
    return words
      .map((word, index) => {
        if (index < 2) return word;
        return word.charAt(0) + "*".repeat(word.length - 1);
      })
      .join(" ");
  };

  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/seller/orders/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        router.push("/seller/orders");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      router.push("/seller/orders");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

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

    if ((params.id ?? "") !== "") {
      fetchOrderDetails();
    }
  }, [session, status, router, params.id, fetchOrderDetails]);

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

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout requiredRole="seller" title="Order Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout requiredRole="seller" title="Order Details">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Order not found
          </h3>
          <p className="text-muted-foreground">
            The order you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="seller" title="Order Details">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </button>
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-foreground">
            Order #{order.orderNumber}
          </h1>
          <p className="text-muted-foreground">Order Details</p>
        </div>
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
                Product Details
              </h2>
              {order._id.includes("_item_") && (
                <p className="text-sm text-muted-foreground mt-1">
                  Individual Item View
                </p>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <ImageWithFallback
                  src={order.orderItems[0].image}
                  alt={order.orderItems[0].title}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-lg object-cover mr-4"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {order.orderItems[0].title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(order.orderItems[0].price)}
                      </span>
                      <span className="text-muted-foreground">
                        Quantity: {order.orderItems[0].quantity}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <div className="text-sm text-success">
                        Commission: {formatCurrency(order.commission)}
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          order.paymentStatus === "paid"
                            ? "text-success"
                            : order.paymentStatus === "failed"
                            ? "text-destructive"
                            : "text-warning"
                        }`}
                      >
                        Payment:{" "}
                        {order.paymentStatus.charAt(0).toUpperCase() +
                          order.paymentStatus.slice(1)}
                      </div>
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
                    <span className="text-sm font-medium text-muted-foreground">
                      Order Number:
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      #{order.orderNumber}
                    </span>
                  </div>
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
                </div>
                <div className="flex items-center justify-between">
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
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {order._id.includes("_item_")
                      ? "Item Total"
                      : "Order Total"}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {order._id.includes("_item_")
                      ? "Item Commission"
                      : "Your Commission"}
                  </div>
                  <div className="text-lg font-bold text-success">
                    {formatCurrency(order.commission)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Customer Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Customer Information
              </h2>
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
                <div className="text-xs text-muted-foreground">Order Date</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
