// Performance monitoring utilities
export function measureApiCall<T>(
  apiCall: () => Promise<T>,
  endpoint: string
): Promise<T> {
  const startTime = performance.now();

  return apiCall().finally(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 1000) {
      console.warn(`Slow API call to ${endpoint}: ${duration.toFixed(2)}ms`);
    }
  });
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
