// Image optimization utilities
export function compressBase64Image(
  base64String: string,
  maxWidth: number = 800
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(base64String);
        return;
      }

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Compress with quality 0.8
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
      resolve(compressedBase64);
    };

    img.onerror = () => {
      resolve(base64String); // Return original if compression fails
    };

    img.src = base64String;
  });
}

export function getImageSize(base64String: string): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = base64String;
  });
}

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    return { valid: false, error: "Image size must be less than 5MB" };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are allowed",
    };
  }

  return { valid: true };
}

// Utility functions for production image handling
export function isExternalImage(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname !== window.location.hostname;
  } catch {
    return false;
  }
}

export function getImageFallbackUrl(): string {
  // Return a default placeholder
  return "/placeholder-image.svg";
}

export function getOptimizedImageUrl(url: string): string {
  // For external images, return as-is since we can't optimize them
  if (isExternalImage(url)) {
    return url;
  }

  // For internal images, you could add optimization parameters here
  return url;
}

// Enhanced image loading with retry logic
export function loadImageWithRetry(
  url: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let retryCount = 0;

    const attemptLoad = () => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(attemptLoad, retryDelay);
        } else {
          reject(
            new Error(`Failed to load image after ${maxRetries} attempts`)
          );
        }
      };

      img.src = url;
    };

    attemptLoad();
  });
}

// Check if image URL is valid format (without loading)
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const validProtocols = ["http:", "https:"];
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];

    // Check protocol
    if (!validProtocols.includes(urlObj.protocol)) {
      return false;
    }

    // Check if it has a valid image extension
    const hasValidExtension = validExtensions.some((ext) =>
      urlObj.pathname.toLowerCase().includes(ext)
    );

    // If no extension, assume it's valid (could be a dynamic URL)
    return hasValidExtension || urlObj.pathname.includes("/");
  } catch {
    return false;
  }
}
