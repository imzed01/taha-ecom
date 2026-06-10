"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import SimpleWorkingImage from "@/components/SimpleWorkingImage";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isActive: boolean;
}

export default function TestSimpleImagesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?limit=10");
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Simple Image Test (HTML img tag)</h1>
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showDebugInfo ? "Hide" : "Show"} Debug Info
        </button>
      </div>

      <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h2 className="font-bold text-yellow-800 mb-2">Test Instructions:</h2>
        <ol className="list-decimal list-inside text-yellow-800 space-y-1">
          <li>Check browser console for image loading logs</li>
          <li>
            Look for &quot;Image loaded successfully&quot; or &quot;Image failed
            to load&quot; messages
          </li>
          <li>Images should display if URLs are accessible</li>
          <li>
            If images fail, you&apos;ll see &quot;Image unavailable&quot;
            placeholders
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">{product.title}</h3>
            <p className="text-sm text-gray-600 mb-2">
              Image URL: {product.image}
            </p>

            <div className="mb-4">
              <SimpleWorkingImage
                src={product.image}
                alt={product.title}
                width={200}
                height={150}
                className="w-full h-32 object-cover rounded"
                showDebugInfo={showDebugInfo}
              />
            </div>

            <p className="text-sm text-gray-600">Price: ${product.price}</p>
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

      {/* Direct HTML img test */}
      <div className="mt-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Direct HTML img Test</h2>
        <p className="mb-4 text-gray-600">
          Testing direct HTML img tags to verify basic image loading:
        </p>

        {products.slice(0, 3).map((product) => (
          <div key={`direct-${product._id}`} className="mb-4">
            <p className="text-sm font-medium mb-2">{product.title}</p>
            <Image
              src={product.image}
              alt={product.title}
              width={100}
              height={75}
              className="border rounded"
              unoptimized={product.image.startsWith("http")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
