"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AlertCircle } from "lucide-react";

// Global cache for all images with TTL
const universalImageCache = new Map<
  string,
  { loaded: boolean; error: boolean; timestamp: number }
>();

// Clean up old cache entries (older than 10 minutes)
const cleanupCache = () => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  for (const [key, value] of universalImageCache.entries()) {
    if (now - value.timestamp > tenMinutes) {
      universalImageCache.delete(key);
    }
  }
};

// Run cleanup every 2 minutes
setInterval(cleanupCache, 2 * 60 * 1000);

interface UniversalImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  showDebugInfo?: boolean;
}

export default function UniversalImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  quality = 75,
  onClick,
  style,
  fallbackSrc,
  showDebugInfo = false,
}: UniversalImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const maxRetries = 2;
  const retryDelay = 1000; // 1 second

  useEffect(() => {
    mountedRef.current = true;

    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Reset state when src changes
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
    setCurrentSrc(src);

    // Check cache first
    const cached = universalImageCache.get(src);
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

    // Set a timeout for loading (5 seconds)
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.warn(`Image loading timeout for: ${src}`);
        setHasError(true);
        setIsLoading(false);
        universalImageCache.set(src, {
          loaded: false,
          error: true,
          timestamp: Date.now(),
        });
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src, isLoading]);

  const handleError = () => {
    if (!mountedRef.current) return;

    console.warn(`Image failed to load: ${currentSrc}`);

    if (retryCount < maxRetries) {
      // Retry with a delay
      setTimeout(() => {
        if (mountedRef.current) {
          setRetryCount((prev) => prev + 1);
          setIsLoading(true);
          setHasError(false);
          console.log(
            `Retrying image load (${
              retryCount + 1
            }/${maxRetries}): ${currentSrc}`
          );
        }
      }, retryDelay);
      return;
    }

    // All retries failed
    setHasError(true);
    setIsLoading(false);

    // Try fallback if available
    if (fallbackSrc && fallbackSrc !== currentSrc) {
      console.log(`Trying fallback image: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
      setRetryCount(0);
      setIsLoading(true);
      setHasError(false);
      return;
    }

    // Cache the error state
    universalImageCache.set(src, {
      loaded: false,
      error: true,
      timestamp: Date.now(),
    });
  };

  const handleLoad = () => {
    if (!mountedRef.current) return;

    console.log(`Image loaded successfully: ${currentSrc}`);
    setHasError(false);
    setIsLoading(false);

    // Cache the success state
    universalImageCache.set(currentSrc, {
      loaded: true,
      error: false,
      timestamp: Date.now(),
    });

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleClick = () => {
    if (onClick && !hasError && !isLoading) {
      onClick();
    }
  };

  // If we have an error, show a placeholder
  if (hasError || !currentSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height, ...style }}
        onClick={handleClick}
      >
        <div className="text-center">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Image unavailable</p>
          {showDebugInfo && (
            <p className="text-xs text-gray-400 mt-1 break-all">{currentSrc}</p>
          )}
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
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mx-auto mb-1"></div>
            <p className="text-xs text-gray-500">
              Loading{retryCount > 0 ? ` (retry ${retryCount})` : ""}...
            </p>
          </div>
        </div>
      )}

      {/* Debug info overlay */}
      {showDebugInfo && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-75 text-white text-xs p-1 z-20 max-w-full overflow-hidden">
          {currentSrc}
        </div>
      )}

      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        quality={quality}
        onError={handleError}
        onLoad={handleLoad}
        onClick={handleClick}
        style={style}
        unoptimized={currentSrc.startsWith("http")} // Don't optimize external images
        sizes={`${width}px`}
      />
    </div>
  );
}
