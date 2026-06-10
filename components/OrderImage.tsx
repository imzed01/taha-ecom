"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RefreshCw } from "lucide-react";

interface OrderImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  showDebugInfo?: boolean;
}

export default function OrderImage({
  src,
  alt,
  width,
  height,
  className = "",
  showDebugInfo = false,
}: OrderImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [useFallbackImg, setUseFallbackImg] = useState(false);
  const [errorType, setErrorType] = useState<string>("unknown");
  const [fallbackImage, setFallbackImage] = useState<string>("");

  const maxRetries = 3;

  // Generate fallback image URL based on error type
  const getFallbackImageUrl = () => {
    if (errorType === "server_down") {
      return "https://via.placeholder.com/100x100/ff6b6b/ffffff?text=Server+Down";
    } else if (errorType === "amazon_image") {
      return "https://via.placeholder.com/100x100/4ecdc4/ffffff?text=Image+Error";
    } else {
      return "https://via.placeholder.com/100x100/95a5a6/ffffff?text=No+Image";
    }
  };

  useEffect(() => {
    if (!src) {
      console.warn("OrderImage: No src provided");
      setHasError(true);
      setIsLoading(false);
      return;
    }

    console.log("OrderImage: Loading image:", src);

    // Test if the image can be loaded with a basic img tag first
    const testImg = new window.Image();
    testImg.onload = () => {
      console.log("OrderImage: Basic img test successful for:", src);
      setUseFallbackImg(true);
      setIsLoading(false);
      setHasError(false);
    };
    testImg.onerror = () => {
      console.log(
        "OrderImage: Basic img test failed, trying Next.js Image for:",
        src
      );
      setUseFallbackImg(false);
      setIsLoading(true);
      setHasError(false);
    };
    testImg.src = src;

    // Reset state when src changes
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
    setCurrentSrc(src);
  }, [src]);

  const handleError = () => {
    console.warn(`Image failed to load: ${currentSrc}`);

    // Detect error type based on URL
    if (currentSrc && currentSrc.includes("esellersvipstore.com")) {
      setErrorType("server_down");
    } else if (currentSrc && currentSrc.includes("m.media-amazon.com")) {
      setErrorType("amazon_image");
    } else {
      setErrorType("general");
    }

    if (retryCount < maxRetries) {
      // Retry with a delay
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setIsLoading(true);
        setHasError(false);
        console.log(
          `Retrying image load (${retryCount + 1}/${maxRetries}): ${currentSrc}`
        );
      }, 1000 * (retryCount + 1)); // Exponential backoff
      return;
    }

    // All retries failed, try fallback img tag
    if (!useFallbackImg) {
      console.log("Trying fallback img tag for:", currentSrc);
      setUseFallbackImg(true);
      setIsLoading(true);
      setHasError(false);
      return;
    }

    // Both Next.js Image and fallback failed
    setHasError(true);
    setIsLoading(false);
    setFallbackImage(getFallbackImageUrl());
  };

  const handleLoad = () => {
    console.log(`Image loaded successfully: ${currentSrc}`);
    setHasError(false);
    setIsLoading(false);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setIsLoading(true);
    setHasError(false);
  };

  // If we have an error, show a placeholder with retry option
  if (hasError || !currentSrc) {
    // Generate a placeholder based on the error type
    const getPlaceholderIcon = () => {
      if (errorType === "server_down") {
        return "🖥️"; // Server icon
      } else if (errorType === "amazon_image") {
        return "📦"; // Package icon
      } else {
        return "🖼️"; // Image icon
      }
    };

    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`,
          maxWidth: `${width}px`,
          maxHeight: `${height}px`,
          borderRadius: "inherit",
        }}
      >
        {fallbackImage ? (
          <img
            src={fallbackImage}
            alt="Fallback"
            className="w-full h-full object-cover object-center"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              objectFit: "cover",
              objectPosition: "center",
            }}
            onError={() => setFallbackImage("")}
          />
        ) : (
          <div className="text-center p-2">
            <div className="text-2xl mb-2">{getPlaceholderIcon()}</div>
            <p className="text-xs text-gray-500 mb-2">Image unavailable</p>
            {showDebugInfo && (
              <div className="text-xs text-gray-400 break-all px-2 mb-2">
                <div>URL: {currentSrc || "No URL"}</div>
                <div className="mt-1 text-red-400">
                  {errorType === "server_down"
                    ? "Server may be down (HTTP 521)"
                    : errorType === "amazon_image"
                    ? "Amazon image failed to load"
                    : "Failed to load image"}
                </div>
              </div>
            )}
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 mx-auto text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // If we're using fallback img tag, render it directly
  if (useFallbackImg) {
    return (
      <div
        className={`relative ${className}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`,
          maxWidth: `${width}px`,
          maxHeight: `${height}px`,
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mx-auto mb-1"></div>
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          </div>
        )}

        {showDebugInfo && (
          <div className="absolute top-0 left-0 bg-black bg-opacity-75 text-white text-xs p-1 z-20 max-w-full overflow-hidden">
            {currentSrc} (Fallback)
          </div>
        )}

        <img
          src={currentSrc}
          alt={alt}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            height: `${height}px`,
            objectFit: "cover",
            objectPosition: "center",
            borderRadius: "inherit",
            overflow: "hidden",
            width: "100%",
            justifyContent: "center",
            display: "flex",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        maxWidth: `${width}px`,
        maxHeight: `${height}px`,
      }}
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

      {useFallbackImg ? (
        <img
          src={currentSrc}
          alt={alt}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            objectFit: "cover",
            objectPosition: "center",
            borderRadius: "inherit",
          }}
        />
      ) : (
        <Image
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            height: `${height}px`,
            objectFit: "cover",
            objectPosition: "center",
            borderRadius: "inherit",
            overflow: "hidden",
            width: "100%",
            justifyContent: "center",
            display: "flex",
          }}
          unoptimized={true} // Disable optimization for external images
          sizes={`${width}px`}
          priority={false}
        />
      )}
    </div>
  );
}
