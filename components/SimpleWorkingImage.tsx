"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AlertCircle, Image as ImageIcon } from "lucide-react";

interface SimpleWorkingImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  showDebugInfo?: boolean;
  fallbackSrc?: string;
}

export default function SimpleWorkingImage({
  src,
  alt,
  width,
  height,
  className = "",
  onClick,
  style,
  showDebugInfo = false,
  fallbackSrc = "/placeholder-image.svg",
}: SimpleWorkingImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);

      return;
    }

    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    console.error(`Image failed to load: ${currentSrc}`);

    // Try fallback if available and different from current source
    if (fallbackSrc && fallbackSrc !== currentSrc) {
      console.log(`Trying fallback image: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);

      return;
    }

    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log(`Image loaded successfully: ${currentSrc}`);
    setHasError(false);
    setIsLoading(false);
  };

  // If no src, show placeholder
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height, ...style }}
        onClick={onClick}
      >
        <div className="text-center">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">No image URL</p>
        </div>
      </div>
    );
  }

  // If error, show placeholder
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height, ...style }}
        onClick={onClick}
      >
        <div className="text-center">
          <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Image unavailable</p>
          {showDebugInfo && (
            <p className="text-xs text-gray-400 mt-1 break-all max-w-full">
              {currentSrc}
            </p>
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
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mx-auto mb-1"></div>
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        </div>
      )}

      {/* Debug info */}
      {showDebugInfo && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-75 text-white text-xs p-1 z-20 max-w-full overflow-hidden">
          {currentSrc}
        </div>
      )}

      {/* Use Next.js Image component */}
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        unoptimized={currentSrc.startsWith("http")}
        sizes={`${width}px`}
      />
    </div>
  );
}
