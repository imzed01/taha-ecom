"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ImageDebuggerProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function ImageDebugger({
  src,
  alt,
  width,
  height,
  className = "",
}: ImageDebuggerProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    const testImage = new window.Image();
    testImage.onload = () => {
      setStatus("success");
      console.log("✅ Image loaded successfully:", src);
      console.log(
        "📏 Dimensions:",
        testImage.naturalWidth,
        "×",
        testImage.naturalHeight
      );
      console.log("✅ Complete:", testImage.complete);
    };

    testImage.onerror = (error) => {
      console.error("❌ Image failed to load:", src, error);
      setStatus("error");
    };

    // Test with fetch to see if URL is accessible
    fetch(src, { method: "HEAD" })
      .then((response) => {
        console.log(
          "🔍 Fetch result for:",
          src,
          response.status,
          response.statusText
        );
        if (!response.ok) {
          console.log(`⚠️ HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .catch((fetchError) => {
        // Log fetch errors to console but don't show them in UI
        console.error("🔍 Fetch error for:", src, fetchError);
        console.log(
          "ℹ️ Note: Fetch errors are normal network warnings and don't affect image display"
        );
      });

    testImage.src = src;
  }, [src]);

  return (
    <div
      className={`border-2 border-dashed p-4 ${className}`}
      style={{ width, height }}
    >
      {/* Debug info removed from UI - only shown in console */}

      {status === "loading" && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {status === "success" && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="max-w-full h-auto"
          unoptimized={src.startsWith("http")}
        />
      )}

      {status === "error" && (
        <div className="flex items-center justify-center h-32 bg-gray-100">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🖼️</div>
            <div className="text-sm">Image Failed to Load</div>
          </div>
        </div>
      )}
    </div>
  );
}
