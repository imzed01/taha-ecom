"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Heart,
  Filter,
  X,
} from "lucide-react";
import SimpleWorkingImage from "@/components/SimpleWorkingImage";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  images: string[];
  product_url: string;
  availability: string;
  brand: string;
}

const PRODUCTS_PER_PAGE = 20;

export default function Store() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Extract unique categories
  const categories = [...new Set(products.map((p) => p.category))].filter(
    (cat) => cat !== "toy"
  );

  // Filtering and sorting
  const filteredAndSortedProducts = products
    .filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / PRODUCTS_PER_PAGE
  );
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Loading products...
          </h2>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
            No products available
          </h3>
          <p className="text-muted-foreground">
            The store is currently empty. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
        <div className="container-responsive">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-primary mr-2 sm:mr-3" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">
                  Essbyebay
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Discover amazing products from verified sellers
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="p-2 hover:bg-sidebar-hover rounded-lg relative">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  0
                </span>
              </button>
              <button className="p-2 hover:bg-sidebar-hover rounded-lg relative">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  0
                </span>
              </button>
              <a
                href="/track-order"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors hidden sm:block"
              >
                Track Order
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-4 sm:py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-sidebar-hover transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters && <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Filters - Mobile */}
        {showFilters && (
          <div className="lg:hidden mb-6 p-4 bg-card border border-border rounded-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Filters - Desktop */}
        <div className="hidden lg:block mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm sm:text-base text-muted-foreground">
            Showing {paginatedProducts.length} of{" "}
            {filteredAndSortedProducts.length} products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {paginatedProducts.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="card p-4 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            >
              <div className="relative mb-4">
                <div className="relative">
                  <SimpleWorkingImage
                    src={product.image_url}
                    alt={product.title}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <button className="absolute top-2 right-2 p-2 bg-card/80 backdrop-blur-sm rounded-full hover:bg-card transition-colors">
                  <Heart className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
                </button>
                <div className="absolute bottom-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-white">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-bold text-foreground">
                    ${product.price}
                  </span>
                  <button className="px-3 py-1 sm:px-4 sm:py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-border rounded-lg hover:bg-sidebar-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-primary text-white"
                        : "border border-border hover:bg-sidebar-hover"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-border rounded-lg hover:bg-sidebar-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
