"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

// Global cache for catalog images
const catalogImageCache = new Map<
  string,
  { loaded: boolean; error: boolean; timestamp: number }
>();

// Clean up old cache entries (older than 5 minutes)
const cleanupCache = () => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  for (const [key, value] of catalogImageCache.entries()) {
    if (now - value.timestamp > fiveMinutes) {
      catalogImageCache.delete(key);
    }
  }
};

// Run cleanup every minute
setInterval(cleanupCache, 60 * 1000);

interface CatalogImageProps {
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

export default function CatalogImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  quality = 75,
  onClick,
  style,
}: CatalogImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = catalogImageCache.get(src);
    if (cached) {
      if (cached.loaded) {
        setHasError(false);
        setIsLoading(false);
        return;
      } else if (cached.error) {
        setHasError(true);
        setIsLoading(false);
        return;
      }
    }

    // Reset state when src changes
    setHasError(false);
    setIsLoading(true);

    return () => {
      mountedRef.current = false;
    };
  }, [src]);

  const handleError = () => {
    if (!mountedRef.current) return;

    setHasError(true);
    setIsLoading(false);
    // Cache the error state
    catalogImageCache.set(src, {
      loaded: false,
      error: true,
      timestamp: Date.now(),
    });
  };

  const handleLoad = () => {
    if (!mountedRef.current) return;

    setHasError(false);
    setIsLoading(false);
    // Cache the success state
    catalogImageCache.set(src, {
      loaded: true,
      error: false,
      timestamp: Date.now(),
    });
  };

  const handleClick = () => {
    if (onClick && !hasError && !isLoading) {
      onClick();
    }
  };

  // If we have an error, show a placeholder
  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height, ...style }}
        onClick={handleClick}
      >
        <div className="text-center">
          <Package className="w-6 h-6 text-gray-400 mx-auto mb-1" />
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
      {/* Show loading state only briefly */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mx-auto mb-1"></div>
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
