"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Product {
  _id: string;
  title: string;
  image: string;
  category: string;
}

export default function TestBasicPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?limit=5");
        const data = await response.json();
        console.log("Products data:", data);
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Loading products...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Basic Image Test</h1>

      <div className="mb-6 p-4 bg-blue-100 border border-blue-400 rounded">
        <p className="text-blue-800">
          This page tests basic HTML img tags to verify image loading works.
          Check the browser console for any error messages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">{product.title}</h3>
            <p className="text-sm text-gray-600 mb-2">URL: {product.image}</p>

            <div className="mb-4">
              <Image
                src={product.image}
                alt={product.title}
                width={200}
                height={150}
                className="w-full h-32 object-cover rounded border"
                unoptimized={product.image.startsWith("http")}
              />
            </div>

            <p className="text-sm text-gray-600">
              Category: {product.category}
            </p>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No products found</p>
        </div>
      )}
    </div>
  );
}
