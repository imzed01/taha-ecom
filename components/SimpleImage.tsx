"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface SimpleImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function SimpleImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  quality = 75,
  onClick,
  style,
}: SimpleImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    console.log("Image error:", src);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log("Image loaded successfully:", src);
    setHasError(false);
    setIsLoading(false);
  };

  // If we have an error, show a placeholder
  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height, ...style }}
        onClick={onClick}
      >
        <div className="text-center">
          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width, height, ...style }}
    >
      {/* Show loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        quality={quality}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        style={style}
        unoptimized={src.startsWith("http")} // Don't optimize external images
      />
    </div>
  );
}
