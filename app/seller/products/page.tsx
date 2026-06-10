"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Package } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import CatalogImage from "@/components/CatalogImage";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isActive: boolean;
}

interface CategoryGroup {
  label: string;
  variants: string[];
}

const PRODUCTS_PER_PAGE = 20;

export default function SellerProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [inStoreMap, setInStoreMap] = useState<{
    [productId: string]: boolean;
  }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(PRODUCTS_PER_PAGE));
        if (selectedCategory && selectedCategory !== "all") {
          const group = categoryGroups.find(
            (g) => g.label === selectedCategory
          );
          if (group && group.variants.length > 0) {
            params.set("categories", group.variants.join(","));
          } else {
            params.set("category", selectedCategory);
          }
        }
        if (searchTerm.trim()) {
          params.set("q", searchTerm.trim());
        }
        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setProducts(data.products);
            setTotal(data.total);
          }
        } else {
          if (isMounted) {
            setProducts([]);
            setTotal(0);
          }
        }
      } catch {
        if (isMounted) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedCategory, searchTerm, categoryGroups]);

  // Load global categories once so dropdown always shows the full list
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        if (!res.ok) return;
        const groups: CategoryGroup[] = await res.json();
        if (isMounted) setCategoryGroups(groups);
      } catch {
        // ignore
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = products;

  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts;

  useEffect(() => {
    // Fetch all seller products once and build a map
    const fetchSellerProducts = async () => {
      try {
        const res = await fetch("/api/seller/products");
        if (res.ok) {
          const sellerProducts: { productId: { _id: string } }[] =
            await res.json();
          const map: { [productId: string]: boolean } = {};
          sellerProducts.forEach((sp) => {
            map[sp.productId._id] = true;
          });
          setInStoreMap(map);
        }
      } catch {
        setInStoreMap({});
      }
    };
    fetchSellerProducts();
  }, []);

  const handleAddToStore = async (productId: string) => {
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setInStoreMap((prev) => ({ ...prev, [productId]: true })); // update immediately
      } else {
        const data = await res.json();
        alert(data.message || "Failed to add product");
      }
    } catch {
      alert("Error adding product to store");
    }
  };

  return (
    <DashboardLayout requiredRole="seller" title="Product Catalog">
      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input w-full pl-10 pr-4 py-2"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="input w-full px-4 py-2"
            >
              <option value="all">All Categories</option>
              {categoryGroups.map((group) => (
                <option key={group.label} value={group.label}>
                  {group.label}
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
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[300px] relative"
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : paginatedProducts.length > 0 ? (
          paginatedProducts.map((product) => {
            return (
              <motion.div
                key={product._id}
                className="card overflow-hidden hover:shadow-lg transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="relative">
                  <CatalogImage
                    src={product.image}
                    alt={product.title}
                    width={200}
                    height={192}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-4 flex flex-col gap-2">
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
                  <div className="flex gap-2 mt-2">
                    <Link
                      href={`/seller/products/${product._id}`}
                      className="flex-1"
                    >
                      <button
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        type="button"
                      >
                        Details
                      </button>
                    </Link>
                    <button
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      onClick={() => handleAddToStore(product._id)}
                      disabled={!!inStoreMap[product._id]}
                    >
                      {!!inStoreMap[product._id]
                        ? "Added to Store"
                        : "Add to Store"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : !loading && paginatedProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No products found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : null}
      </motion.div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 items-center">
          <div className="flex gap-2 px-6 py-3 bg-black/90 rounded-2xl shadow-lg border border-white/10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-white/20 text-white font-medium transition-colors bg-black/60 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {/* Page numbers */}
            <>
              {(() => {
                const siblings = 1;
                const boundaryCount = 1;

                const start = Math.max(1, currentPage - siblings);
                const end = Math.min(totalPages, currentPage + siblings);

                const range = (s: number, e: number) => {
                  const arr: number[] = [];
                  for (let i = s; i <= e; i++) arr.push(i);
                  return arr;
                };

                const first = range(1, Math.min(boundaryCount, totalPages));
                const middle = range(start, end).filter(
                  (n) => n > boundaryCount && n < totalPages - boundaryCount + 1
                );
                const last = range(
                  Math.max(totalPages - boundaryCount + 1, 1),
                  totalPages
                );

                const items: (number | "ellipsis-left" | "ellipsis-right")[] =
                  [];

                items.push(...first);
                if (first.length && start > boundaryCount + 1)
                  items.push("ellipsis-left");
                items.push(...middle);
                if (last.length && end < totalPages - boundaryCount)
                  items.push("ellipsis-right");
                last.forEach((n) => {
                  if (!items.includes(n)) items.push(n);
                });

                return items.map((item, idx) => {
                  if (typeof item === "number") {
                    return (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`px-3 py-2 rounded-lg border font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-black/80 shadow-sm ${
                          item === currentPage
                            ? "bg-white text-black border-white/80 shadow-lg"
                            : "bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/60"
                        }`}
                        disabled={item === currentPage}
                      >
                        {item}
                      </button>
                    );
                  }
                  return (
                    <span
                      key={`e-${idx}`}
                      className="px-2 py-2 text-white/70 select-none"
                    >
                      …
                    </span>
                  );
                });
              })()}
            </>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-white/20 text-white font-medium transition-colors bg-black/60 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <span className="px-4 py-2 text-white/70 select-none">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
