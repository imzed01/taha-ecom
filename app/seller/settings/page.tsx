"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import toast from "react-hot-toast";
import { Edit, Save, X } from "lucide-react";

export default function SellerSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalStoreName, setOriginalStoreName] = useState("");

  type SellerUser = {
    email: string;
    role: "seller";
    storeName?: string;
  };

  useEffect(() => {
    if (status === "loading") return;
    const user = session?.user as SellerUser | undefined;
    if (!session || user?.role !== "seller") {
      router.push("/auth/signin");
      return;
    }
    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/seller/settings");
      if (res.ok) {
        const data = await res.json();
        setStoreName(data.storeName || "");
        setEmail(data.email || "");
        setOriginalStoreName(data.storeName || "");
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName }),
      });
      if (res.ok) {
        toast.success("Settings updated successfully");
        setOriginalStoreName(storeName);
        setIsEditing(false);
      } else {
        toast.error("Failed to update settings");
      }
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setStoreName(originalStoreName);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="seller" title="Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="seller" title="Settings">
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Account Settings
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed for security reasons
                </p>
              </div>

              {/* Store Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Store Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                ) : (
                  <div className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    {storeName || "No store name set"}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>

            {/* Additional Info Section */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Account Type</div>
                  <div className="text-white font-medium">Seller Account</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Member Since</div>
                  <div className="text-white font-medium">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
