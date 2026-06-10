// Image debugging utilities for troubleshooting image loading issues

export interface ImageDebugInfo {
  url: string;
  status: "loading" | "success" | "error" | "timeout";
  loadTime?: number;
  errorMessage?: string;
  retryCount: number;
  timestamp: number;
  size?: { width: number; height: number };
  contentType?: string;
}

class ImageDebugger {
  private debugLog: ImageDebugInfo[] = [];
  private maxLogSize = 100;

  log(info: Omit<ImageDebugInfo, "timestamp">) {
    const debugInfo: ImageDebugInfo = {
      ...info,
      timestamp: Date.now(),
    };

    this.debugLog.push(debugInfo);

    // Keep log size manageable
    if (this.debugLog.length > this.maxLogSize) {
      this.debugLog = this.debugLog.slice(-this.maxLogSize);
    }

    // Console logging for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("🖼️ Image Debug:", debugInfo);
    }
  }

  getLog() {
    return [...this.debugLog];
  }

  clearLog() {
    this.debugLog = [];
  }

  getStats() {
    const total = this.debugLog.length;
    const success = this.debugLog.filter((i) => i.status === "success").length;
    const error = this.debugLog.filter((i) => i.status === "error").length;
    const timeout = this.debugLog.filter((i) => i.status === "timeout").length;
    const loading = this.debugLog.filter((i) => i.status === "loading").length;

    return {
      total,
      success,
      error,
      timeout,
      loading,
      successRate: total > 0 ? (success / total) * 100 : 0,
      errorRate: total > 0 ? (error / total) * 100 : 0,
    };
  }

  // Test image URL accessibility
  async testImageUrl(url: string): Promise<{
    accessible: boolean;
    statusCode?: number;
    contentType?: string;
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors", // Try to avoid CORS issues
      });

      const loadTime = Date.now() - startTime;

      if (response.ok) {
        this.log({
          url,
          status: "success",
          loadTime,
          retryCount: 0,
          contentType: response.headers.get("content-type") || undefined,
        });

        return {
          accessible: true,
          statusCode: response.status,
          contentType: response.headers.get("content-type") || undefined,
        };
      } else {
        this.log({
          url,
          status: "error",
          loadTime,
          retryCount: 0,
          errorMessage: `HTTP ${response.status}`,
        });

        return {
          accessible: false,
          statusCode: response.status,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      this.log({
        url,
        status: "error",
        retryCount: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        accessible: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Batch test multiple URLs
  async testMultipleUrls(urls: string[]): Promise<
    {
      url: string;
      result: Awaited<ReturnType<typeof ImageDebugger.prototype.testImageUrl>>;
    }[]
  > {
    const results = await Promise.all(
      urls.map(async (url) => ({
        url,
        result: await this.testImageUrl(url),
      }))
    );

    return results;
  }

  // Generate debug report
  generateReport(): string {
    const stats = this.getStats();
    const recentErrors = this.debugLog
      .filter((i) => i.status === "error")
      .slice(-10);

    let report = `🖼️ Image Loading Debug Report\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += `📊 Statistics:\n`;
    report += `Total images: ${stats.total}\n`;
    report += `Success: ${stats.success} (${stats.successRate.toFixed(1)}%)\n`;
    report += `Errors: ${stats.error} (${stats.errorRate.toFixed(1)}%)\n`;
    report += `Timeouts: ${stats.timeout}\n`;
    report += `Loading: ${stats.loading}\n\n`;

    if (recentErrors.length > 0) {
      report += `❌ Recent Errors:\n`;
      recentErrors.forEach((error) => {
        report += `- ${error.url}: ${error.errorMessage}\n`;
      });
      report += `\n`;
    }

    return report;
  }
}

// Export singleton instance
export const imageDebugger = new ImageDebugger();

// Export utility functions
export const debugImage = (info: Omit<ImageDebugInfo, "timestamp">) => {
  imageDebugger.log(info);
};

export const testImageUrl = (url: string) => {
  return imageDebugger.testImageUrl(url);
};

export const getImageDebugStats = () => {
  return imageDebugger.getStats();
};

export const generateImageDebugReport = () => {
  return imageDebugger.generateReport();
};
