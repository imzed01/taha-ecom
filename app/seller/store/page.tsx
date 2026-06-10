"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Package, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import CatalogImage from "@/components/CatalogImage";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isActive: boolean;
  // add other fields as needed
}

export default function SellerStorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    const user = session?.user as unknown as {
      role?: string;
      verificationStatus?: string;
    };
    if (!session || user?.role !== "seller") {
      router.push("/auth/signin");
      return;
    }
    if (user?.verificationStatus === "pending") {
      router.push("/seller/pending");
      return;
    }
    if (user?.verificationStatus === "rejected") {
      router.push("/seller/rejected");
      return;
    }
    // Fetch seller's products from API
    const fetchStoreProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/seller/products");
        if (res.ok) {
          const sellerProducts = await res.json();
          // Map to product objects (populated productId)
          setProducts(
            (sellerProducts as Array<{ productId: Product }>)
              .filter((sp) => sp.productId && sp.productId.isActive)
              .map((sp) => sp.productId)
          ); // TODO: Replace with stricter type
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStoreProducts();
  }, [session, status, router]);

  const categories = Array.from(
    new Set(products.map((product) => product.category))
  ).filter((cat) => cat !== "toy");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout requiredRole="seller" title="My Store">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="seller" title="My Store">
      {/* Store Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-success rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Active Products
              </p>
              <p className="text-2xl font-bold text-foreground">
                {products.length}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Button */}
      <div className="mb-6">
        <motion.button
          onClick={() => router.push("/seller/products")}
          className="btn-primary flex items-center px-4 py-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Package className="w-5 h-5 mr-2" />
          Add Products
        </motion.button>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search your products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-10 pr-4 py-2"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-full px-4 py-2"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredProducts.map((product) => (
          <motion.div
            key={product._id}
            className="card overflow-hidden hover:shadow-lg transition-all duration-300"
            whileHover={{ y: -5 }}
          >
            <div className="relative">
              <CatalogImage
                src={product.image}
                alt={product.title}
                width={300}
                height={192}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                {product.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {product.description}
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-success">
                  ${product.price}
                </span>
                <span className="text-xs text-muted-foreground bg-sidebar-hover px-2 py-1 rounded">
                  {product.category}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No products found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
