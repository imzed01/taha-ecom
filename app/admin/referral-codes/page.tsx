"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Copy,
  Check,
  Users,
  Gift,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

interface ReferralCode {
  _id: string;
  code: string;
  isUsed: boolean;
  usedBy?: {
    sellerId: string;
    sellerEmail: string;
    sellerStoreName: string;
    usedAt: string;
  };
  generatedBy: string;
  createdAt: string;
}

export default function ReferralCodesPage() {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"unused" | "used">("unused");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCodes, setFilteredCodes] = useState<ReferralCode[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);

  useEffect(() => {
    fetchReferralCodes();
  }, []);

  useEffect(() => {
    // Filter codes based on active tab and search term
    const filtered = referralCodes.filter((code) => {
      const matchesTab = activeTab === "unused" ? !code.isUsed : code.isUsed;
      const matchesSearch = searchTerm
        ? code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (code.usedBy?.sellerEmail &&
            code.usedBy.sellerEmail
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (code.usedBy?.sellerStoreName &&
            code.usedBy.sellerStoreName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
        : true;
      return matchesTab && matchesSearch;
    });
    setFilteredCodes(filtered);
  }, [referralCodes, activeTab, searchTerm]);

  const fetchReferralCodes = async () => {
    try {
      const response = await fetch("/api/admin/referral-codes");
      if (response.ok) {
        const data = await response.json();
        setReferralCodes(data.referralCodes);
      } else {
        toast.error("Failed to fetch referral codes");
      }
    } catch (error) {
      console.error("Error fetching referral codes:", error);
      toast.error("Error fetching referral codes");
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralCode = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/referral-codes", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCode(data.code);
        setShowGeneratedModal(true);
        toast.success("Referral code generated successfully!");
        fetchReferralCodes(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to generate referral code");
      }
    } catch (error) {
      console.error("Error generating referral code:", error);
      toast.error("Error generating referral code");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Failed to copy code");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unusedCodes = referralCodes.filter((code) => !code.isUsed);
  const usedCodes = referralCodes.filter((code) => code.isUsed);

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="admin" title="Referral Codes">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin" title="Referral Codes">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Referral Codes
            </h1>
            <p className="text-muted-foreground">
              Generate and manage referral codes for seller registration
            </p>
          </div>
          <button
            onClick={generateReferralCode}
            disabled={isGenerating}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isGenerating ? "Generating..." : "Generate Code"}
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Codes</p>
              <p className="text-2xl font-bold text-foreground">
                {referralCodes.length}
              </p>
            </div>
            <Gift className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unused Codes</p>
              <p className="text-2xl font-bold text-success">
                {unusedCodes.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-success" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Used Codes</p>
              <p className="text-2xl font-bold text-secondary">
                {usedCodes.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-secondary" />
          </div>
        </div>
      </motion.div>

      {/* Tabs and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="card p-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-sidebar-hover rounded-lg p-1">
            <button
              onClick={() => setActiveTab("unused")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "unused"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Unused ({unusedCodes.length})
            </button>
            <button
              onClick={() => setActiveTab("used")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "used"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Used ({usedCodes.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search codes, emails, or store names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 pr-4 py-2 w-full sm:w-64"
            />
          </div>
        </div>
      </motion.div>

      {/* Codes Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-sidebar-hover">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Status
                </th>
                {activeTab === "used" && (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Used By
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Store Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      Used At
                    </th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Generated At
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "used" ? 6 : 4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {activeTab === "unused"
                      ? "No unused referral codes found"
                      : "No used referral codes found"}
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code._id} className="hover:bg-sidebar-hover/50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm bg-sidebar-hover px-2 py-1 rounded">
                        {code.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          code.isUsed
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {code.isUsed ? "Used" : "Available"}
                      </span>
                    </td>
                    {activeTab === "used" && code.usedBy && (
                      <>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {code.usedBy.sellerEmail}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {code.usedBy.sellerStoreName}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(code.usedBy.usedAt)}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(code.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        {copiedCode === code.code ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedCode === code.code ? "Copied!" : "Copy"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Generated Code Modal */}
      {showGeneratedModal && generatedCode && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowGeneratedModal(false);
            setGeneratedCode(null);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Referral Code Generated
              </h3>
              <button
                onClick={() => {
                  setShowGeneratedModal(false);
                  setGeneratedCode(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-3">
                Your new referral code has been generated successfully!
              </p>
              <div
                className="bg-sidebar-hover rounded-lg p-4 mb-4 cursor-pointer hover:bg-sidebar-hover/80 transition-colors"
                onClick={() => copyToClipboard(generatedCode)}
              >
                <span className="font-mono text-2xl font-bold text-foreground">
                  {generatedCode}
                </span>
                <div className="text-xs text-muted-foreground mt-1">
                  Click to copy
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(generatedCode)}
                className="btn-primary flex items-center justify-center gap-2 w-full"
              >
                {copiedCode === generatedCode ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copiedCode === generatedCode ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              This code can be used by one seller during registration
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
