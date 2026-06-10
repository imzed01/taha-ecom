"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  product_url?: string;
  availability?: string;
  brand?: string;
}

export default function ProductDetail() {
  const params = useParams();
  const { productId } = params as { productId: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
          setProduct(null);
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading product...</h2>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-600">
            The product you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <Image
            src={product.image}
            alt={product.title}
            width={320}
            height={200}
            className="w-full h-80 object-contain rounded-lg border mb-4"
          />
          <div className="flex gap-2 overflow-x-auto">
            {product.images &&
              product.images.length > 0 &&
              product.images.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt={product.title + " image " + (i + 1)}
                  width={96}
                  height={96}
                  className="w-24 h-24 object-cover rounded border"
                />
              ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
          <span className="text-lg text-green-600 font-bold">
            ${product.price}
          </span>
          <div className="text-sm text-gray-500">{product.brand}</div>
          <div className="text-sm text-gray-500">
            Category: {product.category}
          </div>
          <div className="text-sm text-gray-500">
            Availability: {product.availability}
          </div>
          <p className="text-gray-700 mt-4">{product.description}</p>
          {product.product_url && (
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              View on Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
