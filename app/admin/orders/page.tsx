"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  Package,
  Search,
  DollarSign,
  Calendar,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import ImageWithFallback from "@/components/ImageWithFallback";

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  status?: string;
  paymentStatus?: string;
}

interface Order {
  _id: string;
  sellerId: {
    storeName: string;
    email: string;
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
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<
    Array<{
      _id: string;
      storeName: string;
      email: string;
      verificationStatus?: string;
    }>
  >([]);

  const [sellerProducts, setSellerProducts] = useState<
    Array<{ _id: string; title: string; price: number; image: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    sellerId: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerAddress: "",
  });
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]);
  const [sellerSearchTerm, setSellerSearchTerm] = useState("");
  const [sellerDropdownOpen, setSellerDropdownOpen] = useState(false);
  const sellerDropdownRef = useRef<HTMLDivElement>(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as { role?: string })?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    fetchData();
  }, [session, status, router]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sellerDropdownRef.current &&
        !sellerDropdownRef.current.contains(event.target as Node)
      ) {
        setSellerDropdownOpen(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setProductDropdownOpen(false);
      }
    }
    if (sellerDropdownOpen || productDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sellerDropdownOpen, productDropdownOpen]);

  const fetchData = async () => {
    try {
      const [ordersRes, sellersRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/sellers"),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      if (sellersRes.ok) {
        const sellersData = await sellersRes.json();
        setSellers(
          sellersData.filter(
            (s: { verificationStatus?: string }) =>
              s.verificationStatus === "verified"
          )
        );
      }
    } catch {
      console.error("Error fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSellerProducts = async (sellerId: string) => {
    if (!sellerId) {
      setSellerProducts([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/products`);
      if (response.ok) {
        const data = await response.json();
        setSellerProducts(data);
      } else {
        setSellerProducts([]);
      }
    } catch (error) {
      console.error("Error fetching seller products:", error);
      setSellerProducts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          orderItems: selectedProducts.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Order created successfully");
        fetchData();
        resetForm();
      } else {
        toast.error("Failed to create order");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: string,
    itemIndex?: number
  ) => {
    try {
      const body =
        itemIndex !== undefined
          ? { status: newStatus, itemIndex }
          : { status: newStatus };

      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success("Order status updated");
        fetchData();
      } else {
        toast.error("Failed to update order status");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const resetForm = () => {
    setFormData({
      sellerId: "",
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      buyerAddress: "",
    });
    setSelectedProducts([]);
    setSellerProducts([]);
    setShowAddForm(false);
    setSellerSearchTerm("");
    setSellerDropdownOpen(false);
    setProductSearchTerm("");
    setProductDropdownOpen(false);
  };

  const handleSellerChange = (sellerId: string) => {
    setFormData({ ...formData, sellerId });
    setSelectedProducts([]);
    fetchSellerProducts(sellerId);
  };

  const addProductToOrder = (product: {
    _id: string;
    title: string;
    price: number;
    image: string;
  }) => {
    const existingProduct = selectedProducts.find(
      (p) => p.productId === product._id
    );

    if (existingProduct) {
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.productId === product._id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setSelectedProducts((prev) => [
        ...prev,
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ]);
    }
    setProductDropdownOpen(false);
  };

  const removeProductFromOrder = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.productId !== productId)
    );
  };

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const getTotalAmount = () => {
    return selectedProducts.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Helper function to truncate product titles to 4 words
  const truncateTitle = (title: string, maxWords: number = 4) => {
    const words = title.split(" ");
    if (words.length <= maxWords) {
      return title;
    }
    return words.slice(0, maxWords).join(" ") + "...";
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
      month: "short",
      day: "numeric",
    });
  };

  const getOrderStats = () => {
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
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    return { total, pending, confirmed, onTheWay, delivered, totalRevenue };
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sellerId.storeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = getOrderStats();

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout requiredRole="admin" title="Order Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin" title="Order Management">
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
              <ShoppingCart className="w-6 h-6 text-white" />
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
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Button */}
      <div className="mb-6">
        <motion.button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center px-4 py-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Place New Order
        </motion.button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders by buyer name, email, or seller..."
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
              <option value="confirmed">Confirmed</option>
              <option value="on_the_way">On The Way</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Order Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="p-8 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Place New Order
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new order by selecting a seller and their products
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Select Seller
                </label>
                <div className="relative" ref={sellerDropdownRef}>
                  <button
                    type="button"
                    className="input w-full px-4 py-3 text-base flex justify-between items-center"
                    onClick={() => setSellerDropdownOpen((open) => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={sellerDropdownOpen}
                  >
                    {formData.sellerId
                      ? sellers.find((s) => s._id === formData.sellerId)
                          ?.storeName +
                        " (" +
                        sellers.find((s) => s._id === formData.sellerId)
                          ?.email +
                        ")"
                      : "Choose a seller"}
                    <svg
                      className={`w-4 h-4 ml-2 transition-transform ${
                        sellerDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {sellerDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto animate-fade-in">
                      <div className="sticky top-0 bg-card p-2 border-b border-border flex items-center">
                        <Search className="w-4 h-4 text-muted-foreground mr-2" />
                        <input
                          type="text"
                          placeholder="Search sellers by name or email..."
                          value={sellerSearchTerm}
                          onChange={(e) => setSellerSearchTerm(e.target.value)}
                          className="input w-full pl-2 pr-2 py-1 text-sm"
                          autoFocus
                        />
                      </div>
                      <ul className="max-h-48 overflow-auto" role="listbox">
                        {sellers
                          .filter(
                            (s) =>
                              s.storeName
                                .toLowerCase()
                                .includes(sellerSearchTerm.toLowerCase()) ||
                              s.email
                                .toLowerCase()
                                .includes(sellerSearchTerm.toLowerCase())
                          )
                          .map((seller) => (
                            <li
                              key={seller._id}
                              role="option"
                              aria-selected={formData.sellerId === seller._id}
                              className={`px-4 py-2 cursor-pointer hover:bg-sidebar-hover ${
                                formData.sellerId === seller._id
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : ""
                              }`}
                              onClick={() => {
                                handleSellerChange(seller._id);
                                setSellerDropdownOpen(false);
                              }}
                            >
                              {seller.storeName}{" "}
                              <span className="text-xs text-muted-foreground">
                                ({seller.email})
                              </span>
                            </li>
                          ))}
                        {sellers.filter(
                          (s) =>
                            s.storeName
                              .toLowerCase()
                              .includes(sellerSearchTerm.toLowerCase()) ||
                            s.email
                              .toLowerCase()
                              .includes(sellerSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <li className="px-4 py-2 text-muted-foreground text-sm">
                            No sellers found
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Select Products
                </label>
                <div className="relative" ref={productDropdownRef}>
                  <button
                    type="button"
                    className="input w-full px-4 py-3 text-base flex justify-between items-center"
                    onClick={() => setProductDropdownOpen((open) => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={productDropdownOpen}
                    disabled={!formData.sellerId}
                  >
                    {formData.sellerId
                      ? "Choose products to add to order"
                      : "Please select a seller first"}
                    <svg
                      className={`w-4 h-4 ml-2 transition-transform ${
                        productDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {productDropdownOpen && formData.sellerId && (
                    <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto animate-fade-in">
                      <div className="sticky top-0 bg-card p-2 border-b border-border flex items-center">
                        <Search className="w-4 h-4 text-muted-foreground mr-2" />
                        <input
                          type="text"
                          placeholder="Search products by title or price..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="input w-full pl-2 pr-2 py-1 text-sm"
                          autoFocus
                        />
                      </div>
                      <ul className="max-h-48 overflow-auto" role="listbox">
                        {sellerProducts
                          .filter(
                            (product) =>
                              product.title
                                .toLowerCase()
                                .includes(productSearchTerm.toLowerCase()) ||
                              product.price
                                .toString()
                                .includes(productSearchTerm)
                          )
                          .map((product) => (
                            <li
                              key={product._id}
                              role="option"
                              aria-selected="false"
                              className="px-4 py-3 cursor-pointer hover:bg-sidebar-hover"
                              onClick={() => addProductToOrder(product)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <ImageWithFallback
                                    src={product.image}
                                    alt={product.title}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-lg object-cover mr-3"
                                  />
                                  <div>
                                    <span className="font-medium text-foreground">
                                      {product.title}
                                    </span>
                                    <span className="text-sm text-muted-foreground block">
                                      ${product.price}
                                    </span>
                                  </div>
                                </div>
                                <Plus className="w-4 h-4 text-primary" />
                              </div>
                            </li>
                          ))}
                        {sellerProducts.filter(
                          (product) =>
                            product.title
                              .toLowerCase()
                              .includes(productSearchTerm.toLowerCase()) ||
                            product.price.toString().includes(productSearchTerm)
                        ).length === 0 && (
                          <li className="px-4 py-2 text-muted-foreground text-sm">
                            No products found
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                {formData.sellerId && sellerProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    This seller hasn&apos;t added any products to their store
                    yet.
                  </p>
                )}
              </div>
            </div>

            {/* Selected Products Cart */}
            {selectedProducts.length > 0 && (
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Selected Products ({selectedProducts.length})
                </h3>
                <div className="space-y-3">
                  {selectedProducts.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 bg-sidebar-hover rounded-lg"
                    >
                      <div className="flex items-center">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.title}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover mr-3"
                        />
                        <div>
                          <div className="font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${item.price} each
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateProductQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-sidebar-hover"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateProductQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-sidebar-hover"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProductFromOrder(item.productId)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(getTotalAmount())}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Buyer Name
                </label>
                <input
                  type="text"
                  value={formData.buyerName}
                  onChange={(e) =>
                    setFormData({ ...formData, buyerName: e.target.value })
                  }
                  required
                  className="input w-full px-4 py-3 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Buyer Email
                </label>
                <input
                  type="email"
                  value={formData.buyerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, buyerEmail: e.target.value })
                  }
                  required
                  className="input w-full px-4 py-3 text-base"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Buyer Phone
                </label>
                <input
                  type="tel"
                  value={formData.buyerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, buyerPhone: e.target.value })
                  }
                  required
                  className="input w-full px-4 py-3 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Buyer Address
                </label>
                <textarea
                  value={formData.buyerAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, buyerAddress: e.target.value })
                  }
                  required
                  rows={3}
                  className="input w-full px-4 py-3 text-base resize-none"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="btn-primary px-8 py-3 text-base font-medium"
                disabled={selectedProducts.length === 0}
              >
                Place Order
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary px-8 py-3 text-base font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              All Orders
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sidebar-hover">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Seller
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
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-sidebar-hover transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {order.orderItems.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <ImageWithFallback
                              src={item.image}
                              alt={item.title}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-lg object-cover mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {truncateTitle(item.title, 3)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Qty: {item.quantity} × ${item.price}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {order.buyerName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.buyerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {order.sellerId.storeName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.sellerId.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Commission: {formatCurrency(order.commission)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">
                          {order.status.replace("_", " ")}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {formatDate(order.createdAt)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            router.push(`/admin/orders/${order._id}`)
                          }
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>

                        {/* Overall Order Status Update */}
                        <div className="flex flex-col space-y-1">
                          <label className="text-xs text-muted-foreground">
                            Order:
                          </label>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusUpdate(order._id, e.target.value)
                            }
                            className="px-2 py-1 text-xs border border-border rounded bg-background"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="on_the_way">On The Way</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>

                        {/* Individual Item Status Updates */}
                        {order.orderItems.length > 1 && (
                          <div className="flex flex-col space-y-1">
                            <label className="text-xs text-muted-foreground">
                              Items:
                            </label>
                            {order.orderItems.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-1"
                              >
                                <span className="text-xs text-muted-foreground w-4">
                                  {index + 1}:
                                </span>
                                <select
                                  value={item.status || "pending"}
                                  onChange={(e) =>
                                    handleStatusUpdate(
                                      order._id,
                                      e.target.value,
                                      index
                                    )
                                  }
                                  className="px-1 py-0.5 text-xs border border-border rounded bg-background"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="on_the_way">On The Way</option>
                                  <option value="delivered">Delivered</option>
                                </select>
                              </div>
                            ))}
                          </div>
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
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No orders found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Orders will appear here once they are created"}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
