"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from "lucide-react";
import UniversalImage from "@/components/UniversalImage";
import {
  testImageUrl,
  getImageDebugStats,
  generateImageDebugReport,
} from "@/lib/image-debug";

interface Product {
  _id: string;
  title: string;
  image: string;
  category: string;
}

interface ImageTestResult {
  url: string;
  accessible: boolean;
  statusCode?: number;
  contentType?: string;
  error?: string;
  loadTime?: number;
}

export default function ImageTroubleshooterPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [testResults, setTestResults] = useState<ImageTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=20");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const testAllImages = async () => {
    setIsTesting(true);
    const results: ImageTestResult[] = [];

    for (const product of products) {
      if (product.image) {
        const result = await testImageUrl(product.image);
        results.push({
          url: product.image,
          ...result,
        });
      }
    }

    setTestResults(results);
    setIsTesting(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  const stats = getImageDebugStats();
  const debugReport = generateImageDebugReport();

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-4">🖼️ Image Troubleshooter</h1>
        <p className="text-gray-600 mb-6">
          Comprehensive tool to diagnose and fix image loading issues across the
          application.
        </p>

        {/* Control Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={testAllImages}
                disabled={isTesting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isTesting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
                {isTesting ? "Testing..." : "Test All Images"}
              </button>

              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                {showDebugInfo ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
                {showDebugInfo ? "Hide" : "Show"} Debug Info
              </button>

              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                📊 {showStats ? "Hide" : "Show"} Stats
              </button>
            </div>

            <div className="text-sm text-gray-500">
              {products.length} products loaded
            </div>
          </div>

          {/* Stats Panel */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-500">Total Images</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.success}
                  </div>
                  <div className="text-sm text-gray-500">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.error}
                  </div>
                  <div className="text-sm text-gray-500">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.accessible
                      ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                      : "border-red-200 bg-red-50 dark:bg-red-900/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.accessible ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {result.accessible
                              ? "Accessible"
                              : "Not Accessible"}
                          </span>
                          {result.statusCode && (
                            <span className="text-sm text-gray-500">
                              (HTTP {result.statusCode})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 truncate max-w-md">
                          {result.url}
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {result.error}
                          </div>
                        )}
                        {result.loadTime && (
                          <div className="text-sm text-gray-500 mt-1">
                            Load time: {result.loadTime}ms
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(result.url)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Copy URL"
                      >
                        {copiedUrl === result.url ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openInNewTab(result.url)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                  {product.title}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Category: {product.category}
                </p>
              </div>

              <div className="relative">
                <UniversalImage
                  src={product.image}
                  alt={product.title}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover"
                  showDebugInfo={showDebugInfo}
                  fallbackSrc="/placeholder-image.svg"
                />
              </div>

              <div className="p-4">
                <div className="text-xs text-gray-500 break-all mb-2">
                  {product.image}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(product.image)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => openInNewTab(product.image)}
                    className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded"
                  >
                    Test URL
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Debug Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Debug Report</h2>
            <button
              onClick={() => copyToClipboard(debugReport)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Copy Report
            </button>
          </div>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto">
            {debugReport}
          </pre>
        </motion.div>
      </motion.div>
    </div>
  );
}
