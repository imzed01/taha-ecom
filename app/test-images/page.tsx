"use client";

import { useState } from "react";
import OrderImage from "@/components/OrderImage";

export default function TestImagesPage() {
  const [testUrls] = useState([
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
    "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400",
  ]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Image Loading Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testUrls.map((url, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">
              Test Image {index + 1}
            </h3>
            <OrderImage
              src={url}
              alt={`Test image ${index + 1}`}
              width={200}
              height={200}
              className="w-full h-48 object-cover rounded-lg"
              showDebugInfo={true}
            />
            <div className="mt-2">
              <p className="text-sm text-gray-600 break-all">{url}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <p className="text-sm text-gray-700">
          This page tests the OrderImage component with various image URLs.
          Check the browser console for detailed loading logs.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          If images are not loading, the issue might be:
        </p>
        <ul className="text-sm text-gray-700 mt-2 list-disc list-inside">
          <li>Next.js image domain restrictions</li>
          <li>Image URL format issues</li>
          <li>Network/CORS problems</li>
          <li>Image optimization conflicts</li>
        </ul>
      </div>
    </div>
  );
}
