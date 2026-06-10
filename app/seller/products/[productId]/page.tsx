"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import ImageWithFallback from "@/components/ImageWithFallback";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images: string[];
  product_url: string;
  availability: string;
  brand: string;
}

export default function SellerProductDetail() {
  const params = useParams();
  // const router = useRouter();
  const { productId } = params as { productId: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

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
    fetchProduct();
  }, [productId]);

  // Seller store management (localStorage for demo)
  const [inStore, setInStore] = useState(false);
  const [mainImage, setMainImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!product) return;

    // Set the main image immediately when product loads
    const availableImages = [
      product.image,
      ...(product.images || []).filter((img) => img !== product.image),
    ].filter(Boolean);

    if (availableImages.length > 0) {
      setMainImage(availableImages[0]);
    }

    // Check if product is in seller's store by calling backend
    const checkInStore = async () => {
      try {
        const res = await fetch("/api/seller/products");
        if (res.ok) {
          const sellerProducts: { productId: { _id: string } }[] =
            await res.json();
          setInStore(
            sellerProducts.some((sp) => sp.productId._id === product._id)
          );
        } else {
          setInStore(false);
        }
      } catch {
        setInStore(false);
      }
    };
    checkInStore();
  }, [product]);

  const handleAddToStore = async () => {
    if (!product) return;
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      });
      if (res.ok) {
        setInStore(true);
        toast.success("Product added to your store!");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to add product");
      }
    } catch {
      toast.error("Error adding product to store");
    }
  };

  return (
    <DashboardLayout requiredRole="seller">
      <div className="flex justify-center items-start w-full">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              {mainImage ? (
                <ImageWithFallback
                  src={mainImage}
                  alt={product?.title || "Product image"}
                  width={400}
                  height={300}
                  className="w-full h-96 object-contain rounded-lg border mb-4 bg-zinc-100"
                />
              ) : (
                <div className="w-full h-96 bg-zinc-100 rounded-lg border mb-4 flex items-center justify-center">
                  <p className="text-zinc-500">No image available</p>
                </div>
              )}
              <div className="flex gap-2 overflow-x-auto">
                {[
                  product?.image,
                  ...((product?.images || []).filter(
                    (img) => img !== product?.image
                  ) as string[]),
                ]
                  .filter(Boolean)
                  .map((img, i) => (
                    <ImageWithFallback
                      key={i}
                      src={img!}
                      alt={
                        product?.title + " image " + (i + 1) ||
                        "Product thumbnail"
                      }
                      width={96}
                      height={96}
                      className={`w-24 h-24 object-cover rounded border cursor-pointer transition-all duration-150 ${
                        mainImage === img ? "ring-2 ring-green-500" : ""
                      }`}
                      onClick={() => setMainImage(img)}
                    />
                  ))}
              </div>
            </div>
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
                </div>
              ) : product ? (
                <div className="bg-white rounded-xl shadow p-8 flex flex-col gap-4 w-full">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {product.title}
                  </h1>
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
                  <p
                    className={`text-gray-700 mt-4 ${
                      showFullDescription ? "" : "line-clamp-4"
                    }`}
                  >
                    {product.description}
                  </p>
                  {product.description.length > 200 && (
                    <button
                      className="text-blue-600 hover:underline mt-1 text-sm w-fit"
                      onClick={() => setShowFullDescription((v: boolean) => !v)}
                      type="button"
                    >
                      {showFullDescription ? "Show less" : "Read more"}
                    </button>
                  )}
                  <button
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    onClick={handleAddToStore}
                    disabled={inStore}
                  >
                    {inStore ? "Added to Store" : "Add to Store"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">
                      Product Not Found
                    </h2>
                    <p className="text-gray-600">
                      The product you are looking for does not exist.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
