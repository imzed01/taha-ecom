"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Edit as EditIcon } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import SimpleWorkingImage from "@/components/SimpleWorkingImage";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

const PRODUCTS_PER_PAGE = 20;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Product>>({
    title: "",
    description: "",
    price: 0,
    image: "",
    category: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/products?page=${currentPage}&limit=${PRODUCTS_PER_PAGE}`
        );
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
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  // Load canonical, deduplicated categories (same as seller page)
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        if (!res.ok) return;
        const groups: Array<{ label: string; variants: string[] }> =
          await res.json();
        if (isMounted) setAllCategories(groups.map((g) => g.label));
      } catch {
        // ignore
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Pagination logic - use server-side data directly
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);
  const paginatedProducts = products; // No client-side filtering needed

  // Client-side search filter (only for current page)
  const filteredProducts = paginatedProducts.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product._id);
    setEditForm({ ...product, price: Number(product.price) });
    setShowEditModal(true);
  };

  const handleEditFormChange = (
    field: keyof Product,
    value: string | number | boolean
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: field === "price" ? Number(value) : value,
    }));
  };

  const handleSaveProduct = async (productId: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          price: Number(editForm.price),
          image: editForm.image,
          category: editForm.category,
          isActive: editForm.isActive !== undefined ? editForm.isActive : true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product");
      }

      const result = await response.json();

      // Update local state with the response from server
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, ...result.product } : p))
      );

      setEditingProductId(null);
      setEditForm({});
      setShowEditModal(false);

      // Show success message (you can add a toast notification here)
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert(
        `Error updating product: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditForm({});
    setShowEditModal(false);
  };

  const handleAddFormChange = (
    field: keyof Product,
    value: string | number | boolean
  ) => {
    setAddForm((prev) => ({
      ...prev,
      [field]: field === "price" ? Number(value) : value,
    }));
  };

  const handleAddProduct = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: addForm.title,
          description: addForm.description,
          price: Number(addForm.price),
          image: addForm.image,
          category: addForm.category,
          isActive: addForm.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }

      const result = await response.json();

      // Add new product to local state
      setProducts((prev) => [result.product, ...prev]);
      setTotal((prev) => prev + 1);

      // Reset form and close modal
      setAddForm({
        title: "",
        description: "",
        price: 0,
        image: "",
        category: "",
        isActive: true,
      });
      setShowAddModal(false);

      // Show success message
      alert("Product created successfully!");
    } catch (error) {
      console.error("Error creating product:", error);
      alert(
        `Error creating product: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setAddForm({
      title: "",
      description: "",
      price: 0,
      image: "",
      category: "",
      isActive: true,
    });
    setShowAddModal(false);
  };

  // allCategories now comes from API; keep computed fallback if API empty
  const computedCategories = Array.from(
    new Set(products.map((p) => p.category))
  ).filter((cat) => cat !== "toy");
  const effectiveCategories = allCategories.length
    ? allCategories
    : computedCategories;

  return (
    <DashboardLayout requiredRole="admin" title="Product Management">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="card"
      >
        <div className="px-6 py-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            All Products
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="input px-3 py-2 w-64"
            />
            <button
              className="btn-primary px-4 py-2"
              onClick={() => setCurrentPage(1)}
            >
              Search
            </button>
            <button
              className="btn-primary px-4 py-2 bg-green-600 hover:bg-green-700"
              onClick={() => setShowAddModal(true)}
            >
              Add Product
            </button>
          </div>
        </div>
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="animate-spin text-primary"></div>
                    <p className="mt-2 text-muted-foreground">
                      Loading products...
                    </p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No products found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      No products match your search criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SimpleWorkingImage
                          className="h-12 w-12 rounded-lg object-cover mr-4"
                          src={product.image}
                          alt={product.title}
                          width={48}
                          height={48}
                        />
                        <div>
                          <div className="text-sm font-medium text-foreground line-clamp-1">
                            {product.title.split(" ").slice(0, 5).join(" ")}
                            {product.title.split(" ").length > 20 && "..."}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs line-clamp-2">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                      ${product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive
                            ? "text-success bg-success bg-opacity-20"
                            : "text-muted-foreground bg-muted bg-opacity-20"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-primary hover:text-green-400 transition-colors"
                        title="Edit"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 items-center gap-2 bg-black py-4 rounded-xl">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 mx-1 bg-zinc-800 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            {/* Page numbers */}
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

              const items: (number | "ellipsis-left" | "ellipsis-right")[] = [];

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
                      className={`px-3 py-2 rounded transition-colors ${
                        item === currentPage
                          ? "bg-green-600 text-white"
                          : "bg-zinc-900 text-white hover:bg-zinc-700"
                      }`}
                      disabled={item === currentPage || loading}
                    >
                      {item}
                    </button>
                  );
                }
                return (
                  <span
                    key={`e-${idx}`}
                    className="px-2 py-2 text-white select-none"
                  >
                    …
                  </span>
                );
              });
            })()}
            <span className="px-4 py-2 mx-1 text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 mx-1 bg-zinc-800 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No products yet
            </h3>
            <p className="text-muted-foreground mb-4">
              No products found in the catalog
            </p>
          </div>
        )}
      </motion.div>
      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 rounded-xl shadow-lg p-10 w-full max-w-lg text-white space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold mb-6 text-white">
                Edit Product
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingProductId) handleSaveProduct(editingProductId);
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title ?? ""}
                    onChange={(e) =>
                      handleEditFormChange("title", e.target.value)
                    }
                    className="input w-full bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={editForm.description ?? ""}
                    onChange={(e) =>
                      handleEditFormChange("description", e.target.value)
                    }
                    className="input w-full bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={editForm.image ?? ""}
                    onChange={(e) =>
                      handleEditFormChange("image", e.target.value)
                    }
                    className="input w-full bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Category
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={editForm.category ?? ""}
                      onChange={(e) =>
                        handleEditFormChange("category", e.target.value)
                      }
                      className="input flex-1 bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                      required
                    >
                      {editForm.category &&
                        !allCategories.includes(editForm.category) && (
                          <option value={editForm.category}>
                            {editForm.category}
                          </option>
                        )}
                      {effectiveCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or type new category"
                      onChange={(e) => {
                        if (e.target.value.trim()) {
                          handleEditFormChange(
                            "category",
                            e.target.value.trim()
                          );
                        }
                      }}
                      className="input flex-1 bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Price
                  </label>
                  <input
                    type="number"
                    value={
                      editForm.price !== undefined &&
                      editForm.price !== null &&
                      String(editForm.price) !== ""
                        ? String(editForm.price)
                        : String(
                            products.find((p) => p._id === editingProductId)
                              ?.price ?? ""
                          )
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEditFormChange("price", e.target.value)
                    }
                    className="input w-full bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Active Status
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        value="true"
                        checked={editForm.isActive === true}
                        onChange={(e) =>
                          handleEditFormChange(
                            "isActive",
                            e.target.value === "true"
                          )
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        value="false"
                        checked={editForm.isActive === false}
                        onChange={(e) =>
                          handleEditFormChange(
                            "isActive",
                            e.target.value === "false"
                          )
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">Inactive</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-6">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn-secondary px-4 py-2 bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 rounded-xl shadow-lg p-10 w-full max-w-lg text-white space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold mb-6 text-white">
                Add New Product
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddProduct();
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={addForm.title}
                    onChange={(e) =>
                      handleAddFormChange("title", e.target.value)
                    }
                    className="input w-full bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) =>
                      handleAddFormChange("description", e.target.value)
                    }
                    className="input w-full bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={addForm.image}
                    onChange={(e) =>
                      handleAddFormChange("image", e.target.value)
                    }
                    className="input w-full bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Category
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={addForm.category}
                      onChange={(e) =>
                        handleAddFormChange("category", e.target.value)
                      }
                      className="input flex-1 bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                      required
                    >
                      <option value="">Select a category</option>
                      {effectiveCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or type new category"
                      onChange={(e) => {
                        if (e.target.value.trim()) {
                          handleAddFormChange(
                            "category",
                            e.target.value.trim()
                          );
                        }
                      }}
                      className="input flex-1 bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Price
                  </label>
                  <input
                    type="number"
                    value={addForm.price}
                    onChange={(e) =>
                      handleAddFormChange("price", e.target.value)
                    }
                    className="input w-full bg-zinc-800 text-white border-zinc-700 px-4 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Active Status
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="addIsActive"
                        value="true"
                        checked={addForm.isActive === true}
                        onChange={(e) =>
                          handleAddFormChange(
                            "isActive",
                            e.target.value === "true"
                          )
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="addIsActive"
                        value="false"
                        checked={addForm.isActive === false}
                        onChange={(e) =>
                          handleAddFormChange(
                            "isActive",
                            e.target.value === "false"
                          )
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">Inactive</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-6">
                  <button
                    type="button"
                    onClick={handleCancelAdd}
                    className="btn-secondary px-4 py-2 bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
