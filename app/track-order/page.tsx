"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  Truck,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Image from "next/image";

interface OrderDetails {
  _id: string;
  productId: {
    title: string;
    image: string;
    price: number;
  };
  quantity: number;
  totalAmount: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  status: "pending" | "confirmed" | "on_the_way" | "delivered";
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setIsLoading(true);
    setOrder(null);

    try {
      const response = await fetch(`/api/store/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        // setError("Order not found. Please check your order ID and try again."); // This line was removed
      }
    } catch {
      // Optionally, handle error here if needed
    } finally {
      setIsLoading(false);
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

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "pending":
        return "Your order is being processed and will be confirmed soon.";
      case "confirmed":
        return "Your order has been confirmed and is being prepared for shipping.";
      case "on_the_way":
        return "Your order is on its way to you. You&apos;ll receive it soon!";
      case "delivered":
        return "Your order has been successfully delivered. Enjoy your purchase!";
      default:
        return "Your order status is being updated.";
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Track Your Order
                </h1>
                <p className="text-sm text-gray-600">
                  Enter your order ID to check the status
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter your order ID..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center px-6 py-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Track Order
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Error Message */}
        {/* The error message block was removed as per the edit hint */}

        {/* Order Details */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Order Status */}
            <div className="card">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  Order Status
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="ml-2 capitalize">
                      {order.status.replace("_", " ")}
                    </span>
                  </span>
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
                <p className="text-muted-foreground">
                  {getStatusDescription(order.status)}
                </p>
              </div>
            </div>

            {/* Product Details */}
            <div className="card">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  Product Details
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <Image
                    src={order.productId.image}
                    alt={order.productId.title}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {order.productId.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-bold text-foreground">
                          {formatCurrency(order.productId.price)}
                        </span>
                        <span className="text-muted-foreground">
                          Quantity: {order.quantity}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="card">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">
                    Customer Information
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {order.buyerName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Full Name
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {order.buyerEmail}
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
                        {order.buyerPhone}
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
                        {order.buyerAddress}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Delivery Address
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="card">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">
                    Order Timeline
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          Order Placed
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    {order.status !== "pending" && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            Order Confirmed
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(order.updatedAt)}
                          </div>
                        </div>
                      </div>
                    )}

                    {["on_the_way", "delivered"].includes(order.status) && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-info rounded-full flex items-center justify-center">
                          <Truck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            On The Way
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(order.updatedAt)}
                          </div>
                        </div>
                      </div>
                    )}

                    {order.status === "delivered" && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            Delivered
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(order.updatedAt)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
